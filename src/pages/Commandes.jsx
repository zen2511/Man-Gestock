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

function Commandes({ commandes, produits = [], clients = [], droits }) {
  const { donnees, ajouter, modifier, effacer } = commandes

  const [recherche,    setRecherche]    = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [modal,        setModal]        = useState(false)
  const [cmdEditee,    setCmdEditee]    = useState(null)
  const [form,         setForm]         = useState(COMMANDE_VIDE)
  const [detail,       setDetail]       = useState(null)
  const [confirmation, setConfirmation] = useState(null)

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
        if (prod) { lignes[idx].produitNom = prod.nom; lignes[idx].prixUnit = prod.prix || 0; lignes[idx].total = lignes[idx].quantite * (prod.prix || 0) }
      }
      if (champ === 'quantite' || champ === 'prixUnit') {
        lignes[idx].total = Number(lignes[idx].quantite) * Number(lignes[idx].prixUnit)
      }
      return { ...f, lignes }
    })
  }

  const supprimerLigne = (idx) => setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }))

  const montantTotal = (lignes) => (lignes || []).reduce((s, l) => s + (l.total || 0), 0)

  const sauvegarder = () => {
    if (!form.clientId) return
    const client = clients.find(c => c.id === form.clientId)
    const cmd = { ...form, clientNom: client?.nom || '', montantHT: montantTotal(form.lignes) }
    if (cmdEditee) { modifier(cmdEditee.id, cmd); if (detail?.id === cmdEditee.id) setDetail({ ...detail, ...cmd }) }
    else ajouter({ ...cmd, id: genId() })
    setModal(false)
  }

  const supprimer = () => {
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
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: B[900], marginBottom: 16, marginTop: 0 }}>
              {cmdEditee ? 'Modifier le chantier' : 'Nouveau chantier'}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Référence</label>
                <input style={sInput} value={form.reference || ''} onChange={e => setForm({ ...form, reference: e.target.value })} placeholder="CMD-2025-001" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Statut</label>
                <select style={sInput} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                  {Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
                </select>
              </div>
            </div>

            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Client *</label>
            <select style={sInput} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
              <option value="">-- Sélectionner un client --</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Date chantier</label>
                <input type="date" style={sInput} value={form.dateCommande} onChange={e => setForm({ ...form, dateCommande: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Date livraison</label>
                <input type="date" style={sInput} value={form.dateLivraison || ''} onChange={e => setForm({ ...form, dateLivraison: e.target.value })} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 11, color: '#64748b' }}>Produits</label>
                <button onClick={ajouterLigne} style={{ ...sBtn, padding: '3px 10px', fontSize: 11 }}>+ Ligne</button>
              </div>
              {(form.lignes || []).map((ligne, idx) => (
                <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                  <select value={ligne.produitId} onChange={e => modifierLigne(idx, 'produitId', e.target.value)} style={{ ...sInput, marginBottom: 0 }}>
                    <option value="">-- Produit --</option>
                    {produits.map(p => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                  <input type="number" min="1" value={ligne.quantite} onChange={e => modifierLigne(idx, 'quantite', Number(e.target.value))} style={{ ...sInput, marginBottom: 0 }} placeholder="Qté" />
                  <div style={{ fontSize: 12, color: B[700], fontWeight: 600, textAlign: 'right' }}>{fmt(ligne.total)} F</div>
                  <button onClick={() => supprimerLigne(idx)} style={{ background: B[50], border: `1px solid ${B[200]}`, borderRadius: 4, padding: '5px 7px', cursor: 'pointer', color: B[600], fontSize: 12 }}>×</button>
                </div>
              ))}
              {(form.lignes || []).length > 0 && (
                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 13, color: B[900], marginTop: 6 }}>
                  Total : {fmt(montantTotal(form.lignes))} FCFA
                </div>
              )}
            </div>

            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Note</label>
            <textarea value={form.note || ''} onChange={e => setForm({ ...form, note: e.target.value })}
              rows={2} placeholder="Note optionnelle..."
              style={{ ...sInput, resize: 'vertical', fontFamily: 'inherit' }} />

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={sBtnSec}>Annuler</button>
              <button onClick={sauvegarder} style={sBtn}>{cmdEditee ? 'Enregistrer' : 'Créer'}</button>
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
