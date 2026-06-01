import { useState } from 'react'
import { genId } from '../utils/storage'
import * as XLSX from 'xlsx'

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
  const { donnees, ajouter, modifier, effacer } = produits

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
    const updated = donnees.map(p => ({ ...p, stock: 0 }))
    sauvegarder(updated)
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
        'Référence':    p.reference    || '',
        'Désignation':  p.designation  || '',
        'RAL':          p.ral          || '',
        'Catégorie':    cat?.nom       || p.categorie     || '',
        'Série':        p.serie        || '',
        'Unité':        p.unite        || '',
        'Prix Unitaire':p.prixUnitaire || 0,
        'Stock':        p.stock        || 0,
        'Stock Min':    p.stockMin     || 5,
        'Date Entrée':  p.dateEntree   || '',
        'Fournisseur':  fourn?.nom     || p.fournisseurNom || '',
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

          let n = 0
          lignes.forEach(l => {
            const desig = (l['Désignation'] || l['Designation'] || '').toString().trim()
            if (!desig) return
            const nomCat    = (l['Catégorie'] || l['Categorie'] || '').toString().trim()
            const catFinale = referentiel.find(c => norm(c.nom) === norm(nomCat))
            const nomFourn  = (l['Fournisseur'] || '').toString().trim()
            const fourn     = fournisseurs.find(f => norm(f.nom) === norm(nomFourn))
            const reference = (l['Référence'] || l['Reference'] || '').toString().trim()
            const produitExistant = reference
              ? produitsActuels.find(p => norm(p.reference) === norm(reference)) : null

            const produitData = {
              reference,
              designation:    desig,
              ral:            (l['RAL'] || '').toString().trim(),
              categorieId:    catFinale?.id  || '',
              categorie:      catFinale?.nom || nomCat,
              serie:          (l['Série'] || l['Serie'] || '').toString().trim(),
              unite:          (l['Unité'] || l['Unite'] || '').toString().trim(),
              prixUnitaire:   Number(l['Prix Unitaire']) || 0,
              stock:          Number(l['Stock'])         || 0,
              stockMin:       Number(l['Stock Min'])     || 5,
              dateEntree:     (l['Date Entrée'] || l['Date Entree'] || '').toString().trim(),
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
          sauvegarder(produitsActuels)
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
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Modifier
                          </button>
                        )}
                        {droits?.supprimerDonnees !== false && (
                          <button onClick={() => supprimerProduit(p.id)}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            Suppr.
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,40,71,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

            {/* En-tête modal */}
            <div style={{ padding: '22px 28px 18px', borderBottom: '1.5px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                {produitEdite ? 'Modification' : 'Création'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2847' }}>
                {produitEdite ? 'Modifier le produit' : 'Nouveau produit'}
              </div>
            </div>

            <div style={{ padding: '20px 28px 28px' }}>

              {/* Section 1 — Identification */}
              <div style={sDivider}>Identification</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Référence</label>
                  <input style={sInput} value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })}
                    placeholder="ALU-001" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Désignation <span style={{ color: '#ef4444' }}>*</span></label>
                  <input style={sInput} value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    placeholder="Nom complet du produit" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* RAL — select depuis Paramètres avec option texte libre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>RAL / Couleur / Teinte</label>
                  <select style={sInput} value={form.ral}
                    onChange={e => setForm({ ...form, ral: e.target.value })}>
                    <option value="">Sélectionner une teinte</option>
                    {teintes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.ral === '__autre__' && (
                    <input
                      style={{ ...sInput, marginTop: 6 }}
                      placeholder="Saisir la teinte manuellement"
                      onChange={e => setForm({ ...form, ral: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Série / Modèle</label>
                  <input style={sInput} value={form.serie}
                    onChange={e => setForm({ ...form, serie: e.target.value })}
                    placeholder="Ex : Série 45, T55..." />
                </div>
              </div>

              {/* Section 2 — Classification */}
              <div style={sDivider}>Classification</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Catégorie</label>
                  <select style={sInput} value={form.categorieId}
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
                  <label style={sLabel}>Fournisseur</label>
                  <select style={sInput} value={form.fournisseurId}
                    onChange={e => setForm({ ...form, fournisseurId: e.target.value })}>
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3 — Stock & Prix */}
              <div style={sDivider}>Stock & Tarification</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Unité — select depuis Paramètres */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Unité</label>
                  <select style={sInput} value={form.unite}
                    onChange={e => setForm({ ...form, unite: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {unites.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.unite === '__autre__' && (
                    <input
                      style={{ ...sInput, marginTop: 6 }}
                      placeholder="Saisir l'unité"
                      onChange={e => setForm({ ...form, unite: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Prix unitaire (FCFA)</label>
                  <input type="number" min="0" style={sInput} value={form.prixUnitaire}
                    onChange={e => setForm({ ...form, prixUnitaire: e.target.value })}
                    placeholder="0" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Stock initial</label>
                  <input type="number" min="0" style={sInput} value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label style={sLabel}>Seuil d'alerte (stock min)</label>
                  <input type="number" min="0" style={sInput} value={form.stockMin}
                    onChange={e => setForm({ ...form, stockMin: e.target.value })} />
                </div>
                {!produitEdite && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <label style={sLabel}>Date d'entrée</label>
                    <input type="date" style={sInput} value={form.dateEntree}
                      onChange={e => setForm({ ...form, dateEntree: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1.5px solid #f1f5f9', marginTop: 4 }}>
                <button onClick={() => setModal(false)} style={sBtnSec}>Annuler</button>
                <button onClick={sauvegarder} style={sBtn}>
                  {produitEdite ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation vider stock ── */}
      {confirmViderStock && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,40,71,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '28px 30px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 22 }}>
              ⚠️
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f2847', margin: '0 0 10px', textAlign: 'center' }}>
              Vider tout le stock ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', marginBottom: 6 }}>
              Le stock de <strong style={{ color: '#0f2847' }}>{donnees.length} produit(s)</strong> sera remis à <strong>0</strong>.
            </p>
            <p style={{ color: '#ef4444', fontSize: 12, textAlign: 'center', marginBottom: 24 }}>
              Cette action est irréversible.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmViderStock(false)} style={sBtnSec}>Annuler</button>
              <button onClick={viderToutLeStock}
                style={{ ...sBtn, background: '#ef4444' }}>
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal mouvement de stock ── */}
      {modalMouvement && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px', width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f2847', marginTop: 0, marginBottom: 16 }}>
              {modalMouvement.type === 'entree' ? 'Entrée de stock' : 'Sortie de stock'}
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
              Produit : <strong style={{ color: '#0f2847' }}>{modalMouvement.produit.designation}</strong>
            </p>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              Stock actuel : <strong style={{ color: '#2563eb', fontSize: 16 }}>{modalMouvement.produit.stock || 0}</strong>
            </p>
            <label style={sLabel}>Quantité</label>
            <input type="number" min="1" value={quantiteMvt}
              onChange={e => setQuantiteMvt(e.target.value)}
              style={{ ...sInput, marginBottom: 14 }} />
            <label style={sLabel}>Note</label>
            <input value={noteMvt} onChange={e => setNoteMvt(e.target.value)}
              placeholder="Ex: Livraison fournisseur..."
              style={{ ...sInput, marginBottom: 24 }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalMouvement(null)} style={sBtnSec}>Annuler</button>
              <button onClick={appliquerMouvement}
                style={{ ...sBtn, background: modalMouvement.type === 'entree' ? '#16a34a' : '#c0392b' }}>
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
