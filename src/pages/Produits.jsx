import { useState } from 'react'
import { genId } from '../utils/storage'
import * as XLSX from 'xlsx'

const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0)

const FORM_VIDE = {
  reference:   '',
  designation: '',
  ral:         '',
  categorieId: '',
  categorie:   '',
  serie:       '',
  stock:       0,
  stockMin:    5,
  fournisseurId: '',
}

function Produits({ produits, mouvements, fournisseurs = [], categories = [], droits }) {
  console.log('FOURNISSEURS RECUS PAR PRODUITS :', fournisseurs)
  const { donnees, ajouter, modifier, effacer } = produits

  const [recherche,      setRecherche]      = useState('')
  const [filtreCat,      setFiltreCat]      = useState('tous')
  const [modal,          setModal]          = useState(false)
  const [produitEdite,   setProduitEdite]   = useState(null)
  const [form,           setForm]           = useState(FORM_VIDE)
  const [modalMouvement, setModalMouvement] = useState(null)
  const [quantiteMvt,    setQuantiteMvt]    = useState(1)
  const [noteMvt,        setNoteMvt]        = useState('')

  // ── Styles ────────────────────────────────────────────────
  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 14,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }
  const sBtn = {
    padding: '9px 20px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  }
  const sBtnSec = {
    padding: '9px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: '#fff', fontSize: 14, cursor: 'pointer', color: '#64748b',
  }
  const sLabel = { fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: 4 }

  // ── Filtrage ──────────────────────────────────────────────
  const produitsFiltres = donnees.filter(p => {
    const q = recherche.toLowerCase()
    const matchSearch =
      (p.designation || '').toLowerCase().includes(q) ||
      (p.reference   || '').toLowerCase().includes(q) ||
      (p.serie       || '').toLowerCase().includes(q) ||
      (p.ral         || '').toLowerCase().includes(q) ||
      (p.categorie   || '').toLowerCase().includes(q)
    const matchCat = filtreCat === 'tous' || p.categorieId === filtreCat
    return matchSearch && matchCat
  })

  // ── Stats ─────────────────────────────────────────────────
  const ruptures = donnees.filter(p => (p.stock || 0) <= 0).length
  const faibles  = donnees.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.stockMin || 5)).length

  // ── Badge stock ───────────────────────────────────────────
  const badgeStock = (p) => {
    if ((p.stock || 0) <= 0)                   return { label: 'Rupture', color: '#ef4444', bg: '#fef2f2' }
    if ((p.stock || 0) <= (p.stockMin || 5))   return { label: 'Faible',  color: '#f97316', bg: '#fff7ed' }
    return { label: 'OK', color: '#16a34a', bg: '#f0fdf4' }
  }

  // ── CRUD ──────────────────────────────────────────────────
  const ouvrirAjout = () => {
    setProduitEdite(null)
    setForm({ ...FORM_VIDE })
    setModal(true)
  }

  const ouvrirEdition = (p) => {
    setProduitEdite(p)
    setForm({ ...FORM_VIDE, ...p })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.designation.trim()) return
    const cat = categories.find(c => c.id === form.categorieId)
    const produit = {
      ...form,
      categorie: cat?.nom || '',
      stock:    Number(form.stock)    || 0,
      stockMin: Number(form.stockMin) || 5,
    }
    if (produitEdite) {
      modifier(produitEdite.id, produit)
    } else {
      ajouter({ ...produit, id: genId(), dateAjout: new Date().toISOString().slice(0, 10) })
    }
    setModal(false)
  }

  const supprimerProduit = (id) => {
    if (window.confirm('Supprimer ce produit ?')) effacer(id)
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
      type, quantite: qte,
      note: noteMvt,
      date: new Date().toISOString(),
    })
    setModalMouvement(null); setQuantiteMvt(1); setNoteMvt('')
  }

  // ── Export Excel ──────────────────────────────────────────
  const exporterExcel = () => {
    const rows = donnees.map(p => {
      const cat   = categories.find(c => c.id === p.categorieId)
      const fourn = fournisseurs.find(f => f.id === p.fournisseurId)
      return {
        'Référence':   p.reference   || '',
        'Désignation': p.designation || '',
        'RAL':         p.ral         || '',
        'Catégorie':   cat?.nom      || p.categorie || '',
        'Série':       p.serie       || '',
        'Stock':       p.stock       || 0,
        'Stock Min':   p.stockMin    || 5,
        'Fournisseur': fourn?.nom    || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produits')
    XLSX.writeFile(wb, `produits_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  // ── Import Excel ──────────────────────────────────────────
  const importerExcel = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb  = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const ws  = wb.Sheets[wb.SheetNames[0]]
        let lignes = XLSX.utils.sheet_to_json(ws, { defval: '', range: 2 })
        if (lignes.length === 0) lignes = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (lignes.length === 0) { alert('Fichier vide ou format non reconnu.'); return }

        let n = 0
        lignes.forEach(l => {
          const desig = (l['Désignation'] || l['Designation'] || '').toString().trim()
          if (!desig) return

          console.log('Ligne Excel complète :', l)

          const nomCat  = (l['Catégorie'] || l['Categorie'] || '').toString().trim()
          const cat     = categories.find(c => c.nom.toLowerCase() === nomCat.toLowerCase())
         const nomFourn =
  (
    l['Fournisseur'] ||
    l['FOURNISSEUR'] ||
    l['Nom Fournisseur'] ||
    ''
  )
  .toString()
  .trim()

  console.log('Nom fournisseur Excel :', nomFourn)
  console.log(
  'Liste fournisseurs :',
  fournisseurs.map(f => ({
    id: f.id,
    nom: f.nom
  }))
)

          const normaliser = (txt) =>
  String(txt || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const fourn = fournisseurs.find(
  f => normaliser(f.nom) === normaliser(nomFourn)
)

console.log('Fournisseur trouvé :', fourn)

          const reference = (l['Référence'] || l['Reference'] || '').toString().trim()

const produitExistant = donnees.find(
  p => p.reference?.toLowerCase() === reference.toLowerCase()
)

const produitData = {
  reference,
  designation: desig,
  ral: (l['RAL'] || '').toString().trim(),
  categorieId: cat?.id || '',
  categorie: cat?.nom || nomCat,
  serie: (l['Série'] || l['Serie'] || '').toString().trim(),
  stock: Number(l['Stock']) || 0,
  stockMin: Number(l['Stock Min']) || 5,
  fournisseurId: fourn?.id || '',
}

console.log('Produit à enregistrer :', produitData)

if (produitExistant) {
  modifier(produitExistant.id, produitData)
} else {
  ajouter({
    id: genId(),
    ...produitData,
    dateAjout: new Date().toISOString().slice(0, 10),
  })
}

n++
        })
        alert(`${n} produit(s) importé(s) avec succès !`)
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
          <div style={{ display: 'flex', gap: 10 }}>
            <input type="file" id="excel-upload" accept=".xlsx,.xls" onChange={importerExcel} style={{ display: 'none' }} />
            <button onClick={() => document.getElementById('excel-upload').click()}
              style={{ ...sBtnSec, display: 'flex', alignItems: 'center', gap: 6 }}>
              📥 Importer
            </button>
            <button onClick={exporterExcel}
              style={{ ...sBtnSec, display: 'flex', alignItems: 'center', gap: 6 }}>
              📤 Exporter
            </button>
            <button onClick={ouvrirAjout} style={sBtn}>＋ Ajouter</button>
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="🔍 Référence, désignation, série, RAL..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 0, flex: 1, minWidth: 200, maxWidth: 340 }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => setFiltreCat('tous')} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            background: filtreCat === 'tous' ? '#0f2847' : '#fff',
            color: filtreCat === 'tous' ? '#fff' : '#64748b',
            border: `1.5px solid ${filtreCat === 'tous' ? '#0f2847' : '#e2e8f0'}`,
          }}>
            Tous ({donnees.length})
          </button>
          {categories.map(cat => {
            const n = donnees.filter(p => p.categorieId === cat.id).length
            if (n === 0) return null
            const actif = filtreCat === cat.id
            return (
              <button key={cat.id} onClick={() => setFiltreCat(actif ? 'tous' : cat.id)} style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: actif ? (cat.couleur || '#0f2847') : '#fff',
                color: actif ? '#fff' : '#64748b',
                border: `1.5px solid ${actif ? (cat.couleur || '#0f2847') : '#e2e8f0'}`,
              }}>
                {cat.icone} {cat.nom} ({n})
              </button>
            )
          })}
        </div>
      </div>

      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 14 }}>{produitsFiltres.length} produit(s)</p>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Réf.', 'Désignation', 'RAL', 'Catégorie', 'Série', 'Stock', 'Fournisseur', 'Statut', 'Actions'].map(col => (
                <th key={col} style={{
                  padding: '11px 14px', textAlign: 'left', fontSize: 11,
                  fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                  letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {produitsFiltres.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucun produit trouvé
              </td></tr>
            ) : (
              produitsFiltres.map((p, i) => {
                const badge = badgeStock(p)
                const cat   = categories.find(c => c.id === p.categorieId)
                const fourn = fournisseurs.find(f => f.id === p.fournisseurId)
                return (
                  <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {p.reference || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847' }}>
                      {p.designation || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>
                      {p.ral || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {cat ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 20,
                          background: (cat.couleur || '#0f2847') + '18',
                          color: cat.couleur || '#0f2847', whiteSpace: 'nowrap',
                        }}>
                          {cat.icone} {cat.nom}
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{p.categorie || '—'}</span>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>
                      {p.serie || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: badge.color, fontSize: 15 }}>
                      {p.stock || 0}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fourn?.nom || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: badge.bg, color: badge.color,
                        border: `1px solid ${badge.color}40`,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {droits?.modifierProduits !== false && (
                          <>
                            <button onClick={() => setModalMouvement({ produit: p, type: 'entree' })}
                              style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                              ▲
                            </button>
                            <button onClick={() => setModalMouvement({ produit: p, type: 'sortie' })}
                              style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                              ▼
                            </button>
                            <button onClick={() => ouvrirEdition(p)}
                              style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>
                              ✏️
                            </button>
                          </>
                        )}
                        {droits?.supprimerDonnees !== false && (
                          <button onClick={() => supprimerProduit(p.id)}
                            style={{ padding: '4px 9px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px', width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2847', marginBottom: 22, marginTop: 0 }}>
              {produitEdite ? 'Modifier le produit' : 'Nouveau produit'}
            </h3>

            {/* Référence + Désignation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
              <div>
                <label style={sLabel}>Référence</label>
                <input style={sInput} value={form.reference}
                  onChange={e => setForm({ ...form, reference: e.target.value })}
                  placeholder="Ex: ALU-50" />
              </div>
              <div>
                <label style={sLabel}>Désignation *</label>
                <input style={sInput} value={form.designation}
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  placeholder="Nom du produit" />
              </div>
            </div>

            {/* RAL + Série */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={sLabel}>RAL</label>
                <input style={sInput} value={form.ral}
                  onChange={e => setForm({ ...form, ral: e.target.value })}
                  placeholder="Ex: RAL 9016, Blanc..." />
              </div>
              <div>
                <label style={sLabel}>Série</label>
                <input style={sInput} value={form.serie}
                  onChange={e => setForm({ ...form, serie: e.target.value })}
                  placeholder="Ex: Série 45, T55..." />
              </div>
            </div>

            {/* Catégorie */}
            <label style={sLabel}>Catégorie</label>
            <select style={sInput} value={form.categorieId}
              onChange={e => {
                const cat = categories.find(c => c.id === e.target.value)
                setForm({ ...form, categorieId: e.target.value, categorie: cat?.nom || '' })
              }}>
              <option value="">-- Sélectionner une catégorie --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
              ))}
            </select>

            {/* Stock + Stock min */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={sLabel}>Stock</label>
                <input type="number" min="0" style={sInput} value={form.stock}
                  onChange={e => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div>
                <label style={sLabel}>Stock min (alerte)</label>
                <input type="number" min="0" style={sInput} value={form.stockMin}
                  onChange={e => setForm({ ...form, stockMin: e.target.value })} />
              </div>
            </div>

            {/* Fournisseur */}
            <label style={sLabel}>Fournisseur</label>
            <select style={sInput} value={form.fournisseurId}
              onChange={e => setForm({ ...form, fournisseurId: e.target.value })}>
              <option value="">-- Sélectionner un fournisseur --</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.id}>{f.nom}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setModal(false)} style={sBtnSec}>Annuler</button>
              <button onClick={sauvegarder} style={sBtn}>
                {produitEdite ? 'Enregistrer' : 'Ajouter'}
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
              {modalMouvement.type === 'entree' ? '▲ Entrée de stock' : '▼ Sortie de stock'}
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
              Produit : <strong style={{ color: '#0f2847' }}>{modalMouvement.produit.designation}</strong>
            </p>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
              Stock actuel : <strong style={{ color: '#2563eb', fontSize: 16 }}>{modalMouvement.produit.stock || 0}</strong>
            </p>

            <label style={sLabel}>Quantité *</label>
            <input type="number" min="1" value={quantiteMvt}
              onChange={e => setQuantiteMvt(e.target.value)}
              style={sInput} />

            <label style={sLabel}>Note</label>
            <input value={noteMvt} onChange={e => setNoteMvt(e.target.value)}
              placeholder="Ex: Livraison fournisseur, vente client..."
              style={{ ...sInput, marginBottom: 24 }} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalMouvement(null)} style={sBtnSec}>Annuler</button>
              <button onClick={appliquerMouvement}
                style={{ ...sBtn, background: modalMouvement.type === 'entree' ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#c0392b,#e74c3c)' }}>
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
