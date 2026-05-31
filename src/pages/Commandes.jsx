import { useState } from 'react'
import { genId } from '../utils/storage'

const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0)

const STATUTS = {
  en_attente: { label: 'En attente',  couleur: '#f97316', bg: '#fff7ed', border: '#fed7aa' },
  en_cours:   { label: 'En cours',    couleur: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  livree:     { label: 'Livrée',      couleur: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  annulee:    { label: 'Annulée',     couleur: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

const COMMANDE_VIDE = {
  clientId: '', statut: 'en_attente',
  dateCommande: new Date().toISOString().slice(0, 10),
  dateLivraison: '', note: '', lignes: [],
}

function Commandes({ commandes, produits = [], clients = [], droits }) {
  const { donnees, ajouter, modifier, effacer } = commandes

  const [recherche,   setRecherche]   = useState('')
  const [filtreStatut,setFiltreStatut]= useState('tous')
  const [modal,       setModal]       = useState(false)
  const [cmdEditee,   setCmdEditee]   = useState(null)
  const [form,        setForm]        = useState(COMMANDE_VIDE)
  const [detail,      setDetail]      = useState(null)
  const [confirmation,setConfirmation]= useState(null)

  // ── Filtrage ─────────────────────────────────────────────
  const liste = donnees.filter(c => {
    const matchRecherche = (c.reference || '').toLowerCase().includes(recherche.toLowerCase()) ||
      (c.clientNom || '').toLowerCase().includes(recherche.toLowerCase())
    const matchStatut = filtreStatut === 'tous' || c.statut === filtreStatut
    return matchRecherche && matchStatut
  }).sort((a, b) => new Date(b.dateCommande) - new Date(a.dateCommande))

  // ── Stats ─────────────────────────────────────────────────
  const totalCA = donnees.filter(c => c.statut === 'livree').reduce((s, c) => s + (c.montantHT || 0), 0)
  const enCours = donnees.filter(c => c.statut === 'en_cours' || c.statut === 'en_attente').length

  // ── Modal ajout/édition ───────────────────────────────────
  const ouvrirAjout = () => {
    setCmdEditee(null)
    setForm({ ...COMMANDE_VIDE, reference: `CMD-${new Date().getFullYear()}-${String(donnees.length + 1).padStart(3, '0')}` })
    setModal(true)
  }

  const ouvrirEdition = (c, e) => {
    e.stopPropagation()
    setCmdEditee(c)
    setForm({ ...c })
    setModal(true)
  }

  const ajouterLigne = () => {
    setForm(f => ({
      ...f,
      lignes: [...(f.lignes || []), { produitId: '', produitNom: '', quantite: 1, prixUnit: 0, total: 0 }]
    }))
  }

  const modifierLigne = (idx, champ, valeur) => {
    setForm(f => {
      const lignes = [...(f.lignes || [])]
      lignes[idx] = { ...lignes[idx], [champ]: valeur }
      if (champ === 'produitId') {
        const prod = produits.find(p => p.id === valeur)
        if (prod) {
          lignes[idx].produitNom = prod.nom
          lignes[idx].prixUnit = prod.prix || 0
          lignes[idx].total = lignes[idx].quantite * (prod.prix || 0)
        }
      }
      if (champ === 'quantite' || champ === 'prixUnit') {
        lignes[idx].total = Number(lignes[idx].quantite) * Number(lignes[idx].prixUnit)
      }
      return { ...f, lignes }
    })
  }

  const supprimerLigne = (idx) => {
    setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }))
  }

  const montantTotal = (lignes) => (lignes || []).reduce((s, l) => s + (l.total || 0), 0)

  const sauvegarder = () => {
    if (!form.clientId) return
    const client = clients.find(c => c.id === form.clientId)
    const cmd = {
      ...form,
      clientNom: client?.nom || '',
      montantHT: montantTotal(form.lignes),
    }
    if (cmdEditee) {
      modifier(cmdEditee.id, cmd)
      if (detail?.id === cmdEditee.id) setDetail({ ...detail, ...cmd })
    } else {
      ajouter({ ...cmd, id: genId() })
    }
    setModal(false)
  }

  const supprimer = () => {
    effacer(confirmation.id)
    if (detail?.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  const changerStatut = (cmd, statut, e) => {
    e.stopPropagation()
    modifier(cmd.id, { statut })
    if (detail?.id === cmd.id) setDetail({ ...detail, statut })
  }

  // ── Styles ────────────────────────────────────────────────
  const sBtn = {
    padding: '9px 22px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
  }
  const sBtnSec = {
    padding: '9px 22px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, cursor: 'pointer', color: '#64748b',
  }
  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 14,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc',
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>{`Chantiers (${donnees.length})`}</h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Suivi des chantiers clients</p>
          </div>
          {droits?.modifier !== false && (
            <button onClick={ouvrirAjout} style={sBtn}>+ Nouveau chantier</button>
          )}
        </div>

        {/* Stats rapides */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          {Object.entries(STATUTS).map(([key, s]) => {
            const count = donnees.filter(c => c.statut === key).length
            return (
              <div key={key} onClick={() => setFiltreStatut(filtreStatut === key ? 'tous' : key)}
                style={{
                  background: filtreStatut === key ? s.bg : '#fff',
                  border: `1.5px solid ${filtreStatut === key ? s.border : '#e2e8f0'}`,
                  borderRadius: 10, padding: '12px 14px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.couleur }}>{count}</div>
              </div>
            )
          })}
        </div>

        {/* CA livré */}
        <div style={{
          background: 'linear-gradient(135deg, #0f2847, #1e5fa8)',
          borderRadius: 12, padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 20,
        }}>
          <div style={{ fontSize: 13, color: '#93b8d8', fontWeight: 600 }}>CA total chantiers livrés</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>{fmt(totalCA)} <span style={{ fontSize: 13, color: '#93b8d8' }}>FCFA</span></div>
        </div>

        {/* Barre de recherche */}
        <input
          placeholder="Rechercher par référence ou client..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, maxWidth: 380, marginBottom: 16 }}
        />

        {/* Liste chantiers */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: 14 }}>
            Aucun chantier trouvé..
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {liste.map(cmd => {
              const s = STATUTS[cmd.statut] || STATUTS.en_attente
              const actif = detail?.id === cmd.id
              return (
                <div
                  key={cmd.id}
                  onClick={() => setDetail(actif ? null : cmd)}
                  style={{
                    background: '#fff',
                    border: actif ? `2px solid #c0392b` : '1.5px solid #e2e8f0',
                    borderRadius: 12, padding: '16px 18px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#0f2847' }}>{cmd.reference}</span>
                      <span style={{
                        marginLeft: 10, padding: '2px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700,
                        background: s.bg, color: s.couleur,
                        border: `1px solid ${s.border}`,
                      }}>{s.label}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#0f2847' }}>
                      {fmt(cmd.montantHT)} FCFA
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#334155' }}>👥 {cmd.clientNom}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                        📅 {new Date(cmd.dateCommande).toLocaleDateString('fr-FR')}
                        {cmd.dateLivraison && ` → ${new Date(cmd.dateLivraison).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      {droits?.modifier !== false && (
                        <button onClick={e => ouvrirEdition(cmd, e)}
                          style={{ ...sBtnSec, padding: '5px 10px', fontSize: 12 }}>✏️</button>
                      )}
                      {droits?.supprimer !== false && (
                        <button onClick={e => { e.stopPropagation(); setConfirmation(cmd) }}
                          style={{ ...sBtnSec, padding: '5px 10px', fontSize: 12, color: '#dc2626', borderColor: '#fecaca' }}>🗑️</button>
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
        <div style={{
          width: 320, flexShrink: 0, background: '#fff',
          border: '1.5px solid #e2e8f0', borderRadius: 16,
          padding: '22px 20px', alignSelf: 'flex-start', position: 'sticky', top: 0,
        }}>
          <button onClick={() => setDetail(null)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer' }}>×</button>

          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f2847', marginBottom: 4 }}>{detail.reference}</div>
          <div style={{ marginBottom: 16 }}>
            {(() => {
              const s = STATUTS[detail.statut] || STATUTS.en_attente
              return (
                <span style={{ padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: s.bg, color: s.couleur, border: `1px solid ${s.border}` }}>
                  {s.label}
                </span>
              )
            })()}
          </div>

          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>👥 {detail.clientNom}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
            📅 {new Date(detail.dateCommande).toLocaleDateString('fr-FR')}
          </div>
          {detail.dateLivraison && (
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              🚚 Livraison : {new Date(detail.dateLivraison).toLocaleDateString('fr-FR')}
            </div>
          )}
          {detail.note && (
            <div style={{ fontSize: 13, color: '#64748b', background: '#f8fafc', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
              {detail.note}
            </div>
          )}

          {/* Lignes chantier */}
          {(detail.lignes || []).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Produits</div>
              {detail.lignes.map((l, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ flex: 1, color: '#334155', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {l.produitNom} <span style={{ color: '#94a3b8' }}>×{l.quantite}</span>
                  </span>
                  <span style={{ fontWeight: 700, color: '#0f2847', flexShrink: 0 }}>{fmt(l.total)} F</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 15, fontWeight: 800, color: '#0f2847' }}>
                <span>Total HT</span>
                <span>{fmt(detail.montantHT)} FCFA</span>
              </div>
            </div>
          )}

          {/* Changer statut */}
          {droits?.modifier !== false && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Changer le statut</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(STATUTS).map(([key, s]) => (
                  <button key={key}
                    onClick={e => changerStatut(detail, key, e)}
                    style={{
                      padding: '5px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: `1.5px solid ${detail.statut === key ? s.couleur : s.border}`,
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

      {/* Modal ajout/édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 28px', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2847', marginBottom: 20, marginTop: 0 }}>
              {cmdEditee ? 'Modifier le chantier' : 'Nouveau chantier'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Référence</label>
                <input style={sInput} value={form.reference || ''}
                  onChange={e => setForm({ ...form, reference: e.target.value })}
                  placeholder="CMD-2024-001" />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Statut</label>
                <select style={sInput} value={form.statut}
                  onChange={e => setForm({ ...form, statut: e.target.value })}>
                  {Object.entries(STATUTS).map(([k, s]) => (
                    <option key={k} value={k}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Client *</label>
            <select style={sInput} value={form.clientId}
              onChange={e => setForm({ ...form, clientId: e.target.value })}>
              <option value="">-- Sélectionner un client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date chantier</label>
                <input type="date" style={sInput} value={form.dateCommande}
                  onChange={e => setForm({ ...form, dateCommande: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Date livraison</label>
                <input type="date" style={sInput} value={form.dateLivraison || ''}
                  onChange={e => setForm({ ...form, dateLivraison: e.target.value })} />
              </div>
            </div>

            {/* Lignes produits */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Produits</label>
                <button onClick={ajouterLigne}
                  style={{ padding: '4px 12px', background: '#0f2847', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  + Ajouter
                </button>
              </div>
              {(form.lignes || []).map((ligne, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <select
                    value={ligne.produitId}
                    onChange={e => modifierLigne(idx, 'produitId', e.target.value)}
                    style={{ ...sInput, marginBottom: 0 }}>
                    <option value="">-- Produit --</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                  <input type="number" min="1" value={ligne.quantite}
                    onChange={e => modifierLigne(idx, 'quantite', Number(e.target.value))}
                    style={{ ...sInput, marginBottom: 0 }} placeholder="Qté" />
                  <div style={{ fontSize: 13, color: '#0f2847', fontWeight: 700, textAlign: 'right' }}>
                    {fmt(ligne.total)} F
                  </div>
                  <button onClick={() => supprimerLigne(idx)}
                    style={{ background: '#fef2f2', border: 'none', borderRadius: 6, padding: '6px 8px', cursor: 'pointer', color: '#dc2626', fontSize: 14 }}>
                    ×
                  </button>
                </div>
              ))}
              {(form.lignes || []).length > 0 && (
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 15, color: '#0f2847', marginTop: 8 }}>
                  Total : {fmt(montantTotal(form.lignes))} FCFA
                </div>
              )}
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Note</label>
            <textarea value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })}
              rows={2} placeholder="Note optionnelle..."
              style={{ ...sInput, resize: 'vertical', fontFamily: 'inherit' }} />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={sBtnSec}>Annuler</button>
              <button onClick={sauvegarder} style={sBtn}>
                {cmdEditee ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px', width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2847', marginTop: 0 }}>Supprimer ce chantier ?</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}><strong>{confirmation.reference}</strong> sera supprimé définitivement.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={sBtnSec}>Annuler</button>
              <button onClick={supprimer} style={{ ...sBtn, background: '#dc2626' }}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Commandes
