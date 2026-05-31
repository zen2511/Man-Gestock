import { useState } from 'react'
import { getUsers, ajouterUser, modifierUser, supprimerUser, DROITS } from '../utils/auth'

const CLE_TEINTES = 'mansa_teintes'
const CLE_TAILLES = 'mansa_tailles'
const CLE_UNITES  = 'mansa_unites'
const CLE_MAGASIN = 'mansa_magasin'

const TEINTES_DEFAUT = []
const TAILLES_DEFAUT = []
const UNITES_DEFAUT  = []

function load(cle, defaut) {
  try { return JSON.parse(localStorage.getItem(cle)) || defaut } catch { return defaut }
}

// ── Composant TagManager ────────────────────────────────────
function TagManager({ titre, cle, defaut, couleurTag, couleurBtn }) {
  const [items, setItems]   = useState(() => load(cle, defaut))
  const [nouv, setNouv]     = useState('')

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
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <h3 style={S.sectionTitre}>{titre}</h3>
        <button onClick={resetDefaut} style={S.btnReset} title="Remettre les valeurs par défaut">↺ Réinitialiser</button>
      </div>

      {/* Tags */}
      <div style={S.tagList}>
        {items.map(t => (
          <span key={t} style={{ ...S.tag, background: couleurTag + '20', color: couleurTag, border: `1px solid ${couleurTag}40` }}>
            {t}
            <button onClick={() => supprimer(t)} style={S.tagX}>×</button>
          </span>
        ))}
        {items.length === 0 && (
          <span style={{ fontSize:13, color:'#94a3b8' }}>Aucune valeur. Ajoutez-en ci-dessous.</span>
        )}
      </div>

      {/* Ajout */}
      <div style={S.addRow}>
        <input
          value={nouv}
          onChange={e => setNouv(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ajouter()}
          placeholder={`Nouvelle valeur...`}
          style={{ ...S.input, flex:1 }}
        />
        <button onClick={ajouter} style={{ ...S.btnAjouter, background: couleurBtn }}>+ Ajouter</button>
      </div>
      <p style={{ fontSize:11, color:'#94a3b8', marginTop:8 }}>Appuyez sur Entrée ou cliquez sur Ajouter</p>
    </div>
  )
}

// ── Composant principal ────────────────────────────────────
export default function Parametres({ userActif }) {
  const [onglet, setOnglet] = useState('magasin')

  // ── Magasin ────────────────────────────────────────────
  const [magasin, setMagasin] = useState(() => load(CLE_MAGASIN, {
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
    devise: 'FCFA',
    stockMin: 5,
  }))
  const [notifMsg, setNotifMsg] = useState('')

  const alerte = (msg) => { setNotifMsg(msg); setTimeout(() => setNotifMsg(''), 3000) }

  const saveMagasin = () => {
    localStorage.setItem(CLE_MAGASIN, JSON.stringify(magasin))
    alerte('✅ Informations sauvegardées !')
  }

  // ── Utilisateurs ──────────────────────────────────────
  const [users, setUsers]       = useState(() => getUsers())
  const [modalUser, setModalUser] = useState(null)
  const [formUser, setFormUser]   = useState({ nom:'', prenom:'', email:'', motDePasse:'', role:'visiteur', actif:true })
  const [errUser, setErrUser]     = useState('')

  const rafraichir = () => setUsers(getUsers())

  const ouvrirNouveau = () => {
    setFormUser({ nom:'', prenom:'', email:'', motDePasse:'', role:'visiteur', actif:true })
    setErrUser(''); setModalUser('nouveau')
  }

  const ouvrirModif = (u) => {
    setFormUser({ nom:u.nom, prenom:u.prenom, email:u.email, motDePasse:u.motDePasse, role:u.role, actif:u.actif })
    setErrUser(''); setModalUser(u)
  }

  const sauvegarderUser = () => {
    if (!formUser.nom || !formUser.email || !formUser.motDePasse) { setErrUser('Nom, email et mot de passe obligatoires.'); return }
    if (modalUser === 'nouveau') { ajouterUser(formUser) } else { modifierUser(modalUser.id, formUser) }
    rafraichir(); setModalUser(null)
    alerte('✅ Utilisateur sauvegardé !')
  }

  const suppUser = (id) => {
    if (id === userActif?.id) { alerte('❌ Tu ne peux pas supprimer ton propre compte !'); return }
    if (window.confirm('Supprimer cet utilisateur ?')) { supprimerUser(id); rafraichir(); alerte('🗑️ Utilisateur supprimé.') }
  }

  // ── Onglets ───────────────────────────────────────────
  const onglets = [
    { id: 'magasin',      label: '🏪 Magasin',         visible: true },
    { id: 'teintes',      label: '🎨 Teintes',          visible: true },
    { id: 'tailles',      label: '📐 Tailles',          visible: true },
    { id: 'unites',       label: '📏 Unités',           visible: true },
    { id: 'utilisateurs', label: '👥 Utilisateurs',     visible: userActif?.role === 'admin' },
    { id: 'droits',       label: '🔐 Autorisations',    visible: userActif?.role === 'admin' },
  ]

  return (
    <div style={{ position:'relative', fontFamily:"'Segoe UI', sans-serif" }}>

      {/* Notification toast */}
      {notifMsg && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:9999,
          background:'#0f172a', color:'white',
          padding:'12px 20px', borderRadius:10,
          boxShadow:'0 4px 20px rgba(0,0,0,.3)',
          fontSize:14, fontWeight:600,
          animation:'slideIn .3s ease',
        }}>
          {notifMsg}
        </div>
      )}

      <div style={{ marginBottom:28 }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#0f2847', margin:0 }}>Paramètres</h2>
        <p style={{ fontSize:12, color:'#64748b', margin:'4px 0 0' }}>Configuration de l'application</p>
      </div>

      {/* Onglets */}
      <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
        {onglets.filter(o => o.visible).map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)} style={{
            padding:'9px 18px', borderRadius:10,
            border: onglet === o.id ? 'none' : '1.5px solid #e2e8f0',
            background: onglet === o.id ? 'linear-gradient(135deg,#c0392b,#e74c3c)' : 'white',
            color: onglet === o.id ? 'white' : '#475569',
            cursor:'pointer', fontSize:13, fontWeight:600,
            boxShadow: onglet === o.id ? '0 3px 10px rgba(192,57,43,0.3)' : 'none',
            transition:'all .15s',
          }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── MAGASIN ── */}
      {onglet === 'magasin' && (
        <div style={S.section}>
          <h3 style={S.sectionTitre}>Informations de l'entreprise</h3>
          <div style={S.grille2}>
            {[
              { key:'nom',       label:'Nom de l\'entreprise', type:'text' },
              { key:'telephone', label:'Téléphone',            type:'text' },
              { key:'email',     label:'Email',                type:'email' },
              { key:'adresse',   label:'Adresse complète',     type:'text' },
              { key:'devise',    label:'Devise',               type:'text' },
              { key:'stockMin',  label:'Seuil d\'alerte stock',type:'number' },
            ].map(f => (
              <div key={f.key} style={S.champ}>
                <label style={S.label}>{f.label}</label>
                <input
                  type={f.type}
                  value={magasin[f.key] || ''}
                  onChange={e => setMagasin(m => ({ ...m, [f.key]: e.target.value }))}
                  style={S.input}
                />
              </div>
            ))}
          </div>
          <button onClick={saveMagasin} style={S.btnPrimary}>💾 Sauvegarder</button>
        </div>
      )}

      {/* ── TEINTES ── */}
      {onglet === 'teintes' && (
        <TagManager
          titre="🎨 Teintes / Couleurs"
          cle={CLE_TEINTES}
          defaut={TEINTES_DEFAUT}
          couleurTag="#92400e"
          couleurBtn="#d97706"
        />
      )}

      {/* ── TAILLES ── */}
      {onglet === 'tailles' && (
        <TagManager
          titre="📐 Tailles disponibles"
          cle={CLE_TAILLES}
          defaut={TAILLES_DEFAUT}
          couleurTag="#1d4ed8"
          couleurBtn="#2563eb"
        />
      )}

      {/* ── UNITÉS ── */}
      {onglet === 'unites' && (
        <TagManager
          titre="📏 Unités de mesure"
          cle={CLE_UNITES}
          defaut={UNITES_DEFAUT}
          couleurTag="#065f46"
          couleurBtn="#059669"
        />
      )}

      {/* ── UTILISATEURS ── */}
      {onglet === 'utilisateurs' && userActif?.role === 'admin' && (
        <div style={S.section}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ ...S.sectionTitre, marginBottom:0 }}>Gestion des utilisateurs</h3>
            <button onClick={ouvrirNouveau} style={S.btnPrimary}>+ Ajouter un utilisateur</button>
          </div>

          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Utilisateur','Email','Rôle','Statut','Actions'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={S.tr}>
                    <td style={S.td}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{
                          width:34, height:34, borderRadius:8,
                          background: (DROITS[u.role]?.couleur || '#6b7280') + '20',
                          color: DROITS[u.role]?.couleur || '#6b7280',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontWeight:800, fontSize:14,
                        }}>
                          {u.nom?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14, color:'#0f2847' }}>{u.nom} {u.prenom}</div>
                          <div style={{ fontSize:11, color:'#94a3b8' }}>{u.dateCreation?.slice(0,10)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.td}>{u.email}</td>
                    <td style={S.td}>
                      <span style={{
                        background: (DROITS[u.role]?.couleur || '#6b7280') + '20',
                        color: DROITS[u.role]?.couleur || '#6b7280',
                        padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700,
                      }}>
                        {DROITS[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ color: u.actif ? '#16a34a' : '#dc2626', fontWeight:600, fontSize:13 }}>
                        {u.actif ? '● Actif' : '● Inactif'}
                      </span>
                    </td>
                    <td style={S.td}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => ouvrirModif(u)} style={S.btnEdit} title="Modifier">✏️</button>
                        <button onClick={() => suppUser(u.id)} style={S.btnDel} disabled={u.id === userActif?.id} title="Supprimer">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AUTORISATIONS ── */}
      {onglet === 'droits' && userActif?.role === 'admin' && (
        <div style={S.section}>
          <h3 style={S.sectionTitre}>Tableau des autorisations par rôle</h3>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>
            Résumé des droits accordés à chaque rôle dans l'application.
          </p>

          {/* Cards rôles */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:28 }}>
            {Object.entries(DROITS).map(([role, d]) => (
              <div key={role} style={{
                background:'#fff', border:`2px solid ${d.couleur}30`,
                borderRadius:12, padding:'16px 18px',
                borderTop:`4px solid ${d.couleur}`,
              }}>
                <div style={{ fontSize:15, fontWeight:800, color: d.couleur, marginBottom:8 }}>{d.label}</div>
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {Object.entries(d.peut).map(([perm, val]) => (
                    <div key={perm} style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#475569' }}>
                      <span>{perm}</span>
                      <span style={{ fontWeight:700, color: val ? '#16a34a' : '#dc2626' }}>{val ? '✅' : '❌'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Tableau complet */}
          <h3 style={{ ...S.sectionTitre, marginTop:0 }}>Vue détaillée</h3>
          <div style={{ overflowX:'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Permission</th>
                  {Object.entries(DROITS).map(([r, d]) => (
                    <th key={r} style={{ ...S.th, color:d.couleur }}>{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.keys(DROITS.admin.peut).map(perm => (
                  <tr key={perm} style={S.tr}>
                    <td style={{ ...S.td, fontWeight:600, color:'#0f2847' }}>{perm}</td>
                    {Object.entries(DROITS).map(([r, d]) => (
                      <td key={r} style={{ ...S.td, textAlign:'center', fontSize:16 }}>
                        {d.peut[perm] ? '✅' : '❌'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL UTILISATEUR ── */}
      {modalUser && (
        <div style={S.modalOverlay}>
          <div style={S.modal}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:'#0f2847' }}>
                {modalUser === 'nouveau' ? 'Nouvel utilisateur' : 'Modifier l\'utilisateur'}
              </h3>
              <button onClick={() => setModalUser(null)} style={{ background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#6b7280' }}>×</button>
            </div>

            {errUser && <div style={{ background:'#fef2f2', color:'#dc2626', borderRadius:8, padding:'10px 14px', fontSize:13, marginBottom:14 }}>{errUser}</div>}

            <div style={S.grille2}>
              {[
                { key:'nom',        label:'Nom *',          type:'text' },
                { key:'prenom',     label:'Prénom',         type:'text' },
                { key:'email',      label:'Email *',        type:'email' },
                { key:'motDePasse', label:'Mot de passe *', type:'password' },
              ].map(f => (
                <div key={f.key} style={S.champ}>
                  <label style={S.label}>{f.label}</label>
                  <input type={f.type} value={formUser[f.key] || ''}
                    onChange={e => setFormUser(u => ({ ...u, [f.key]: e.target.value }))}
                    style={S.input} />
                </div>
              ))}
            </div>

            <div style={{ display:'flex', gap:16, marginTop:4 }}>
              <div style={{ ...S.champ, flex:1 }}>
                <label style={S.label}>Rôle</label>
                <select value={formUser.role}
                  onChange={e => setFormUser(u => ({ ...u, role: e.target.value }))}
                  style={S.input}>
                  <option value="admin">Administrateur</option>
                  <option value="gestionnaire">Gestionnaire</option>
                  <option value="visiteur">Visiteur</option>
                </select>
              </div>
              <div style={{ ...S.champ, flex:1 }}>
                <label style={S.label}>Statut</label>
                <select value={formUser.actif ? 'actif' : 'inactif'}
                  onChange={e => setFormUser(u => ({ ...u, actif: e.target.value === 'actif' }))}
                  style={S.input}>
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                </select>
              </div>
            </div>

            <div style={{ display:'flex', gap:12, justifyContent:'flex-end', marginTop:20 }}>
              <button onClick={() => setModalUser(null)} style={S.btnSecondary}>Annuler</button>
              <button onClick={sauvegarderUser} style={S.btnPrimary}>💾 Sauvegarder</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }`}</style>
    </div>
  )
}

// ── Styles communs ──────────────────────────────────────────
const S = {
  section: {
    background:'white', borderRadius:14, padding:24,
    boxShadow:'0 2px 12px rgba(0,0,0,.06)', marginBottom:20,
  },
  sectionTitre: { fontSize:16, fontWeight:700, color:'#0f2847', marginBottom:16, marginTop:0 },
  grille2: { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16, marginBottom:16 },
  champ: { display:'flex', flexDirection:'column', gap:6 },
  label: { fontSize:12, fontWeight:700, color:'#475569', textTransform:'uppercase', letterSpacing:'0.4px' },
  input: {
    padding:'10px 14px', border:'1.5px solid #e2e8f0', borderRadius:8,
    fontSize:14, color:'#0f2847', outline:'none',
    background:'#f8fafc', width:'100%', boxSizing:'border-box',
  },
  tagList: { display:'flex', flexWrap:'wrap', gap:8, marginBottom:16, minHeight:40 },
  tag: {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'6px 12px', borderRadius:20,
    fontSize:13, fontWeight:600,
  },
  tagX: { background:'none', border:'none', cursor:'pointer', fontSize:16, color:'inherit', padding:0, lineHeight:1 },
  addRow: { display:'flex', gap:10, alignItems:'center' },
  btnAjouter: {
    padding:'10px 18px', color:'white',
    border:'none', borderRadius:8, fontSize:13, cursor:'pointer',
    fontWeight:700, flexShrink:0,
  },
  btnReset: {
    padding:'6px 14px', background:'#f1f5f9', color:'#64748b',
    border:'1px solid #e2e8f0', borderRadius:7, cursor:'pointer',
    fontSize:12, fontWeight:600,
  },
  btnPrimary: {
    padding:'10px 22px',
    background:'linear-gradient(135deg,#c0392b,#e74c3c)',
    color:'white', border:'none', borderRadius:8, cursor:'pointer',
    fontSize:14, fontWeight:700,
    boxShadow:'0 3px 10px rgba(192,57,43,0.3)',
  },
  btnSecondary: {
    padding:'10px 22px', background:'#f1f5f9', color:'#475569',
    border:'none', borderRadius:8, cursor:'pointer', fontSize:14, fontWeight:600,
  },
  btnEdit: { background:'#eff6ff', border:'none', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:15 },
  btnDel:  { background:'#fef2f2', border:'none', borderRadius:7, padding:'6px 10px', cursor:'pointer', fontSize:15 },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:'11px 14px', background:'#f8fafc', borderBottom:'2px solid #e2e8f0', textAlign:'left', fontSize:12, fontWeight:700, color:'#374151' },
  tr: { borderBottom:'1px solid #f1f5f9' },
  td: { padding:'12px 14px', fontSize:14, color:'#374151' },
  modalOverlay: { position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  modal: { background:'white', borderRadius:16, padding:28, width:'100%', maxWidth:540, boxShadow:'0 20px 50px rgba(0,0,0,.2)', maxHeight:'90vh', overflowY:'auto' },
}
