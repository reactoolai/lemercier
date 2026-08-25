import { useEffect } from 'react';
import { setPageSEO } from '../lib/seo.js';

export default function Privacy({ goHome }) {
  useEffect(() => {
    setPageSEO('Politique de confidentialité', 'Politique de confidentialité — Le Mercier Alma. Protection de vos données personnelles.', '/confidentialite');
  }, []);

  return (
    <main className="wrap page legal-page">
      <div className="breadcrumb">
        <button onClick={goHome}>Accueil</button>
        <span>›</span>
        <span>Confidentialité</span>
      </div>
      <h1 className="page-title">Politique de confidentialité</h1>
      <div className="legal-content">
        <h2>Collecte de renseignements</h2>
        <p>Le Mercier Alma recueille uniquement les renseignements nécessaires au traitement de vos commandes et à la communication avec vous: nom, courriel, adresse de livraison et numéro de téléphone. Nous ne vendons ni ne louons vos renseignements personnels à des tiers.</p>

        <h2>Utilisation des renseignements</h2>
        <p>Vos renseignements servent à traiter et expédier vos commandes, à vous informer du statut de celles-ci, et à vous envoyer notre infolettre si vous y êtes abonné. Vous pouvez vous désabonner en tout temps.</p>

        <h2>Paiement sécurisé</h2>
        <p>Les paiements sont traités par Square. Nous ne stockons aucune information de carte de crédit sur nos serveurs.</p>

        <h2>Cookies</h2>
        <p>Notre site utilise des cookies essentiels au fonctionnement du panier et de la navigation. Aucun cookie publicitaire n'est utilisé.</p>

        <h2>Protection des données</h2>
        <p>Vos données sont stockées de manière sécurisée chez notre fournisseur d'hébergement (Supabase). L'accès est limité aux personnes autorisées de la boutique.</p>

        <h2>Droit d'accès et de modification</h2>
        <p>Vous pouvez demander l'accès, la modification ou la suppression de vos renseignements personnels en nous écrivant à info@lechoixdesophie.com.</p>

        <h2>Lois applicables</h2>
        <p>Cette politique est régie par les lois du Québec et du Canada.</p>
      </div>
    </main>
  );
}
