import { useState } from 'react'
import { genId } from '../utils/storage'

const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0)

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  500: '#1976d2', 400: '#2196f3', 300: '#64b5f6',
  200: '#bbdefb', 100: '#e3f2fd', 50: '#f0f7ff',
}

// Statuts en nuances de bleu uniquement
const STATUTS = {
  en_attente: { label: 'En attente', couleur: '#334155', bg: '#f1f5f9', border: '#e2e8f0' },
  en_cours:   { label: 'En cours',   couleur: B[600],   bg: B[100],    border: B[200]    },
  livree:     { label: 'Livré',      couleur: B[700],   bg: '#e8eef7', border: '#c7d8ed'  },
  annulee:    { label: 'Annulé',     couleur: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
}

const COMMANDE_VIDE = {
  clientId: '', statut: 'en_attente',
  dateCommande: new Date().toISOString().slice(0, 10),
  dateLivraison: '', note: '', lignes: [],
}

const sInput = {
  width: '100%', padding: '8px 11px', borderRadius: 5,
  border: `1px solid ${B[200]}`, fontSize: 13, marginBottom: 12,
  boxSizing: 'border-box', outline: 'none', background: B[50], color: B[900],
}
const sBtn    = { padding: '7px 16px', borderRadius: 5, border: 'none', background: B[600], color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const sBtnSec = { padding: '7px 16px', borderRadius: 5, border: `1px solid ${B[200]}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }

function Commandes({ commandes, produits: produitsStore = {}, mouvements, clients = [], droits }) {
  const { donnees, ajouter, modifier, effacer } = commandes
  // Store produits complet pour pouvoir modifier le stock
  const produits     = produitsStore.donnees  || []
  const modifProduit = produitsStore.modifier  || (() => {})

  const [recherche,    setRecherche]    = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [modal,        setModal]        = useState(false)
  const [cmdEditee,    setCmdEditee]    = useState(null)
  const [form,         setForm]         = useState(COMMANDE_VIDE)
  const [detail,       setDetail]       = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [rechercheP,   setRechercheP]   = useState('')
  const [filtreCatP,   setFiltreCatP]   = useState('')

  const liste = donnees.filter(c => {
    const matchR = (c.reference || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (c.clientNom || '').toLowerCase().includes(recherche.toLowerCase())
    const matchS = filtreStatut === 'tous' || c.statut === filtreStatut
    return matchR && matchS
  }).sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande))

  const totalCA = donnees.filter(c => c.statut === 'livree').reduce((s, c) => s + (c.montantHT || 0), 0)

  const ouvrirAjout = () => {
    setCmdEditee(null)
    setForm({ ...COMMANDE_VIDE, reference: `CMD-${new Date().getFullYear()}-${String(donnees.length + 1).padStart(3, '0')}` })
    setModal(true)
  }

  const ouvrirEdition = (c, e) => {
    e.stopPropagation(); setCmdEditee(c); setForm({ ...c }); setModal(true)
  }

  const ajouterLigne = () => {
    setForm(f => ({ ...f, lignes: [...(f.lignes || []), { produitId: '', produitNom: '', quantite: 1, prixUnit: 0, total: 0 }] }))
  }

  const modifierLigne = (idx, champ, valeur) => {
    setForm(f => {
      const lignes = [...(f.lignes || [])]
      lignes[idx] = { ...lignes[idx], [champ]: valeur }
      if (champ === 'produitId') {
        const prod = produits.find(p => p.id === valeur)
        if (prod) {
          lignes[idx].produitNom = prod.designation || prod.nom || ''
          lignes[idx].produitRef = prod.reference || ''
          lignes[idx].stockDispo = prod.stock ?? 0
          // prixUnit reste ce que l'utilisateur a saisi (pas de prix dans les produits)
          lignes[idx].total = lignes[idx].quantite * (lignes[idx].prixUnit || 0)
        }
      }
      if (champ === 'quantite' || champ === 'prixUnit') {
        lignes[idx].total = Number(lignes[idx].quantite) * Number(lignes[idx].prixUnit)
      }
      return { ...f, lignes }
    })
  }

  const supprimerLigne = (idx) => setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }))

  const montantTotal = (lignes) => (lignes || []).reduce((s, l) => s + (l.total || 0), 0)

  // Catégories uniques présentes dans les produits (pour filtre)
  const categoriesProduits = [...new Set(produits.map(p => p.categorie).filter(Boolean))]

  // Produits filtrés selon la recherche et la catégorie sélectionnée dans le modal
  const produitsFiltres = produits.filter(p => {
    const q = rechercheP.toLowerCase()
    const matchQ = !q ||
      (p.designation || p.nom || '').toLowerCase().includes(q) ||
      (p.reference || '').toLowerCase().includes(q) ||
      (p.ral || '').toLowerCase().includes(q) ||
      (p.serie || '').toLowerCase().includes(q)
    const matchCat = !filtreCatP || p.categorie === filtreCatP
    return matchQ && matchCat
  })

  const sauvegarder = () => {
    if (!form.clientId) return
    const client = clients.find(c => c.id === form.clientId)
    const cmd = { ...form, clientNom: client?.nom || '', montantHT: montantTotal(form.lignes) }

    const lignesValides = (form.lignes || []).filter(l => l.produitId && l.quantite > 0)

    if (cmdEditee) {
      // ── Modification : recalculer le delta de stock ──────────
      const lignesAvant = (cmdEditee.lignes || []).filter(l => l.produitId && l.quantite > 0)

      // Rembourser l'ancienne sortie
      lignesAvant.forEach(l => {
        const prod = produits.find(p => p.id === l.produitId)
        if (prod) modifProduit(prod.id, { stock: (prod.stock || 0) + l.quantite })
      })
      // Débiter la nouvelle sortie
      lignesValides.forEach(l => {
        const prod = produits.find(p => p.id === l.produitId)
        if (prod) {
          modifProduit(prod.id, { stock: Math.max(0, (prod.stock || 0) - l.quantite) })
          if (mouvements?.ajouter) mouvements.ajouter({
            id: genId(), produitId: prod.id,
            produitNom: prod.designation || prod.nom,
            type: 'sortie', quantite: l.quantite,
            note: `Chantier modifié ${cmd.reference || ''} — ${client?.nom || ''}`,
            date: new Date().toISOString(),
          })
        }
      })

      modifier(cmdEditee.id, cmd)
      if (detail?.id === cmdEditee.id) setDetail({ ...detail, ...cmd })

    } else {
      // ── Création : débiter le stock de chaque produit ────────
      lignesValides.forEach(l => {
        const prod = produits.find(p => p.id === l.produitId)
        if (prod) {
          modifProduit(prod.id, { stock: Math.max(0, (prod.stock || 0) - l.quantite) })
          if (mouvements?.ajouter) mouvements.ajouter({
            id: genId(), produitId: prod.id,
            produitNom: prod.designation || prod.nom,
            type: 'sortie', quantite: l.quantite,
            note: `Chantier ${cmd.reference || ''} — ${client?.nom || ''}`,
            date: new Date().toISOString(),
          })
        }
      })

      ajouter({ ...cmd, id: genId() })
    }

    setModal(false)
  }

  const supprimer = () => {
    // Rembourser le stock des produits du chantier supprimé
    const lignesARemb = (confirmation.lignes || []).filter(l => l.produitId && l.quantite > 0)
    lignesARemb.forEach(l => {
      const prod = produits.find(p => p.id === l.produitId)
      if (prod) {
        modifProduit(prod.id, { stock: (prod.stock || 0) + l.quantite })
        if (mouvements?.ajouter) mouvements.ajouter({
          id: genId(), produitId: prod.id,
          produitNom: prod.designation || prod.nom,
          type: 'entree', quantite: l.quantite,
          note: `Annulation chantier ${confirmation.reference || ''}`,
          date: new Date().toISOString(),
        })
      }
    })
    effacer(confirmation.id)
    if (detail?.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  const changerStatut = (cmd, statut, e) => {
    e.stopPropagation(); modifier(cmd.id, { statut })
    if (detail?.id === cmd.id) setDetail({ ...detail, statut })
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: B[900], margin: 0 }}>
              Chantiers <span style={{ color: '#94a3b8', fontWeight: 400 }}>({donnees.length})</span>
            </h2>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Suivi des chantiers clients</p>
          </div>
          {droits?.modifier !== false && (
            <button onClick={ouvrirAjout} style={sBtn}>+ Nouveau</button>
          )}
        </div>

        {/* Stats statuts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {Object.entries(STATUTS).map(([key, s]) => {
            const count = donnees.filter(c => c.statut === key).length
            return (
              <div key={key}
                onClick={() => setFiltreStatut(filtreStatut === key ? 'tous' : key)}
                style={{
                  background: filtreStatut === key ? s.bg : '#fff',
                  border: `1px solid ${filtreStatut === key ? s.border : B[200]}`,
                  borderRadius: 6, padding: '10px 12px', cursor: 'pointer',
                }}>
                <div style={{ fontSize: 10, color: '#64748b', marginBottom: 3, fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.couleur }}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* CA */}
        <div style={{ background: B[700], borderRadius: 6, padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: B[300] }}>CA total chantiers livrés</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{fmt(totalCA)} <span style={{ fontSize: 11, color: B[300] }}>FCFA</span></div>
        </div>

        {/* Recherche */}
        <input
          placeholder="Rechercher par référence ou client..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, maxWidth: 340, marginBottom: 12 }}
        />

        {/* Liste */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '36px 0', fontSize: 13 }}>Aucun chantier trouvé.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {liste.map(cmd => {
              const s    = STATUTS[cmd.statut] || STATUTS.en_attente
              const actif = detail?.id === cmd.id
              return (
                <div key={cmd.id} onClick={() => setDetail(actif ? null : cmd)}
                  style={{ background: '#fff', border: actif ? `1.5px solid ${B[400]}` : `1px solid ${B[200]}`, borderRadius: 7, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.12s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: 13, color: B[900] }}>{cmd.reference}</span>
                      <span style={{ padding: '1px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: s.bg, color: s.couleur, border: `1px solid ${s.border}` }}>
                        {s.label}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: B[700] }}>{fmt(cmd.montantHT)} FCFA</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#334155' }}>{cmd.clientNom}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                        {new Date(cmd.dateCommande).toLocaleDateString('fr-FR')}
                        {cmd.dateLivraison && ` → ${new Date(cmd.dateLivraison).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }} onClick={e => e.stopPropagation()}>
                      {droits?.modifier !== false && (
                        <button onClick={e => ouvrirEdition(cmd, e)} style={{ ...sBtnSec, padding: '4px 10px', fontSize: 11 }}>Modifier</button>
                      )}
                      {droits?.supprimer !== false && (
                        <button onClick={e => { e.stopPropagation(); setConfirmation(cmd) }} style={{ ...sBtnSec, padding: '4px 10px', fontSize: 11 }}>Retirer</button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {detail && (
        <div style={{ width: 280, flexShrink: 0, background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '18px 16px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <button onClick={() => setDetail(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</button>

          <div style={{ fontSize: 14, fontWeight: 700, color: B[900], marginBottom: 4 }}>{detail.reference}</div>
          <div style={{ marginBottom: 12 }}>
            {(() => {
              const s = STATUTS[detail.statut] || STATUTS.en_attente
              return <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: s.bg, color: s.couleur, border: `1px solid ${s.border}` }}>{s.label}</span>
            })()}
          </div>

          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>Client : <strong style={{ color: B[900] }}>{detail.clientNom}</strong></div>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>Date : {new Date(detail.dateCommande).toLocaleDateString('fr-FR')}</div>
          {detail.dateLivraison && (
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 5 }}>Livraison : {new Date(detail.dateLivraison).toLocaleDateString('fr-FR')}</div>
          )}
          {detail.note && (
            <div style={{ fontSize: 12, color: '#64748b', background: B[50], borderRadius: 5, padding: '7px 10px', marginBottom: 12, border: `1px solid ${B[100]}` }}>
              {detail.note}
            </div>
          )}

          {(detail.lignes || []).length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Produits</div>
              {detail.lignes.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${B[50]}`, fontSize: 12 }}>
                  <span style={{ flex: 1, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 6 }}>
                    {l.produitNom} <span style={{ color: '#94a3b8' }}>×{l.quantite}</span>
                  </span>
                  <span style={{ fontWeight: 600, color: B[700], flexShrink: 0 }}>{fmt(l.total)} F</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', fontSize: 13, fontWeight: 700, color: B[900] }}>
                <span>Total HT</span>
                <span>{fmt(detail.montantHT)} FCFA</span>
              </div>
            </div>
          )}

          {droits?.modifier !== false && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Statut</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {Object.entries(STATUTS).map(([key, s]) => (
                  <button key={key}
                    onClick={e => changerStatut(detail, key, e)}
                    style={{
                      padding: '4px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600,
                      border: `1px solid ${detail.statut === key ? s.couleur : s.border}`,
                      background: detail.statut === key ? s.couleur : s.bg,
                      color: detail.statut === key ? '#fff' : s.couleur,
                      cursor: 'pointer',
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 8px 40px rgba(10,25,41,0.18)' }}>

            {/* En-tête modal */}
            <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${B[100]}`, position: 'sticky', top: 0, background: '#fff', zIndex: 2, borderRadius: '12px 12px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: B[900] }}>{cmdEditee ? '✏️ Modifier le chantier' : '🏗️ Nouveau chantier'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Remplissez les informations ci-dessous</div>
                </div>
                <button onClick={() => setModal(false)} style={{ background: B[50], border: `1px solid ${B[200]}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#64748b', fontSize: 18, lineHeight: 1 }}>×</button>
              </div>
            </div>

            <div style={{ padding: '20px 24px' }}>

              {/* ── Section 1 : Identification ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: B[600], textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 2, background: B[600] }} />
                  1. Identification du chantier
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Référence interne
                      <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>· Numéro unique du chantier</span>
                    </label>
                    <input style={sInput} value={form.reference || ''} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="Ex : CMD-2025-001" />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Statut
                      <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>· Avancement du chantier</span>
                    </label>
                    <select style={sInput} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                      {Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Section 2 : Client ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: B[600], textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 2, background: B[600] }} />
                  2. Client
                </div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Client associé *
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>· Un chantier doit être lié à un client</span>
                </label>
                <select style={{ ...sInput, borderColor: !form.clientId ? '#fca5a5' : B[200] }} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                  <option value="">— Sélectionner un client —</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.numeroAffaire ? `[${c.numeroAffaire}]  ` : ''}{c.nom}{c.telephone ? `  ·  ${c.telephone}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* ── Section 3 : Dates ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: B[600], textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 2, background: B[600] }} />
                  3. Planification
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Date de début
                      <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>· Démarrage du chantier</span>
                    </label>
                    <input type="date" style={sInput} value={form.dateCommande} onChange={e => setForm({ ...form, dateCommande: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                      Date de livraison
                      <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>· Optionnelle</span>
                    </label>
                    <input type="date" style={sInput} value={form.dateLivraison || ''} onChange={e => setForm({ ...form, dateLivraison: e.target.value })} />
                  </div>
                </div>
              </div>

              {/* ── Section 4 : Produits ── */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: B[600], textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 2, background: B[600] }} />
                  4. Produits / Matériaux sortis
                </div>

                {/* Barre de recherche + filtre catégorie */}
                <div style={{ background: B[50], border: `1px solid ${B[200]}`, borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginBottom: 8 }}>🔍 Filtrer les produits disponibles</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Recherche par désignation / référence / RAL</label>
                      <input
                        value={rechercheP}
                        onChange={e => setRechercheP(e.target.value)}
                        placeholder="Ex: aluminium, ALU-50, RAL 9016..."
                        style={{ ...sInput, marginBottom: 0, fontSize: 12 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#94a3b8', display: 'block', marginBottom: 3 }}>Filtrer par catégorie</label>
                      <select value={filtreCatP} onChange={e => setFiltreCatP(e.target.value)} style={{ ...sInput, marginBottom: 0, fontSize: 12 }}>
                        <option value="">— Toutes les catégories —</option>
                        {categoriesProduits.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                  </div>
                  {(rechercheP || filtreCatP) && (
                    <div style={{ marginTop: 6, fontSize: 10, color: B[600] }}>
                      {produitsFiltres.length} produit{produitsFiltres.length !== 1 ? 's' : ''} trouvé{produitsFiltres.length !== 1 ? 's' : ''}
                      <button onClick={() => { setRechercheP(''); setFiltreCatP('') }}
                        style={{ marginLeft: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 10, textDecoration: 'underline' }}>
                        Effacer les filtres
                      </button>
                    </div>
                  )}
                </div>

                {/* En-tête colonnes */}
                {(form.lignes || []).length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 80px 28px', gap: 6, marginBottom: 4, padding: '0 2px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Désignation du produit</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>Quantité</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'center' }}>Prix unitaire</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', textAlign: 'right' }}>Total</div>
                    <div />
                  </div>
                )}

                {/* Lignes produits */}
                {(form.lignes || []).map((ligne, idx) => {
                  const stockInsuffisant = ligne.produitId && ligne.stockDispo !== undefined && ligne.quantite > ligne.stockDispo
                  return (
                    <div key={idx} style={{ marginBottom: 6, background: stockInsuffisant ? '#fff7ed' : '#f8fafc', border: `1px solid ${stockInsuffisant ? '#fed7aa' : B[100]}`, borderRadius: 7, padding: '8px 10px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 70px 90px 80px 28px', gap: 6, alignItems: 'center' }}>
                        <div>
                          <select value={ligne.produitId} onChange={e => modifierLigne(idx, 'produitId', e.target.value)}
                            style={{ ...sInput, marginBottom: 0, fontSize: 12, background: '#fff' }}>
                            <option value="">— Choisir un produit —</option>
                            {produitsFiltres.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.reference ? `[${p.reference}] ` : ''}{p.designation || p.nom}{p.ral ? ` · ${p.ral}` : ''}{p.serie ? ` · ${p.serie}` : ''} — stock: {p.stock ?? 0}
                              </option>
                            ))}
                            {produitsFiltres.length === 0 && <option disabled>Aucun produit ne correspond au filtre</option>}
                          </select>
                          {ligne.produitId && (
                            <div style={{ fontSize: 10, color: B[600], marginTop: 3, display: 'flex', gap: 8 }}>
                              {ligne.produitRef && <span>Réf : <strong>{ligne.produitRef}</strong></span>}
                              <span style={{ color: stockInsuffisant ? '#f97316' : '#16a34a', fontWeight: 600 }}>
                                Stock dispo : {ligne.stockDispo ?? '—'}
                              </span>
                            </div>
                          )}
                        </div>
                        <input type="number" min="1" value={ligne.quantite}
                          onChange={e => modifierLigne(idx, 'quantite', Number(e.target.value))}
                          style={{ ...sInput, marginBottom: 0, fontSize: 12, textAlign: 'center', background: '#fff', borderColor: stockInsuffisant ? '#f97316' : undefined }}
                          placeholder="Qté" />
                        <input type="number" min="0" value={ligne.prixUnit}
                          onChange={e => modifierLigne(idx, 'prixUnit', Number(e.target.value))}
                          style={{ ...sInput, marginBottom: 0, fontSize: 12, background: '#fff' }}
                          placeholder="Prix FCFA" />
                        <div style={{ fontSize: 12, color: B[700], fontWeight: 700, textAlign: 'right' }}>{fmt(ligne.total)}</div>
                        <button onClick={() => supprimerLigne(idx)}
                          style={{ background: '#fee2e2', border: 'none', borderRadius: 5, width: 24, height: 24, cursor: 'pointer', color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
                      </div>
                      {stockInsuffisant && (
                        <div style={{ fontSize: 10, color: '#f97316', marginTop: 5, fontWeight: 600 }}>
                          ⚠ Quantité demandée ({ligne.quantite}) dépasse le stock disponible ({ligne.stockDispo})
                        </div>
                      )}
                    </div>
                  )
                })}

                {/* Bouton ajouter ligne */}
                <button onClick={ajouterLigne}
                  style={{ width: '100%', padding: '8px', borderRadius: 7, border: `1.5px dashed ${B[300]}`, background: 'transparent', color: B[600], fontWeight: 600, fontSize: 12, cursor: 'pointer', marginTop: 4 }}>
                  + Ajouter un produit
                </button>

                {/* Total */}
                {(form.lignes || []).length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${B[100]}` }}>
                    <span style={{ fontSize: 12, color: '#64748b' }}>Montant total HT :</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: B[900] }}>{fmt(montantTotal(form.lignes))} FCFA</span>
                  </div>
                )}
              </div>

              {/* ── Section 5 : Note ── */}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: B[600], textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ display: 'inline-block', width: 16, height: 2, background: B[600] }} />
                  5. Remarques
                </div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Note libre
                  <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>· Instructions, observations, détails du chantier</span>
                </label>
                <textarea value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })}
                  rows={2} placeholder="Ex : Chantier sur 3 jours, accès côté nord, attention aux finitions..."
                  style={{ ...sInput, resize: 'vertical', fontFamily: 'inherit' }} />
              </div>

            </div>

            {/* Pied modal sticky */}
            <div style={{ padding: '14px 24px', borderTop: `1px solid ${B[100]}`, display: 'flex', gap: 8, justifyContent: 'flex-end', position: 'sticky', bottom: 0, background: '#fff', borderRadius: '0 0 12px 12px' }}>
              <button onClick={() => setModal(false)} style={sBtnSec}>Annuler</button>
              <button onClick={sauvegarder} style={{ ...sBtn, opacity: !form.clientId ? 0.5 : 1 }}>
                {cmdEditee ? '💾 Enregistrer' : '✅ Créer le chantier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: B[900], marginTop: 0 }}>Supprimer ce chantier ?</h3>
            <p style={{ color: '#64748b', fontSize: 13 }}><strong>{confirmation.reference}</strong> sera supprimé définitivement.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={sBtnSec}>Annuler</button>
              <button onClick={supprimer} style={sBtn}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Commandes
