import { useState, useEffect } from 'react'
import { getUsers, ajouterUser, modifierUser, supprimerUser, demanderReinitialisationMdp, DROITS } from '../utils/auth'
import { exporterRapportComptable } from '../utils/exportComptable'

const CLE_TEINTES = 'mansa_teintes'
const CLE_TAILLES = 'mansa_tailles'
const CLE_UNITES = 'mansa_unites'
const CLE_MAGASIN = 'mansa_magasin'

const TEINTES_DEFAUT = ['Naturel', 'Blanc', 'Bronze', 'Noir', 'Argent', 'Inox', 'Clair', 'Fumé', 'Laqué RAL sur mesure']
const TAILLES_DEFAUT = ['60×60', '60×120', '90×120', '90×210', '120×120', '120×210', '150×120', '180×210', '200×220', 'Sur mesure']
const UNITES_DEFAUT = ['unité', 'ml', 'm²', 'm³', 'barre', 'rouleau', 'kg', 'tonne', 'lot', 'boîte', 'palette']

const B1 = {
900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
500: '#1976d2', 300: '#64b5f6', 200: '#bbdefb',
100: '#e3f2fd', 50: '#f0f7ff',
}

const B = {
  900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
  500: '#1976d2', 400: '#2196f3', 300: '#64b5f6',
  200: '#bbdefb', 100: '#e3f2fd', 50: '#f0f7ff',
}

function load(cle, defaut) {
try { return JSON.parse(localStorage.getItem(cle)) || defaut } catch { return defaut }
}

// ── TagManager ──────────────────────────────────────────────
function TagManager({ titre, cle, defaut }) {
const [items, setItems] = useState(() => load(cle, defaut))
const [nouv, setNouv] = useState('')

const ajouter = () => {
const t = nouv.trim()
if (!t || items.includes(t)) return
const updated = [...items, t]
setItems(updated)
localStorage.setItem(cle, JSON.stringify(updated))
setNouv('')
}

const supprimer = (t) => {
const updated = items.filter(x => x !== t)
setItems(updated)
localStorage.setItem(cle, JSON.stringify(updated))
}

const resetDefaut = () => {
setItems(defaut)
localStorage.setItem(cle, JSON.stringify(defaut))
}

return (
<div style={S.section}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
<h3 style={S.sectionTitre}>{titre}</h3>
<button onClick={resetDefaut} style={S.btnReset}>Réinitialiser</button></div>

<div style={S.tagList}>
{items.map(t => (
<span key={t} style={S.tag}>
{t}
<button onClick={() => supprimer(t)} style={S.tagX}>×</button></span>
))}
{items.length === 0 && <span style={{ fontSize: 12, color: '#94a3b8' }}>Aucune valeur.</span>}
</div>

<div style={S.addRow}>
<input
value={nouv}
onChange={e => setNouv(e.target.value)}
onKeyDown={e => e.key === 'Enter' && ajouter()}
placeholder="Nouvelle valeur..."
style={{ ...S.input, flex: 1 }}
/>
<button onClick={ajouter} style={S.btnAjouter}>Ajouter</button></div></div>
)
}

// ── Paramètres principal ─────────────────────────────────────
export default function Parametres({ userActif, produits = [], fournisseurs = [], clients = [], mouvements = [], categories = [], familles = [] }) {
const [onglet, setOnglet] = useState('magasin')

// ── État export comptable ──────────────────────────────────
const [modalExport,    setModalExport]    = useState(false)
const [typePeriode,    setTypePeriode]    = useState('mois')
const [exportEnCours,  setExportEnCours]  = useState(false)
const [dernierExport,  setDernierExport]  = useState(null)

const [magasin, setMagasin] = useState(() => load(CLE_MAGASIN, {
nom: 'MAN-SA – Menuiserie Aluminium & Verre',
telephone: '00 237 6 99 99 88 37',
email: 'man@man-sa.com',
adresse: 'Zone industrielle de Djamboutou, BP 528, Garoua – Cameroun',
devise: 'FCFA',
stockMin: 8,
}))
const [notifMsg, setNotifMsg] = useState('')
const alerte = (msg) => { setNotifMsg(msg); setTimeout(() => setNotifMsg(''), 3000) }

const saveMagasin = () => {
localStorage.setItem(CLE_MAGASIN, JSON.stringify(magasin))
alerte('Informations sauvegardées.')
}

// ── Lancer l'export comptable ──────────────────────────────
const lancerExport = () => {
  setExportEnCours(true)
  try {
    const magasinInfo = magasin
    const { nomFichier, periode } = exporterRapportComptable({
      typePeriode,
      produits:      Array.isArray(produits)     ? produits     : (produits.donnees     || []),
      fournisseurs:  Array.isArray(fournisseurs) ? fournisseurs : (fournisseurs.donnees || []),
      clients:       Array.isArray(clients)      ? clients      : (clients.donnees      || []),
      mouvements:    Array.isArray(mouvements)   ? mouvements   : (mouvements.donnees   || []),
      categories:    Array.isArray(categories)   ? categories   : (categories.donnees   || []),
      familles:      Array.isArray(familles)     ? familles     : (familles.donnees     || []),
      magasin:       magasinInfo,
    })
    setDernierExport({ nomFichier, periode, date: new Date().toLocaleString('fr-FR') })
    alerte(`Rapport exporté : ${nomFichier}`)
    setModalExport(false)
  } catch (err) {
    console.error(err)
    alerte('Erreur lors de l\'export. Vérifiez la console.')
  } finally {
    setExportEnCours(false)
  }
}

const [users, setUsers] = useState([])
const [chargeUsers, setChargeUsers] = useState(true)
const [modalUser, setModalUser] = useState(null)
const [formUser, setFormUser] = useState({ nom: '', prenom: '', email: '', motDePasse: '', role: 'visiteur', actif: true })
const [errUser, setErrUser] = useState('')
const [enregistrementUser, setEnregistrementUser] = useState(false)

const rafraichir = async () => {
  setChargeUsers(true)
  try { setUsers(await getUsers()) } finally { setChargeUsers(false) }
}

useEffect(() => { rafraichir() }, [])

const ouvrirNouveau = () => {
setFormUser({ nom: '', prenom: '', email: '', motDePasse: '', role: 'visiteur', actif: true })
setErrUser(''); setModalUser('nouveau')
}

const ouvrirModif = (u) => {
setFormUser({ nom: u.nom, prenom: u.prenom, email: u.email, motDePasse: '', role: u.role, actif: u.actif })
setErrUser(''); setModalUser(u)
}

const sauvegarderUser = async () => {
if (!formUser.nom || !formUser.email) { setErrUser('Nom et email obligatoires.'); return }
if (modalUser === 'nouveau' && !formUser.motDePasse) { setErrUser('Mot de passe obligatoire pour un nouveau compte.'); return }
setEnregistrementUser(true)
setErrUser('')
try {
  if (modalUser === 'nouveau') await ajouterUser(formUser)
  else await modifierUser(modalUser.id, formUser)
  await rafraichir()
  setModalUser(null)
  alerte('Utilisateur sauvegardé.')
} catch (err) {
  console.error(err)
  setErrUser(err?.code === 'auth/email-already-in-use'
    ? 'Cet email est déjà utilisé par un autre compte.'
    : err?.message || "Erreur lors de l'enregistrement.")
} finally {
  setEnregistrementUser(false)
}
}

const envoyerReinitialisation = async (u) => {
try {
  await demanderReinitialisationMdp(u.email)
  alerte(`Email de réinitialisation envoyé à ${u.email}.`)
} catch (err) {
  console.error(err)
  alerte("Erreur lors de l'envoi de l'email de réinitialisation.")
}
}

const suppUser = async (id) => {
if (id === userActif?.id) { alerte('Impossible de supprimer votre propre compte.'); return }
if (window.confirm('Retirer cet utilisateur ? (le compte de connexion devra être supprimé séparément depuis la console Firebase)')) {
  try { await supprimerUser(id); await rafraichir(); alerte('Utilisateur supprimé.') }
  catch (err) { console.error(err); alerte('Erreur lors de la suppression.') }
}
}

const onglets = [
{ id: 'magasin', label: 'Entreprise', visible: true },
{ id: 'teintes', label: 'Teintes', visible: true },
{ id: 'tailles', label: 'Tailles', visible: true },
{ id: 'unites', label: 'Unités', visible: true },
{ id: 'export', label: 'Export comptable', visible: true },
{ id: 'utilisateurs', label: 'Utilisateurs', visible: userActif?.role === 'admin' },
{ id: 'droits', label: 'Autorisations', visible: userActif?.role === 'admin' },
].filter(o => o.visible)

return (
<div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', minHeight: 'calc(100vh - 52px)' }}>

{/* Toast */}
{notifMsg && (
<div style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999, background: B[700], color: 'white', padding: '10px 18px', borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,.2)', fontSize: 13, fontWeight: 600 }}>
{notifMsg}
</div>
)}

{/* Sidebar gauche FIXE */}
<div style={{
width: 180,
flexShrink: 0,
position: 'sticky',
top: 0,
height: 'calc(100vh - 52px)',
overflowY: 'auto',
borderRight: `1px solid ${B[200]}`,
paddingTop: 16,
paddingBottom: 16,
background: '#fff',
}}>
<div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.6px', padding: '0 14px 10px' }}>
Paramètres
</div>
{onglets.map(o => (
<div
key={o.id}
onClick={() => setOnglet(o.id)}
style={{
padding: '8px 14px',
fontSize: 13,
fontWeight: onglet === o.id ? 600 : 400,
color: onglet === o.id ? B[600] : '#475569',
background: onglet === o.id ? B[100] : 'transparent',
borderLeft: `3px solid ${onglet === o.id ? B[500] : 'transparent'}`,
cursor: 'pointer',
transition: 'all 0.1s',
}}
onMouseEnter={e => { if (onglet !== o.id) e.currentTarget.style.background = B[50] }}
onMouseLeave={e => { if (onglet !== o.id) e.currentTarget.style.background = 'transparent' }}
>
{o.label}
</div>
))}
</div>

{/* Contenu scrollable à droite */}
<div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

{/* ENTREPRISE */}
{onglet === 'magasin' && (
<div style={S.section}>
<h3 style={S.sectionTitre}>Informations de l'entreprise</h3>
<div style={S.grille2}>
{[
{ key: 'nom', label: "Nom de l'entreprise", type: 'text' },
{ key: 'telephone',label: 'Téléphone', type: 'text' },
{ key: 'email', label: 'Email', type: 'email' },
{ key: 'adresse', label: 'Adresse complète', type: 'text' },
{ key: 'devise', label: 'Devise', type: 'text' },
{ key: 'stockMin', label: "Seuil d'alerte stock", type: 'number' },
].map(f => (
<div key={f.key} style={S.champ}>
<label style={S.label}>{f.label}</label>
<input
type={f.type}
value={magasin[f.key] || ''}
onChange={e => setMagasin(m => ({ ...m, [f.key]: e.target.value }))}
style={S.input}
/></div>
))}
</div>
<button onClick={saveMagasin} style={S.btnPrimary}>Sauvegarder</button></div>
)}

{onglet === 'teintes' && (
<TagManager titre="Teintes / Couleurs" cle={CLE_TEINTES} defaut={TEINTES_DEFAUT} />
)}

{onglet === 'tailles' && (
<TagManager titre="Tailles disponibles" cle={CLE_TAILLES} defaut={TAILLES_DEFAUT} />
)}

{onglet === 'unites' && (
<TagManager titre="Unités de mesure" cle={CLE_UNITES} defaut={UNITES_DEFAUT} />
)}

{/* EXPORT COMPTABLE */}
{onglet === 'export' && (
<div style={S.section}>
  <h3 style={S.sectionTitre}>Export rapport comptable</h3>
  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, marginTop: 0, lineHeight: 1.6 }}>
    Génère un fichier Excel complet à remettre à l'expert comptable, avec 7 feuilles :
    Résumé général, Mouvements, État du stock, Fournisseurs, Clients, Top produits, et Récapitulatif par famille.
  </p>

  {/* Sélection période */}
  <div style={{ marginBottom: 20 }}>
    <label style={S.label}>Période du rapport</label>
    <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
      {[
        { id: 'mois',      label: 'Mois en cours',      desc: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) },
        { id: 'semestre',  label: 'Semestre en cours',  desc: new Date().getMonth() < 6 ? `Jan – Jun ${new Date().getFullYear()}` : `Jul – Déc ${new Date().getFullYear()}` },
        { id: 'annee',     label: 'Année en cours',     desc: `Janvier – Décembre ${new Date().getFullYear()}` },
      ].map(p => (
        <div
          key={p.id}
          onClick={() => setTypePeriode(p.id)}
          style={{
            flex: 1, minWidth: 140,
            border: `2px solid ${typePeriode === p.id ? B[600] : B[200]}`,
            background: typePeriode === p.id ? B[50] : '#fff',
            borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
            transition: 'all 0.12s',
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: typePeriode === p.id ? B[600] : B[900], marginBottom: 4 }}>
            {p.label}
          </div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.desc}</div>
        </div>
      ))}
    </div>
  </div>

  {/* Ce que contiendra le fichier */}
  <div style={{ background: B[50], borderRadius: 8, padding: '14px 16px', marginBottom: 20, border: `1px solid ${B[200]}` }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: B[700], marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      Contenu du fichier Excel
    </div>
    {[
      { num: '1', titre: 'Résumé général',   desc: 'Valeur du stock, mouvements, marge brute, alertes' },
      { num: '2', titre: 'Mouvements',       desc: 'Toutes les entrées et sorties de la période' },
      { num: '3', titre: 'État du stock',    desc: 'Inventaire complet avec valeurs et statuts' },
      { num: '4', titre: 'Fournisseurs',     desc: 'Liste et valeur du stock par fournisseur' },
      { num: '5', titre: 'Clients',          desc: 'Liste des clients et nouveaux sur la période' },
      { num: '6', titre: 'Top produits',     desc: 'Produits les plus sortis, quantités et valeurs' },
      { num: '7', titre: 'Récapitulatif',    desc: 'Valeur du stock groupée par famille et catégorie' },
    ].map(f => (
      <div key={f.num} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5, flexShrink: 0,
          background: B[600], color: '#fff',
          fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{f.num}</span>
        <span style={{ fontSize: 12, color: B[900], fontWeight: 600 }}>{f.titre}</span>
        <span style={{ fontSize: 11, color: '#94a3b8' }}>— {f.desc}</span>
      </div>
    ))}
  </div>

  {/* Dernier export */}
  {dernierExport && (
    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#166534' }}>
      Dernier export : <strong>{dernierExport.nomFichier}</strong> — {dernierExport.date}
    </div>
  )}

  {/* Bouton export */}
  <button
    onClick={lancerExport}
    disabled={exportEnCours}
    style={{
      ...S.btnPrimary,
      fontSize: 14, padding: '11px 28px',
      opacity: exportEnCours ? 0.7 : 1,
      cursor: exportEnCours ? 'wait' : 'pointer',
    }}
  >
    {exportEnCours ? 'Génération en cours...' : 'Générer le rapport Excel'}
  </button>
</div>
)}

{/* UTILISATEURS */}
{onglet === 'utilisateurs' && userActif?.role === 'admin' && (
<div style={S.section}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
<h3 style={{ ...S.sectionTitre, marginBottom: 0 }}>Utilisateurs</h3>
<button onClick={ouvrirNouveau} style={S.btnPrimary}>+ Ajouter</button></div>
{chargeUsers ? (
<div style={{ fontSize: 13, color: '#94a3b8', padding: '16px 0' }}>Chargement des utilisateurs...</div>
) : (
<div style={{ overflowX: 'auto' }}>
<table style={S.table}>
<thead>
<tr>
{['Utilisateur', 'Email', 'Rôle', 'Statut', 'Actions'].map(h => (
<th key={h} style={S.th}>{h}</th>
))}
</tr></thead>
<tbody>
{users.map(u => (
<tr key={u.id} style={S.tr}>
<td style={S.td}>
<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
<div style={{ width: 30, height: 30, borderRadius: 5, background: B[100], color: B[600], display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
{u.nom?.[0]?.toUpperCase() || '?'}
</div>
<div>
<div style={{ fontWeight: 600, fontSize: 13, color: B[900] }}>{u.nom} {u.prenom}</div>
<div style={{ fontSize: 10, color: '#94a3b8' }}>{u.dateCreation?.slice(0, 10)}</div></div></div></td>
<td style={S.td}>{u.email}</td>
<td style={S.td}>
<span style={{ background: B[100], color: B[600], padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
{DROITS[u.role]?.label || u.role}
</span></td>
<td style={S.td}>
<span style={{ color: u.actif ? B[600] : '#94a3b8', fontWeight: 600, fontSize: 12 }}>
{u.actif ? 'Actif' : 'Inactif'}
</span></td>
<td style={S.td}>
<div style={{ display: 'flex', gap: 6 }}>
<button onClick={() => ouvrirModif(u)} style={S.btnEdit}>Modifier</button>
<button onClick={() => envoyerReinitialisation(u)} style={S.btnEdit}>Réinit. mdp</button>
<button onClick={() => suppUser(u.id)} style={S.btnDel} disabled={u.id === userActif?.id}>Retirer</button></div></td></tr>
))}
</tbody></table></div>
)}
</div>
)}

{/* AUTORISATIONS */}
{onglet === 'droits' && userActif?.role === 'admin' && (
<div style={S.section}>
<h3 style={S.sectionTitre}>Autorisations par rôle</h3>
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 20 }}>
{Object.entries(DROITS).map(([role, d]) => (
<div key={role} style={{ background: '#fff', border: `1px solid ${B[200]}`, borderTop: `3px solid ${B[500]}`, borderRadius: 7, padding: '14px 16px' }}>
<div style={{ fontSize: 13, fontWeight: 700, color: B[700], marginBottom: 8 }}>{d.label}</div>
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
{Object.entries(d.peut).map(([perm, val]) => (
<div key={perm} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
<span>{perm}</span>
<span style={{ fontWeight: 700, color: val ? B[600] : '#94a3b8' }}>{val ? 'Oui' : 'Non'}</span></div>
))}
</div></div>
))}
</div>

<div style={{ overflowX: 'auto' }}>
<table style={S.table}>
<thead>
<tr>
<th style={S.th}>Permission</th>
{Object.entries(DROITS).map(([r, d]) => <th key={r} style={{ ...S.th, color: B[600] }}>{d.label}</th>)}
</tr></thead>
<tbody>
{Object.keys(DROITS.admin.peut).map(perm => (
<tr key={perm} style={S.tr}>
<td style={{ ...S.td, fontWeight: 600, color: B[900] }}>{perm}</td>
{Object.entries(DROITS).map(([r, d]) => (
<td key={r} style={{ ...S.td, textAlign: 'center', fontSize: 12, fontWeight: 600, color: d.peut[perm] ? B[600] : '#94a3b8' }}>
{d.peut[perm] ? 'Oui' : 'Non'}
</td>
))}
</tr>
))}
</tbody></table></div></div>
)}
</div>

{/* Modal utilisateur */}
{modalUser && (
<div style={S.modalOverlay}>
<div style={S.modal}>
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
<h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: B[900] }}>
{modalUser === 'nouveau' ? 'Nouvel utilisateur' : "Modifier l'utilisateur"}
</h3>
<button onClick={() => setModalUser(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#94a3b8' }}>×</button></div>

{errUser && <div style={{ background: B[50], color: B[600], borderRadius: 5, padding: '8px 12px', fontSize: 12, marginBottom: 12, border: `1px solid ${B[200]}` }}>{errUser}</div>}

<div style={S.grille2}>
{[
{ key: 'nom', label: 'Nom *', type: 'text' },
{ key: 'prenom', label: 'Prénom', type: 'text' },
{ key: 'email', label: 'Email *', type: 'email', disabled: modalUser !== 'nouveau' },
...(modalUser === 'nouveau' ? [{ key: 'motDePasse', label: 'Mot de passe * (6 car. min.)', type: 'password' }] : []),
].map(f => (
<div key={f.key} style={S.champ}>
<label style={S.label}>{f.label}</label>
<input type={f.type} value={formUser[f.key] || ''} disabled={f.disabled}
onChange={e => setFormUser(u => ({ ...u, [f.key]: e.target.value }))}
style={{ ...S.input, ...(f.disabled ? { background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' } : {}) }} /></div>
))}
</div>
{modalUser !== 'nouveau' && (
<p style={{ fontSize: 11, color: '#94a3b8', marginTop: -8, marginBottom: 14 }}>
  L'email ne peut pas être changé ici. Pour le mot de passe, utilisez « Réinit. mdp » depuis la liste.
</p>
)}

<div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
<div style={{ ...S.champ, flex: 1 }}>
<label style={S.label}>Rôle</label>
<select value={formUser.role} onChange={e => setFormUser(u => ({ ...u, role: e.target.value }))} style={S.input}>
<option value="admin">Administrateur</option>
<option value="gestionnaire">Gestionnaire</option>
<option value="visiteur">Visiteur</option></select></div>
<div style={{ ...S.champ, flex: 1 }}>
<label style={S.label}>Statut</label>
<select value={formUser.actif ? 'actif' : 'inactif'} onChange={e => setFormUser(u => ({ ...u, actif: e.target.value === 'actif' }))} style={S.input}>
<option value="actif">Actif</option>
<option value="inactif">Inactif</option></select></div></div>

<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
<button onClick={() => setModalUser(null)} style={S.btnSecondary}>Annuler</button>
<button onClick={sauvegarderUser} style={{ ...S.btnPrimary, opacity: enregistrementUser ? 0.7 : 1, cursor: enregistrementUser ? 'wait' : 'pointer' }} disabled={enregistrementUser}>
{enregistrementUser ? 'Enregistrement...' : 'Sauvegarder'}
</button></div></div></div>
)}
</div>
)
}

const B2 = {
900: '#0a1929', 700: '#0f2847', 600: '#1565c0',
500: '#1976d2', 300: '#64b5f6', 200: '#bbdefb',
100: '#e3f2fd', 50: '#f0f7ff',
}

const S = {
section: { background: 'white', borderRadius: 8, padding: '20px 22px', border: `1px solid ${B[200]}`, marginBottom: 16 },
sectionTitre: { fontSize: 14, fontWeight: 700, color: B[900], marginBottom: 14, marginTop: 0 },
grille2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 14 },
champ: { display: 'flex', flexDirection: 'column', gap: 4 },
label: { fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' },
input: { padding: '8px 11px', border: `1px solid ${B[200]}`, borderRadius: 5, fontSize: 13, color: B[900], outline: 'none', background: B[50], width: '100%', boxSizing: 'border-box' },
tagList: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12, minHeight: 32 },
tag: { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: B[100], color: B[600], border: `1px solid ${B[200]}` },
tagX: { background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: B[500], padding: 0, lineHeight: 1 },
addRow: { display: 'flex', gap: 8, alignItems: 'center' },
btnAjouter: { padding: '8px 14px', background: B[600], color: 'white', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', fontWeight: 600, flexShrink: 0 },
btnReset: { padding: '5px 12px', background: B[50], color: '#64748b', border: `1px solid ${B[200]}`, borderRadius: 5, cursor: 'pointer', fontSize: 11, fontWeight: 500 },
btnPrimary: { padding: '8px 18px', background: B[600], color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 600 },
btnSecondary: { padding: '8px 18px', background: B[50], color: '#475569', border: `1px solid ${B[200]}`, borderRadius: 5, cursor: 'pointer', fontSize: 13, fontWeight: 500 },
btnEdit: { background: B[50], border: `1px solid ${B[200]}`, borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: B[600], fontWeight: 500 },
btnDel: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontSize: 11, color: '#94a3b8', fontWeight: 500 },
table: { width: '100%', borderCollapse: 'collapse' },
th: { padding: '9px 12px', background: B[50], borderBottom: `1px solid ${B[200]}`, textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#475569' },
tr: { borderBottom: `1px solid ${B[50]}` },
td: { padding: '10px 12px', fontSize: 13, color: '#374151' },
modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
modal: { background: 'white', borderRadius: 10, padding: '22px 24px', width: '100%', maxWidth: 500, boxShadow: '0 16px 40px rgba(0,0,0,.15)', maxHeight: '90vh', overflowY: 'auto' },
}
