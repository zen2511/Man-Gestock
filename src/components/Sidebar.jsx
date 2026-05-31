import { LOGO_BASE64 } from '../utils/logoData'

const menuItems = [
  { id: 'dashboard',    label: 'Dashboard'    },
  { id: 'produits',     label: 'Produits'     },
  { id: 'categories',   label: 'Catégories'   },
  { id: 'clients',      label: 'Clients'      },
  { id: 'fournisseurs', label: 'Fournisseurs' },
  { id: 'commandes',    label: 'Chantiers'    },
]

function Sidebar({ pageActive, setPageActive, droits, collapsed, setCollapsed }) {
  const w = collapsed ? 56 : 210

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

      {/* Logo + toggle */}
      <div style={{
        padding: collapsed ? '16px 12px' : '16px 14px',
        borderBottom: '1px solid #1a2f4a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 64,
        gap: 8,
      }}>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <img
              src={LOGO_BASE64}
              alt="MAN-SA"
              style={{ height: 32, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
            />
            <div style={{ fontSize: 9, color: '#3d6a99', marginTop: 4, letterSpacing: '0.4px', fontWeight: 700, textTransform: 'uppercase' }}>
              Man-Gestock
            </div>
          </div>
        )}
        {collapsed && (
          <img
            src={LOGO_BASE64}
            alt="MAN"
            style={{ height: 26, width: 36, objectFit: 'cover', objectPosition: 'left center', borderRadius: 3 }}
          />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{
            background: 'transparent',
            border: '1px solid #1e3a5a',
            borderRadius: 5,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#4a7fa5',
            fontSize: 10,
            flexShrink: 0,
            transition: 'border-color 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#2d6aa0'; e.currentTarget.style.color = '#7ab0d4' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#1e3a5a'; e.currentTarget.style.color = '#4a7fa5' }}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Menu */}
      <nav style={{ padding: collapsed ? '10px 6px' : '10px 8px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ fontSize: 9, color: '#2a4a6a', fontWeight: 700, letterSpacing: '0.8px', padding: '4px 10px 8px', textTransform: 'uppercase' }}>
            Navigation
          </div>
        )}
        {menuItems.map(item => {
          const actif = pageActive === item.id
          return (
            <div
              key={item.id}
              onClick={() => setPageActive(item.id)}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 0,
                padding: collapsed ? '9px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 6,
                marginBottom: 2,
                cursor: 'pointer',
                background: actif ? '#1565c0' : 'transparent',
                color: actif ? '#e3f2fd' : '#5a8ab5',
                fontWeight: actif ? 600 : 400,
                fontSize: 13,
                letterSpacing: '0.01em',
                transition: 'all 0.12s',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!actif) e.currentTarget.style.background = '#0d2137' }}
              onMouseLeave={e => { if (!actif) e.currentTarget.style.background = 'transparent' }}
            >
              {!collapsed && (
                <span style={{
                  display: 'inline-block',
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: actif ? '#64b5f6' : 'transparent',
                  marginRight: 10,
                  flexShrink: 0,
                  transition: 'background 0.12s',
                }} />
              )}
              {collapsed ? (
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: actif ? '#64b5f6' : '#2a4a6a',
                  display: 'inline-block',
                }} />
              ) : (
                <span style={{ flex: 1 }}>{item.label}</span>
              )}
            </div>
          )
        })}
      </nav>

      {/* Paramètres en bas */}
      <div style={{ padding: collapsed ? '8px 6px 18px' : '8px 8px 18px', borderTop: '1px solid #1a2f4a' }}>
        <div
          onClick={() => setPageActive('parametres')}
          title={collapsed ? 'Paramètres' : ''}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: collapsed ? '9px 0' : '8px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: 6,
            cursor: 'pointer',
            background: pageActive === 'parametres' ? '#1565c0' : 'transparent',
            color: pageActive === 'parametres' ? '#e3f2fd' : '#5a8ab5',
            fontWeight: pageActive === 'parametres' ? 600 : 400,
            fontSize: 13,
            transition: 'all 0.12s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { if (pageActive !== 'parametres') e.currentTarget.style.background = '#0d2137' }}
          onMouseLeave={e => { if (pageActive !== 'parametres') e.currentTarget.style.background = 'transparent' }}
        >
          {!collapsed && (
            <span style={{
              display: 'inline-block',
              width: 3,
              height: 14,
              borderRadius: 2,
              background: pageActive === 'parametres' ? '#64b5f6' : 'transparent',
              marginRight: 10,
              flexShrink: 0,
            }} />
          )}
          {collapsed ? (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: pageActive === 'parametres' ? '#64b5f6' : '#2a4a6a', display: 'inline-block' }} />
          ) : (
            <span>Paramètres</span>
          )}
        </div>
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
