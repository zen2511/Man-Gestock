import { useState } from 'react'
import { genId } from '../utils/storage'

const CHAMPS_VIDES = { numeroAffaire: '', nom: '', telephone: '', email: '', adresse: '', note: '' }

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  500: '#1976d2', 300: '#64b5f6', 200: '#bbdefb',
  100: '#e3f2fd', 50: '#f0f7ff',
}

const styleInput = {
  width: '100%', padding: '8px 11px', borderRadius: 5,
  border: `1px solid ${B[200]}`, fontSize: 13, marginBottom: 10,
  boxSizing: 'border-box', outline: 'none', color: B[900],
  background: B[50],
}
const btnP = {
  padding: '7px 16px', borderRadius: 5, border: 'none',
  background: B[600], color: '#fff', fontWeight: 600,
  fontSize: 13, cursor: 'pointer',
}
const btnS = {
  padding: '7px 16px', borderRadius: 5,
  border: `1px solid ${B[200]}`, background: '#fff',
  fontSize: 13, cursor: 'pointer', color: '#64748b',
}

function Ligne({ label, valeur }) {
  if (!valeur) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '7px 0', borderBottom: `1px solid ${B[50]}` }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontSize: 13, color: B[900] }}>{valeur}</div>
    </div>
  )
}

function Clients({ clients }) {
  const { donnees, ajouter, modifier, effacer } = clients

  const [recherche,    setRecherche]    = useState('')
  const [modal,        setModal]        = useState(false)
  const [clientEdite,  setClientEdite]  = useState(null)
  const [form,         setForm]         = useState(CHAMPS_VIDES)
  const [confirmation, setConfirmation] = useState(null)
  const [detail,       setDetail]       = useState(null)

  const liste = donnees.filter(c =>
    c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.telephone || '').includes(recherche) ||
    (c.numeroAffaire || '').toLowerCase().includes(recherche.toLowerCase())
  )

  const ouvrirAjout = () => { setClientEdite(null); setForm(CHAMPS_VIDES); setModal(true) }

  const ouvrirEdition = (c, e) => {
    e.stopPropagation()
    setClientEdite(c); setForm({ ...c }); setModal(true)
  }

  const sauvegarder = () => {
    if (!form.nom.trim() || !form.numeroAffaire.trim()) return
    if (clientEdite) {
      modifier(clientEdite.id, form)
      if (detail?.id === clientEdite.id) setDetail({ ...detail, ...form })
    } else {
      ajouter({ ...form, id: genId(), dateCreation: new Date().toISOString() })
    }
    setModal(false)
  }

  const demanderSuppression = (c, e) => { e.stopPropagation(); setConfirmation(c) }

  const supprimer = () => {
    effacer(confirmation.id)
    if (detail?.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: B[900], margin: 0 }}>
            Clients <span style={{ color: '#94a3b8', fontWeight: 400 }}>({donnees.length})</span>
          </h2>
          <button onClick={ouvrirAjout} style={btnP}>+ Nouveau</button>
        </div>

        <input
          placeholder="Rechercher par nom, N° affaire ou téléphone..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...styleInput, marginBottom: 16, maxWidth: 320 }}
        />

        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '36px 0', fontSize: 13 }}>
            {recherche ? 'Aucun client trouvé.' : 'Aucun client enregistré.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {liste.map(c => {
              const actif = detail?.id === c.id
              return (
                <div
                  key={c.id}
                  onClick={() => setDetail(c)}
                  style={{
                    background: '#fff',
                    border: actif ? `1.5px solid ${B[400]}` : `1px solid ${B[200]}`,
                    borderRadius: 7,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 5,
                      background: B[100], color: B[600],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {c.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: B[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.nom}
                      </div>
                      {c.numeroAffaire && (
                        <div style={{ fontSize: 10, color: B[600], fontWeight: 700, letterSpacing: '0.3px' }}>
                          N° {c.numeroAffaire}
                        </div>
                      )}
                      {c.telephone && <div style={{ fontSize: 11, color: '#64748b' }}>{c.telephone}</div>}
                    </div>
                  </div>
                  {c.email && <div style={{ fontSize: 11, color: B[600], marginBottom: 8 }}>{c.email}</div>}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={e => ouvrirEdition(c, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Modifier</button>
                    <button onClick={e => demanderSuppression(c, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0', color: '#64748b' }}>Retirer</button>
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
          width: 270, flexShrink: 0,
          background: '#fff', border: `1px solid ${B[200]}`,
          borderRadius: 8, padding: '18px 16px',
          alignSelf: 'flex-start', position: 'sticky', top: 0,
        }}>
          <button onClick={() => setDetail(null)}
            style={{ float: 'right', background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer', lineHeight: 1 }}>×</button>

          <div style={{
            width: 52, height: 52, borderRadius: 7,
            background: B[100], color: B[600],
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 20, margin: '0 auto 12px',
          }}>
            {detail.nom.charAt(0).toUpperCase()}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: B[900] }}>{detail.nom}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Client</div>
          </div>

          <Ligne label="N° Affaire"  valeur={detail.numeroAffaire} />
          <Ligne label="Téléphone" valeur={detail.telephone} />
          <Ligne label="Email"     valeur={detail.email} />
          <Ligne label="Adresse"   valeur={detail.adresse} />
          <Ligne label="Note"      valeur={detail.note} />

          {detail.dateCreation && (
            <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 12, textAlign: 'center' }}>
              Ajouté le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
            </div>
          )}

          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            <button onClick={e => ouvrirEdition(detail, e)} style={{ ...btnP, flex: 1, fontSize: 12 }}>Modifier</button>
            <button onClick={e => demanderSuppression(detail, e)} style={{ ...btnS, flex: 1, fontSize: 12 }}>Retirer</button>
          </div>
        </div>
      )}

      {/* Modal ajout/édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: B[900], marginBottom: 16, marginTop: 0 }}>
              {clientEdite ? 'Modifier le client' : 'Nouveau client'}
            </h3>

            {[
              { key: 'numeroAffaire', label: 'N° Affaire *', placeholder: 'Ex : AFF-2025-001' },
              { key: 'nom',       label: 'Nom *',      placeholder: 'Nom complet' },
              { key: 'telephone', label: 'Téléphone',  placeholder: '699 123 456' },
              { key: 'email',     label: 'Email',      placeholder: 'email@exemple.com' },
              { key: 'adresse',   label: 'Adresse',    placeholder: 'Ville, quartier...' },
              { key: 'note',      label: 'Note',       placeholder: 'Note optionnelle...' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>{f.label}</label>
                <input style={styleInput} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setModal(false)} style={btnS}>Annuler</button>
              <button onClick={sauvegarder} style={btnP}>{clientEdite ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation suppression */}
      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: B[900], marginTop: 0 }}>Retirer ce client ?</h3>
            <p style={{ color: '#64748b', fontSize: 13 }}><strong>{confirmation.nom}</strong> sera supprimé définitivement.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={btnS}>Annuler</button>
              <button onClick={supprimer} style={{ ...btnP, background: '#1565c0' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Clients
