import { useState } from 'react'
import { genId } from '../utils/storage'

const CHAMPS_VIDES = { nom: '', icone: '📦', couleur: '#0f2847', description: '' }

const ICONES_SUGGESTIONS = ['📦','🏢','🪟','🚪','↔️','🔲','🛡️','🔩','🔷','🏗️','⚙️','🔑','💡','🪜','🧱','🪵']
const COULEURS_SUGGESTIONS = ['#0f2847','#1e5fa8','#c0392b','#8e44ad','#16a085','#d35400','#27ae60','#2980b9','#7f8c8d','#f39c12']

function Categories({ categories, produits }) {
  const { donnees, ajouter, modifier, effacer } = categories

  const [recherche,   setRecherche]   = useState('')
  const [modal,       setModal]       = useState(false)
  const [catEditee,   setCatEditee]   = useState(null)
  const [form,        setForm]        = useState(CHAMPS_VIDES)
  const [confirmation,setConfirmation]= useState(null)
  const [detail,      setDetail]      = useState(null)

  const liste = donnees.filter(c =>
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  )

  // Compter les produits par catégorie
  const countProduits = (cat) =>
    (produits?.donnees || []).filter(p => p.categorieId === cat.id || p.categorie === cat.nom).length

  const ouvrirAjout = () => {
    setCatEditee(null)
    setForm(CHAMPS_VIDES)
    setModal(true)
  }

  const ouvrirEdition = (c, e) => {
    e.stopPropagation()
    setCatEditee(c)
    setForm({ nom: c.nom, icone: c.icone || '📦', couleur: c.couleur || '#0f2847', description: c.description || '' })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.nom.trim()) return
    if (catEditee) {
      modifier(catEditee.id, { ...form })
      if (detail && detail.id === catEditee.id) setDetail({ ...detail, ...form })
    } else {
      ajouter({ ...form, id: genId(), dateCreation: new Date().toISOString() })
    }
    setModal(false)
  }

  const demanderSuppression = (c, e) => {
    e.stopPropagation()
    setConfirmation(c)
  }

  const supprimer = () => {
    effacer(confirmation.id)
    if (detail && detail.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  const styleInput = {
    width: '100%', padding: '9px 13px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 14,
    boxSizing: 'border-box', outline: 'none', color: '#0f2847',
    background: '#f8fafc',
  }
  const styleBtnPrimaire = {
    padding: '9px 22px', borderRadius: 8, border: 'none',
    background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
    color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(192,57,43,0.3)',
  }
  const styleBtnSecondaire = {
    padding: '9px 22px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, cursor: 'pointer', color: '#64748b',
  }

  return (
    <div style={{ display: 'flex', gap: 24 }}>

      {/* Colonne principale */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
              Catégories ({donnees.length})
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              Organisez vos produits par famille
            </p>
          </div>
          <button onClick={ouvrirAjout} style={styleBtnPrimaire}>
            + Nouvelle catégorie
          </button>
        </div>

        {/* Recherche */}
        <input
          placeholder="Rechercher une catégorie..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...styleInput, marginBottom: 20, maxWidth: 340 }}
        />

        {/* Grille de catégories */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: 14 }}>
            {recherche ? 'Aucune catégorie trouvée.' : 'Aucune catégorie. Cliquez sur "+ Nouvelle catégorie".'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {liste.map(cat => {
              const actif = detail && detail.id === cat.id
              const nbProd = countProduits(cat)
              return (
                <div
                  key={cat.id}
                  onClick={() => setDetail(cat)}
                  style={{
                    background: '#fff',
                    border: actif ? `2px solid ${cat.couleur || '#c0392b'}` : '1.5px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '18px 18px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => { if (!actif) { e.currentTarget.style.borderColor = cat.couleur || '#c0392b'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)' }}}
                  onMouseLeave={e => { if (!actif) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = 'none' }}}
                >
                  {/* Bande de couleur top */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    background: cat.couleur || '#0f2847',
                    borderRadius: '14px 14px 0 0',
                  }} />

                  {/* Icone + nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 10,
                      background: (cat.couleur || '#0f2847') + '18',
                      border: `2px solid ${(cat.couleur || '#0f2847')}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 22, flexShrink: 0,
                    }}>
                      {cat.icone || '📦'}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: 15, color: '#0f2847',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {cat.nom}
                      </div>
                      <div style={{
                        fontSize: 11, fontWeight: 700,
                        color: cat.couleur || '#0f2847',
                        marginTop: 2,
                      }}>
                        {nbProd} produit{nbProd !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {cat.description && (
                    <div style={{
                      fontSize: 12, color: '#64748b',
                      lineHeight: 1.5, marginBottom: 12,
                      overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {cat.description}
                    </div>
                  )}

                  {/* Boutons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={e => ouvrirEdition(cat, e)}
                      style={{ ...styleBtnSecondaire, flex: 1, fontSize: 12, padding: '6px 0' }}
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={e => demanderSuppression(cat, e)}
                      style={{ ...styleBtnSecondaire, flex: 1, fontSize: 12, padding: '6px 0', color: '#dc2626', borderColor: '#fecaca' }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {detail && (() => {
        const nbProd = countProduits(detail)
        const prodsCat = (produits?.donnees || []).filter(p => p.categorieId === detail.id || p.categorie === detail.nom)
        return (
          <div style={{
            width: 300, flexShrink: 0,
            background: '#fff', border: '1.5px solid #e2e8f0',
            borderRadius: 16, padding: '24px 20px',
            alignSelf: 'flex-start', position: 'sticky', top: 0,
          }}>
            <button
              onClick={() => setDetail(null)}
              style={{ float: 'right', background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer' }}
            >×</button>

            {/* Icone grande */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{
                width: 70, height: 70, borderRadius: 16, margin: '0 auto 12px',
                background: (detail.couleur || '#0f2847') + '18',
                border: `3px solid ${(detail.couleur || '#0f2847')}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>
                {detail.icone || '📦'}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2847' }}>{detail.nom}</div>
              <div style={{
                display: 'inline-block', marginTop: 6,
                background: (detail.couleur || '#0f2847') + '18',
                color: detail.couleur || '#0f2847',
                fontWeight: 700, fontSize: 12,
                padding: '3px 12px', borderRadius: 20,
              }}>
                {nbProd} produit{nbProd !== 1 ? 's' : ''}
              </div>
            </div>

            {detail.description && (
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16, padding: '12px', background: '#f8fafc', borderRadius: 8 }}>
                {detail.description}
              </div>
            )}

            {/* Liste des produits */}
            {prodsCat.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                  Produits ({prodsCat.length})
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {prodsCat.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '7px 0', borderBottom: '1px solid #f1f5f9',
                      fontSize: 13,
                    }}>
                      <span style={{ color: '#334155', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</span>
                      <span style={{
                        fontWeight: 700, fontSize: 11, marginLeft: 8, flexShrink: 0,
                        color: p.quantite <= 0 ? '#ef4444' : p.quantite <= p.quantiteMin ? '#f97316' : '#16a34a',
                      }}>
                        {p.quantite}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detail.dateCreation && (
              <div style={{ fontSize: 11, color: '#cbd5e1', marginTop: 14, textAlign: 'center' }}>
                Créée le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={e => ouvrirEdition(detail, e)} style={{ ...styleBtnPrimaire, flex: 1, fontSize: 13 }}>
                Modifier
              </button>
              <button onClick={e => demanderSuppression(detail, e)} style={{ ...styleBtnSecondaire, flex: 1, fontSize: 13, color: '#dc2626', borderColor: '#fecaca' }}>
                Supprimer
              </button>
            </div>
          </div>
        )
      })()}

      {/* Modal ajout/édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px', width: '100%', maxWidth: 440 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2847', marginBottom: 20, marginTop: 0 }}>
              {catEditee ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
            </h3>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Nom *</label>
            <input style={styleInput} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: Mur rideau, Fenêtre battante..." />

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Icône</label>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {ICONES_SUGGESTIONS.map(ic => (
                  <button key={ic} onClick={() => setForm({ ...form, icone: ic })}
                    style={{
                      padding: '6px 10px', borderRadius: 7, border: `2px solid ${form.icone === ic ? '#c0392b' : '#e2e8f0'}`,
                      background: form.icone === ic ? '#fef2f0' : '#f8fafc',
                      cursor: 'pointer', fontSize: 18,
                    }}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Couleur</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {COULEURS_SUGGESTIONS.map(col => (
                <button key={col} onClick={() => setForm({ ...form, couleur: col })}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: col,
                    border: form.couleur === col ? '3px solid #0f2847' : '3px solid transparent',
                    cursor: 'pointer', outline: 'none',
                    boxShadow: form.couleur === col ? '0 0 0 2px white, 0 0 0 4px ' + col : 'none',
                  }} />
              ))}
            </div>

            {/* Aperçu */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', background: '#f8fafc',
              borderRadius: 10, marginBottom: 14,
              border: '1px solid #e2e8f0',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: (form.couleur) + '20',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20,
              }}>
                {form.icone || '📦'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: form.couleur }}>
                {form.nom || 'Aperçu'}
              </div>
            </div>

            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Description de la catégorie..."
              rows={2}
              style={{ ...styleInput, resize: 'vertical', fontFamily: 'inherit' }}
            />

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setModal(false)} style={styleBtnSecondaire}>Annuler</button>
              <button onClick={sauvegarder} style={styleBtnPrimaire}>
                {catEditee ? 'Enregistrer' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px', width: '100%', maxWidth: 380 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f2847', marginTop: 0 }}>
              Supprimer cette catégorie ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              <strong>{confirmation.nom}</strong> sera supprimée définitivement.
              {countProduits(confirmation) > 0 && (
                <span style={{ color: '#f97316' }}> Les {countProduits(confirmation)} produits associés ne seront pas supprimés.</span>
              )}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={styleBtnSecondaire}>Annuler</button>
              <button onClick={supprimer} style={{ ...styleBtnPrimaire, background: '#dc2626', boxShadow: 'none' }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
