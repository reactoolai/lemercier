import { useEffect } from 'react';
import { setPageSEO } from '../lib/seo.js';

export default function ShippingReturns({ goHome }) {
  useEffect(() => {
    setPageSEO('Livraison et retours', 'Livraison 25 $, offerte dès 200 $. Retour facile sous 30 jours. — Le Mercier Alma.', '/livraison-et-retours');
  }, []);

  return (
    <main className="wrap page legal-page">
      <div className="breadcrumb">
        <button onClick={goHome}>Accueil</button>
        <span>›</span>
        <span>Livraison et retours</span>
      </div>
      <h1 className="page-title">Livraison et retours</h1>
      <div className="legal-content">
        <h2>Livraison</h2>
        <p>Nous livrons partout au Québec. Les frais de livraison sont de 25 $ et sont offerts pour toute commande de 200 $ ou plus.</p>
        <p>Les commandes sont traitées sous 1 à 2 jours ouvrables. Le délai de livraison est généralement de 2 à 5 jours ouvrables selon votre région.</p>

        <h2>Ramassage en boutique</h2>
        <p>Vous pouvez choisir le ramassage gratuit en boutique au moment de la commande. Vous recevrez un courriel lorsque votre commande sera prête. Notre adresse: 630 Rue Sacré-Coeur O, Alma (Québec) G8B 1M1.</p>
        <p>Heures d'ouverture: Lun–Mer 9h30–17h30, Jeu–Ven 9h30–21h, Sam 9h30–17h, Dim 12h–16h.</p>

        <h2>Retours</h2>
        <p>Vous disposez de 30 jours après la réception pour retourner un article non porté, avec étiquettes et emballage d'origine. Les frais de retour sont à la charge du client, sauf en cas de défaut ou d'erreur de notre part.</p>
        <p>Pour initier un retour, contactez-nous à info@lechoixdesophie.com avec votre numéro de commande.</p>

        <h2>Échanges</h2>
        <p>Les échanges sont acceptés sous 30 jours, selon la disponibilité des tailles. Les frais de livraison pour l'échange sont à la charge du client.</p>

        <h2>Articles non retournables</h2>
        <p>Les articles en solde final, les sous-vêtements et les certificats cadeaux ne sont ni retournables ni échangeables.</p>
      </div>
    </main>
  );
}
