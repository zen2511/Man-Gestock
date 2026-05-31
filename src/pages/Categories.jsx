import { useState } from 'react'
import { genId } from '../utils/storage'

const CHAMPS_VIDES = { nom: '', description: '' }

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  500: '#1976d2', 400: '#2196f3', 300: '#64b5f6',
  200: '#bbdefb', 100: '#e3f2fd', 50: '#f0f7ff',
}

const sInput = {
  width: '100%', padding: '8px 11px', borderRadius: 5,
  border: `1px solid ${B[200]}`, fontSize: 13, marginBottom: 10,
  boxSizing: 'border-box', outline: 'none', color: B[900], background: B[50],
}
const btnP = { padding: '7px 16px', borderRadius: 5, border: 'none', background: B[600], color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const btnS = { padding: '7px 16px', borderRadius: 5, border: `1px solid ${B[200]}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }

function Categories({ categories, produits }) {
  const { donnees, ajouter, modifier, effacer } = categories

  const [recherche,    setRecherche]    = useState('')
  const [modal,        setModal]        = useState(false)
  const [catEditee,    setCatEditee]    = useState(null)
  const [form,         setForm]         = useState(CHAMPS_VIDES)
  const [confirmation, setConfirmation] = useState(null)
  const [detail,       setDetail]       = useState(null)

  const liste = donnees.filter(c => c.nom.toLowerCase().includes(recherche.toLowerCase()))

  const countProduits = (cat) =>
    (produits?.donnees || []).filter(p => p.categorieId === cat.id || p.categorie === cat.nom).length

  const ouvrirAjout = () => { setCatEditee(null); setForm(CHAMPS_VIDES); setModal(true) }

  const ouvrirEdition = (c, e) => {
    e.stopPropagation()
    setCatEditee(c)
    setForm({ nom: c.nom, description: c.description || '' })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.nom.trim()) return
    if (catEditee) {
      modifier(catEditee.id, { ...form })
      if (detail?.id === catEditee.id) setDetail({ ...detail, ...form })
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
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: B[900], margin: 0 }}>
              Catégories <span style={{ color: '#94a3b8', fontWeight: 400 }}>({donnees.length})</span>
            </h2>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Organisation des produits par famille</p>
          </div>
          <button onClick={ouvrirAjout} style={btnP}>+ Nouvelle</button>
        </div>

        <input
          placeholder="Rechercher une catégorie..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 16, maxWidth: 300 }}
        />

        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '36px 0', fontSize: 13 }}>
            {recherche ? 'Aucune catégorie trouvée.' : 'Aucune catégorie configurée.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {liste.map(cat => {
              const actif  = detail?.id === cat.id
              const nbProd = countProduits(cat)
              return (
                <div
                  key={cat.id}
                  onClick={() => setDetail(cat)}
                  style={{
                    background: '#fff',
                    border: actif ? `1.5px solid ${B[400]}` : `1px solid ${B[200]}`,
                    borderTop: actif ? `3px solid ${B[500]}` : `3px solid ${B[300]}`,
                    borderRadius: 7,
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'border-color 0.12s',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: B[900], marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.nom}
                  </div>
                  <div style={{ fontSize: 11, color: B[600], fontWeight: 600, marginBottom: 8 }}>
                    {nbProd} produit{nbProd !== 1 ? 's' : ''}
                  </div>
                  {cat.description && (
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {cat.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button onClick={e => ouvrirEdition(cat, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Modifier</button>
                    <button onClick={e => demanderSuppression(cat, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Retirer</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {detail && (() => {
        const nbProd  = countProduits(detail)
        const prodsCat = (produits?.donnees || []).filter(p => p.categorieId === detail.id || p.categorie === detail.nom)
        return (
          <div style={{ width: 260, flexShrink: 0, background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '18px 16px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
            <button onClick={() => setDetail(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</button>

            <div style={{ display: 'inline-block', padding: '2px 10px', background: B[100], color: B[600], borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
              Catégorie
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: B[900], marginBottom: 4 }}>{detail.nom}</div>
            <div style={{ fontSize: 12, color: B[600], fontWeight: 600, marginBottom: 12 }}>{nbProd} produit{nbProd !== 1 ? 's' : ''}</div>

            {detail.description && (
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 14, padding: '8px 10px', background: B[50], borderRadius: 5, border: `1px solid ${B[100]}` }}>
                {detail.description}
              </div>
            )}

            {prodsCat.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Produits ({prodsCat.length})</div>
                <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                  {prodsCat.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${B[50]}`, fontSize: 12 }}>
                      <span style={{ color: '#334155', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</span>
                      <span style={{ fontWeight: 600, fontSize: 11, marginLeft: 6, flexShrink: 0, color: p.quantite <= 0 ? '#64748b' : p.quantite <= p.quantiteMin ? B[500] : B[600] }}>
                        {p.quantite}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.dateCreation && (
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 12, textAlign: 'center' }}>
                Créée le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
              <button onClick={e => ouvrirEdition(detail, e)} style={{ ...btnP, flex: 1, fontSize: 12 }}>Modifier</button>
              <button onClick={e => demanderSuppression(detail, e)} style={{ ...btnS, flex: 1, fontSize: 12 }}>Retirer</button>
            </div>
          </div>
        )
      })()}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: B[900], marginBottom: 16, marginTop: 0 }}>
              {catEditee ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h3>
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Nom *</label>
            <input style={sInput} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Mur rideau, Fenêtre battante..." />
            <label style={{ fontSize: 11, color: '#64748b', display: 'block', marginBottom: 3 }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description optionnelle..."
              rows={2}
              style={{ ...sInput, resize: 'vertical', fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button onClick={() => setModal(false)} style={btnS}>Annuler</button>
              <button onClick={sauvegarder} style={btnP}>{catEditee ? 'Enregistrer' : 'Créer'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 26px', width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: B[900], marginTop: 0 }}>Supprimer cette catégorie ?</h3>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              <strong>{confirmation.nom}</strong> sera supprimée définitivement.
              {countProduits(confirmation) > 0 && (
                <span style={{ color: B[600] }}> Les {countProduits(confirmation)} produits associés ne seront pas supprimés.</span>
              )}
            </p>
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

export default Categories
