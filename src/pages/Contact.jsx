import { useEffect, useState } from 'react';
import { setPageSEO } from '../lib/seo.js';

export default function Contact({ goHome, goShop }) {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPageSEO('Nous joindre', 'Contactez Le Mercier Alma — 630 Rue Sacré-Coeur O, Alma, Québec. Téléphone, courriel, heures d\'ouverture et réseaux sociaux.', '/nous-joindre');
  }, []);

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus('Veuillez remplir les champs obligatoires.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/contact-form`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus('Merci ! Votre message a été envoyé. Nous vous répondrons sous peu.');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus(data.error || "Une erreur est survenue. Veuillez réessayer.");
      }
    } catch {
      setStatus("Une erreur est survenue. Veuillez réessayer.");
    }
    setLoading(false);
  };

  return (
    <main className="wrap page contact-page">
      <div className="breadcrumb">
        <button onClick={goHome}>Accueil</button>
        <span>›</span>
        <span>Nous joindre</span>
      </div>
      <h1 className="page-title">Nous joindre</h1>

      <div className="contact-layout">
        <div className="contact-info">
          <div className="contact-card">
            <h2 className="contact-card-title">Adresse</h2>
            <div className="contact-card-body">630 Rue Sacré-Coeur O, Alma, Québec G8B 1M1</div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Téléphone</h2>
            <div className="contact-card-body"><a href="tel:+14186623240">(418) 662-3240</a></div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Courriel</h2>
            <div className="contact-card-body"><a href="mailto:info@lechoixdesophie.com">info@lechoixdesophie.com</a></div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Heures d'ouverture</h2>
            <div className="contact-card-hours">
              <div><span className="contact-hours-day">Lun–Mer</span> 9h30–17h30</div>
              <div><span className="contact-hours-day">Jeu–Ven</span> 9h30–21h</div>
              <div><span className="contact-hours-day">Sam</span> 9h30–17h</div>
              <div><span className="contact-hours-day">Dim</span> 12h–16h</div>
            </div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Réseaux sociaux</h2>
            <div className="contact-socials">
              <a href="https://www.facebook.com/lemercieralma/?locale=fr_CA" target="_blank" rel="noopener noreferrer">Facebook</a>
              <a href="https://www.instagram.com/lemercieralma/" target="_blank" rel="noopener noreferrer">Instagram</a>
            </div>
          </div>
          <div className="contact-card">
            <h2 className="contact-card-title">Livraison</h2>
            <div className="contact-card-body">Livraison 25 $ · offerte dès 200 $ partout au Québec. Retour facile sous 30 jours.</div>
          </div>
        </div>

        <div className="contact-right">
          <div className="contact-map">
            <iframe
              src="https://www.google.com/maps?q=630+Rue+Sacré-Coeur+O,+Alma,+QC&output=embed"
              title="Carte Le Mercier Alma"
              loading="lazy"
              style={{ width: '100%', height: '100%', border: 0, borderRadius: 12, minHeight: 240 }}
            />
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <h2 className="contact-form-title">Écrivez-nous</h2>
            <div className="contact-form-fields">
              <div className="contact-form-field">
                <label>Nom *</label>
                <input type="text" value={form.name} onChange={e => setField('name', e.target.value)} />
              </div>
              <div className="contact-form-field">
                <label>Courriel *</label>
                <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} />
              </div>
              <div className="contact-form-field">
                <label>Sujet</label>
                <input type="text" value={form.subject} onChange={e => setField('subject', e.target.value)} />
              </div>
              <div className="contact-form-field">
                <label>Message *</label>
                <textarea value={form.message} onChange={e => setField('message', e.target.value)} rows={4} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Envoi…' : 'ENVOYER'}
            </button>
            {status && <div className="contact-form-status">{status}</div>}
          </form>
        </div>
      </div>

      <button className="btn-primary" onClick={() => goShop()} style={{ marginTop: 32 }}>MAGASINER</button>
    </main>
  );
}
