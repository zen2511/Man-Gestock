import { useState } from 'react'
import { DROITS } from '../utils/auth'

const PAGES = {
  dashboard:    { label: 'Dashboard',     desc: 'Vue d\'ensemble du stock'      },
  produits:     { label: 'Produits',      desc: 'Catalogue et gestion du stock' },
  categories:   { label: 'Catégories',    desc: 'Organisation des produits'     },
  clients:      { label: 'Clients',       desc: 'Carnet clients'                },
  fournisseurs: { label: 'Fournisseurs',  desc: 'Partenaires et approvisionnement' },
  commandes:    { label: 'Chantiers',     desc: 'Suivi des chantiers en cours'  },
  parametres:   { label: 'Paramètres',    desc: 'Configuration de l\'application' },
}

// Icônes inline SVG
const IconBell = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
)

const IconLogout = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const IconChevron = ({ open }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
    <polyline points="2,4 6,8 10,4"/>
  </svg>
)

const IconHome = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

function Header({ pageActive, alertes, setPageActive, userActif, onLoginClick, onLogout }) {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const estVisiteur = !userActif || userActif.role === 'visiteur'
  const droitLabel  = DROITS[userActif?.role]?.label ?? 'Visiteur'
  const page        = PAGES[pageActive] || PAGES.dashboard
  const estDashboard = pageActive === 'dashboard'

  return (
    <div style={{
      height: 56,
      background: '#ffffff',
      borderBottom: '1px solid #e8edf5',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px 0 24px',
      gap: 16,
      position: 'sticky',
      top: 0,
      zIndex: 10,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>

      {/* ── Breadcrumb ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        {/* Accueil */}
        <button
          onClick={() => setPageActive('dashboard')}
          title="Dashboard"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: estDashboard ? '#1565c0' : '#94a3b8',
            display: 'flex', alignItems: 'center', padding: '4px 6px',
            borderRadius: 5, transition: 'background 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.color = '#1565c0' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = estDashboard ? '#1565c0' : '#94a3b8' }}
        >
          <IconHome />
        </button>

        {/* Séparateur + page courante */}
        {!estDashboard && (
          <>
            <span style={{ color: '#cbd5e1', fontSize: 14, userSelect: 'none' }}>/</span>
            <span style={{
              fontSize: 13, fontWeight: 600, color: '#0f172a',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {page.label}
            </span>
          </>
        )}
        {estDashboard && (
          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
            Dashboard
          </span>
        )}

        {/* Description subtile */}
        <span style={{
          fontSize: 11, color: '#94a3b8', marginLeft: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          display: 'none',
        }}
          className="header-desc"
        >
          — {page.desc}
        </span>
      </div>

      {/* ── Actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Bouton alertes */}
        <button
          onClick={() => setPageActive('produits')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px 5px 10px',
            borderRadius: 7,
            border: alertes > 0 ? '1px solid #fca5a5' : '1px solid #e8edf5',
            background: alertes > 0 ? '#fef2f2' : '#f8fafc',
            color: alertes > 0 ? '#dc2626' : '#94a3b8',
            fontSize: 12,
            fontWeight: alertes > 0 ? 600 : 400,
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = alertes > 0 ? '#fee2e2' : '#f0f7ff'; e.currentTarget.style.borderColor = alertes > 0 ? '#f87171' : '#bfdbfe' }}
          onMouseLeave={e => { e.currentTarget.style.background = alertes > 0 ? '#fef2f2' : '#f8fafc'; e.currentTarget.style.borderColor = alertes > 0 ? '#fca5a5' : '#e8edf5' }}
        >
          <span style={{
            display: 'inline-flex',
            color: alertes > 0 ? '#dc2626' : '#94a3b8',
          }}>
            <IconBell />
          </span>
          {alertes > 0 ? (
            <>
              <span style={{
                minWidth: 17, height: 17, borderRadius: '50%',
                background: '#dc2626', color: '#fff',
                fontSize: 10, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
              }}>
                {alertes}
              </span>
              <span>Ruptures</span>
            </>
          ) : (
            <span>Stock OK</span>
          )}
        </button>

        {/* Séparateur */}
        <div style={{ width: 1, height: 24, background: '#e8edf5' }} />

        {/* Profil / Connexion */}
        {estVisiteur ? (
          <button
            onClick={onLoginClick}
            style={{
              padding: '6px 16px', background: '#1565c0', color: '#fff',
              border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#1976d2'}
            onMouseLeave={e => e.currentTarget.style.background = '#1565c0'}
          >
            Connexion
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOuvert(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 10px 5px 6px',
                background: menuOuvert ? '#f0f7ff' : '#fff',
                border: `1px solid ${menuOuvert ? '#bfdbfe' : '#e8edf5'}`,
                borderRadius: 7, cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f7ff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
              onMouseLeave={e => { if (!menuOuvert) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e8edf5' } }}
            >
              {/* Avatar */}
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
              }}>
                {userActif.nom?.[0]?.toUpperCase() ?? '?'}
              </div>
              {/* Infos */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                  {userActif.nom} {userActif.prenom}
                </span>
                <span style={{ fontSize: 10, color: '#64b5f6' }}>{droitLabel}</span>
              </div>
              <IconChevron open={menuOuvert} />
            </button>

            {/* Dropdown profil */}
            {menuOuvert && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOuvert(false)} />
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  background: '#fff',
                  border: '1px solid #e8edf5',
                  borderRadius: 10,
                  padding: 6,
                  minWidth: 210,
                  zIndex: 100,
                  boxShadow: '0 8px 30px rgba(0,0,0,0.10)',
                  animation: 'fadeDown 0.15s ease',
                }}>
                  <style>{`@keyframes fadeDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

                  {/* Infos utilisateur */}
                  <div style={{
                    padding: '8px 10px 10px',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: 4,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: 'linear-gradient(135deg, #1565c0, #1976d2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontWeight: 700, fontSize: 14,
                    }}>
                      {userActif.nom?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                        {userActif.nom} {userActif.prenom}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{userActif.email}</div>
                      <div style={{
                        display: 'inline-flex', marginTop: 4,
                        fontSize: 10, fontWeight: 600, color: '#1565c0',
                        background: '#eff6ff', padding: '1px 7px', borderRadius: 10,
                      }}>
                        {droitLabel}
                      </div>
                    </div>
                  </div>

                  {/* Action déconnexion */}
                  <button
                    onClick={() => { setMenuOuvert(false); onLogout() }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 10px', background: 'transparent',
                      color: '#64748b', border: 'none', borderRadius: 6,
                      fontSize: 12, fontWeight: 500, cursor: 'pointer',
                      transition: 'background 0.12s, color 0.12s',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b' }}
                  >
                    <IconLogout />
                    Se déconnecter
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
