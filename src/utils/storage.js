// ── Clés localStorage ────────────────────────────────────────
export const CLES = {
  produits:     'mansa_produits',
  clients:      'mansa_clients',
  fournisseurs: 'mansa_fournisseurs',
  commandes:    'mansa_commandes',
  mouvements:   'mansa_mouvements',
  categories:   'mansa_categories',
}

// ── Générateur d'ID ──────────────────────────────────────────
export const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

// ── Données par défaut (vides) ───────────────────────────────
export const CATEGORIES_DEFAUT  = []
export const PRODUITS_DEFAUT    = []
export const CLIENTS_DEFAUT     = []
export const FOURNISSEURS_DEFAUT = []
export const COMMANDES_DEFAUT   = []
