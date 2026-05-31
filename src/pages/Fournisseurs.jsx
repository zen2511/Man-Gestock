import { useState } from 'react'
import { genId } from '../utils/storage'

const CHAMPS_VIDES = { nom: '', telephone: '', email: '', adresse: '', categorieIds: [] }

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  400: '#2196f3', 200: '#bbdefb', 100: '#e3f2fd', 50: '#f0f7ff',
}

const sInput = {
  width: '100%', padding: '9px 12px', borderRadius: 6,
  border: `1.5px solid ${B[200]}`, fontSize: 13, marginBottom: 12,
  boxSizing: 'border-box', outline: 'none', color: B[900], background: B[50],
}
const sLabel = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 4 }
const btnP = { padding: '8px 18px', borderRadius: 6, border: 'none', background: B[600], color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const btnS = { padding: '8px 18px', borderRadius: 6, border: `1.5px solid ${B[200]}`, background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b' }

const AVATAR_COLORS = [
  { bg: '#dbeafe', color: '#1d4ed8' }, { bg: '#dcfce7', color: '#15803d' },
  { bg: '#fef3c7', color: '#b45309' }, { bg: '#fce7f3', color: '#be185d' },
  { bg: '#ede9fe', color: '#7c3aed' }, { bg: '#ffedd5', color: '#c2410c' },
]
function avatarColor(nom) {
  return AVATAR_COLORS[(nom?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function InfoLigne({ icone, valeur }) {
  if (!valeur) return null
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 0', borderBottom: `1px solid ${B[50]}` }}>
      <span style={{ fontSize: 14, marginTop: 1, flexShrink: 0 }}>{icone}</span>
      <span style={{ fontSize: 13, color: B[900], lineHeight: 1.4 }}>{valeur}</span>
    </div>
  )
}

function TagCategorie({ cat }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 20,
      background: (cat.couleur || B[600]) + '18',
      color: cat.couleur || B[600],
      fontSize: 11, fontWeight: 600,
      border: `1px solid ${(cat.couleur || B[600]) + '40'}`,
      margin: '2px 3px 2px 0',
    }}>
      {cat.icone && <span>{cat.icone}</span>}
      {cat.nom}
    </span>
  )
}

function Fournisseurs({ fournisseurs, categories = [], droits }) {
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
    setForm({ ...CHAMPS_VIDES, categorieIds: [] })
    setModal(true)
  }

  const ouvrirEdition = (f, e) => {
    e?.stopPropagation()
    setFournisseurEdite(f)
    setForm({ ...CHAMPS_VIDES, ...f, categorieIds: f.categorieIds || [] })
    setModal(true)
  }

  const toggleCategorie = (id) => {
    setForm(prev => ({
      ...prev,
      categorieIds: prev.categorieIds.includes(id)
        ? prev.categorieIds.filter(c => c !== id)
        : [...prev.categorieIds, id]
    }))
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

  const demanderSuppression = (f, e) => { e?.stopPropagation(); setConfirmation(f) }

  const supprimer = () => {
    effacer(confirmation.id)
    if (detail?.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  // Récupère les objets catégorie d'un fournisseur
  const getCategoriesFournisseur = (f) =>
    (f.categorieIds || []).map(id => categories.find(c => c.id === id)).filter(Boolean)

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>

      {/* ── Liste ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: B[900], margin: 0 }}>Fournisseurs</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>
              {donnees.length} fournisseur{donnees.length !== 1 ? 's' : ''} enregistré{donnees.length !== 1 ? 's' : ''}
            </p>
          </div>
          {droits?.modifierFournisseurs !== false && (
            <button onClick={ouvrirAjout} style={{ ...btnP, display: 'flex', alignItems: 'center', gap: 6 }}>
              ＋ Nouveau
            </button>
          )}
        </div>

        {/* Recherche */}
        <input
          placeholder="🔍  Rechercher par nom ou téléphone..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 18, maxWidth: 380 }}
        />

        {/* Grille cartes */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>🏭</div>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              {recherche ? 'Aucun fournisseur trouvé.' : 'Aucun fournisseur enregistré.'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
            {liste.map(f => {
              const actif = detail?.id === f.id
              const av    = avatarColor(f.nom)
              const cats  = getCategoriesFournisseur(f)

              return (
                <div
                  key={f.id}
                  onClick={() => setDetail(f)}
                  style={{
                    background: '#fff',
                    border: actif ? `2px solid ${B[400]}` : `1.5px solid ${B[200]}`,
                    borderRadius: 10, padding: '16px', cursor: 'pointer',
                    transition: 'box-shadow 0.15s, border-color 0.15s',
                    boxShadow: actif ? `0 0 0 3px ${B[100]}` : '0 1px 4px rgba(0,0,0,0.06)',
                  }}
                  onMouseEnter={e => { if (!actif) e.currentTarget.style.boxShadow = '0 4px 14px rgba(21,101,192,0.12)' }}
                  onMouseLeave={e => { if (!actif) e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}
                >
                  {/* Avatar + nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 8,
                      background: av.bg, color: av.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 16, flexShrink: 0,
                    }}>
                      {f.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: B[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.nom}
                      </div>
                      {f.telephone && <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>📞 {f.telephone}</div>}
                    </div>
                  </div>

                  {/* Catégories */}
                  {cats.length > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      {cats.slice(0, 3).map(c => <TagCategorie key={c.id} cat={c} />)}
                      {cats.length > 3 && <span style={{ fontSize: 10, color: '#94a3b8' }}>+{cats.length - 3}</span>}
                    </div>
                  )}

                  {/* Adresse */}
                  {f.adresse && (
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>📍</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.adresse}</span>
                    </div>
                  )}

                  {/* Actions */}
                  {droits?.modifierFournisseurs !== false && (
                    <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                      <button onClick={e => ouvrirEdition(f, e)}
                        style={{ ...btnS, flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 5 }}>
                        ✏️ Modifier
                      </button>
                      {droits?.supprimerDonnees !== false && (
                        <button onClick={e => demanderSuppression(f, e)}
                          style={{ ...btnS, flex: 1, fontSize: 11, padding: '5px 0', borderRadius: 5, color: '#ef4444', borderColor: '#fecaca' }}>
                          🗑️ Retirer
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Panneau détail ── */}
      {detail && (
        <div style={{
          width: 290, flexShrink: 0, background: '#fff',
          border: `1.5px solid ${B[200]}`, borderRadius: 12,
          overflow: 'hidden', alignSelf: 'flex-start',
          position: 'sticky', top: 16,
          boxShadow: '0 4px 20px rgba(21,101,192,0.08)',
        }}>
          <div style={{ background: `linear-gradient(135deg, ${B[700]}, ${B[600]})`, padding: '20px 16px 24px', position: 'relative' }}>
            <button onClick={() => setDetail(null)} style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(255,255,255,0.2)', border: 'none',
              color: '#fff', borderRadius: 5, width: 26, height: 26,
              cursor: 'pointer', fontSize: 14,
            }}>×</button>
            <div style={{
              width: 52, height: 52, borderRadius: 12,
              background: 'rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 22, color: '#fff', margin: '0 auto 10px',
            }}>
              {detail.nom.charAt(0).toUpperCase()}
            </div>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{detail.nom}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 3 }}>Fournisseur</div>
            </div>
          </div>

          <div style={{ padding: '16px' }}>
            <InfoLigne icone="📞" valeur={detail.telephone} />
            <InfoLigne icone="✉️" valeur={detail.email} />
            <InfoLigne icone="📍" valeur={detail.adresse} />

            {/* Catégories liées */}
            {getCategoriesFournisseur(detail).length > 0 && (
              <div style={{ padding: '10px 0', borderBottom: `1px solid ${B[50]}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Catégories livrées
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                  {getCategoriesFournisseur(detail).map(c => <TagCategorie key={c.id} cat={c} />)}
                </div>
              </div>
            )}

            {detail.dateCreation && (
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 12, textAlign: 'center' }}>
                Ajouté le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
              </div>
            )}

            {droits?.modifierFournisseurs !== false && (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button onClick={e => ouvrirEdition(detail, e)} style={{ ...btnP, flex: 1, fontSize: 12 }}>✏️ Modifier</button>
                {droits?.supprimerDonnees !== false && (
                  <button onClick={e => demanderSuppression(detail, e)}
                    style={{ ...btnS, flex: 1, fontSize: 12, color: '#ef4444', borderColor: '#fecaca' }}>
                    🗑️ Retirer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal ajout/édition ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '26px 28px', width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: B[900], marginBottom: 20, marginTop: 0 }}>
              {fournisseurEdite ? '✏️ Modifier le fournisseur' : '＋ Nouveau fournisseur'}
            </h3>

            <label style={sLabel}>Nom *</label>
            <input style={sInput} value={form.nom}
              onChange={e => setForm({ ...form, nom: e.target.value })}
              placeholder="Nom société ou personne" />

            <label style={sLabel}>Adresse</label>
            <input style={sInput} value={form.adresse}
              onChange={e => setForm({ ...form, adresse: e.target.value })}
              placeholder="Ville, quartier..." />

            <label style={sLabel}>Téléphone</label>
            <input style={sInput} value={form.telephone}
              onChange={e => setForm({ ...form, telephone: e.target.value })}
              placeholder="699 123 456" />

            <label style={sLabel}>Email</label>
            <input style={sInput} value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemple.com" />

            {/* Sélection des catégories */}
            <label style={{ ...sLabel, marginBottom: 8 }}>Catégories livrées</label>
            {categories.length === 0 ? (
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12, padding: '10px', background: B[50], borderRadius: 6 }}>
                Aucune catégorie disponible. Créez d'abord des catégories.
              </div>
            ) : (
              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8,
                marginBottom: 20, padding: '12px',
                background: B[50], borderRadius: 8,
                border: `1.5px solid ${B[200]}`,
              }}>
                {categories.map(cat => {
                  const selectionne = form.categorieIds.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategorie(cat.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', transition: 'all 0.15s',
                        background: selectionne ? (cat.couleur || B[600]) : '#fff',
                        color: selectionne ? '#fff' : (cat.couleur || B[600]),
                        border: `1.5px solid ${cat.couleur || B[600]}`,
                        boxShadow: selectionne ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                      }}
                    >
                      {cat.icone && <span>{cat.icone}</span>}
                      {cat.nom}
                      {selectionne && <span style={{ fontSize: 10 }}>✓</span>}
                    </button>
                  )
                })}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(false)} style={btnS}>Annuler</button>
              <button onClick={sauvegarder} style={btnP}>
                {fournisseurEdite ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '26px 28px', width: '100%', maxWidth: 360 }}>
            <div style={{ fontSize: 32, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: B[900], marginTop: 0, textAlign: 'center' }}>
              Retirer ce fournisseur ?
            </h3>
            <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>
              <strong style={{ color: B[900] }}>{confirmation.nom}</strong> sera supprimé définitivement.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 6 }}>
              <button onClick={() => setConfirmation(null)} style={btnS}>Annuler</button>
              <button onClick={supprimer} style={{ ...btnP, background: '#ef4444' }}>
                Confirmer la suppression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fournisseurs
