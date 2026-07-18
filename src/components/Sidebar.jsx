import { LOGO_BASE64 } from '../utils/logoData'

const GROUPES_MENU = [
  {
    section: 'Aperçu',
    items: [
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
    ],
  },
  {
    // Catégories/Familles avant Produits : un produit a besoin d'une
    // catégorie, et une famille regroupe des catégories.
    section: 'Catalogue',
    items: [
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
        id: 'familles',
        label: 'Familles',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
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
    ],
  },
  {
    // Fournisseurs avant Cmd. fournisseur avant Entrées : une commande a
    // besoin d'un fournisseur, une entrée a besoin d'une commande.
    section: 'Achats',
    items: [
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
        id: 'commandesFournisseur',
        label: 'Cmd. fournisseur',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 2h6l1 4H8l1-4z"/>
            <path d="M4 6h16l-1.5 13.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 6z"/>
            <line x1="9" y1="10" x2="15" y2="10"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
        ),
      },
      {
        id: 'entrees',
        label: 'Entrées',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        ),
      },
      {
        // Juste sous Cmd. fournisseur : les prévisions aident à préparer
        // la prochaine commande à partir des stocks bas.
        id: 'previsions',
        label: 'Prévisions',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4"/><path d="M12 17h.01"/>
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          </svg>
        ),
      },
    ],
  },
  {
    // Clients avant Chantiers : un chantier a besoin d'un client.
    section: 'Ventes',
    items: [
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
      {
        id: 'sortie',
        label: 'Sortie',
        icon: (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 8 12 3 17 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        ),
      },
    ],
  },
]

const PARAMS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>
  </svg>
)

const SIDEBAR_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .sidebar-root {
    font-family: 'DM Sans', sans-serif;
    position: relative;
    background: transparent;
  }

  /* Fond glassmorphism */
  .sidebar-glass {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      160deg,
      rgba(8, 20, 40, 0.92) 0%,
      rgba(10, 28, 58, 0.88) 40%,
      rgba(13, 35, 70, 0.90) 100%
    );
    backdrop-filter: blur(20px) saturate(160%);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    border-right: 1px solid rgba(100, 181, 246, 0.08);
    z-index: 0;
  }

  /* Reflets lumineux décoratifs */
  .sidebar-glow-top {
    position: absolute;
    top: -60px;
    left: -40px;
    width: 180px;
    height: 180px;
    background: radial-gradient(circle, rgba(25, 118, 210, 0.18) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }
  .sidebar-glow-bottom {
    position: absolute;
    bottom: 20px;
    right: -30px;
    width: 140px;
    height: 140px;
    background: radial-gradient(circle, rgba(100, 181, 246, 0.10) 0%, transparent 70%);
    pointer-events: none;
    z-index: 1;
  }

  /* Contenu au-dessus du glass */
  .sidebar-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  /* Item nav */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    border-radius: 9px;
    margin-bottom: 3px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.01em;
    white-space: nowrap;
    position: relative;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    color: rgba(148, 190, 230, 0.7);
    overflow: hidden;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.06) !important;
    color: rgba(180, 215, 248, 0.95) !important;
    box-shadow: inset 0 0 0 1px rgba(100, 181, 246, 0.10);
  }

  /* État actif — remplissage bleu complet */
  .nav-item.active {
    background: linear-gradient(
      135deg,
      rgba(21, 101, 192, 0.85) 0%,
      rgba(25, 118, 210, 0.75) 100%
    ) !important;
    color: #fff !important;
    font-weight: 600;
    box-shadow:
      0 4px 16px rgba(21, 101, 192, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.12),
      inset 0 0 0 1px rgba(100, 181, 246, 0.25);
  }

  .nav-item.active .nav-icon {
    opacity: 1;
    filter: drop-shadow(0 0 6px rgba(144, 202, 249, 0.6));
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, #90caf9, #42a5f5);
    border-radius: 0 2px 2px 0;
  }

  .nav-icon {
    flex-shrink: 0;
    opacity: 0.65;
    display: flex;
    align-items: center;
    transition: opacity 0.15s, filter 0.15s;
  }

  .nav-item:hover .nav-icon {
    opacity: 0.9;
  }

  /* Badge de notification (ex: nb de prévisions) */
  .nav-badge {
    flex-shrink: 0;
    min-width: 17px;
    height: 17px;
    padding: 0 5px;
    border-radius: 9px;
    background: #dc2626;
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
  }
  .nav-item.active .nav-badge {
    background: #fff;
    color: #b91c1c;
  }
  .nav-badge-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #dc2626;
    box-shadow: 0 0 0 1.5px rgba(8, 20, 40, 0.9);
  }

  /* Séparateur section */
  .nav-section-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(100, 181, 246, 0.22);
    padding: 2px 12px 8px;
  }

  /* Scrollbar custom */
  .sidebar-nav::-webkit-scrollbar { width: 3px; }
  .sidebar-nav::-webkit-scrollbar-track { background: transparent; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(100,181,246,0.15); border-radius: 3px; }

  /* Toggle button */
  .toggle-btn {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(100, 181, 246, 0.12);
    border-radius: 6px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(100, 181, 246, 0.5);
    flex-shrink: 0;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
  }
  .toggle-btn:hover {
    background: rgba(21, 101, 192, 0.25);
    border-color: rgba(100, 181, 246, 0.35);
    color: #90caf9;
  }

  /* Version badge */
  .version-badge {
    text-align: center;
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: rgba(100, 181, 246, 0.18);
    margin-top: 10px;
    padding: 0 4px;
  }

  /* Logo zone */
  .logo-zone {
    height: 56px;
    border-bottom: 1px solid rgba(100, 181, 246, 0.07);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .logo-name {
    font-size: 12px;
    font-weight: 700;
    color: #c8dff0;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }
  .logo-sub {
    font-size: 9px;
    color: rgba(100, 181, 246, 0.3);
    font-weight: 600;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    margin-top: 1px;
  }
`

function NavItem({ item, actif, collapsed, onClick, badge }) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? item.label : ''}
      className={`nav-item${actif ? ' active' : ''}`}
      style={{
        padding: collapsed ? '10px 0' : '9px 12px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        position: 'relative',
      }}
    >
      <span className="nav-icon">{item.icon}</span>
      {!collapsed && (
        <>
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {item.label}
          </span>
          {badge > 0 && <span className="nav-badge">{badge > 99 ? '99+' : badge}</span>}
        </>
      )}
      {collapsed && badge > 0 && <span className="nav-badge-dot" />}
    </div>
  )
}

function Sidebar({ pageActive, setPageActive, droits, collapsed, setCollapsed, badges = {} }) {
  const w = collapsed ? 56 : 214

  return (
    <>
      <style>{SIDEBAR_STYLES}</style>
      <div
        className="sidebar-root"
        style={{
          width: w,
          minHeight: '100vh',
          flexShrink: 0,
          transition: 'width 0.22s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Fond verre */}
        <div className="sidebar-glass" />
        <div className="sidebar-glow-top" />
        <div className="sidebar-glow-bottom" />

        <div className="sidebar-content">

          {/* ── Logo + toggle ── */}
          <div
            className="logo-zone"
            style={{
              padding: collapsed ? '0 10px' : '0 14px',
              justifyContent: collapsed ? 'center' : 'space-between',
              gap: 8,
            }}
          >
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <img
                  src={LOGO_BASE64}
                  alt="MAN"
                  style={{ height: 28, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ minWidth: 0 }}>
                  <div className="logo-name">MAN-SA</div>
                  <div className="logo-sub">Gestion de stock</div>
                </div>
              </div>
            )}
            {collapsed && (
              <img
                src={LOGO_BASE64}
                alt="MAN"
                style={{ height: 24, width: 32, objectFit: 'cover', objectPosition: 'left center', borderRadius: 3 }}
              />
            )}
            <button
              className="toggle-btn"
              onClick={() => setCollapsed(c => !c)}
              title={collapsed ? 'Développer' : 'Réduire'}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                {collapsed
                  ? <polyline points="3,2 7,5 3,8"/>
                  : <polyline points="7,2 3,5 7,8"/>
                }
              </svg>
            </button>
          </div>

          {/* ── Nav principale ── */}
          <nav
            className="sidebar-nav"
            style={{
              padding: collapsed ? '10px 6px' : '10px 8px',
              flex: 1,
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(100,181,246,0.15) transparent',
            }}
          >
            {GROUPES_MENU.map((groupe, i) => (
              <div key={groupe.section}>
                {!collapsed && (
                  <div className="nav-section-label" style={i > 0 ? { marginTop: 10 } : undefined}>
                    {groupe.section}
                  </div>
                )}
                {groupe.items.map(item => (
                  <NavItem
                    key={item.id}
                    item={item}
                    actif={pageActive === item.id}
                    collapsed={collapsed}
                    onClick={() => setPageActive(item.id)}
                    badge={badges[item.id]}
                  />
                ))}
              </div>
            ))}
          </nav>

          {/* ── Paramètres + version ── */}
          <div
            style={{
              padding: collapsed ? '8px 6px 16px' : '8px 8px 16px',
              borderTop: '1px solid rgba(100, 181, 246, 0.07)',
              flexShrink: 0,
            }}
          >
            <NavItem
              item={{ id: 'parametres', label: 'Paramètres', icon: PARAMS_ICON }}
              actif={pageActive === 'parametres'}
              collapsed={collapsed}
              onClick={() => setPageActive('parametres')}
            />
            {!collapsed && <div className="version-badge">v2.0 · Man-Gestock</div>}
          </div>

        </div>
      </div>
    </>
  )
}

export default Sidebar
