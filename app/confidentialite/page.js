import NavPublic from "../../components/NavPublic";
import { T } from "../../lib/data";

export const metadata = {
  title: "Politique de confidentialité",
  description: "Comment Sama Site collecte, utilise et protège vos données personnelles.",
  robots: { index: true, follow: true },
};

function Section({ titre, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-bold mb-2" style={{ color: T.encre }}>{titre}</h2>
      <div className="text-sm leading-relaxed space-y-2" style={{ color: T.gris }}>{children}</div>
    </section>
  );
}

export default function Confidentialite() {
  return (
    <div>
      <NavPublic />
      <main className="max-w-2xl mx-auto px-5 py-14">
        <h1 className="text-2xl font-bold mb-1" style={{ color: T.encre }}>Politique de confidentialité</h1>
        <p className="text-xs mb-10" style={{ color: T.gris }}>
          Dernière mise à jour : 20 septembre 2026. Cette page décrit les données
          personnelles traitées par Sama Site et vos droits.
        </p>

        <Section titre="Qui est responsable de vos données">
          <p>
            Sama Site est un produit de Codesign Center SN SUARL (NINEA 010238758, RCCM SN DKR
            2023 B 18462), joignable à Cité Keur Gorgui, Rond-point, Dakar 23119, Sénégal.
            Pour toute question relative à vos données personnelles, contactez oumarchamaba@gmail.com.
          </p>
        </Section>

        <Section titre="Données que nous collectons">
          <p>Lorsque vous créez un compte ou un site avec Sama Site, nous collectons :</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Votre adresse e-mail et votre mot de passe (si vous créez un compte par e-mail), ou votre identité Google (si vous vous connectez avec Google).</li>
            <li>Les informations de votre commerce que vous saisissez : nom, numéro WhatsApp, adresse, lien Google Maps, logo, bannière, produits/services et prix.</li>
            <li>Les informations de commande que vous nous transmettez pour l'abonnement (moyen de paiement choisi, référence de transaction).</li>
          </ul>
        </Section>

        <Section titre="Pourquoi nous les utilisons">
          <ul className="list-disc pl-5 space-y-1">
            <li>Créer, héberger et faire fonctionner votre site (base de données Supabase).</li>
            <li>Vous permettre de vous connecter et de gérer vos sites depuis votre espace personnel.</li>
            <li>Traiter votre abonnement et vous contacter au sujet de votre commande.</li>
            <li>Si vous utilisez l'assistant "Améliorer avec l'IA" : le texte que vous soumettez est envoyé à l'API Google Gemini uniquement pour générer une reformulation ; il n'est pas utilisé à d'autres fins par Sama Site.</li>
          </ul>
        </Section>

        <Section titre="Durée de conservation">
          <p>
            Vos données sont conservées tant que votre compte ou votre site est actif. Un site créé
            sans compte pendant la période d'essai (2 jours) et non rattaché à un compte peut être
            supprimé après expiration du lien d'édition.
          </p>
        </Section>

        <Section titre="Partage de vos données">
          <p>
            Nous ne vendons ni ne louons vos données. Elles sont hébergées chez notre prestataire
            technique (Supabase). Si vous utilisez l'assistant IA, le texte soumis est transmis à
            Google (API Gemini) le temps du traitement de votre demande.
          </p>
        </Section>

        <Section titre="Vos droits">
          <p>
            Vous pouvez demander l'accès, la rectification ou la suppression de vos données à tout
            moment en nous contactant à oumarchamaba@gmail.com. Nous traiterons votre demande
            dans un délai raisonnable.
          </p>
        </Section>

        <Section titre="Cookies">
          <p>
            Sama Site n'utilise aujourd'hui aucun cookie de suivi publicitaire ni d'outil d'analyse
            tiers. Seuls des mécanismes techniques nécessaires à la connexion (gestion de votre
            session) sont utilisés.
          </p>
        </Section>
      </main>
    </div>
  );
}
