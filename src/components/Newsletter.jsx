import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('Veuillez entrer un courriel valide.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert({ email, source: 'site' });
      if (error) {
        if (error.code === '23505' || (error.message || '').includes('duplicate')) {
          setStatus('Merci ! Vous êtes déjà inscrit.');
        } else {
          setStatus('Une erreur est survenue. Veuillez réessayer.');
        }
      } else {
        setStatus('Merci ! Vous êtes maintenant inscrit à notre infolettre.');
        setEmail('');
      }
    } catch {
      setStatus('Une erreur est survenue. Veuillez réessayer.');
    }
    setLoading(false);
  };

  return (
    <section className="newsletter">
      <div className="wrap">
        <h2 className="newsletter-title">Inscrivez-vous à notre infolettre</h2>
        <p className="newsletter-sub">Nouveautés, soldes et événements en boutique.</p>
        <form className="nl-row" onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Votre courriel"
            value={email}
            onChange={e => setEmail(e.target.value)}
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '…' : "S'ABONNER"}
          </button>
        </form>
        {status && <div className="newsletter-status">{status}</div>}
      </div>
    </section>
  );
}
