import { LOGO_BASE64 } from '../utils/logoData'

const MENU = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: 'produits',
    label: 'Produits',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'categories',
    label: 'Catégories',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
        <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
        <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
      </svg>
    ),
  },
  {
    id: 'clients',
    label: 'Clients',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'fournisseurs',
    label: 'Fournisseurs',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
        <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
  },
  {
    id: 'commandes',
    label: 'Chantiers',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
  },
]

const PARAMS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
  </svg>
)

function NavItem({ item, actif, collapsed, onClick }) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? item.label : ''}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: collapsed ? '10px 0' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: 7,
        marginBottom: 2,
        cursor: 'pointer',
        background: actif ? 'rgba(21,101,192,0.18)' : 'transparent',
        color: actif ? '#90caf9' : '#4a7fa5',
        fontWeight: actif ? 600 : 400,
        fontSize: 13,
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
        position: 'relative',
      }}
      onMouseEnter={e => { if (!actif) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#7ab0d4' } }}
      onMouseLeave={e => { if (!actif) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4a7fa5' } }}
    >
      {/* Trait actif */}
      {actif && (
        <span style={{
          position: 'absolute',
          left: 0, top: '20%', bottom: '20%',
          width: 3, borderRadius: '0 3px 3px 0',
          background: '#64b5f6',
        }} />
      )}

      {/* Icône */}
      <span style={{
        flexShrink: 0,
        opacity: actif ? 1 : 0.7,
        display: 'flex',
        alignItems: 'center',
        color: actif ? '#90caf9' : 'inherit',
      }}>
        {item.icon}
      </span>

      {/* Label */}
      {!collapsed && (
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.label}
        </span>
      )}
    </div>
  )
}

function Sidebar({ pageActive, setPageActive, droits, collapsed, setCollapsed }) {
  const w = collapsed ? 56 : 214

  return (
    <div style={{
      width: w,
      minHeight: '100vh',
      background: '#0a1929',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid #1a2f4a',
      transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden',
    }}>

      {/* ── Logo + toggle ── */}
      <div style={{
        padding: collapsed ? '0 10px' : '0 14px',
        height: 56,
        borderBottom: '1px solid #1a2f4a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
        flexShrink: 0,
      }}>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <img src={LOGO_BASE64} alt="MAN" style={{ height: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#c8dff0', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                MAN-SA
              </div>
              <div style={{ fontSize: 9, color: '#2a4a6a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Gestion de stock
              </div>
            </div>
          </div>
        )}
        {collapsed && (
          <img src={LOGO_BASE64} alt="MAN" style={{ height: 24, width: 32, objectFit: 'cover', objectPosition: 'left center', borderRadius: 3 }} />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Développer' : 'Réduire'}
          style={{
            background: 'transparent',
            border: '1px solid #1e3a5a',
            borderRadius: 5,
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#4a7fa5',
            flexShrink: 0,
            transition: 'border-color 0.15s, color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0d2137'; e.currentTarget.style.borderColor = '#2d6aa0'; e.currentTarget.style.color = '#90caf9' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#1e3a5a'; e.currentTarget.style.color = '#4a7fa5' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {collapsed
              ? <><polyline points="3,2 7,5 3,8"/></>
              : <><polyline points="7,2 3,5 7,8"/></>
            }
          </svg>
        </button>
      </div>

      {/* ── Nav principale ── */}
      <nav style={{
        padding: collapsed ? '10px 6px' : '10px 8px',
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        scrollbarWidth: 'thin',
        scrollbarColor: '#1a2f4a transparent',
      }}>
        {!collapsed && (
          <div style={{
            fontSize: 9, color: '#1e3a5a', fontWeight: 700,
            letterSpacing: '0.8px', padding: '2px 12px 8px',
            textTransform: 'uppercase',
          }}>
            Navigation
          </div>
        )}
        {MENU.map(item => (
          <NavItem
            key={item.id}
            item={item}
            actif={pageActive === item.id}
            collapsed={collapsed}
            onClick={() => setPageActive(item.id)}
          />
        ))}
      </nav>

      {/* ── Paramètres + version ── */}
      <div style={{ padding: collapsed ? '8px 6px 16px' : '8px 8px 16px', borderTop: '1px solid #1a2f4a', flexShrink: 0 }}>
        <NavItem
          item={{ id: 'parametres', label: 'Paramètres', icon: PARAMS_ICON }}
          actif={pageActive === 'parametres'}
          collapsed={collapsed}
          onClick={() => setPageActive('parametres')}
        />
        {!collapsed && (
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, color: '#1e3a5a', letterSpacing: '0.3px' }}>
            v2.0 · Man-Gestock
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
