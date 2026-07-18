import { useState } from 'react'
import { genId } from '../utils/storage'
import { MODAL_CSS } from '../utils/modalStyles'

const CHAMPS_VIDES = { nom: '', description: '', couleur: '#1565c0' }

const PALETTE = ['#1565c0', '#0f766e', '#c2410c', '#7c3aed', '#be123c', '#4d7c0f', '#0e7490', '#a16207']

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

function Familles({ familles, categories, produits, droits }) {
 const { donnees, ajouter, modifier, effacer } = familles
 const toutesCategories = categories?.donnees || []
 const modifierCategorie = categories?.modifier || (() => {})

 const [recherche, setRecherche] = useState('')
 const [modal, setModal] = useState(false)
 const [famEditee, setFamEditee] = useState(null)
 const [form, setForm] = useState(CHAMPS_VIDES)
 const [catsSelectionnees, setCatsSelectionnees] = useState([])
 const [confirmation, setConfirmation] = useState(null)
 const [detail, setDetail] = useState(null)

 const liste = donnees.filter(f => f.nom.toLowerCase().includes(recherche.toLowerCase()))

 const categoriesDe = (fam) => toutesCategories.filter(c => c.familleId === fam.id)
 const produitsDe = (fam) => {
   const idsCats = new Set(categoriesDe(fam).map(c => c.id))
   return (produits?.donnees || []).filter(p => idsCats.has(p.categorieId))
 }

 const ouvrirAjout = () => {
   setFamEditee(null)
   setForm(CHAMPS_VIDES)
   setCatsSelectionnees([])
   setModal(true)
 }

 const ouvrirEdition = (f, e) => {
   e.stopPropagation()
   setFamEditee(f)
   setForm({ nom: f.nom, description: f.description || '', couleur: f.couleur || '#1565c0' })
   setCatsSelectionnees(toutesCategories.filter(c => c.familleId === f.id).map(c => c.id))
   setModal(true)
 }

 const toggleCategorie = (catId) => {
   setCatsSelectionnees(sel => sel.includes(catId) ? sel.filter(id => id !== catId) : [...sel, catId])
 }

 const sauvegarder = () => {
   if (!form.nom.trim()) return
   const famId = famEditee ? famEditee.id : genId()

   if (famEditee) {
     modifier(famEditee.id, { ...form })
     if (detail?.id === famEditee.id) setDetail({ ...detail, ...form })
   } else {
     ajouter({ ...form, id: famId, dateCreation: new Date().toISOString() })
   }

   // Synchronise l'appartenance des catégories à cette famille
   toutesCategories.forEach(c => {
     const doitEtreDans = catsSelectionnees.includes(c.id)
     const estActuellementDans = c.familleId === famId
     if (doitEtreDans && !estActuellementDans) modifierCategorie(c.id, { familleId: famId })
     if (!doitEtreDans && estActuellementDans) modifierCategorie(c.id, { familleId: null })
   })

   setModal(false)
 }

 const demanderSuppression = (f, e) => { e.stopPropagation(); setConfirmation(f) }

 const supprimer = () => {
   // Détache les catégories de la famille supprimée
   toutesCategories.filter(c => c.familleId === confirmation.id).forEach(c => modifierCategorie(c.id, { familleId: null }))
   effacer(confirmation.id)
   if (detail?.id === confirmation.id) setDetail(null)
   setConfirmation(null)
 }

 return (
 <div style={{ display: 'flex', gap: 20 }}>
 <style>{MODAL_CSS}</style>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
 <div>
 <h2 style={{ fontSize: 16, fontWeight: 700, color: B[900], margin: 0 }}>
 Familles <span style={{ color: '#94a3b8', fontWeight: 400 }}>({donnees.length})</span>
 </h2>
 <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>Regroupement de catégories par famille de produits</p>
 </div>
 {droits?.modifierProduits !== false && (
   <button onClick={ouvrirAjout} style={btnP}>+ Nouvelle</button>
 )}
 </div>

 <input
 placeholder="Rechercher une famille..."
 value={recherche}
 onChange={e => setRecherche(e.target.value)}
 style={{ ...sInput, marginBottom: 16, maxWidth: 300 }}
 />

 {liste.length === 0 ? (
 <div style={{ textAlign: 'center', color: '#94a3b8', padding: '36px 0', fontSize: 13 }}>
 {recherche ? 'Aucune famille trouvée.' : "Aucune famille configurée. Regroupez vos catégories (ex: TPR = Accessoires + Joints)."}
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
 {liste.map(fam => {
 const actif = detail?.id === fam.id
 const nbCats = categoriesDe(fam).length
 const nbProd = produitsDe(fam).length
 const couleur = fam.couleur || B[600]
 return (
 <div
 key={fam.id}
 onClick={() => setDetail(fam)}
 style={{
 background: '#fff',
 border: actif ? `1.5px solid ${couleur}` : `1px solid ${B[200]}`,
 borderTop: `3px solid ${couleur}`,
 borderRadius: 7,
 padding: '12px 14px',
 cursor: 'pointer',
 transition: 'border-color 0.12s',
 }}
 >
 <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
   <span style={{ width: 9, height: 9, borderRadius: '50%', background: couleur, flexShrink: 0 }} />
   <div style={{ fontWeight: 600, fontSize: 13, color: B[900], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
     {fam.nom}
   </div>
 </div>
 <div style={{ fontSize: 11, color: couleur, fontWeight: 600, marginBottom: 8 }}>
 {nbCats} catégorie{nbCats !== 1 ? 's' : ''} · {nbProd} produit{nbProd !== 1 ? 's' : ''}
 </div>
 {fam.description && (
 <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
 {fam.description}
 </div>
 )}
 {droits?.modifierProduits !== false && (
   <div style={{ display: 'flex', gap: 5 }}>
     <button onClick={e => ouvrirEdition(fam, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Modifier</button>
     <button onClick={e => demanderSuppression(fam, e)} style={{ ...btnS, flex: 1, fontSize: 11, padding: '4px 0' }}>Retirer</button>
   </div>
 )}
 </div>
 )
 })}
 </div>
 )}
 </div>

 {/* Panneau détail */}
 {detail && (() => {
 const cats = categoriesDe(detail)
 const nbProd = produitsDe(detail).length
 const couleur = detail.couleur || B[600]
 return (
 <div style={{ width: 260, flexShrink: 0, background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '18px 16px', alignSelf: 'flex-start', position: 'sticky', top: 0 }}>
 <button onClick={() => setDetail(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: 18, color: '#94a3b8', cursor: 'pointer' }}>×</button>

 <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '2px 10px', background: couleur + '18', color: couleur, borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 10 }}>
 Famille
 </div>
 <div style={{ fontSize: 15, fontWeight: 700, color: B[900], marginBottom: 4 }}>{detail.nom}</div>
 <div style={{ fontSize: 12, color: couleur, fontWeight: 600, marginBottom: 12 }}>{cats.length} catégorie{cats.length !== 1 ? 's' : ''} · {nbProd} produit{nbProd !== 1 ? 's' : ''}</div>

 {detail.description && (
 <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5, marginBottom: 14, padding: '8px 10px', background: B[50], borderRadius: 5, border: `1px solid ${B[100]}` }}>
 {detail.description}
 </div>
 )}

 {cats.length > 0 ? (
 <div>
 <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Catégories ({cats.length})</div>
 <div style={{ maxHeight: 220, overflowY: 'auto' }}>
 {cats.map(c => (
 <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: `1px solid ${B[50]}`, fontSize: 12 }}>
 <span style={{ color: '#334155' }}>{c.nom}</span>
 <span style={{ fontSize: 10, color: '#94a3b8' }}>
   {(produits?.donnees || []).filter(p => p.categorieId === c.id).length} prod.
 </span>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>Aucune catégorie assignée</div>
 )}

 {detail.dateCreation && (
 <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 12, textAlign: 'center' }}>
 Créée le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
 </div>
 )}

 {droits?.modifierProduits !== false && (
   <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
   <button onClick={e => ouvrirEdition(detail, e)} style={{ ...btnP, flex: 1, fontSize: 12, background: couleur }}>Modifier</button>
   <button onClick={e => demanderSuppression(detail, e)} style={{ ...btnS, flex: 1, fontSize: 12 }}>Retirer</button>
   </div>
 )}
 </div>
 )
 })()}

 {modal && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
 <div style={{ background: '#1e293b', border: '1px solid rgba(100,181,246,0.12)', borderRadius: 14, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.45)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}>

   {/* En-tête */}
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 16px', borderBottom: '1px solid rgba(100,181,246,0.08)', flexShrink: 0 }}>
     <div>
       <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'rgba(37,78,136,0.35)', color: 'rgba(100,181,246,0.85)', border: '1px solid rgba(100,181,246,0.18)', borderRadius: 20, padding: '2px 10px', display: 'inline-block', marginBottom: 6 }}>
         {famEditee ? 'Modification' : 'Création'}
       </div>
       <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>
         {famEditee ? 'Modifier la famille' : 'Nouvelle famille'}
       </div>
     </div>
     <button onClick={() => setModal(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 20, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>×</button>
   </div>

   <div style={{ padding: '20px 24px', overflowY: 'auto' }}>
     <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,190,230,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Nom *</label>
     <input className="mg-input" value={form.nom}
       onChange={e => setForm({ ...form, nom: e.target.value })}
       placeholder="Ex: TPR, Aluminium, Quincaillerie..." />

     <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,190,230,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Description</label>
     <textarea
       value={form.description}
       onChange={e => setForm({ ...form, description: e.target.value })}
       placeholder="Description optionnelle..."
       rows={2}
       className="mg-input"
       style={{ resize: 'vertical', fontFamily: 'inherit' }}
     />

     <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,190,230,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Couleur</label>
     <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
       {PALETTE.map(c => (
         <div key={c} onClick={() => setForm({ ...form, couleur: c })}
           style={{
             width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer',
             boxShadow: form.couleur === c ? `0 0 0 2px #1e293b, 0 0 0 4px ${c}` : 'none',
           }} />
       ))}
     </div>

     <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(148,190,230,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
       Catégories de cette famille
       <span style={{ fontWeight: 400, textTransform: 'none', color: 'rgba(148,190,230,0.5)' }}> ({catsSelectionnees.length} sélectionnée{catsSelectionnees.length !== 1 ? 's' : ''})</span>
     </label>
     {toutesCategories.length === 0 ? (
       <div style={{ fontSize: 12, color: 'rgba(148,190,230,0.5)', padding: '8px 0' }}>Aucune catégorie créée pour l'instant.</div>
     ) : (
       <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 8 }}>
         {toutesCategories.map(c => {
           const dejaAilleurs = c.familleId && c.familleId !== famEditee?.id
           return (
             <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 6, cursor: 'pointer', background: catsSelectionnees.includes(c.id) ? 'rgba(21,101,192,0.15)' : 'transparent' }}>
               <input type="checkbox" checked={catsSelectionnees.includes(c.id)} onChange={() => toggleCategorie(c.id)}
                 style={{ width: 14, height: 14, cursor: 'pointer', accentColor: form.couleur }} />
               <span style={{ fontSize: 12.5, color: '#f1f5f9' }}>{c.nom}</span>
               {dejaAilleurs && (
                 <span style={{ fontSize: 9.5, color: '#f97316', marginLeft: 'auto' }}>déjà dans une autre famille</span>
               )}
             </label>
           )
         })}
       </div>
     )}

     <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 18, borderTop: '1px solid rgba(100,181,246,0.08)', paddingTop: 16 }}>
       <button onClick={() => setModal(false)} className="mg-btn-ghost">Annuler</button>
       <button onClick={sauvegarder} className="mg-btn-primary">{famEditee ? 'Enregistrer' : 'Créer'}</button>
     </div>
   </div>
 </div>
 </div>
 )}

 {confirmation && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
 <div style={{ background: '#1e293b', border: '1px solid rgba(100,181,246,0.12)', borderRadius: 14, padding: '24px 26px', width: '100%', maxWidth: 360, boxShadow: '0 24px 64px rgba(0,0,0,0.45)' }}>
   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
     <h3 style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Supprimer cette famille ?</h3>
     <button onClick={() => setConfirmation(null)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8', fontSize: 18, width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>
   </div>
   <p style={{ color: 'rgba(148,190,230,0.6)', fontSize: 13, margin: '0 0 20px' }}>
     <strong style={{ color: '#f1f5f9' }}>{confirmation.nom}</strong> sera supprimée définitivement.
     {categoriesDe(confirmation).length > 0 && (
       <span style={{ color: 'rgba(100,181,246,0.8)' }}> Les {categoriesDe(confirmation).length} catégories associées seront détachées (non supprimées).</span>
     )}
   </p>
   <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
     <button onClick={() => setConfirmation(null)} className="mg-btn-ghost">Annuler</button>
     <button onClick={supprimer} className="mg-btn-danger">Confirmer</button>
   </div>
 </div>
 </div>
 )}
 </div>
 )
}

export default Familles