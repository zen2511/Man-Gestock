import { useState } from 'react'
import { genId } from '../utils/storage'
import * as XLSX from 'xlsx'
import { MODAL_CSS } from '../utils/modalStyles'

const CLE_TEINTES = 'mansa_teintes'
const CLE_UNITES  = 'mansa_unites'
const TEINTES_DEFAUT = ['Naturel', 'Blanc', 'Bronze', 'Noir', 'Argent', 'Inox', 'Clair', 'Fumé', 'Laqué RAL sur mesure']
const UNITES_DEFAUT  = ['unité', 'ml', 'm²', 'm³', 'barre', 'rouleau', 'kg', 'tonne', 'lot', 'boîte', 'palette']

function loadLS(cle, defaut) {
  try { return JSON.parse(localStorage.getItem(cle)) || defaut } catch { return defaut }
}

const FORM_VIDE = {
  reference: '', designation: '', ral: '', categorieId: '', categorie: '',
  serie: '', stock: 0, stockMin: 5, prixUnitaire: 0, unite: '',
  dateEntree: new Date().toISOString().slice(0, 10),
  fournisseurId: '', fournisseurNom: '',
}

function Produits({ produits, mouvements, fournisseurs = [], categories: categoriesArg = [], droits }) {
  const { donnees, ajouter, modifier, effacer, sauvegarder: sauvegarderProduits } = produits

  const categories            = Array.isArray(categoriesArg) ? categoriesArg         : (categoriesArg.donnees    || [])
  const sauvegarderCategories = Array.isArray(categoriesArg) ? (() => {})             : (categoriesArg.sauvegarder || (() => {}))

  // ── Données depuis Paramètres ──────────────────────────────
  const teintes = loadLS(CLE_TEINTES, TEINTES_DEFAUT)
  const unites  = loadLS(CLE_UNITES,  UNITES_DEFAUT)

  const [recherche,        setRecherche]        = useState('')
  const [filtreCat,        setFiltreCat]        = useState('tous')
  const [modal,            setModal]            = useState(false)
  const [produitEdite,     setProduitEdite]      = useState(null)
  const [form,             setForm]             = useState(FORM_VIDE)
  const [modalMouvement,   setModalMouvement]   = useState(null)
  const [quantiteMvt,      setQuantiteMvt]      = useState(1)
  const [noteMvt,          setNoteMvt]          = useState('')
  const [confirmViderStock, setConfirmViderStock] = useState(false)

  // ── Styles ────────────────────────────────────────────────
  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13, marginBottom: 0,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }
  const sBtn = {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    background: '#254e88', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  }
  const sBtnSec = {
    padding: '10px 22px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b',
  }
  const sLabel = {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: 5,
  }
  const sDivider = {
    fontSize: 10, fontWeight: 800, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    padding: '18px 0 8px', borderBottom: '1.5px solid #f1f5f9', marginBottom: 16,
  }

  // ── Helpers ───────────────────────────────────────────────
  const norm = (txt) =>
    String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const resoudreCat = (p) =>
    categories.find(c => c.id === p.categorieId) ||
    categories.find(c => norm(c.nom) === norm(p.categorie))

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0)

  // ── Stats mensuelles produits (pour expert comptable) ─────
  const statsProduits = (() => {
    const debut = new Date(); debut.setDate(1); debut.setHours(0,0,0,0)
    const mvtsMois = (mouvements.donnees || []).filter(m => m.date && new Date(m.date) >= debut)

    // Valeur totale du stock actuel
    const valeurTotale = donnees.reduce((s, p) => s + (p.prixUnitaire || 0) * (p.stock || 0), 0)

    // Valeur des entrées du mois
    const valeurEntrees = mvtsMois
      .filter(m => m.type === 'entree')
      .reduce((s, m) => {
        const p = donnees.find(p => p.id === m.produitId)
        return s + (p?.prixUnitaire || 0) * (m.quantite || 0)
      }, 0)

    // Valeur des sorties du mois
    const valeurSorties = mvtsMois
      .filter(m => m.type === 'sortie')
      .reduce((s, m) => {
        const p = donnees.find(p => p.id === m.produitId)
        return s + (p?.prixUnitaire || 0) * (m.quantite || 0)
      }, 0)

    // Produits les plus sortis du mois (top 5 par quantité sortie)
    const sortiePar = {}
    mvtsMois.filter(m => m.type === 'sortie').forEach(m => {
      sortiePar[m.produitId] = (sortiePar[m.produitId] || 0) + (m.quantite || 0)
    })
    const topSorties = Object.entries(sortiePar)
      .map(([id, qte]) => ({ produit: donnees.find(p => p.id === id), qte }))
      .filter(x => x.produit)
      .sort((a, b) => b.qte - a.qte)
      .slice(0, 5)

    // Variation de stock du mois (entrées − sorties en quantité)
    const qteTotaleEntrees = mvtsMois.filter(m => m.type === 'entree').reduce((s, m) => s + (m.quantite || 0), 0)
    const qteTotaleSorties = mvtsMois.filter(m => m.type === 'sortie').reduce((s, m) => s + (m.quantite || 0), 0)
    const variationStock   = qteTotaleEntrees - qteTotaleSorties

    // Produits sans mouvement ce mois (stock dormant)
    const idsMouvementsMois = new Set(mvtsMois.map(m => m.produitId))
    const produitsDormants  = donnees.filter(p => !idsMouvementsMois.has(p.id) && (p.stock || 0) > 0).length

    return {
      valeurTotale, valeurEntrees, valeurSorties,
      qteTotaleEntrees, qteTotaleSorties, variationStock,
      topSorties, produitsDormants,
    }
  })()

  // ── Filtrage ──────────────────────────────────────────────
  const produitsFiltres = donnees.filter(p => {
    const q = recherche.toLowerCase()
    const matchSearch =
      (p.designation || '').toLowerCase().includes(q) ||
      (p.reference   || '').toLowerCase().includes(q) ||
      (p.serie       || '').toLowerCase().includes(q) ||
      (p.ral         || '').toLowerCase().includes(q) ||
      (p.categorie   || '').toLowerCase().includes(q)
    const catResolue = resoudreCat(p)
    const matchCat   = filtreCat === 'tous' || catResolue?.id === filtreCat
    return matchSearch && matchCat
  })

  const ruptures = donnees.filter(p => (p.stock || 0) <= 0).length
  const faibles  = donnees.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.stockMin || 5)).length

  const badgeStock = (p) => {
    if ((p.stock || 0) <= 0)                 return { label: 'Rupture', color: '#ef4444', bg: '#fef2f2' }
    if ((p.stock || 0) <= (p.stockMin || 5)) return { label: 'Faible',  color: '#f97316', bg: '#fff7ed' }
    return { label: 'OK', color: '#16a34a', bg: '#f0fdf4' }
  }

  // ── CRUD ──────────────────────────────────────────────────
  const ouvrirAjout = () => {
    setProduitEdite(null)
    setForm({ ...FORM_VIDE, dateEntree: new Date().toISOString().slice(0, 10) })
    setModal(true)
  }

  const ouvrirEdition = (p) => {
    setProduitEdite(p)
    setForm({ ...FORM_VIDE, ...p })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.designation.trim()) return
    const cat   = categories.find(c => c.id === form.categorieId)
    const fourn = fournisseurs.find(f => f.id === form.fournisseurId)
    const produit = {
      ...form,
      categorie:      cat?.nom   || '',
      fournisseurNom: fourn?.nom || '',
      stock:        Number(form.stock)        || 0,
      stockMin:     Number(form.stockMin)     || 5,
      prixUnitaire: Number(form.prixUnitaire) || 0,
    }
    if (produitEdite) modifier(produitEdite.id, produit)
    else ajouter({ ...produit, id: genId(), dateAjout: new Date().toISOString().slice(0, 10) })
    setModal(false)
  }

  const supprimerProduit = (id) => {
    if (window.confirm('Supprimer ce produit ?')) effacer(id)
  }

  // ── Vider tout le stock ───────────────────────────────────
  const viderToutLeStock = () => {
    sauvegarderProduits([])
    setConfirmViderStock(false)
  }

  // ── Mouvement de stock ────────────────────────────────────
  const appliquerMouvement = () => {
    const qte = Number(quantiteMvt)
    if (qte <= 0) return
    const { produit, type } = modalMouvement
    const nouvelleQte = type === 'entree'
      ? (produit.stock || 0) + qte
      : (produit.stock || 0) - qte
    if (nouvelleQte < 0) { alert('Stock insuffisant !'); return }
    modifier(produit.id, { stock: nouvelleQte })
    mouvements.ajouter({
      id: genId(), produitId: produit.id,
      produitNom: produit.designation,
      type, quantite: qte, note: noteMvt,
      date: new Date().toISOString(),
    })
    setModalMouvement(null); setQuantiteMvt(1); setNoteMvt('')
  }

  // ── Export Excel ──────────────────────────────────────────
  const exporterExcel = () => {
    const rows = donnees.map(p => {
      const cat   = resoudreCat(p)
      const fourn = fournisseurs.find(f => f.id === p.fournisseurId)
                 || fournisseurs.find(f => norm(f.nom) === norm(p.fournisseurNom))
      return {
        'Référence':       p.reference       || '',
        'Désignation *':   p.designation     || '',
        'Catégorie *':     cat?.nom          || p.categorie     || '',
        'RAL / Couleur':   p.ral             || '',
        'Série / Modèle':  p.serie           || '',
        'Unité':           p.unite           || '',
        'Prix Unitaire':   p.prixUnitaire    || 0,
        'Stock':           p.stock           || 0,
        'Stock Min':       p.stockMin        || 5,
        'Date Entrée':     p.dateEntree      || '',
        'Fournisseur':     fourn?.nom        || p.fournisseurNom || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produits')
    XLSX.writeFile(wb, `produits_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Import Excel ──────────────────────────────────────────
  const importerExcel = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        let lignes = XLSX.utils.sheet_to_json(ws, { defval: '', range: 2 })
        if (lignes.length === 0) lignes = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (lignes.length === 0) { alert('Fichier vide ou format non reconnu.'); return }

        let catsActuelles = []
        try {
          const raw = localStorage.getItem('mansa_categories')
          catsActuelles = raw ? JSON.parse(raw) : [...categories]
        } catch { catsActuelles = [...categories] }

        const vus = new Set()
        catsActuelles = catsActuelles.filter(c => {
          const k = norm(c.nom); if (vus.has(k)) return false; vus.add(k); return true
        })

        const nomsCats = [...new Set(
          lignes.map(l => (l['Catégorie'] || l['Categorie'] || '').toString().trim()).filter(Boolean)
        )]
        const nouvelles = []
        nomsCats.forEach(nomCat => {
          if (!catsActuelles.find(c => norm(c.nom) === norm(nomCat)))
            nouvelles.push({ id: genId(), nom: nomCat, description: '', dateCreation: new Date().toISOString() })
        })

        const referentiel = [...catsActuelles, ...nouvelles]
        localStorage.setItem('mansa_categories', JSON.stringify(referentiel))
        sauvegarderCategories(referentiel)

        setTimeout(() => {
          // Lire depuis localStorage pour éviter le state stale en boucle
          let produitsActuels = []
          try {
            const raw = localStorage.getItem('mansa_produits')
            produitsActuels = raw ? JSON.parse(raw) : [...donnees]
          } catch { produitsActuels = [...donnees] }

          // Helper : lit une colonne avec plusieurs variantes de nom possibles
          const col = (l, ...cles) => {
            for (const k of cles) { const v = l[k]; if (v !== undefined && v !== '') return v.toString().trim() }
            return ''
          }

          // Helper : convertit une date Excel (numéro de série ou chaîne) en AAAA-MM-JJ
          const parseDate = (val) => {
            if (!val) return ''
            if (typeof val === 'number') {
              const d = new Date(Math.round((val - 25569) * 86400 * 1000))
              return d.toISOString().slice(0, 10)
            }
            const s = val.toString().trim()
            if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
            return s
          }

          let n = 0
          lignes.forEach(l => {
            const desig = col(l, 'Désignation *', 'Désignation', 'Designation *', 'Designation')
            if (!desig) return
            const nomCat    = col(l, 'Catégorie *', 'Catégorie', 'Categorie *', 'Categorie')
            const catFinale = referentiel.find(c => norm(c.nom) === norm(nomCat))
            const nomFourn  = col(l, 'Fournisseur')
            const fourn     = fournisseurs.find(f => norm(f.nom) === norm(nomFourn))
            const reference = col(l, 'Référence', 'Reference')
            const produitExistant = reference
              ? produitsActuels.find(p => norm(p.reference) === norm(reference)) : null

            const produitData = {
              reference,
              designation:    desig,
              ral:            col(l, 'RAL / Couleur', 'RAL', 'Ral'),
              categorieId:    catFinale?.id  || '',
              categorie:      catFinale?.nom || nomCat,
              serie:          col(l, 'Série / Modèle', 'Série', 'Serie / Modele', 'Serie'),
              unite:          col(l, 'Unité', 'Unite'),
              prixUnitaire:   Number(col(l, 'Prix Unitaire')) || 0,
              stock:          Number(col(l, 'Stock'))         || 0,
              stockMin:       Number(col(l, 'Stock Min'))     || 5,
              dateEntree:     parseDate(col(l, 'Date Entrée', 'Date Entree')),
              fournisseurId:  fourn?.id  || '',
              fournisseurNom: fourn?.nom || nomFourn,
            }

            if (produitExistant) {
              const idx = produitsActuels.findIndex(p => p.id === produitExistant.id)
              produitsActuels[idx] = { ...produitsActuels[idx], ...produitData }
            } else {
              produitsActuels.push({ id: genId(), ...produitData, dateAjout: new Date().toISOString().slice(0, 10) })
            }
            n++
          })

          // Un seul appel pour tout le lot — évite les écrasements de state
          sauvegarderProduits(produitsActuels)
          alert(`${n} produit(s) importé(s) avec succès !`)
        }, 0)
      } catch (err) {
        console.error(err)
        alert('Erreur de lecture du fichier Excel. Vérifiez le format.')
      }
    }
    reader.readAsArrayBuffer(file)
    event.target.value = ''
  }

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div>
      <style>{MODAL_CSS}</style>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
            Produits ({donnees.length})
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Catalogue des produits</p>
        </div>
        {droits?.modifierProduits !== false && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input type="file" id="excel-upload" accept=".xlsx,.xls" onChange={importerExcel} style={{ display: 'none' }} />
            <button onClick={() => document.getElementById('excel-upload').click()} style={sBtnSec}>
              Importer
            </button>
            <button onClick={exporterExcel} style={sBtnSec}>Exporter</button>
            {droits?.supprimerDonnees !== false && (
              <button
                onClick={() => setConfirmViderStock(true)}
                style={{ ...sBtnSec, color: '#ef4444', borderColor: '#fecaca' }}
              >
                Vider le stock
              </button>
            )}
            <button onClick={ouvrirAjout} style={sBtn}>+ Ajouter</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #0f2847' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Total produits</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2847' }}>{donnees.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Ruptures</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{ruptures}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #fed7aa', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Stock faible</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f97316' }}>{faibles}</div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Référence, désignation, série, RAL, catégorie..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 0, flex: 1, minWidth: 200, maxWidth: 360 }}
        />
      </div>

      {/* Filtre catégorie */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <button onClick={() => setFiltreCat('tous')} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: filtreCat === 'tous' ? '#0f2847' : '#fff',
          color:      filtreCat === 'tous' ? '#fff'    : '#64748b',
          border:     `1.5px solid ${filtreCat === 'tous' ? '#0f2847' : '#e2e8f0'}`,
        }}>
          Tous ({donnees.length})
        </button>
        {categories.map(cat => {
          const n = donnees.filter(p => resoudreCat(p)?.id === cat.id).length
          if (n === 0) return null
          const actif = filtreCat === cat.id
          return (
            <button key={cat.id} onClick={() => setFiltreCat(actif ? 'tous' : cat.id)} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: actif ? (cat.couleur || '#0f2847') : '#fff',
              color:      actif ? '#fff' : '#64748b',
              border:     `1.5px solid ${actif ? (cat.couleur || '#0f2847') : '#e2e8f0'}`,
            }}>
              {cat.icone} {cat.nom} ({n})
            </button>
          )
        })}
      </div>

      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 14 }}>{produitsFiltres.length} produit(s)</p>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Réf.', 'Désignation', 'Catégorie', 'RAL', 'Série', 'Unité', 'P.U (FCFA)', 'Stock', 'Fournisseur', 'Statut', 'Actions'].map(col => (
                <th key={col} style={{
                  padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucun produit trouvé
              </td></tr>
            ) : (
              produitsFiltres.map((p, i) => {
                const badge = badgeStock(p)
                const cat   = resoudreCat(p)
                const fourn = fournisseurs.find(f => f.id === p.fournisseurId)
                           || fournisseurs.find(f => norm(f.nom) === norm(p.fournisseurNom))
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.reference || '—'}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847', minWidth: 160 }}>{p.designation || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {cat ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: (cat.couleur || '#0f2847') + '18',
                          color: cat.couleur || '#0f2847',
                          border: `1px solid ${(cat.couleur || '#0f2847') + '30'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {cat.icone} {cat.nom}
                        </span>
                      ) : p.categorie ? (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {p.categorie}
                        </span>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.ral || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.serie || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.unite || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                      {p.prixUnitaire ? fmt(p.prixUnitaire) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: badge.color, fontSize: 15 }}>{p.stock || 0}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fourn?.nom || p.fournisseurNom || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40` }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {droits?.modifierProduits !== false && (
                          <button onClick={() => ouvrirEdition(p)}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>
                            ✏️
                          </button>
                        )}
                        {droits?.supprimerDonnees !== false && (
                          <button onClick={() => supprimerProduit(p.id)}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ajout/édition ── */}
      {modal && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="mg-card mg-card-scroll" style={{ maxWidth: 580 }}>

            {/* En-tête modal */}
            <div className="mg-header">
              <div>
                <div className="mg-badge">{produitEdite ? 'Modification' : 'Création'}</div>
                <div className="mg-title">{produitEdite ? 'Modifier le produit' : 'Nouveau produit'}</div>
                <div className="mg-subtitle">Remplissez les informations du produit</div>
              </div>
              <button className="mg-close" onClick={() => setModal(false)}>×</button>
            </div>

            <div className="mg-card-body">

              {/* Section 1 — Identification */}
              <div className="mg-divider">
                <div className="mg-divider-line" /><span className="mg-divider-label">Identification</span><div className="mg-divider-line" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Référence</label>
                  <input className="mg-input mg-input-no-mb" value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })}
                    placeholder="ALU-001" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Désignation <span style={{ color: '#f87171' }}>*</span></label>
                  <input className="mg-input mg-input-no-mb" value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    placeholder="Nom complet du produit" />
                </div>
              </div>

              <div className="mg-field-grid-2" style={{ marginTop: 14 }}>
                {/* RAL — select depuis Paramètres avec option texte libre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">RAL / Couleur / Teinte</label>
                  <select className="mg-select mg-select-no-mb" value={form.ral}
                    onChange={e => setForm({ ...form, ral: e.target.value })}>
                    <option value="">Sélectionner une teinte</option>
                    {teintes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.ral === '__autre__' && (
                    <input
                      className="mg-input"
                      style={{ marginTop: 6 }}
                      placeholder="Saisir la teinte manuellement"
                      onChange={e => setForm({ ...form, ral: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Série / Modèle</label>
                  <input className="mg-input mg-input-no-mb" value={form.serie}
                    onChange={e => setForm({ ...form, serie: e.target.value })}
                    placeholder="Ex : Série 45, T55..." />
                </div>
              </div>

              {/* Section 2 — Classification */}
              <div className="mg-divider" style={{ marginTop: 6 }}>
                <div className="mg-divider-line" /><span className="mg-divider-label">Classification</span><div className="mg-divider-line" />
              </div>
              <div className="mg-field-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Catégorie</label>
                  <select className="mg-select mg-select-no-mb" value={form.categorieId}
                    onChange={e => {
                      const cat = categories.find(c => c.id === e.target.value)
                      setForm({ ...form, categorieId: e.target.value, categorie: cat?.nom || '' })
                    }}>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Fournisseur</label>
                  <select className="mg-select mg-select-no-mb" value={form.fournisseurId}
                    onChange={e => setForm({ ...form, fournisseurId: e.target.value })}>
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3 — Stock & Prix */}
              <div className="mg-divider" style={{ marginTop: 6 }}>
                <div className="mg-divider-line" /><span className="mg-divider-label">Stock & Tarification</span><div className="mg-divider-line" />
              </div>
              <div className="mg-field-grid-3">
                {/* Unité — select depuis Paramètres */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Unité</label>
                  <select className="mg-select mg-select-no-mb" value={form.unite}
                    onChange={e => setForm({ ...form, unite: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {unites.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.unite === '__autre__' && (
                    <input
                      className="mg-input"
                      style={{ marginTop: 6 }}
                      placeholder="Saisir l'unité"
                      onChange={e => setForm({ ...form, unite: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Prix unitaire (FCFA)</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.prixUnitaire}
                    onChange={e => setForm({ ...form, prixUnitaire: e.target.value })}
                    placeholder="0" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Stock initial</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>

              <div className="mg-field-grid-2" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Seuil d'alerte (stock min)</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.stockMin}
                    onChange={e => setForm({ ...form, stockMin: e.target.value })} />
                </div>
                {!produitEdite && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <label className="mg-label">Date d'entrée</label>
                    <input type="date" className="mg-input mg-input-no-mb" value={form.dateEntree}
                      onChange={e => setForm({ ...form, dateEntree: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mg-actions mg-actions-border" style={{ marginTop: 18 }}>
                <button className="mg-btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button className="mg-btn-primary" onClick={sauvegarder}>
                  {produitEdite ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation vider stock ── */}
      {confirmViderStock && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setConfirmViderStock(false)}>
          <div className="mg-card" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div className="mg-confirm-icon mg-confirm-icon-warn">⚠️</div>
            <div className="mg-title" style={{ textAlign: 'center', marginBottom: 8 }}>
              Vider tout le stock ?
            </div>
            <p className="mg-body-text" style={{ textAlign: 'center' }}>
              Les <span className="mg-body-strong">{donnees.length} produit(s)</span> du catalogue seront définitivement supprimés.
            </p>
            <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>
              Cette action est irréversible.
            </p>
            <div className="mg-actions" style={{ justifyContent: 'center' }}>
              <button className="mg-btn-ghost" onClick={() => setConfirmViderStock(false)}>Annuler</button>
              <button className="mg-btn-danger" onClick={viderToutLeStock}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal mouvement de stock ── */}
      {modalMouvement && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setModalMouvement(null)}>
          <div className="mg-card" style={{ maxWidth: 420 }}>
            <div className="mg-header">
              <div>
                <div className="mg-title">
                  {modalMouvement.type === 'entree' ? '📦 Entrée de stock' : '📤 Sortie de stock'}
                </div>
                <div className="mg-subtitle">{modalMouvement.produit.designation}</div>
              </div>
              <button className="mg-close" onClick={() => setModalMouvement(null)}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, border: '1px solid rgba(100,181,246,0.10)' }}>
              <span style={{ fontSize: 12, color: 'rgba(148,190,230,0.55)' }}>Stock actuel :</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(100,181,246,0.9)' }}>{modalMouvement.produit.stock || 0}</span>
            </div>

            <div className="mg-field">
              <label className="mg-label">Quantité</label>
              <input type="number" min="1" className="mg-input" value={quantiteMvt}
                onChange={e => setQuantiteMvt(e.target.value)} />
            </div>
            <div className="mg-field">
              <label className="mg-label">Note</label>
              <input className="mg-input" value={noteMvt} onChange={e => setNoteMvt(e.target.value)}
                placeholder="Ex: Livraison fournisseur..." />
            </div>

            <div className="mg-actions">
              <button className="mg-btn-ghost" onClick={() => setModalMouvement(null)}>Annuler</button>
              <button className="mg-btn-primary"
                onClick={appliquerMouvement}
                style={{ background: modalMouvement.type === 'entree'
                  ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)' }}>
                {modalMouvement.type === 'entree' ? "Confirmer l'entrée" : "Confirmer la sortie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Produits
