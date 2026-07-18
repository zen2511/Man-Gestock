import * as XLSX from 'xlsx'

// ─────────────────────────────────────────────────────────────
//  Export Excel des prévisions de commande
//
//  Logique :
//  - Un produit "prévision" a déjà : stock, qteBase, manqueBase, prevision
//    (calculés par calculerPrevisions dans Previsions.jsx)
//  - EXPORT CIBLÉ (un fournisseur sélectionné) : un classeur avec une seule
//    feuille "Bon de commande", prête à imprimer/envoyer à ce fournisseur.
//  - EXPORT GLOBAL (aucun filtre) : un classeur avec une feuille
//    "Synthèse" (toutes les prévisions, tous fournisseurs confondus) suivie
//    d'une feuille "Bon de commande" par fournisseur ayant des prévisions.
//    Ainsi Zen peut imprimer/exporter chaque feuille séparément selon le
//    fournisseur à qui il doit passer commande.
// ─────────────────────────────────────────────────────────────

const CLE_MAGASIN = 'mansa_magasin'

function chargerMagasin() {
  try {
    return JSON.parse(localStorage.getItem(CLE_MAGASIN)) || {}
  } catch {
    return {}
  }
}

const fmt = (n) => Number(n || 0)

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

const TITRE_STYLE = { font: { bold: true, sz: 15, color: { rgb: '0F2847' } } }
const SOUS_TITRE_STYLE = { font: { sz: 11, color: { rgb: '64748B' } } }
const URGENCE_RUPTURE_STYLE = { font: { bold: true, color: { rgb: 'DC2626' }, sz: 11 } }
const URGENCE_FAIBLE_STYLE  = { font: { bold: true, color: { rgb: 'D97706' }, sz: 11 } }
const TOTAL_STYLE = {
  fill: { fgColor: { rgb: 'E3F2FD' } },
  font: { bold: true, sz: 12, color: { rgb: '0F2847' } },
  alignment: { horizontal: 'right' },
}
const TOTAL_VALEUR_STYLE = { ...TOTAL_STYLE, numFmt: '#,##0' }

function applyRowStyle(ws, row, colStart, colEnd, style) {
  for (let c = colStart; c <= colEnd; c++) {
    const addr = XLSX.utils.encode_cell({ r: row, c })
    if (!ws[addr]) ws[addr] = { v: '', t: 's' }
    ws[addr].s = style
  }
}

function setCellStyle(ws, r, c, style) {
  const addr = XLSX.utils.encode_cell({ r, c })
  if (ws[addr]) ws[addr].s = style
}

const ENTETES_BON = [
  'Réf.', 'Désignation', 'Catégorie', 'Unité',
  'Qté stock', 'Qté. base', 'Qté à commander', 'PU (FCFA)', 'Total (FCFA)',
]

/**
 * Construit la feuille "Bon de commande" pour UN fournisseur.
 * @param {string} nomFournisseur
 * @param {Array}  produits - lignes de prévision déjà filtrées pour ce fournisseur
 * @param {Object} magasin  - infos entreprise (nom, adresse, téléphone)
 */
function feuilleBonCommande(nomFournisseur, produits, magasin) {
  const lignes = []

  // ── En-tête (entreprise / fournisseur / date) ──
  lignes.push([magasin?.nom || 'MAN-SA', '', '', '', '', '', '', 'BON DE COMMANDE', ''])
  lignes.push([magasin?.adresse || '', '', '', '', '', '', '', `Date : ${new Date().toLocaleDateString('fr-FR')}`, ''])
  lignes.push([magasin?.telephone || '', '', '', '', '', '', '', `Fournisseur : ${nomFournisseur}`, ''])
  lignes.push(['', '', '', '', '', '', '', '', ''])

  const ligneHeader = lignes.length
  lignes.push(ENTETES_BON)

  const lignesProduits = []
  produits.forEach(p => {
    const qte = p.manqueBase ? 'À définir' : Math.round(p.prevision)
    const total = p.manqueBase ? '' : Math.round(p.prevision * fmt(p.prixUnitaire))
    lignes.push([
      p.reference || '—',
      p.designation || '—',
      p.categorie || '—',
      p.uniteVente || p.unite || '—',
      Math.round(p.stock),
      p.manqueBase ? 'À définir' : Math.round(p.qteBase),
      qte,
      p.manqueBase ? '' : fmt(p.prixUnitaire),
      total,
    ])
    lignesProduits.push({ r: lignes.length - 1, rupture: p.stock <= 0, manqueBase: p.manqueBase })
  })

  lignes.push(['', '', '', '', '', '', '', '', ''])
  const ligneTotal = lignes.length
  const totalGeneral = produits.reduce((s, p) => s + (p.manqueBase ? 0 : p.prevision * fmt(p.prixUnitaire)), 0)
  lignes.push(['', '', '', '', '', '', '', 'TOTAL COMMANDE (FCFA)', Math.round(totalGeneral)])

  lignes.push(['', '', '', '', '', '', '', '', ''])
  lignes.push(['', '', '', '', '', '', '', '', ''])
  lignes.push(['Visé / validé par : ____________________', '', '', '', '', 'Date : ____________________', '', '', ''])

  const ws = XLSX.utils.aoa_to_sheet(lignes)

  setCellStyle(ws, 0, 0, TITRE_STYLE)
  setCellStyle(ws, 0, 7, TITRE_STYLE)
  setCellStyle(ws, 1, 0, SOUS_TITRE_STYLE)
  setCellStyle(ws, 1, 7, SOUS_TITRE_STYLE)
  setCellStyle(ws, 2, 0, SOUS_TITRE_STYLE)
  setCellStyle(ws, 2, 7, { font: { bold: true, sz: 11, color: { rgb: '0F2847' } } })

  applyRowStyle(ws, ligneHeader, 0, ENTETES_BON.length - 1, HEADER_STYLE)

  lignesProduits.forEach(({ r, rupture, manqueBase }) => {
    if (manqueBase) {
      setCellStyle(ws, r, 5, URGENCE_FAIBLE_STYLE)
      setCellStyle(ws, r, 6, URGENCE_FAIBLE_STYLE)
    } else if (rupture) {
      setCellStyle(ws, r, 6, URGENCE_RUPTURE_STYLE)
    }
  })

  setCellStyle(ws, ligneTotal, 7, TOTAL_STYLE)
  setCellStyle(ws, ligneTotal, 8, TOTAL_VALEUR_STYLE)

  ws['!cols'] = [
    { wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 10 },
    { wch: 11 }, { wch: 11 }, { wch: 16 }, { wch: 13 }, { wch: 14 },
  ]
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
    { s: { r: 0, c: 7 }, e: { r: 0, c: 8 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } },
    { s: { r: 1, c: 7 }, e: { r: 1, c: 8 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 3 } },
    { s: { r: 2, c: 7 }, e: { r: 2, c: 8 } },
  ]

  return ws
}

/**
 * Construit la feuille "Synthèse" : toutes les prévisions, tous
 * fournisseurs confondus, triées par urgence (identique à l'écran).
 */
function feuilleSynthese(previsions) {
  const entetes = ['Réf.', 'Désignation', 'Catégorie', 'Fournisseur', 'Qté stock', 'Qté. base', 'Prévision commande', 'Statut']
  const lignes = previsions.map(p => {
    const statut = p.manqueBase ? 'Qté base à renseigner' : (p.stock <= 0 ? 'Rupture' : 'Stock faible')
    return [
      p.reference || '—',
      p.designation || '—',
      p.categorie || '—',
      p.fournisseurNom || '—',
      Math.round(p.stock),
      p.manqueBase ? 'À renseigner' : Math.round(p.qteBase),
      p.manqueBase ? '—' : Math.round(p.prevision),
      statut,
    ]
  })

  const data = [entetes, ...lignes]
  const ws = XLSX.utils.aoa_to_sheet(data)
  applyRowStyle(ws, 0, 0, entetes.length - 1, HEADER_STYLE)
  ws['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 16 }, { wch: 20 }, { wch: 11 }, { wch: 11 }, { wch: 18 }, { wch: 20 }]
  return ws
}

// Nom de feuille Excel valide : 31 caractères max, sans / \ ? * [ ]
function nomFeuilleValide(nom, dejaUtilises) {
  let base = String(nom || 'Fournisseur').replace(/[/\\?*[\]]/g, '-').slice(0, 28)
  let candidat = base
  let i = 2
  while (dejaUtilises.has(candidat)) {
    candidat = `${base} (${i})`.slice(0, 31)
    i++
  }
  dejaUtilises.add(candidat)
  return candidat
}

function slug(txt) {
  return String(txt || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

/**
 * Exporte une fiche Excel de commande à partir des prévisions.
 *
 * @param {Array}  previsions      - lignes de prévision (déjà calculées, filtrées par l'écran)
 * @param {string} [fournisseurId] - si fourni, export ciblé (une seule feuille, ce fournisseur)
 * @returns {{ nomFichier: string }}
 */
export function exporterFichePrevisions({ previsions, fournisseurId }) {
  if (!previsions || previsions.length === 0) {
    throw new Error('Aucune prévision à exporter.')
  }

  const magasin = chargerMagasin()
  const wb = XLSX.utils.book_new()
  const dateStr = new Date().toISOString().slice(0, 10)

  // ── Export ciblé : un seul fournisseur, une seule feuille ──
  if (fournisseurId) {
    const lignesFourn = previsions.filter(p => p.fournisseurId === fournisseurId)
    const nomFournisseur = lignesFourn[0]?.fournisseurNom || 'Fournisseur'
    XLSX.utils.book_append_sheet(wb, feuilleBonCommande(nomFournisseur, lignesFourn, magasin), 'Bon de commande')

    const nomFichier = `bon_commande_${slug(nomFournisseur)}_${dateStr}.xlsx`
    XLSX.writeFile(wb, nomFichier)
    return { nomFichier }
  }

  // ── Export global : synthèse + une feuille par fournisseur ──
  XLSX.utils.book_append_sheet(wb, feuilleSynthese(previsions), '0 - Synthèse')

  const parFournisseur = new Map()
  previsions.forEach(p => {
    const id = p.fournisseurId || '__sans__'
    if (!parFournisseur.has(id)) parFournisseur.set(id, { nom: p.fournisseurNom || 'Sans fournisseur', lignes: [] })
    parFournisseur.get(id).lignes.push(p)
  })

  const nomsUtilises = new Set(['0 - Synthèse'])
  Array.from(parFournisseur.values())
    .sort((a, b) => a.nom.localeCompare(b.nom))
    .forEach(f => {
      const nomFeuille = nomFeuilleValide(f.nom, nomsUtilises)
      XLSX.utils.book_append_sheet(wb, feuilleBonCommande(f.nom, f.lignes, magasin), nomFeuille)
    })

  const nomFichier = `previsions_commandes_${dateStr}.xlsx`
  XLSX.writeFile(wb, nomFichier)
  return { nomFichier }
}