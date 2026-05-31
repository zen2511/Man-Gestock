import { LOGO_BASE64 } from '../utils/logoData'

const menuItems = [
  { id: 'dashboard',    label: 'Dashboard',    icon: '📊' },
  { id: 'produits',     label: 'Produits',     icon: '📦' },
  { id: 'categories',   label: 'Catégories',   icon: '🗂️' },
  { id: 'clients',      label: 'Clients',      icon: '👥' },
  { id: 'fournisseurs', label: 'Fournisseurs', icon: '🚚' },
  { id: 'commandes',    label: 'Chantiers',    icon: '🏗️' },
]

function Sidebar({ pageActive, setPageActive, droits, collapsed, setCollapsed }) {
  const w = collapsed ? 68 : 220

  return (
    <div style={{
      width: w,
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1e3d 0%, #0f2847 60%, #0d2340 100%)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      boxShadow: '4px 0 20px rgba(0,0,0,0.25)',
      transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
      overflow: 'hidden',
    }}>

      {/* Logo + bouton toggle */}
      <div style={{
        padding: collapsed ? '18px 14px' : '18px 16px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 8,
        minHeight: 76,
      }}>
        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <img
              src={LOGO_BASE64}
              alt="MAN-SA"
              style={{ height: 36, width: 'auto', maxWidth: '100%', objectFit: 'contain', display: 'block' }}
            />
            <div style={{ fontSize: 10, color: '#5a8ab5', marginTop: 5, letterSpacing: '0.3px', fontWeight: 600 }}>
              Man-Gestock
            </div>
          </div>
        )}
        {collapsed && (
          <img
            src={LOGO_BASE64}
            alt="MAN"
            style={{ height: 30, width: 42, objectFit: 'cover', objectPosition: 'left center', borderRadius: 4 }}
          />
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Agrandir' : 'Réduire'}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 7, width: 28, height: 28,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#7aa3cc', fontSize: 13, flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
        >
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      {/* Menu */}
      <nav style={{ padding: collapsed ? '12px 8px' : '12px 10px', flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!collapsed && (
          <div style={{ fontSize: 10, color: '#3d6a99', fontWeight: 700, letterSpacing: '0.8px', padding: '6px 14px 8px', textTransform: 'uppercase' }}>
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
                display: 'flex', alignItems: 'center',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '11px 0' : '10px 14px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 9, marginBottom: 2, cursor: 'pointer',
                background: actif ? 'linear-gradient(135deg, #c0392b, #e74c3c)' : 'transparent',
                color: actif ? '#ffffff' : '#93b8d8',
                fontWeight: actif ? 700 : 400, fontSize: 14,
                transition: 'all 0.15s',
                boxShadow: actif ? '0 3px 12px rgba(192,57,43,0.35)' : 'none',
                whiteSpace: 'nowrap', overflow: 'hidden',
              }}
              onMouseEnter={e => { if (!actif) e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
              onMouseLeave={e => { if (!actif) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              {!collapsed && <span style={{ flex: 1 }}>{item.label}</span>}
              {!collapsed && actif && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
              )}
            </div>
          )
        })}
      </nav>

      {/* Paramètres en bas */}
      <div style={{ padding: collapsed ? '10px 8px 20px' : '10px 10px 20px' }}>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
          <div
            onClick={() => setPageActive('parametres')}
            title={collapsed ? 'Paramètres' : ''}
            style={{
              display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : 10,
              padding: collapsed ? '11px 0' : '10px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 9, cursor: 'pointer',
              background: pageActive === 'parametres' ? 'linear-gradient(135deg, #c0392b, #e74c3c)' : 'transparent',
              color: pageActive === 'parametres' ? '#ffffff' : '#93b8d8',
              fontWeight: pageActive === 'parametres' ? 700 : 400,
              fontSize: 14, transition: 'all 0.15s',
              boxShadow: pageActive === 'parametres' ? '0 3px 12px rgba(192,57,43,0.35)' : 'none',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { if (pageActive !== 'parametres') e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            onMouseLeave={e => { if (pageActive !== 'parametres') e.currentTarget.style.background = 'transparent' }}
          >
            <span style={{ fontSize: 18, flexShrink: 0 }}>⚙️</span>
            {!collapsed && <span>Paramètres</span>}
          </div>
        </div>
        {!collapsed && (
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 10, color: '#2d5580' }}>
            v2.0 · Man-Gestock © 2024
          </div>
        )}
      </div>
    </div>
  )
}

export default Sidebar
