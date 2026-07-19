import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
//  Guide d'utilisation — MAN-SA Gestock
//  Un chapitre par module de l'application. Cliquer sur une carte
//  ouvre une page secondaire avec les étapes détaillées. Certaines
//  étapes/chapitres sont marqués par rôle et s'affichent avec une
//  note adaptée selon qui est connecté (admin / gestionnaire / visiteur).
// ─────────────────────────────────────────────────────────────

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  500: '#1976d2', 400: '#2196f3', 300: '#64b5f6',
  200: '#bbdefb', 100: '#e3f2fd', 50: '#f0f7ff',
}

const ROLES_LABEL = { admin: 'Administrateur', gestionnaire: 'Gestionnaire', visiteur: 'Visiteur' }

// icônes simples en SVG inline (cohérent avec le reste de l'app, pas de dépendance externe)
const ICONES = {
  dashboard: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  ),
  catalogue: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  produits: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  fournisseurs: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>
  ),
  commandesFournisseur: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2h6l1 4H8l1-4z"/><path d="M4 6h16l-1.5 13.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 6z"/>
    </svg>
  ),
  previsions: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
    </svg>
  ),
  entrees: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  sortie: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 8 12 3 17 8"/><line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  chantiers: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
  clients: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    </svg>
  ),
  parametres: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    </svg>
  ),
}

// ── Contenu des chapitres ──────────────────────────────────────
// rolesConcernes: qui utilise ce module au quotidien (indicatif, affiché en haut de page)
// etapes: { titre, texte, roleNote?: { admin|gestionnaire|visiteur: "précision pour ce rôle" } }
const CHAPITRES = [
  {
    id: 'dashboard',
    titre: 'Dashboard',
    resume: "Vue d'ensemble de l'activité : stock, alertes, chiffres clés.",
    rolesConcernes: ['admin', 'gestionnaire', 'visiteur'],
    etapes: [
      { titre: 'Ouvrir le Dashboard', texte: "C'est la première page qui s'affiche à la connexion. Elle donne une vue d'ensemble sans avoir à naviguer dans chaque module." },
      { titre: 'Lire les indicateurs', texte: "Valeur totale du stock, nombre de références, produits en rupture ou en stock faible, activité récente : tout est résumé en haut de page." },
      { titre: 'Utiliser les raccourcis', texte: "Les cartes du Dashboard renvoient directement vers les pages concernées (ex: cliquer sur « Produits en rupture » ouvre la liste filtrée)." },
      { titre: "Vérifier l'alerte de stock", texte: 'La cloche en haut de page (Header) signale le nombre de produits en stock bas — un clic ouvre directement la liste concernée.' },
    ],
    astuce: "Le Dashboard est le bon réflexe en début de journée : il montre en un coup d'œil ce qui nécessite une action (ruptures, commandes en attente...).",
  },
  {
    id: 'catalogue',
    titre: 'Catégories & Familles',
    resume: 'La base du catalogue : chaque produit a une catégorie, chaque catégorie appartient à une ou plusieurs familles.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Comprendre la hiérarchie', texte: 'Famille = grand regroupement (ex: TPR, Vitrage, Visserie). Catégorie = sous-ensemble plus précis (ex: Profilés, Joints, Accessoires). Un produit appartient toujours à une catégorie.' },
      { titre: 'Créer une catégorie', texte: "Aller dans Catégories → « + Ajouter ». Donner un nom clair : c'est ce nom qui apparaît ensuite sur chaque fiche produit." },
      { titre: 'Créer une famille et y rattacher des catégories', texte: "Aller dans Familles → « + Ajouter ». Une famille peut regrouper plusieurs catégories ; une catégorie peut aussi être rattachée à plusieurs familles si besoin." },
      { titre: "Pourquoi c'est important", texte: "Ce regroupement sert de base au Récapitulatif comptable (Paramètres → Export comptable) : la valeur du stock y est présentée famille par famille, catégorie par catégorie — exactement comme un inventaire comptable classique." },
    ],
    astuce: "Créez vos catégories et familles avant d'ajouter vos produits : ça évite d'avoir des produits « sans catégorie » à corriger après coup.",
    roleNoteBas: {
      visiteur: "En tant que Visiteur, vous pouvez consulter ces pages mais pas créer ou modifier de catégorie/famille.",
    },
  },
  {
    id: 'produits',
    titre: 'Produits',
    resume: 'Le catalogue complet : fiches produits, stock, prix, import/export Excel.',
    rolesConcernes: ['admin', 'gestionnaire', 'visiteur'],
    etapes: [
      { titre: 'Consulter la liste', texte: 'Chaque ligne affiche référence, désignation, catégorie, teinte, série, stock actuel et prix. Utilisez la recherche pour retrouver un produit rapidement.' },
      { titre: 'Ajouter un produit', texte: "« + Nouveau produit » → renseignez au minimum la référence, la désignation et la catégorie. Les champs Teinte, Série, Unité matière, Unité vente et Conditionnement affinent la fiche mais sont optionnels.", roleNote: { visiteur: 'Action réservée aux rôles Administrateur et Gestionnaire.' } },
      { titre: 'Renseigner les quantités', texte: "Qté. base = quantité de référence pour le réapprovisionnement (utilisée par les Prévisions). Qté stock = quantité physiquement disponible actuellement. Le Prix total est calculé automatiquement (Qté stock × Prix unitaire)." },
      { titre: "Définir le seuil d'alerte", texte: "Le champ Stock min détermine à partir de quand un produit est considéré « en stock faible » et remonte dans les alertes et les Prévisions." },
      { titre: 'Importer/exporter en masse', texte: "Le bouton Excel permet d'importer un fichier de produits existant ou d'exporter le catalogue actuel. Utile pour une mise à jour groupée des prix ou des stocks." },
    ],
    astuce: "Gardez toujours « Qté. base » à jour : c'est elle qui pilote automatiquement les prévisions de commande — sans elle, un produit en rupture n'aura pas de quantité suggérée.",
  },
  {
    id: 'fournisseurs',
    titre: 'Fournisseurs',
    resume: 'Le carnet de vos fournisseurs, lié aux produits et aux commandes.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Ajouter un fournisseur', texte: "Nom, téléphone, email, adresse. Ces informations réapparaissent automatiquement sur les bons de commande exportés en Excel." },
      { titre: 'Associer les produits', texte: "Sur chaque fiche produit, le champ Fournisseur permet de savoir chez qui commander. C'est ce lien qui alimente automatiquement les Prévisions et les Commandes fournisseur." },
      { titre: 'Vue par fournisseur', texte: "La fiche fournisseur montre la valeur totale du stock associé à ce fournisseur et le nombre de références — utile pour prioriser les négociations." },
    ],
    astuce: null,
    roleNoteBas: { visiteur: 'Consultation seule pour ce module.' },
  },
  {
    id: 'commandesFournisseur',
    titre: 'Commandes fournisseur',
    resume: 'Les bons de commande passés auprès des fournisseurs, du brouillon à la réception.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Créer une commande', texte: "« + Nouvelle commande » → numéro (obligatoire, doit être unique), fournisseur, date, statut. Le numéro de facture peut être ajouté plus tard, à réception." },
      { titre: 'Suivre le statut', texte: "En attente → Partiellement reçue → Reçue, ou Annulée. Le statut se met à jour manuellement selon l'avancement réel de la livraison." },
      { titre: 'Consulter le détail', texte: "Cliquer sur une commande dans la liste ouvre sa fiche détaillée avec deux sections : « Produits commandés » (ce qui a été demandé) et « Produits reçus » (ce qui est arrivé, via le module Entrées) — pratique pour repérer un écart de livraison." },
      { titre: 'Lier une réception', texte: "Quand la marchandise arrive, c'est dans le module Entrées qu'on enregistre la réception en la rattachant au numéro de commande — la commande se met alors à jour automatiquement." },
    ],
    astuce: "Le moyen le plus rapide de créer une commande complète (avec les produits déjà remplis) est de passer par Prévisions plutôt que par « + Nouvelle commande » à vide.",
  },
  {
    id: 'previsions',
    titre: 'Prévisions',
    resume: 'Les produits à recommander en priorité, et la création de commande en un clic.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Comprendre la liste', texte: "Un produit apparaît ici si sa Qté stock est inférieure ou égale à son Stock min. La quantité suggérée = Qté. base − Qté stock." },
      { titre: 'Filtrer par urgence ou fournisseur', texte: "Utilisez les onglets Rupture / Stock faible / Qté base à renseigner, ou cliquez sur une carte fournisseur pour ne voir que ses produits." },
      { titre: 'Créer une commande depuis un fournisseur', texte: "Cliquez sur « Créer une commande » sur la carte d'un fournisseur : un panneau s'ouvre avec tous ses produits à recommander, quantité déjà suggérée mais modifiable, et possibilité de retirer un produit avant de valider." },
      { titre: 'Valider', texte: "Une fois les quantités ajustées, validez : la commande fournisseur est créée automatiquement avec tous les produits et quantités choisis — plus besoin de les ressaisir dans Commandes fournisseur." },
      { titre: 'Exporter en Excel', texte: "Le bouton d'export génère un bon de commande Excel prêt à envoyer au fournisseur (ou un classeur complet avec une feuille par fournisseur si aucun filtre n'est actif)." },
    ],
    astuce: "Un produit avec « Qté. base à renseigner » (en orange) signifie que ce champ est vide sur la fiche produit — complétez-le pour que la prévision se calcule automatiquement.",
  },
  {
    id: 'entrees',
    titre: 'Entrées',
    resume: 'Enregistrement des marchandises reçues, avec mise à jour automatique du stock.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Sélectionner le produit', texte: 'Recherchez le produit par référence. Le filtrage se fait uniquement sur la référence pour éviter les confusions entre produits similaires.' },
      { titre: 'Rattacher à une commande', texte: "Si la marchandise correspond à une commande fournisseur en cours, sélectionnez son numéro : le numéro de facture est repris automatiquement et la commande passe à « Partiellement reçue » ou « Reçue »." },
      { titre: 'Saisir la quantité reçue', texte: "La quantité saisie s'ajoute directement au stock du produit — inutile de modifier le stock manuellement dans Produits ensuite." },
    ],
    astuce: null,
  },
  {
    id: 'sortie',
    titre: 'Sortie',
    resume: 'Sortie de stock vers un chantier ou une vente.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Sélectionner le produit et la quantité', texte: 'Le stock disponible est affiché en temps réel pour éviter une sortie supérieure à ce qui est en rayon.' },
      { titre: 'Associer un chantier (optionnel)', texte: "Si la sortie concerne un chantier suivi dans Chantiers, la rattacher permet de retrouver plus tard tout ce qui a été consommé pour ce chantier précis." },
      { titre: 'Confirmer', texte: 'Le stock du produit est immédiatement décrémenté.' },
    ],
    astuce: null,
  },
  {
    id: 'chantiers',
    titre: 'Chantiers',
    resume: 'Suivi des commandes clients / chantiers en cours.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Créer un chantier', texte: 'Rattachez-le à un client existant (créez le client au préalable dans Clients si besoin).' },
      { titre: 'Suivre l\'avancement', texte: "Le statut du chantier reflète son avancement global. Les sorties de stock liées à ce chantier apparaissent dans son détail." },
    ],
    astuce: null,
  },
  {
    id: 'clients',
    titre: 'Clients',
    resume: 'Le carnet de vos clients, avec numéro d\'affaire et coordonnées.',
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Ajouter un client', texte: 'Nom, téléphone, email, adresse, numéro d\'affaire si applicable.' },
      { titre: 'Retrouver un client', texte: 'Utilisez la recherche pour le retrouver rapidement au moment de créer un chantier ou une sortie.' },
    ],
    astuce: null,
  },
  {
    id: 'parametres',
    titre: 'Paramètres',
    resume: "Informations de l'entreprise, listes personnalisables, export comptable, utilisateurs.",
    rolesConcernes: ['admin', 'gestionnaire'],
    etapes: [
      { titre: 'Informations entreprise', texte: "Nom, contact, adresse, devise et seuil d'alerte stock par défaut — utilisés notamment sur les documents exportés (bons de commande, rapports)." },
      { titre: 'Listes personnalisables', texte: 'Teintes, Tailles et Unités sont des listes que vous alimentez vous-même : elles apparaissent ensuite comme options dans les fiches produits.' },
      { titre: 'Export comptable', texte: "Génère un fichier Excel complet (résumé, mouvements, état du stock, fournisseurs, clients, top produits, et récapitulatif par famille/catégorie) à remettre à l'expert-comptable." },
      { titre: 'Utilisateurs', texte: "Réservé à l'Administrateur : créer un compte, changer un rôle, réinitialiser un mot de passe, désactiver un accès.", roleNote: { gestionnaire: 'Non accessible pour ce rôle.', visiteur: 'Non accessible pour ce rôle.' } },
      { titre: 'Autorisations', texte: 'Tableau récapitulatif de ce que chaque rôle peut faire ou non, module par module.', roleNote: { gestionnaire: 'Non accessible pour ce rôle.', visiteur: 'Non accessible pour ce rôle.' } },
    ],
    astuce: "Pour le détail exact de ce que chaque rôle peut faire module par module, consultez l'onglet Autorisations (visible uniquement par l'Administrateur).",
  },
]

const S = {
  card: {
    background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 10,
    padding: '16px 18px', cursor: 'pointer', transition: 'border-color 0.15s, box-shadow 0.15s',
  },
}

function BadgeRole({ role }) {
  const couleurs = { admin: '#dc2626', gestionnaire: B[600], visiteur: '#64748b' }
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: (couleurs[role] || '#64748b') + '18', color: couleurs[role] || '#64748b',
      border: `1px solid ${(couleurs[role] || '#64748b')}30`, whiteSpace: 'nowrap',
    }}>
      {ROLES_LABEL[role] || role}
    </span>
  )
}

export default function GuideUtilisation({ role }) {
  const [chapitreId, setChapitreId] = useState(null)
  const chapitre = CHAPITRES.find(c => c.id === chapitreId)

  // ── Page secondaire : détail d'un chapitre ──
  if (chapitre) {
    return (
      <div>
        <button
          onClick={() => setChapitreId(null)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: B[600], cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 16 }}
        >
          ← Retour au guide
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 6 }}>
          <div style={{ color: B[600], flexShrink: 0, marginTop: 2 }}>{ICONES[chapitre.id]}</div>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: B[900], margin: 0 }}>{chapitre.titre}</h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{chapitre.resume}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, margin: '12px 0 22px' }}>
          <span style={{ fontSize: 11, color: '#94a3b8', marginRight: 2 }}>Concerne :</span>
          {chapitre.rolesConcernes.map(r => <BadgeRole key={r} role={r} />)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {chapitre.etapes.map((etape, i) => {
            const noteRole = etape.roleNote?.[role]
            return (
              <div key={i} style={{ display: 'flex', gap: 14, background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 10, padding: '14px 18px' }}>
                <div style={{
                  flexShrink: 0, width: 26, height: 26, borderRadius: '50%',
                  background: B[100], color: B[600], fontWeight: 800, fontSize: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: B[900], marginBottom: 3 }}>{etape.titre}</div>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{etape.texte}</div>
                  {noteRole && (
                    <div style={{ marginTop: 8, fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px' }}>
                      ⚠ {noteRole}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {chapitre.astuce && (
          <div style={{ marginTop: 20, background: B[50], border: `1px solid ${B[200]}`, borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <div style={{ fontSize: 13, color: B[700], lineHeight: 1.55 }}>{chapitre.astuce}</div>
          </div>
        )}

        {chapitre.roleNoteBas?.[role] && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: '#64748b', fontStyle: 'italic' }}>
            {chapitre.roleNoteBas[role]}
          </div>
        )}
      </div>
    )
  }

  // ── Page principale : grille des chapitres ──
  const chapitresVisibles = CHAPITRES.filter(c => !role || c.rolesConcernes.includes(role) || role === 'admin')

  return (
    <div>
      <h2 style={{ fontSize: 19, fontWeight: 800, color: B[900], margin: '0 0 4px' }}>Guide d'utilisation</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 6px' }}>
        Un chapitre par module de MAN-SA Gestock — cliquez sur une carte pour voir les étapes détaillées.
      </p>
      {role && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Connecté en tant que</span>
          <BadgeRole role={role} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, marginTop: role ? 0 : 16 }}>
        {chapitresVisibles.map(c => (
          <div
            key={c.id}
            onClick={() => setChapitreId(c.id)}
            style={S.card}
            onMouseEnter={e => { e.currentTarget.style.borderColor = B[400]; e.currentTarget.style.boxShadow = '0 4px 14px rgba(21,101,192,0.10)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = B[200]; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ color: B[600] }}>{ICONES[c.id]}</div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: B[900] }}>{c.titre}</div>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>{c.resume}</div>
            <div style={{ fontSize: 11, color: B[500], fontWeight: 700, marginTop: 10 }}>
              {c.etapes.length} étape{c.etapes.length > 1 ? 's' : ''} →
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
