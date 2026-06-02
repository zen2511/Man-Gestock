import * as XLSX from 'xlsx'

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0)
const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR') : ''

/**
 * Retourne { debut: Date, fin: Date, label: string }
 * selon la période choisie : 'mois', 'semestre', 'annee'
 */
function getPeriode(type) {
  const now   = new Date()
  const annee = now.getFullYear()
  const mois  = now.getMonth() // 0-based

  if (type === 'mois') {
    const debut = new Date(annee, mois, 1)
    const fin   = new Date(annee, mois + 1, 0, 23, 59, 59)
    const label = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    return { debut, fin, label }
  }

  if (type === 'semestre') {
    const premier = mois < 6
    const debut   = new Date(annee, premier ? 0 : 6, 1)
    const fin     = new Date(annee, premier ? 6 : 12, 0, 23, 59, 59)
    const label   = `${premier ? '1er' : '2e'} semestre ${annee}`
    return { debut, fin, label }
  }

  // annee
  const debut = new Date(annee, 0, 1)
  const fin   = new Date(annee, 11, 31, 23, 59, 59)
  return { debut, fin, label: `Année ${annee}` }
}

/**
 * Style de cellule header (fond bleu foncé, texte blanc, gras)
 */
const HEADER_STYLE = {
  fill:   { fgColor: { rgb: '0F2847' } },
  font:   { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  border: {
    top:    { style: 'thin', color: { rgb: 'BBDEFB' } },
    bottom: { style: 'thin', color: { rgb: 'BBDEFB' } },
    left:   { style: 'thin', color: { rgb: 'BBDEFB' } },
    right:  { style: 'thin', color: { rgb: 'BBDEFB' } },
  },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
}

/**
 * Style cellule section titre (fond bleu clair)
 */
const SECTION_STYLE = {
  fill: { fgColor: { rgb: 'E3F2FD' } },
  font: { bold: true, color: { rgb: '0F2847' }, sz: 12 },
  alignment: { horizontal: 'left', vertical: 'center' },
}

/**
 * Applique un style à une plage de cellules dans une feuille
 * ex: applyStyle(ws, 'A1', 'F1', HEADER_STYLE)
 */
function applyRowStyle(ws, row, colStart, colEnd, style) {
  for (let c = colStart; c <= colEnd; c++) {
    const addr = XLSX.utils.encode_cell({ r: row, c })
    if (!ws[addr]) ws[addr] = { v: '', t: 's' }
    ws[addr].s = style
  }
}

/**
 * Crée une feuille à partir d'un tableau de lignes (array of arrays)
 * et applique les styles header sur la première ligne
 */
function creerFeuille(entetes, lignes) {
  const data = [entetes, ...lignes]
  const ws   = XLSX.utils.aoa_to_sheet(data)

  // Style header (ligne 0)
  applyRowStyle(ws, 0, 0, entetes.length - 1, HEADER_STYLE)

  // Largeur auto des colonnes (basée sur le contenu)
  ws['!cols'] = entetes.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...lignes.map(l => String(l[i] ?? '').length)
    )
    return { wch: Math.min(Math.max(maxLen + 2, 10), 40) }
  })

  return ws
}

// ─────────────────────────────────────────────────────────────
//  Feuille 1 — Résumé général
// ─────────────────────────────────────────────────────────────
function feuilleResume(produits, fournisseurs, clients, mouvements, periode, magasin) {
  const { debut, fin, label } = periode
  const mvts = mouvements.filter(m => {
    if (!m.date) return false
    const d = new Date(m.date)
    return d >= debut && d <= fin
  })

  const valeurStock = produits.reduce((s, p) => s + fmt(p.prixUnitaire) * fmt(p.stock), 0)
  const totalUnites = produits.reduce((s, p) => s + fmt(p.stock), 0)
  const ruptures    = produits.filter(p => fmt(p.stock) <= 0).length
  const faibles     = produits.filter(p => fmt(p.stock) > 0 && fmt(p.stock) <= fmt(p.stockMin || 5)).length

  const valeurEntrees = mvts.filter(m => m.type === 'entree').reduce((s, m) => {
    const p = produits.find(x => x.id === m.produitId)
    return s + fmt(p?.prixUnitaire) * fmt(m.quantite)
  }, 0)

  const valeurSorties = mvts.filter(m => m.type === 'sortie').reduce((s, m) => {
    const p = produits.find(x => x.id === m.produitId)
    return s + fmt(p?.prixUnitaire) * fmt(m.quantite)
  }, 0)

  const margeBrute = valeurSorties - valeurEntrees

  const lignes = [
    ['Entreprise',                  magasin?.nom       || '—'],
    ['Période',                     label],
    ['Date du rapport',             new Date().toLocaleDateString('fr-FR')],
    ['', ''],
    ['── STOCK ──────────────────', ''],
    ['Valeur totale du stock (FCFA)', Math.round(valeurStock)],
    ['Nombre de références produits', produits.length],
    ['Total unités en stock',         totalUnites],
    ['Produits en rupture',           ruptures],
    ['Produits en stock faible',      faibles],
    ['', ''],
    ['── MOUVEMENTS ─────────────', ''],
    ['Nombre total de mouvements',    mvts.length],
    ['Nb entrées',                    mvts.filter(m => m.type === 'entree').length],
    ['Nb sorties',                    mvts.filter(m => m.type === 'sortie').length],
    ['Valeur des entrées (FCFA)',      Math.round(valeurEntrees)],
    ['Valeur des sorties (FCFA)',      Math.round(valeurSorties)],
    ['Marge brute estimée (FCFA)',     Math.round(margeBrute)],
    ['', ''],
    ['── TIERS ───────────────────', ''],
    ['Nombre de fournisseurs',        fournisseurs.length],
    ['Nombre de clients',             clients.length],
  ]

  const ws = XLSX.utils.aoa_to_sheet(lignes)
  ws['!cols'] = [{ wch: 34 }, { wch: 28 }]

  // Style titres de section
  lignes.forEach((row, i) => {
    if (String(row[0]).startsWith('──')) {
      const addr = XLSX.utils.encode_cell({ r: i, c: 0 })
      if (ws[addr]) ws[addr].s = SECTION_STYLE
    }
  })

  // Style ligne 0 (entreprise) en gras
  const a0 = XLSX.utils.encode_cell({ r: 0, c: 1 })
  if (ws[a0]) ws[a0].s = { font: { bold: true, sz: 12 }, alignment: { horizontal: 'left' } }

  return ws
}

// ─────────────────────────────────────────────────────────────
//  Feuille 2 — Mouvements de stock
// ─────────────────────────────────────────────────────────────
function feuilleMouvements(produits, mouvements, periode) {
  const { debut, fin } = periode
  const mvts = mouvements
    .filter(m => {
      if (!m.date) return false
      const d = new Date(m.date)
      return d >= debut && d <= fin
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const entetes = ['Date', 'Type', 'Produit', 'Référence', 'Catégorie', 'Qté', 'Prix unit. (FCFA)', 'Valeur (FCFA)', 'Note']
  const lignes  = mvts.map(m => {
    const p = produits.find(x => x.id === m.produitId)
    const pu = fmt(p?.prixUnitaire)
    const qte = fmt(m.quantite)
    return [
      fmtDate(m.date),
      m.type === 'entree' ? 'Entrée' : 'Sortie',
      m.produitNom || p?.designation || '—',
      p?.reference || '—',
      p?.categorie || '—',
      qte,
      pu,
      Math.round(pu * qte),
      m.note || '',
    ]
  })

  return creerFeuille(entetes, lignes)
}

// ─────────────────────────────────────────────────────────────
//  Feuille 3 — État du stock (instantané)
// ─────────────────────────────────────────────────────────────
function feuilleStock(produits, fournisseurs) {
  const entetes = [
    'Référence', 'Désignation', 'Catégorie', 'Série / Modèle',
    'Fournisseur', 'Stock actuel', 'Stock min', 'Statut',
    'Prix unit. (FCFA)', 'Valeur stock (FCFA)', 'Date entrée',
  ]
  const lignes = produits.map(p => {
    const stock  = fmt(p.stock)
    const stockMin = fmt(p.stockMin || 5)
    const statut = stock <= 0 ? 'Rupture' : stock <= stockMin ? 'Faible' : 'OK'
    const fourn  = fournisseurs.find(f => f.id === p.fournisseurId)
    return [
      p.reference      || '—',
      p.designation    || '—',
      p.categorie      || '—',
      p.serie          || '—',
      fourn?.nom || p.fournisseurNom || '—',
      stock,
      stockMin,
      statut,
      fmt(p.prixUnitaire),
      Math.round(fmt(p.prixUnitaire) * stock),
      fmtDate(p.dateEntree || p.dateAjout),
    ]
  })

  return creerFeuille(entetes, lignes)
}

// ─────────────────────────────────────────────────────────────
//  Feuille 4 — Fournisseurs
// ─────────────────────────────────────────────────────────────
function feuilleFournisseurs(fournisseurs, produits) {
  const entetes = [
    'Fournisseur', 'Téléphone', 'Email', 'Adresse',
    'Nb références', 'Valeur stock (FCFA)', 'Date ajout',
  ]
  const lignes = fournisseurs.map(f => {
    const prods = produits.filter(p => p.fournisseurId === f.id || p.fournisseurNom === f.nom)
    const valeur = prods.reduce((s, p) => s + fmt(p.prixUnitaire) * fmt(p.stock), 0)
    return [
      f.nom       || '—',
      f.telephone || '—',
      f.email     || '—',
      f.adresse   || '—',
      prods.length,
      Math.round(valeur),
      fmtDate(f.dateCreation),
    ]
  })

  return creerFeuille(entetes, lignes)
}

// ─────────────────────────────────────────────────────────────
//  Feuille 5 — Clients
// ─────────────────────────────────────────────────────────────
function feuilleClients(clients, periode) {
  const { debut } = periode
  const entetes = ['N° Affaire', 'Nom', 'Téléphone', 'Email', 'Adresse', 'Note', 'Date ajout', 'Nouveau ce mois']
  const lignes  = clients.map(c => [
    c.numeroAffaire || '—',
    c.nom           || '—',
    c.telephone     || '—',
    c.email         || '—',
    c.adresse       || '—',
    c.note          || '—',
    fmtDate(c.dateCreation),
    c.dateCreation && new Date(c.dateCreation) >= debut ? 'Oui' : 'Non',
  ])

  return creerFeuille(entetes, lignes)
}

// ─────────────────────────────────────────────────────────────
//  Feuille 6 — Top produits (les plus sortis sur la période)
// ─────────────────────────────────────────────────────────────
function feuilleTopProduits(produits, mouvements, periode) {
  const { debut, fin } = periode
  const mvts = mouvements.filter(m => {
    if (!m.date) return false
    const d = new Date(m.date)
    return d >= debut && d <= fin && m.type === 'sortie'
  })

  // Agrégation par produit
  const map = {}
  mvts.forEach(m => {
    if (!map[m.produitId]) map[m.produitId] = { qteSortie: 0, nbMvts: 0 }
    map[m.produitId].qteSortie += fmt(m.quantite)
    map[m.produitId].nbMvts   += 1
  })

  const top = Object.entries(map)
    .map(([id, stat]) => {
      const p = produits.find(x => x.id === id)
      return {
        designation: p?.designation || '—',
        reference:   p?.reference   || '—',
        categorie:   p?.categorie   || '—',
        prixUnitaire: fmt(p?.prixUnitaire),
        stockActuel:  fmt(p?.stock),
        ...stat,
      }
    })
    .sort((a, b) => b.qteSortie - a.qteSortie)

  const entetes = [
    'Désignation', 'Référence', 'Catégorie',
    'Qté sortie', 'Nb mouvements', 'Valeur sortie (FCFA)',
    'Stock restant', 'Prix unit. (FCFA)',
  ]
  const lignes = top.map(t => [
    t.designation,
    t.reference,
    t.categorie,
    t.qteSortie,
    t.nbMvts,
    Math.round(t.prixUnitaire * t.qteSortie),
    t.stockActuel,
    t.prixUnitaire,
  ])

  return creerFeuille(entetes, lignes)
}

// ─────────────────────────────────────────────────────────────
//  Fonction principale d'export
// ─────────────────────────────────────────────────────────────
/**
 * @param {Object} params
 * @param {'mois'|'semestre'|'annee'} params.typePeriode
 * @param {Array}  params.produits     - produits.donnees
 * @param {Array}  params.fournisseurs - fournisseurs.donnees
 * @param {Array}  params.clients      - clients.donnees
 * @param {Array}  params.mouvements   - mouvements.donnees
 * @param {Object} params.magasin      - infos entreprise (depuis localStorage)
 */
export function exporterRapportComptable({ typePeriode, produits, fournisseurs, clients, mouvements, magasin }) {
  const periode = getPeriode(typePeriode)
  const wb      = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, feuilleResume(produits, fournisseurs, clients, mouvements, periode, magasin),       '1 - Résumé')
  XLSX.utils.book_append_sheet(wb, feuilleMouvements(produits, mouvements, periode),                                   '2 - Mouvements')
  XLSX.utils.book_append_sheet(wb, feuilleStock(produits, fournisseurs),                                               '3 - État du stock')
  XLSX.utils.book_append_sheet(wb, feuilleFournisseurs(fournisseurs, produits),                                        '4 - Fournisseurs')
  XLSX.utils.book_append_sheet(wb, feuilleClients(clients, periode),                                                   '5 - Clients')
  XLSX.utils.book_append_sheet(wb, feuilleTopProduits(produits, mouvements, periode),                                  '6 - Top produits')

  const nomFichier = `rapport_comptable_${periode.label.replace(/\s+/g, '_').toLowerCase()}.xlsx`
  XLSX.writeFile(wb, nomFichier)

  return { nomFichier, periode: periode.label }
}
