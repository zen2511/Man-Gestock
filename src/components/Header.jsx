import { useState } from 'react'
import { DROITS } from '../utils/auth'

const titres = {
  dashboard:    'Dashboard',
  produits:     'Produits',
  categories:   'Catégories',
  clients:      'Clients',
  fournisseurs: 'Fournisseurs',
  commandes:    'Chantiers',
  parametres:   'Paramètres',
}

function Header({ pageActive, alertes, setPageActive, userActif, onLoginClick, onLogout }) {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const estVisiteur  = !userActif || userActif.role === 'visiteur'
  const droitLabel   = DROITS[userActif?.role]?.label ?? 'Visiteur'
  const droitCouleur = DROITS[userActif?.role]?.couleur ?? '#6b7280'

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 28px',
      background:'#ffffff', borderBottom:'1px solid #e2e8f0',
      position:'sticky', top:0, zIndex:10, gap:16,
    }}>
      <h1 style={{ fontSize:18, fontWeight:700, color:'#0f2847', margin:0 }}>
        {titres[pageActive] || 'Man-Gestock'}
      </h1>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {/* Cloche alertes */}
        <div onClick={() => setPageActive('produits')} style={{
          position:'relative', cursor:'pointer',
          background: alertes > 0 ? '#fef2f2' : '#f1f5f9',
          border: alertes > 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0',
          borderRadius:10, padding:'7px 12px',
          display:'flex', alignItems:'center', gap:6,
        }}>
          <span style={{ fontSize:17 }}>🔔</span>
          {alertes > 0 ? (
            <>
              <span style={{
                position:'absolute', top:-6, right:-6,
                background:'#ef4444', color:'#fff',
                fontSize:10, fontWeight:700,
                width:18, height:18, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>{alertes}</span>
              <span style={{ fontSize:12, color:'#ef4444', fontWeight:600 }}>Rupture</span>
            </>
          ) : (
            <span style={{ fontSize:12, color:'#94a3b8' }}>Aucune alerte</span>
          )}
        </div>

        {/* Zone utilisateur */}
        {estVisiteur ? (
          <button onClick={onLoginClick} style={{
            padding:'8px 18px',
            background:'linear-gradient(135deg,#c0392b,#e74c3c)',
            color:'white', border:'none', borderRadius:9,
            fontSize:13, fontWeight:700, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6,
            boxShadow:'0 3px 10px rgba(192,57,43,0.3)',
          }}>
            🔑 Se connecter
          </button>
        ) : (
          <div style={{ position:'relative' }}>
            <button onClick={() => setMenuOuvert(o => !o)} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'6px 12px 6px 6px',
              background:'white', border:'1.5px solid #e2e8f0',
              borderRadius:10, cursor:'pointer',
            }}>
              <div style={{
                width:34, height:34, borderRadius:8,
                background: droitCouleur,
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'white', fontWeight:800, fontSize:15, flexShrink:0,
              }}>
                {userActif.nom?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:1 }}>
                <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{userActif.nom} {userActif.prenom}</span>
                <span style={{ fontSize:11, fontWeight:600, color: droitCouleur }}>{droitLabel}</span>
              </div>
              <span style={{ color:'#94a3b8', fontSize:11 }}>▾</span>
            </button>

            {menuOuvert && (
              <>
                <div style={{ position:'fixed', inset:0, zIndex:99 }} onClick={() => setMenuOuvert(false)} />
                <div style={{
                  position:'absolute', top:'calc(100% + 8px)', right:0,
                  background:'white', border:'1.5px solid #e2e8f0',
                  borderRadius:12, padding:'10px 8px',
                  minWidth:210, zIndex:100,
                  boxShadow:'0 8px 30px rgba(0,0,0,.12)',
                }}>
                  <div style={{ padding:'4px 10px 8px' }}>
                    <div style={{ fontSize:14, fontWeight:700, color:'#0f172a' }}>{userActif.nom} {userActif.prenom}</div>
                    <div style={{ fontSize:12, color:'#6b7280', marginTop:2 }}>{userActif.email}</div>
                    <span style={{
                      display:'inline-block', marginTop:5,
                      background: droitCouleur + '20', color: droitCouleur,
                      fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:20,
                    }}>{droitLabel}</span>
                  </div>
                  <hr style={{ border:'none', borderTop:'1px solid #e2e8f0', margin:'6px 0' }} />
                  <button onClick={() => { setMenuOuvert(false); onLogout() }} style={{
                    width:'100%', padding:'9px 10px',
                    background:'#fef2f2', color:'#dc2626',
                    border:'none', borderRadius:8,
                    fontSize:13, fontWeight:700, cursor:'pointer', textAlign:'left',
                  }}>
                    🚪 Se déconnecter
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Header
