// src/pages/Fournisseurs.jsx
import { useState } from 'react'
import { genId } from '../utils/storage'

const CHAMPS_VIDES = { nom: '', telephone: '', email: '', adresse: '', produits: '', note: '' }

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

  const ouvrirAjout = () => {
    setFournisseurEdite(null)
    setForm(CHAMPS_VIDES)
    setModal(true)
  }

  const ouvrirEdition = (f, e) => {
    e.stopPropagation()
    setFournisseurEdite(f)
    setForm({ ...f })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.nom.trim()) return
    if (fournisseurEdite) {
      modifier(fournisseurEdite.id, form)
      // mettre à jour le détail si ouvert
      if (detail && detail.id === fournisseurEdite.id) setDetail({ ...detail, ...form })
    } else {
      ajouter({ ...form, id: genId(), dateCreation: new Date().toISOString() })
    }
    setModal(false)
  }

  const demanderSuppression = (f, e) => {
    e.stopPropagation()
    setConfirmation(f)
  }

  const supprimer = () => {
    effacer(confirmation.id)
    if (detail && detail.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  const styleInput = {
    width: '100%', padding: '8px 12px', borderRadius: 8,
    border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 12,
    boxSizing: 'border-box', outline: 'none',
  }
  const styleBtnPrimaire = {
    padding: '8px 20px', borderRadius: 8, border: 'none',
    background: '#f59e0b', color: '#fff', fontWeight: 600,
    fontSize: 14, cursor: 'pointer',
  }
  const styleBtnSecondaire = {
    padding: '8px 20px', borderRadius: 8,
    border: '1px solid #e2e8f0', background: '#fff',
    fontSize: 14, cursor: 'pointer', color: '#64748b',
  }

  const Ligne = ({ icone, label, valeur }) => valeur ? (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 18, width: 24 }}>{icone}</span>
      <div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#1e293b' }}>{valeur}</div>
      </div>
    </div>
  ) : null

  return (
    <div style={{ display: 'flex', gap: 24 }}>

      {/* Colonne gauche : liste */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', margin: 0 }}>
            Fournisseurs ({donnees.length})
          </h2>
          <button onClick={ouvrirAjout} style={styleBtnPrimaire}>
            + Nouveau fournisseur
          </button>
        </div>

        {/* Recherche */}
        <input
          placeholder="Rechercher par nom ou téléphone..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...styleInput, marginBottom: 20, maxWidth: 360 }}
        />

        {/* Liste cartes */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: 14 }}>
            {recherche ? 'Aucun fournisseur trouvé.' : 'Aucun fournisseur. Cliquez sur "+ Nouveau fournisseur".'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {liste.map(f => {
              const actif = detail && detail.id === f.id
              return (
                <div
                  key={f.id}
                  onClick={() => setDetail(f)}
                  style={{
                    background: '#fff',
                    border: actif ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                    borderRadius: 12,
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Avatar + nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      background: '#fef3c7', color: '#d97706',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 15, flexShrink: 0,
                    }}>
                      {f.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: 600, fontSize: 14, color: '#1e293b',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {f.nom}
                      </div>
                      {f.telephone && (
                        <div style={{ fontSize: 12, color: '#64748b' }}>{f.telephone}</div>
                      )}
                    </div>
                  </div>

                  {f.produits && (
                    <div style={{
                      fontSize: 11, color: '#92400e',
                      background: '#fef3c7', borderRadius: 20,
                      padding: '2px 10px', display: 'inline-block', marginBottom: 8,
                    }}>
                      {f.produits.length > 28 ? f.produits.slice(0, 28) + '…' : f.produits}
                    </div>
                  )}

                  {/* Boutons */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      onClick={e => ouvrirEdition(f, e)}
                      style={{ ...styleBtnSecondaire, flex: 1, fontSize: 12, padding: '5px 0' }}
                    >
                      Modifier
                    </button>
                    <button
                      onClick={e => demanderSuppression(f, e)}
                      style={{ ...styleBtnSecondaire, flex: 1, fontSize: 12, padding: '5px 0', color: '#dc2626', borderColor: '#fecaca' }}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail à droite */}
      {detail && (
        <div style={{
          width: 300, flexShrink: 0,
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 16,
          padding: '24px 22px',
          alignSelf: 'flex-start',
          position: 'sticky',
          top: 0,
        }}>
          {/* Bouton fermer */}
          <button
            onClick={() => setDetail(null)}
            style={{
              float: 'right', background: 'none', border: 'none',
              fontSize: 20, color: '#94a3b8', cursor: 'pointer', lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Avatar grand */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#fef3c7', color: '#d97706',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 26, margin: '0 auto 14px',
          }}>
            {detail.nom.charAt(0).toUpperCase()}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{detail.nom}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Fournisseur</div>
          </div>

          {/* Informations */}
          <Ligne icone="📞" label="Téléphone"       valeur={detail.telephone} />
          <Ligne icone="📧" label="Email"            valeur={detail.email} />
          <Ligne icone="📍" label="Adresse"          valeur={detail.adresse} />
          <Ligne icone="📦" label="Produits fournis" valeur={detail.produits} />
          <Ligne icone="🗒️" label="Note"             valeur={detail.note} />

          {detail.dateCreation && (
            <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 14, textAlign: 'center' }}>
              Ajouté le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
            </div>
          )}

          {/* Boutons actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
            <button
              onClick={e => ouvrirEdition(detail, e)}
              style={{ ...styleBtnPrimaire, flex: 1, fontSize: 13 }}
            >
              Modifier
            </button>
            <button
              onClick={e => demanderSuppression(detail, e)}
              style={{ ...styleBtnSecondaire, flex: 1, fontSize: 13, color: '#dc2626', borderColor: '#fecaca' }}
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Modal ajout/édition */}
      {modal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 32px',
            width: '100%', maxWidth: 420,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 20, marginTop: 0 }}>
              {fournisseurEdite ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
            </h3>

            <label style={{ fontSize: 13, color: '#64748b' }}>Nom *</label>
            <input style={styleInput} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom de la société ou personne" />

            <label style={{ fontSize: 13, color: '#64748b' }}>Téléphone</label>
            <input style={styleInput} value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="Ex: 699123456" />

            <label style={{ fontSize: 13, color: '#64748b' }}>Email</label>
            <input style={styleInput} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemple.com" />

            <label style={{ fontSize: 13, color: '#64748b' }}>Adresse</label>
            <input style={styleInput} value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })}
              placeholder="Ville, quartier..." />

            <label style={{ fontSize: 13, color: '#64748b' }}>Produits fournis</label>
            <input style={styleInput} value={form.produits}
              onChange={e => setForm({ ...form, produits: e.target.value })}
              placeholder="Ex: Électronique, alimentaire..." />

            <label style={{ fontSize: 13, color: '#64748b' }}>Note</label>
            <input style={styleInput} value={form.note}
              onChange={e => setForm({ ...form, note: e.target.value })}
              placeholder="Note optionnelle..." />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button onClick={() => setModal(false)} style={styleBtnSecondaire}>Annuler</button>
              <button onClick={sauvegarder} style={styleBtnPrimaire}>
                {fournisseurEdite ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmation && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: '#fff', borderRadius: 16, padding: '28px 32px',
            width: '100%', maxWidth: 380,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b', marginTop: 0 }}>
              Supprimer ce fournisseur ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              <strong>{confirmation.nom}</strong> sera supprimé définitivement.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={styleBtnSecondaire}>Annuler</button>
              <button onClick={supprimer}
                style={{ ...styleBtnPrimaire, background: '#dc2626' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fournisseurs
