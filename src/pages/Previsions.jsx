import { useState } from 'react'
import { MODAL_CSS } from '../utils/modalStyles'
import { exporterFichePrevisions } from '../utils/exportPrevisions'

const norm = (txt) =>
  String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0)

const URGENCES = [
  { valeur: 'tous',      label: 'Tous' },
  { valeur: 'rupture',   label: 'Rupture' },
  { valeur: 'faible',    label: 'Stock faible' },
  { valeur: 'aRenseigner', label: 'Qté. base à renseigner' },
]

// Calcule la liste des prévisions à partir des produits.
// Un produit apparaît si son stock est faible (stock ≤ stockMin) et que la
// prévision (qteBase − stock) serait utile : soit qteBase > stock, soit
// qteBase n'est pas encore renseignée (on l'affiche quand même avec un
// avertissement à compléter, plutôt que de le faire disparaître).
function calculerPrevisions(listeProduits) {
  return listeProduits
    .filter(p => (Number(p.stock) || 0) <= (Number(p.stockMin) || 5))
    .map(p => {
      const stock = Number(p.stock) || 0
      const manqueBase = p.qteBase === '' || p.qteBase === undefined || p.qteBase === null || Number(p.qteBase) === 0
      const qteBase = manqueBase ? 0 : Number(p.qteBase)
      const prevision = qteBase - stock
      return { ...p, stock, qteBase, manqueBase, prevision }
    })
    .filter(p => p.manqueBase || p.prevision > 0)
    .sort((a, b) => {
      const ruptureA = a.stock <= 0 ? 0 : 1
      const ruptureB = b.stock <= 0 ? 0 : 1
      if (ruptureA !== ruptureB) return ruptureA - ruptureB
      return (b.prevision || 0) - (a.prevision || 0)
    })
}

const statutPrevision = (p) => {
  if (p.manqueBase) return { label: 'Qté base à renseigner', couleur: '#b45309', cle: 'aRenseigner' }
  if (p.stock <= 0)  return { label: 'Rupture',              couleur: '#dc2626', cle: 'rupture' }
  return { label: 'Stock faible', couleur: '#d97706', cle: 'faible' }
}

function Previsions({ produits: produitsArg = [], fournisseurs: fournisseursArg = [], onCreerCommande, droits }) {
  const listeProduits = Array.isArray(produitsArg) ? produitsArg : (produitsArg.donnees || [])
  const fournisseurs  = Array.isArray(fournisseursArg) ? fournisseursArg : (fournisseursArg.donnees || [])

  const [recherche,        setRecherche]        = useState('')
  const [urgence,           setUrgence]          = useState('tous')
  const [filtreFournisseur, setFiltreFournisseur] = useState('')
  const [exportEnCours,     setExportEnCours]     = useState(false)
  const [selection,         setSelection]         = useState(null) // { fournisseurId, fournisseurNom, lignes: [...] }

  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13, marginBottom: 0,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }

  const previsions = calculerPrevisions(listeProduits)

  const totalFCFA = (liste) => liste.reduce((s, p) => s + (p.manqueBase ? 0 : p.prevision * (Number(p.prixUnitaire) || 0)), 0)

  // ── Synthèse par fournisseur : sert de raccourci de filtrage + création ──
  const parFournisseur = (() => {
    const map = new Map()
    previsions.forEach(p => {
      const id = p.fournisseurId || '_sans'
      if (!map.has(id)) {
        map.set(id, { id, nom: p.fournisseurNom || 'Sans fournisseur', produits: [] })
      }
      map.get(id).produits.push(p)
    })
    return Array.from(map.values())
      .map(f => ({ ...f, nbRupture: f.produits.filter(p => p.stock <= 0).length, budget: totalFCFA(f.produits) }))
      .sort((a, b) => b.produits.length - a.produits.length)
  })()

  // ── Filtrage combiné : recherche texte + urgence + fournisseur ──
  const previsionsAffichees = previsions.filter(p => {
    if (filtreFournisseur && p.fournisseurId !== filtreFournisseur) return false
    if (urgence !== 'tous' && statutPrevision(p).cle !== urgence) return false
    if (recherche) {
      const cible = norm([p.reference, p.designation, p.categorie].filter(Boolean).join(' '))
      if (!cible.includes(norm(recherche))) return false
    }
    return true
  })

  const nbRuptureTotal = previsions.filter(p => p.stock <= 0).length
  const nbFaibleTotal  = previsions.filter(p => p.stock > 0 && !p.manqueBase).length
  const nbARenseigner  = previsions.filter(p => p.manqueBase).length

  // ── Sélection des produits avant création de la commande ──────
  // Ouvre un panneau listant les produits en prévision pour ce
  // fournisseur, avec quantité éditable et possibilité de retirer
  // un produit avant validation.
  const ouvrirSelection = (fournisseurId) => {
    if (!fournisseurId || fournisseurId === '_sans') return
    const lignesFourn = previsions.filter(p => p.fournisseurId === fournisseurId)
    const nomFournisseur = lignesFourn[0]?.fournisseurNom || 'Fournisseur'
    setSelection({
      fournisseurId,
      fournisseurNom: nomFournisseur,
      lignes: lignesFourn.map(p => ({
        produitId: p.id,
        reference: p.reference,
        designation: p.designation,
        categorie: p.categorie,
        stock: p.stock,
        prixUnitaire: Number(p.prixUnitaire) || 0,
        qte: p.manqueBase ? 1 : Math.max(1, Math.round(p.prevision)),
      })),
    })
  }

  const majQteSelection = (produitId, val) => {
    setSelection(sel => ({
      ...sel,
      lignes: sel.lignes.map(l => l.produitId === produitId ? { ...l, qte: val } : l),
    }))
  }

  const retirerDeSelection = (produitId) => {
    setSelection(sel => ({ ...sel, lignes: sel.lignes.filter(l => l.produitId !== produitId) }))
  }

  const totalSelection = (lignes) => lignes.reduce((s, l) => s + (Number(l.qte) || 0) * l.prixUnitaire, 0)

  const validerSelection = () => {
    if (!selection || selection.lignes.length === 0) {
      alert('Ajoutez au moins un produit avant de créer la commande.')
      return
    }
    const lignesCommande = selection.lignes.map(l => ({
      produitId: l.produitId,
      reference: l.reference,
      designation: l.designation,
      categorie: l.categorie,
      qteCommandee: Number(l.qte) || 0,
      prixUnitaire: l.prixUnitaire,
    }))
    onCreerCommande?.(selection.fournisseurId, lignesCommande)
    setSelection(null)
  }

  // ── Export Excel ──────────────────────────────────────────
  // Exporte toujours l'ensemble des prévisions (pas juste ce qui est
  // affiché après recherche/urgence) pour garantir un bon de commande
  // complet. Si un fournisseur est déjà filtré via les cartes, l'export
  // ciblé génère directement son bon de commande ; sinon un classeur
  // complet est produit (synthèse + une feuille par fournisseur).
  const exporterExcel = (fournisseurIdCible) => {
    setExportEnCours(true)
    try {
      exporterFichePrevisions({ previsions, fournisseurId: fournisseurIdCible || undefined })
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'export Excel. Vérifiez la console.")
    } finally {
      setExportEnCours(false)
    }
  }

  return (
    <div>
      <style>{MODAL_CSS}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
            Prévisions de commande{previsions.length > 0 ? ` (${previsions.length})` : ''}
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
            Produits en stock faible ou en rupture — Prévision = Qté. base − Qté stock
          </p>
        </div>
        {previsions.length > 0 && (
          <button
            onClick={() => exporterExcel(filtreFournisseur)}
            disabled={exportEnCours}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none',
              background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: exportEnCours ? 'wait' : 'pointer', opacity: exportEnCours ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
            }}
          >
            {exportEnCours
              ? 'Génération...'
              : filtreFournisseur
                ? '📄 Exporter le bon de commande'
                : '📄 Exporter toutes les prévisions (Excel)'}
          </button>
        )}
      </div>

      {previsions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
          <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
            Aucun produit ne nécessite de réapprovisionnement pour l'instant.
          </p>
        </div>
      ) : (
        <>
          {/* Barre de synthèse globale */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 28, flexWrap: 'wrap', marginBottom: 16,
            padding: '14px 18px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
          }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Produits à commander
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', marginTop: 2 }}>{previsions.length}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Budget estimé (FCFA)
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', marginTop: 2 }}>{fmt(totalFCFA(previsions))}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                En rupture
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626', marginTop: 2 }}>{nbRuptureTotal}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Stock faible
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706', marginTop: 2 }}>{nbFaibleTotal}</div>
            </div>
            {nbARenseigner > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Qté. base à renseigner
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309', marginTop: 2 }}>{nbARenseigner}</div>
              </div>
            )}
          </div>

          {/* Cartes par fournisseur — filtrage + création rapide */}
          {parFournisseur.length >= 1 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
              {parFournisseur.map(f => {
                const actif = filtreFournisseur === f.id
                return (
                  <div
                    key={f.id}
                    onClick={() => setFiltreFournisseur(actif ? '' : f.id)}
                    style={{
                      cursor: 'pointer', minWidth: 180, padding: '12px 16px', borderRadius: 10,
                      background: actif ? '#254e88' : '#fff',
                      border: `1.5px solid ${actif ? '#254e88' : '#e2e8f0'}`,
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: actif ? '#fff' : '#0f2847', marginBottom: 4 }}>
                      {f.nom}
                    </div>
                    <div style={{ fontSize: 11, color: actif ? '#cbd8ec' : '#64748b' }}>
                      {f.produits.length} produit{f.produits.length > 1 ? 's' : ''}
                      {f.nbRupture > 0 ? ` · ${f.nbRupture} en rupture` : ''}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: actif ? '#fff' : '#254e88', marginTop: 4 }}>
                      {fmt(f.budget)} FCFA
                    </div>
                    {droits?.modifierProduits !== false && f.id !== '_sans' && (
                      <button
                        onClick={e => { e.stopPropagation(); ouvrirSelection(f.id) }}
                        style={{
                          marginTop: 8, width: '100%', padding: '6px 10px', borderRadius: 6, border: 'none',
                          background: actif ? '#fff' : '#eef3fa', color: '#254e88', fontWeight: 700, fontSize: 11.5,
                          cursor: 'pointer',
                        }}
                      >
                        Créer une commande
                      </button>
                    )}
                    {f.id !== '_sans' && (
                      <button
                        onClick={e => { e.stopPropagation(); exporterExcel(f.id) }}
                        disabled={exportEnCours}
                        style={{
                          marginTop: 6, width: '100%', padding: '6px 10px', borderRadius: 6,
                          border: `1px solid ${actif ? 'rgba(255,255,255,0.4)' : '#cbd5e1'}`,
                          background: 'transparent', color: actif ? '#fff' : '#475569', fontWeight: 700, fontSize: 11.5,
                          cursor: exportEnCours ? 'wait' : 'pointer',
                        }}
                      >
                        📄 Exporter (Excel)
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Filtres : recherche + urgence + fournisseur (liste déroulante en secours) */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              placeholder="Rechercher par référence, désignation, catégorie..."
              value={recherche}
              onChange={e => setRecherche(e.target.value)}
              style={{ ...sInput, flex: 1, minWidth: 200, maxWidth: 320 }}
            />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {URGENCES.map(u => (
                <button
                  key={u.valeur}
                  onClick={() => setUrgence(u.valeur)}
                  style={{
                    padding: '7px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${urgence === u.valeur ? '#254e88' : '#e2e8f0'}`,
                    background: urgence === u.valeur ? '#254e88' : '#fff',
                    color: urgence === u.valeur ? '#fff' : '#64748b',
                  }}
                >
                  {u.label}
                </button>
              ))}
            </div>
            {filtreFournisseur && (
              <button
                onClick={() => setFiltreFournisseur('')}
                style={{ padding: '7px 13px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: '1.5px solid #e2e8f0', background: '#fff', color: '#94a3b8' }}
              >
                ✕ Retirer le filtre fournisseur
              </button>
            )}
          </div>

          {/* Tableau, trié par urgence */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Réf.', 'Désignation', 'Catégorie', 'Fournisseur', 'Qté stock', 'Qté. base', 'Prévision commande', 'Statut'].map(col => (
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
                {previsionsAffichees.length === 0 ? (
                  <tr><td colSpan={8} style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                    Aucun produit ne correspond à ces filtres
                  </td></tr>
                ) : (
                  previsionsAffichees.map((p, i) => {
                    const st = statutPrevision(p)
                    return (
                      <tr key={p.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.reference || '—'}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847', minWidth: 160 }}>{p.designation || '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.categorie || '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.fournisseurNom || '—'}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: p.stock <= 0 ? '#dc2626' : '#475569' }}>{fmt(p.stock)}</td>
                        <td style={{ padding: '11px 14px', fontSize: 13, color: p.manqueBase ? '#b45309' : '#475569' }}>
                          {p.manqueBase ? 'À renseigner' : fmt(p.qteBase)}
                        </td>
                        <td style={{ padding: '11px 14px', fontSize: 14, fontWeight: 800, color: p.manqueBase ? '#b45309' : '#254e88' }}>
                          {p.manqueBase ? '—' : `+${fmt(p.prevision)}`}
                        </td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                            background: st.couleur + '18', color: st.couleur, border: `1px solid ${st.couleur}30`,
                            whiteSpace: 'nowrap',
                          }}>
                            {st.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── Sélection des produits + quantités avant création de la commande ── */}
      {selection && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setSelection(null)}>
          <div className="mg-card" style={{ maxWidth: 780, width: '95%' }}>
            <div className="mg-header">
              <div>
                <div className="mg-title">Créer la commande — {selection.fournisseurNom}</div>
                <div className="mg-subtitle">Ajustez les quantités ou retirez un produit avant de créer la commande</div>
              </div>
              <button className="mg-close" onClick={() => setSelection(null)}>×</button>
            </div>
            <div className="mg-card-body" style={{ maxHeight: '68vh', overflow: 'auto' }}>
              {selection.lignes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: 24, fontSize: 13 }}>
                  Tous les produits ont été retirés. Fermez ce panneau ou revenez à la liste.
                </p>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Réf.', 'Désignation', 'Stock', 'Qté à commander', 'PU (FCFA)', 'Sous-total', ''].map(col => (
                          <th key={col} style={{
                            padding: '10px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700,
                            color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em',
                            borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                          }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selection.lignes.map(l => (
                        <tr key={l.produitId} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 12px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.reference || '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#0f2847', minWidth: 160 }}>{l.designation || '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: l.stock <= 0 ? '#dc2626' : '#475569' }}>{fmt(l.stock)}</td>
                          <td style={{ padding: '9px 12px' }}>
                            <input
                              type="number" min="0" value={l.qte}
                              onChange={e => majQteSelection(l.produitId, e.target.value)}
                              style={{ width: 76, padding: '6px 8px', borderRadius: 6, border: '1.5px solid #cbd5e1', fontSize: 13 }}
                            />
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: '#475569' }}>{fmt(l.prixUnitaire)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: '#254e88' }}>
                            {fmt((Number(l.qte) || 0) * l.prixUnitaire)}
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <button
                              onClick={() => retirerDeSelection(l.produitId)}
                              title="Retirer ce produit de la commande"
                              style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, fontWeight: 700, padding: 0 }}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <div style={{ fontSize: 13, color: '#64748b' }}>
                  {selection.lignes.length} produit{selection.lignes.length > 1 ? 's' : ''} · Total : <strong style={{ color: '#0f2847' }}>{fmt(totalSelection(selection.lignes))} FCFA</strong>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="mg-btn-ghost" onClick={() => setSelection(null)}>Annuler</button>
                  <button
                    className="mg-btn-primary"
                    onClick={validerSelection}
                    disabled={selection.lignes.length === 0}
                    style={selection.lignes.length === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  >
                    Créer la commande ({selection.lignes.length})
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Previsions
export { calculerPrevisions }
