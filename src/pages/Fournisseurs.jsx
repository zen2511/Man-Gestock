import { useState } from 'react'
import { genId } from '../utils/storage'

const CHAMPS_VIDES = { nom: '', telephone: '', email: '', adresse: '', produits: '', note: '' }

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  400: '#2196f3', 300: '#64b5f6', 200: '#bbdefb',
  100: '#e3f2fd', 50: '#f0f7ff',
}

const sInput = {
  width: '100%', padding: '8px 11px', borderRadius: 5,
  border: `1px solid ${B[200]}`, fontSize: 13, marginBottom: 10,
  boxSizing: 'border-box', outline: 'none', color: B[900], background: B[50],
}
const btnP = { padding: '7px 16px', borderRadius: 5, border: 'none', background: B[600], color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const btnS = { padding: '7px 16px', borderRadius: 5, border: `1px solid ${B[200]}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }

function Ligne({ label, valeur }) {
  if (!valeur) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '7px 0', borderBottom: `1px solid ${B[50]}` }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{label}</div>
      <div style={{ fontSize: 13, color: B[900] }}>{valeur}</div>
    </div>
  )
}

function Fournisseurs({ fournisseurs }) {
  const { donnees, ajouter, modifier, effacer } = fournisseurs

  const [recherche,        setRecherche]        = useState('')
  const [modal,            setModal]            = useState(false)
  const [fournisseurEdite, setFournisseurEdite] = useState(null)
  const [form,             setForm]             = useState(CHAMPS_VIDES)
  const [confirmation,     setConfirmation]     = useState(null)
  const [detail,           setDetail]           = useState(null)

  const liste = donnees.filter(f =>
    f.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (f.telephone || '').includes(recherche)
  )

  const ouvrirAjout = () => { setFournisseurEdite(null); setForm(CHAMPS_VIDES); setModal(true) }

  const ouvrirEdition = (f, e) => {
    e.stopPropagation()
    setFournisseurEdite(f); setForm({ ...f }); setModal(true)
  }

  const sauvegarder = () => {
    if (!form.nom.trim()) return
    if (fournisseurEdite) {
      modifier(fournisseurEdite.id, form)
      if (detail?.id === fournisseurEdite.id) setDetail({ ...detail, ...form })
    } else {
      ajouter({ ...form, id: genId(), dateCreation: new Date().toISOString() })
    }
    setModal(false)
  }

  const demanderSuppression = (f, e) => { e.stopPropagation(); setConfirmation(f) }

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
            Fournisseurs <span style={{ color: '#94a3b8', fontWeight: 400 }}>({donnees.length})</span>
          </h2>
          <button onClick={ouvrirAjout} style={btnP}>+ Nouveau</button>
        </div>

        <input
          placeholder="Rechercher par nom ou téléphone..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 16, maxWidth: 320 }}
        />

        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '36px 0', fontSize: 13 }}>
            {recherche ? 'Aucun fournisseur trouvé.' : 'Aucun fournisseur enregistré.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {liste.map(f => {
              const actif = detail?.id === f.id
              return (
                <div
                  key={f.id}
                  onClick={() => setDetail(f)}
                  style={{
                    background: '#fff', border: actif ? `1.5px solid ${B[400]}` : `1px solid ${B[200]}`,
                    borderRadius: 7, padding: '12px 14px', cursor: 'pointer', transition: 'border-color 0.12s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 5,
                      background: B[100], color: B[600],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {f.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: B[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.nom}</div>
                      {f.telephone && <div style={{ fontSize: 11, color: '#64748b' }}>{f.telephone}</div>}
                    </div>
                  </div>
                  {f.produits && (
                    <div style={{ fontSize: 11, color: B[600], background: B[50], borderRadius: 3, padding: '2px 7px', display: 'inline-block', marginBottom: 8, border: `1px solid ${B[200]}` }}>
                      {f.produits.length > 28 ? f.produits.slice(0, 28) + '…' : f.produits}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={e => ouvrirEdition(f, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Modifier</button>
                    <button onClick={e => demanderSuppression(f, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Retirer</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {detail && (
        <div style={{ width: 270, flexShrink: 0, background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '18px 16px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
          <button onClick={() => setDetail(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</button>

          <div style={{ width: 52, height: 52, borderRadius: 7, background: B[100], color: B[600], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, margin: '0 auto 12px' }}>
            {detail.nom.charAt(0).toUpperCase()}
          </div>
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: B[900] }}>{detail.nom}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>Fournisseur</div>
          </div>

          <Ligne label="Téléphone"       valeur={detail.telephone} />
          <Ligne label="Email"            valeur={detail.email} />
          <Ligne label="Adresse"          valeur={detail.adresse} />
          <Ligne label="Produits fournis" valeur={detail.produits} />
          <Ligne label="Note"             valeur={detail.note} />

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

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 400 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: B[900], marginBottom: 16, marginTop: 0 }}>
              {fournisseurEdite ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h3>
            {[
              { key: 'nom',       label: 'Nom *',           placeholder: 'Nom société ou personne' },
              { key: 'telephone', label: 'Téléphone',       placeholder: '699 123 456' },
              { key: 'email',     label: 'Email',           placeholder: 'email@exemple.com' },
              { key: 'adresse',   label: 'Adresse',         placeholder: 'Ville, quartier...' },
              { key: 'produits',  label: 'Produits fournis',placeholder: 'Ex: Aluminium, verre...' },
              { key: 'note',      label: 'Note',            placeholder: 'Note optionnelle...' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>{f.label}</label>
                <input style={sInput} value={form[f.key]}
                  onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setModal(false)} style={btnS}>Annuler</button>
              <button onClick={sauvegarder} style={btnP}>{fournisseurEdite ? 'Enregistrer' : 'Ajouter'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: B[900], marginTop: 0 }}>Retirer ce fournisseur ?</h3>
            <p style={{ color: '#64748b', fontSize: 13 }}><strong>{confirmation.nom}</strong> sera supprimé définitivement.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={btnS}>Annuler</button>
              <button onClick={supprimer} style={btnP}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fournisseurs
