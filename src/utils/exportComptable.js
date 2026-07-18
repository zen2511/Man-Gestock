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
//  Feuille 7 — Récapitulatif par famille / catégorie
//  Reproduit la logique du tableau "RECAP Etat_du_stock" :
//  chaque FAMILLE regroupe ses CATÉGORIES, chaque catégorie affiche
//  la valeur de son stock, et la famille affiche la somme de ses
//  catégories. Le total général somme toutes les familles.
// ─────────────────────────────────────────────────────────────

/**
 * Style ligne "Famille" (fond bleu clair, gras) — cohérent avec SECTION_STYLE
 */
const FAMILLE_STYLE = {
  fill: { fgColor: { rgb: 'E3F2FD' } },
  font: { bold: true, color: { rgb: '0F2847' }, sz: 12 },
  alignment: { horizontal: 'left', vertical: 'center' },
}
const FAMILLE_PRIX_STYLE = {
  fill: { fgColor: { rgb: 'E3F2FD' } },
  font: { bold: true, color: { rgb: '0F2847' }, sz: 12 },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
}
const CATEGORIE_STYLE = {
  font: { color: { rgb: '374151' }, sz: 11 },
  alignment: { horizontal: 'left', vertical: 'center', indent: 2 },
}
const CATEGORIE_PRIX_STYLE = {
  font: { color: { rgb: '374151' }, sz: 11 },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
}
const TOTAL_GENERAL_STYLE = {
  fill:   { fgColor: { rgb: '0F2847' } },
  font:   { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
  alignment: { horizontal: 'left', vertical: 'center' },
}
const TOTAL_GENERAL_PRIX_STYLE = {
  fill:   { fgColor: { rgb: '0F2847' } },
  font:   { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
  alignment: { horizontal: 'right', vertical: 'center' },
  numFmt: '#,##0',
}

const norm = (txt) =>
  String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function feuilleRecapFamilles(produits, categories, familles, magasin) {
  const valeurProduit = (p) => fmt(p.prixUnitaire) * fmt(p.stock)

  const idsFamillesDe = (cat) => cat?.familleIds || (cat?.familleId ? [cat.familleId] : [])

  // Valeur du stock par nom de catégorie (tel qu'enregistré sur les produits)
  const valeurParCategorie = {}
  produits.forEach(p => {
    const nomCat = p.categorie || 'Sans catégorie'
    valeurParCategorie[nomCat] = (valeurParCategorie[nomCat] || 0) + valeurProduit(p)
  })

  // Regroupement famille → catégories. Une catégorie peut appartenir à
  // plusieurs familles (many-to-many) ; ici on la rattache à sa famille
  // principale (la première) pour que chaque valeur ne compte qu'une
  // seule fois dans le total général, comme dans le tableau récap.
  const groupes = new Map() // familleId|'sans' -> { nom, categories: [{nom, valeur}], total }
  const categoriesTraitees = new Set()

  categories.forEach(cat => {
    const idsFam = idsFamillesDe(cat)
    const familleId = idsFam[0] || '__sans_famille__'
    const famille = familles.find(f => f.id === familleId)
    const nomGroupe = famille?.nom || 'Sans famille'
    const valeur = valeurParCategorie[cat.nom] || 0

    if (!groupes.has(familleId)) groupes.set(familleId, { nom: nomGroupe, categories: [], total: 0 })
    const g = groupes.get(familleId)
    g.categories.push({ nom: cat.nom, valeur })
    g.total += valeur
    categoriesTraitees.add(norm(cat.nom))
  })

  // Produits dont la catégorie ne correspond à aucune catégorie déclarée
  // (référence orpheline, ex: import Excel avec un nom mal orthographié)
  Object.entries(valeurParCategorie).forEach(([nomCat, valeur]) => {
    if (!categoriesTraitees.has(norm(nomCat))) {
      const familleId = '__orphelines__'
      if (!groupes.has(familleId)) groupes.set(familleId, { nom: 'Catégories non rattachées', categories: [], total: 0 })
      const g = groupes.get(familleId)
      g.categories.push({ nom: nomCat, valeur })
      g.total += valeur
    }
  })

  // Ordre : familles connues triées par nom, puis "Sans famille", puis "Catégories non rattachées"
  const listeGroupes = Array.from(groupes.entries())
    .sort(([idA, a], [idB, b]) => {
      if (idA === '__orphelines__') return 1
      if (idB === '__orphelines__') return -1
      if (idA === '__sans_famille__') return 1
      if (idB === '__sans_famille__') return -1
      return a.nom.localeCompare(b.nom)
    })

  const totalGeneral = listeGroupes.reduce((s, [, g]) => s + g.total, 0)

  // ── Construction des lignes ──
  const lignes = []
  const stylesParLigne = [] // { style: 'famille'|'categorie'|'total', ligne: index }

  lignes.push([magasin?.nom || 'Entreprise', '', `Récapitulatif au ${new Date().toLocaleDateString('fr-FR')}`])
  lignes.push(['', '', ''])
  lignes.push(['RÉCAPITULATIF DU STOCK PAR FAMILLE', '', ''])
  lignes.push(['', '', ''])
  lignes.push(['Désignation', 'Prix catégorie (FCFA)', 'Prix total famille (FCFA)'])
  const ligneHeader = lignes.length - 1

  let n = 1
  listeGroupes.forEach(([id, g]) => {
    const numero = (id === '__sans_famille__' || id === '__orphelines__') ? '-' : n++
    lignes.push([`${numero} - ${g.nom}`, '', Math.round(g.total)])
    stylesParLigne.push({ r: lignes.length - 1, type: 'famille' })

    g.categories
      .sort((a, b) => b.valeur - a.valeur)
      .forEach(cat => {
        lignes.push([cat.nom, Math.round(cat.valeur), ''])
        stylesParLigne.push({ r: lignes.length - 1, type: 'categorie' })
      })

    lignes.push(['', '', ''])
  })

  lignes.push(['MONTANT TOTAL EN FRANCS CFA', '', Math.round(totalGeneral)])
  const ligneTotal = lignes.length - 1

  // ── Feuille + styles ──
  const ws = XLSX.utils.aoa_to_sheet(lignes)

  applyRowStyle(ws, ligneHeader, 0, 2, HEADER_STYLE)

  const a0 = XLSX.utils.encode_cell({ r: 0, c: 0 })
  if (ws[a0]) ws[a0].s = { font: { bold: true, sz: 13, color: { rgb: '0F2847' } } }
  const a2 = XLSX.utils.encode_cell({ r: 2, c: 0 })
  if (ws[a2]) ws[a2].s = SECTION_STYLE

  stylesParLigne.forEach(({ r, type }) => {
    const styleTexte = type === 'famille' ? FAMILLE_STYLE : CATEGORIE_STYLE
    const stylePrix   = type === 'famille' ? FAMILLE_PRIX_STYLE : CATEGORIE_PRIX_STYLE
    const cA = XLSX.utils.encode_cell({ r, c: 0 })
    const cB = XLSX.utils.encode_cell({ r, c: 1 })
    const cC = XLSX.utils.encode_cell({ r, c: 2 })
    if (ws[cA]) ws[cA].s = styleTexte
    if (ws[cB]) ws[cB].s = type === 'famille' ? styleTexte : stylePrix
    if (ws[cC]) ws[cC].s = type === 'famille' ? stylePrix : styleTexte
  })

  const tA = XLSX.utils.encode_cell({ r: ligneTotal, c: 0 })
  const tB = XLSX.utils.encode_cell({ r: ligneTotal, c: 1 })
  const tC = XLSX.utils.encode_cell({ r: ligneTotal, c: 2 })
  if (ws[tA]) ws[tA].s = TOTAL_GENERAL_STYLE
  if (ws[tB]) ws[tB].s = TOTAL_GENERAL_STYLE
  if (ws[tC]) ws[tC].s = TOTAL_GENERAL_PRIX_STYLE

  ws['!cols'] = [{ wch: 42 }, { wch: 22 }, { wch: 24 }]
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 2 } },
  ]

  return ws
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
 * @param {Array}  params.categories   - categories.donnees
 * @param {Array}  params.familles     - familles.donnees
 * @param {Object} params.magasin      - infos entreprise (depuis localStorage)
 */
export function exporterRapportComptable({ typePeriode, produits, fournisseurs, clients, mouvements, categories = [], familles = [], magasin }) {
  const periode = getPeriode(typePeriode)
  const wb      = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, feuilleResume(produits, fournisseurs, clients, mouvements, periode, magasin),       '1 - Résumé')
  XLSX.utils.book_append_sheet(wb, feuilleMouvements(produits, mouvements, periode),                                   '2 - Mouvements')
  XLSX.utils.book_append_sheet(wb, feuilleStock(produits, fournisseurs),                                               '3 - État du stock')
  XLSX.utils.book_append_sheet(wb, feuilleFournisseurs(fournisseurs, produits),                                        '4 - Fournisseurs')
  XLSX.utils.book_append_sheet(wb, feuilleClients(clients, periode),                                                   '5 - Clients')
  XLSX.utils.book_append_sheet(wb, feuilleTopProduits(produits, mouvements, periode),                                  '6 - Top produits')
  XLSX.utils.book_append_sheet(wb, feuilleRecapFamilles(produits, categories, familles, magasin),                      '7 - Récapitulatif')

  const nomFichier = `rapport_comptable_${periode.label.replace(/\s+/g, '_').toLowerCase()}.xlsx`
  XLSX.writeFile(wb, nomFichier)

  return { nomFichier, periode: periode.label }
}