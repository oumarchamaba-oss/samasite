import NavPublic from "../../components/NavPublic";
import { T } from "../../lib/data";

export const metadata = {
  title: "Conditions générales d'utilisation",
  description: "Conditions d'utilisation et de vente du service Sama Site.",
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

export default function CGU() {
  return (
    <div>
      <NavPublic />
      <main className="max-w-2xl mx-auto px-5 py-14">
        <h1 className="text-2xl font-bold mb-1" style={{ color: T.encre }}>Conditions générales d'utilisation et de vente</h1>
        <p className="text-xs mb-10" style={{ color: T.gris }}>
          Dernière mise à jour : 20 septembre 2026. Ce texte n'a pas encore été validé par un
          juriste — voir la section 9 ci-dessous.
        </p>

        <Section titre="1. Objet">
          <p>
            Sama Site est un produit édité par Codesign Center SN SUARL (NINEA 010238758, RCCM SN
            DKR 2023 B 18462), joignable à Cité Keur Gorgui, Rond-point, Dakar 23119, Sénégal.
            Il permet à un commerce de créer un mini-site e-commerce avec prise de commande
            via WhatsApp, sans compétence technique. En créant un site avec Sama Site, vous acceptez
            les présentes conditions.
          </p>
        </Section>

        <Section titre="2. Essai gratuit">
          <p>
            Chaque site créé bénéficie d'une période d'essai gratuite de 2 jours, sans engagement et
            sans carte bancaire, permettant de créer et de modifier le contenu du site avant
            publication définitive.
          </p>
        </Section>

        <Section titre="3. Abonnement et paiement">
          <p>
            À l'issue de l'essai, la mise en ligne du site avec nom de domaine nécessite un
            abonnement payant (durée et tarif affichés sur le site au moment de la commande).
            Le paiement s'effectue aujourd'hui par confirmation manuelle (Wave, Orange Money ou
            virement) : votre commande reste "en attente" jusqu'à vérification et confirmation par
            l'administrateur. Aucune activation automatique n'a lieu sans paiement vérifié.
          </p>
        </Section>

        <Section titre="4. Contenu du client">
          <p>
            Vous restez propriétaire des textes, images, logos et informations que vous saisissez
            sur votre site. Vous garantissez disposer des droits nécessaires sur tout contenu
            (photos, logo) que vous importez, et être seul responsable de son exactitude.
          </p>
        </Section>

        <Section titre="5. Renouvellement et résiliation">
          <p>
            L'abonnement n'est pas reconduit automatiquement par prélèvement : vous êtes recontacté
            avant l'échéance pour renouveler. Sans renouvellement, le site passe en statut expiré et
            peut être désactivé.
          </p>
        </Section>

        <Section titre="6. Responsabilité">
          <p>
            Sama Site s'engage à maintenir le service accessible dans des conditions normales
            d'exploitation, sans garantie de disponibilité continue absolue. Sama Site ne peut être
            tenu responsable du contenu publié par ses clients ni des échanges effectués via
            WhatsApp entre un client et ses propres acheteurs.
          </p>
        </Section>

        <Section titre="7. Modification des présentes conditions">
          <p>
            Ces conditions peuvent être mises à jour ; la version en vigueur est celle publiée sur
            cette page à la date de votre commande.
          </p>
        </Section>

        <Section titre="8. Contact">
          <p>Pour toute question : oumarchamaba@gmail.com.</p>
        </Section>

        <Section titre="9. Validation juridique">
          <p>
            Ce texte a été rédigé comme point de départ raisonnable pour un service de ce type,
            mais n'a pas encore été relu par un juriste sénégalais spécialisé en droit du numérique
            et en droit de la consommation. Une validation juridique est recommandée avant toute
            communication commerciale à grande échelle.
          </p>
        </Section>
      </main>
    </div>
  );
}
