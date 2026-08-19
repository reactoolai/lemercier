import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

const STANDARD_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'TU', '28', '30', '32', '34', '36', '38', '40', '42', '44', 'P', 'TG', 'TTG', '3TG'];

async function uploadImage(file, prefix = 'product') {
  const ext = file.name.split('.').pop().toLowerCase();
  const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { data, error } = await supabase.storage.from('product-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
  return urlData.publicUrl;
}

function SizesPicker({ selected, onChange }) {
  const sizes = Array.isArray(selected) ? selected : [];
  const toggle = (s) => {
    if (sizes.includes(s)) onChange(sizes.filter(x => x !== s));
    else onChange([...sizes, s]);
  };
  return (
    <div className="sizes-picker">
      {STANDARD_SIZES.map(s => (
        <button key={s} type="button" className={'size-toggle' + (sizes.includes(s) ? ' on' : '')} onClick={() => toggle(s)}>{s}</button>
      ))}
    </div>
  );
}

export default function ProductEditModal({ product, onSaved, onClose }) {
  const isNew = !product.id;
  const [form, setForm] = useState({
    id: product.id || '',
    name: product.name || '',
    brand: product.brand || '',
    cat: product.cat || '',
    price: product.price || '',
    stock: product.stock ?? '',
    img: product.img || '',
    gallery: Array.isArray(product.gallery) ? product.gallery : [],
    sizes: Array.isArray(product.sizes) ? product.sizes : [],
    desc: product.desc || '',
  });
  const [colors, setColors] = useState([]);
  const [colorsLoaded, setColorsLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');

  useEffect(() => {
    if (isNew || !product.id) { setColorsLoaded(true); return; }
    supabase.from('product_variants').select('*').eq('product_id', product.id).order('created_at', { ascending: true }).then(({ data }) => {
      setColors((data || []).map(v => ({
        ...v,
        color: v.color || '#000000',
        color_name: v.color_name || '',
        photos: Array.isArray(v.photos) ? v.photos : (v.img ? [v.img] : []),
        sizes: (Array.isArray(v.sizes) && v.sizes.length > 0) ? v.sizes : (Array.isArray(product.sizes) ? [...product.sizes] : []),
        stock: v.stock ?? 0,
        _dirty: false,
        _new: false,
      })));
      setColorsLoaded(true);
    });
  }, [product.id, isNew]);

  const allPhotos = [form.img, ...form.gallery].filter(Boolean);

  const addColor = () => {
    const defaultSizes = Array.isArray(form.sizes) && form.sizes.length > 0 ? [...form.sizes] : [];
    setColors(prev => [...prev, { _new: true, color: '#000000', color_name: '', photos: [], sizes: defaultSizes, stock: 0 }]);
  };

  const updateColor = (idx, field, value) => {
    setColors(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value, _dirty: true } : c));
  };

  const toggleColorSize = (colorIdx, size) => {
    setColors(prev => prev.map((c, i) => {
      if (i !== colorIdx) return c;
      const sizes = Array.isArray(c.sizes) ? c.sizes : [];
      const has = sizes.includes(size);
      return { ...c, sizes: has ? sizes.filter(s => s !== size) : [...sizes, size], _dirty: true };
    }));
  };

  const setAllColorSizes = (colorIdx, on) => {
    setColors(prev => prev.map((c, i) => {
      if (i !== colorIdx) return c;
      return { ...c, sizes: on ? [...STANDARD_SIZES.filter(s => form.sizes.includes(s))] : [], _dirty: true };
    }));
  };

  const removeColor = async (idx) => {
    const c = colors[idx];
    if (c._new) {
      setColors(prev => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!confirm('Supprimer cette couleur?')) return;
    const { error: err } = await supabase.from('product_variants').delete().eq('id', c.id);
    if (err) { setError(err.message); return; }
    setColors(prev => prev.filter((_, i) => i !== idx));
  };

  const togglePhotoColor = (photoUrl, colorIdx) => {
    const c = colors[colorIdx];
    const photos = Array.isArray(c.photos) ? c.photos : [];
    if (photos.includes(photoUrl)) {
      updateColor(colorIdx, 'photos', photos.filter(u => u !== photoUrl));
    } else {
      updateColor(colorIdx, 'photos', [...photos, photoUrl]);
    }
  };

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadErr('');
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadImage(file, 'gallery');
        newUrls.push(url);
      }
      setForm(f => ({ ...f, gallery: [...f.gallery, ...newUrls] }));
    } catch (e) {
      setUploadErr(e.message || 'Erreur upload');
    }
    setUploading(false);
  };

  const removePhoto = (idx) => {
    let removed;
    if (idx === 0 && form.img) {
      removed = form.img;
      const rest = form.gallery;
      const newMain = rest.length > 0 ? rest[0] : '';
      const newGallery = rest.slice(1);
      setForm(f => ({ ...f, img: newMain, gallery: newGallery }));
    } else {
      const galleryIdx = form.img ? idx - 1 : idx;
      removed = form.gallery[galleryIdx];
      setForm(f => ({ ...f, gallery: f.gallery.filter((_, i) => i !== galleryIdx) }));
    }
    setColors(prev => prev.map(c => {
      const photos = Array.isArray(c.photos) ? c.photos.filter(u => u !== removed) : [];
      return { ...c, photos, _dirty: true };
    }));
  };

  const setMainPhoto = (idx) => {
    if (idx === 0) return;
    const galleryIdx = form.img ? idx - 1 : idx;
    const newMain = form.gallery[galleryIdx];
    const oldMain = form.img;
    const newGallery = form.gallery.filter((_, i) => i !== galleryIdx);
    if (oldMain) newGallery.unshift(oldMain);
    setForm(f => ({ ...f, img: newMain, gallery: newGallery }));
  };

  const movePhoto = (idx, dir) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= allPhotos.length) return;
    if (idx === 0 && form.img) {
      const oldMain = form.img;
      const newMain = form.gallery[0];
      setForm(f => ({ ...f, img: newMain, gallery: [oldMain, ...f.gallery.slice(1)] }));
    } else if (newIdx === 0 && form.img) {
      const galleryIdx = idx - 1;
      const newMain = form.gallery[galleryIdx];
      const oldMain = form.img;
      const newGallery = form.gallery.filter((_, i) => i !== galleryIdx);
      setForm(f => ({ ...f, img: newMain, gallery: [oldMain, ...newGallery] }));
    } else {
      const arr = [...form.gallery];
      const gi = form.img ? idx - 1 : idx;
      const ni = form.img ? newIdx - 1 : newIdx;
      [arr[gi], arr[ni]] = [arr[ni], arr[gi]];
      setForm(f => ({ ...f, gallery: arr }));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      name: form.name,
      brand: form.brand,
      cat: form.cat,
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      img: form.img || null,
      gallery: form.gallery,
      sizes: form.sizes,
      desc: form.desc || null,
    };
    let result;
    if (isNew) {
      if (!form.id) { setError("L'identifiant du produit est requis"); setSaving(false); return; }
      payload.id = form.id;
      const { data, error: err } = await supabase.from('products').insert([payload]).select();
      if (err) { setError(err.message); setSaving(false); return; }
      result = data?.[0];
    } else {
      const { data, error: err } = await supabase.from('products').update(payload).eq('id', form.id).select();
      if (err) { setError(err.message); setSaving(false); return; }
      result = data?.[0];
    }

    const productId = result?.id || form.id;
    for (const c of colors) {
      const photos = Array.isArray(c.photos) ? c.photos : [];
      const cPayload = {
        product_id: productId,
        color: c.color || '',
        color_name: c.color_name || '',
        img: photos[0] || '',
        photos,
        sizes: Array.isArray(c.sizes) ? c.sizes : [],
        stock: Number(c.stock) || 0,
      };
      if (c._new) {
        const { error: ce } = await supabase.from('product_variants').insert([cPayload]);
        if (ce) { setError('Couleur: ' + ce.message); setSaving(false); return; }
      } else if (c._dirty) {
        const { error: ce } = await supabase.from('product_variants').update(cPayload).eq('id', c.id);
        if (ce) { setError('Couleur: ' + ce.message); setSaving(false); return; }
      }
    }

    setSaving(false);
    onSaved(result);
  };

  const handleDelete = async () => {
    if (!form.id) return;
    if (!confirm('Supprimer ce produit et toutes ses variantes?')) return;
    setSaving(true);
    const { error: err } = await supabase.from('products').delete().eq('id', form.id);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false);
    onSaved(null, true);
  };

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={e => e.stopPropagation()}>
        <div className="admin-modal-head">
          <h2>{isNew ? 'Nouveau produit' : 'Modifier le produit'}</h2>
          <button className="admin-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} className="admin-form">
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Nom</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="admin-field">
              <label>Marque</label>
              <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Catégorie</label>
              <input value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })} />
            </div>
            <div className="admin-field">
              <label>Prix ($)</label>
              <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-field">
              <label>Stock</label>
              <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>

          <div className="admin-field">
            <label>Tailles disponibles</label>
            <SizesPicker selected={form.sizes} onChange={s => setForm({ ...form, sizes: s })} />
          </div>

          <div className="admin-field">
            <label>Description</label>
            <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={3} />
          </div>

          {/* COULEURS - juste pixel + nom */}
          <div className="edit-section">
            <div className="edit-section-head">
              <h3>Couleurs</h3>
              <button type="button" className="btn-outline btn-sm" onClick={addColor}>+ Couleur</button>
            </div>
            {!colorsLoaded ? (
              <p className="muted">Chargement…</p>
            ) : colors.length === 0 ? (
              <p className="muted">Aucune couleur. Cliquez sur « + Couleur » pour en ajouter.</p>
            ) : (
              <div className="colors-simple-list">
                {colors.map((c, idx) => {
                  const photoCount = (c.photos || []).length;
                  const colorSizes = Array.isArray(c.sizes) ? c.sizes : [];
                  const availableSizes = (form.sizes || []).filter(s => STANDARD_SIZES.includes(s));
                  return (
                    <div key={c.id || idx} className="color-simple-row">
                      <div className="color-simple-head">
                        <div className="color-simple-left">
                          <input
                            type="color"
                            value={c.color || '#000000'}
                            onChange={e => updateColor(idx, 'color', e.target.value)}
                            className="color-pixel-input"
                          />
                          <input
                            type="text"
                            value={c.color_name || ''}
                            onChange={e => updateColor(idx, 'color_name', e.target.value)}
                            placeholder="Nom (ex: Noir, Bleu marine…)"
                            className="color-text-input"
                          />
                          {photoCount > 0 && <span className="color-photo-count">{photoCount} photo{photoCount > 1 ? 's' : ''}</span>}
                        </div>
                        <button type="button" className="color-simple-remove" onClick={() => removeColor(idx)}>✕</button>
                      </div>
                      {availableSizes.length > 0 && (
                        <div className="color-size-matrix">
                          <div className="color-size-matrix-label">Tailles disponibles pour cette couleur:</div>
                          <div className="color-size-toggles">
                            {availableSizes.map(s => (
                              <button
                                key={s}
                                type="button"
                                className={'size-toggle' + (colorSizes.includes(s) ? ' on' : '')}
                                onClick={() => toggleColorSize(idx, s)}
                              >{s}</button>
                            ))}
                          </div>
                          <div className="color-size-quick">
                            <button type="button" className="size-quick-btn" onClick={() => setAllColorSizes(idx, true)}>Tout cocher</button>
                            <button type="button" className="size-quick-btn" onClick={() => setAllColorSizes(idx, false)}>Tout décocher</button>
                          </div>
                        </div>
                      )}
                      {availableSizes.length === 0 && (
                        <div className="color-size-hint">Définissez d'abord les tailles du produit ci-dessus.</div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* PHOTOS - toutes les photos, avec assignation de couleurs (multi) */}
          <div className="edit-section">
            <div className="edit-section-head">
              <h3>Photos</h3>
              <button type="button" className="btn-outline btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Upload…' : '+ Ajouter'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={e => { handleUpload(e.target.files); e.target.value = ''; }}
              />
            </div>
            {uploadErr && <span className="img-upload-err">{uploadErr}</span>}
            {allPhotos.length === 0 ? (
              <p className="muted">Aucune photo. Cliquez sur « + Ajouter » pour uploader des images.</p>
            ) : (
              <div className="photos-grid">
                {allPhotos.map((url, idx) => {
                  const assignedColors = colors.filter(c => (c.photos || []).includes(url));
                  return (
                    <div key={idx} className="photo-card">
                      <img src={url} alt={`Photo ${idx + 1}`} className="photo-card-img" />
                      {idx === 0 && form.img && <span className="photo-main-badge">Principale</span>}
                      <div className="photo-card-controls">
                        <button type="button" className="photo-card-btn" onClick={() => setMainPhoto(idx)} title="Définir comme principale" disabled={idx === 0 && !!form.img}>★</button>
                        <button type="button" className="photo-card-btn" onClick={() => movePhoto(idx, -1)} title="Gauche">←</button>
                        <button type="button" className="photo-card-btn danger" onClick={() => removePhoto(idx)} title="Supprimer">✕</button>
                        <button type="button" className="photo-card-btn" onClick={() => movePhoto(idx, 1)} title="Droite">→</button>
                      </div>
                      {colors.length > 0 && (
                        <div className="photo-color-assign">
                          <div className="photo-color-label">Couleurs:</div>
                          <div className="photo-color-dots">
                            {colors.map((c, ci) => {
                              const isOn = (c.photos || []).includes(url);
                              return (
                                <button
                                  key={ci}
                                  type="button"
                                  className={'photo-color-dot' + (isOn ? ' on' : '')}
                                  style={{ background: c.color || '#000' }}
                                  title={c.color_name || c.color || ''}
                                  onClick={() => togglePhotoColor(url, ci)}
                                />
                              );
                            })}
                          </div>
                          {assignedColors.length > 0 && (
                            <div className="photo-color-names">
                              {assignedColors.map((c, i) => (
                                <span key={i} className="photo-color-tag">{c.color_name || c.color}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {error && <div className="admin-error">{error}</div>}
          <div className="admin-form-actions">
            {!isNew && <button type="button" className="admin-action danger" onClick={handleDelete} disabled={saving}>Supprimer</button>}
            <button type="button" className="btn-outline" onClick={onClose} disabled={saving}>Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
