import { useState } from 'react'
import { DROITS } from '../utils/auth'

const titres = {
  dashboard:    'Tableau de bord',
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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      height: 52,
      background: '#ffffff',
      borderBottom: '1px solid #e1e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      <h1 style={{ fontSize: 14, fontWeight: 600, color: '#0a1929', margin: 0, letterSpacing: '0.01em' }}>
        {titres[pageActive] || 'Man-Gestock'}
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Alertes stock */}
        <button
          onClick={() => setPageActive('produits')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 5,
            border: alertes > 0 ? '1px solid #bbdefb' : '1px solid #e1e8f0',
            background: alertes > 0 ? '#e3f2fd' : '#f5f8fc',
            color: alertes > 0 ? '#1565c0' : '#90a4ae',
            fontSize: 12,
            fontWeight: alertes > 0 ? 600 : 400,
            cursor: 'pointer',
          }}
        >
          {alertes > 0 ? (
            <>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: '#1565c0',
                color: '#fff',
                fontSize: 9,
                fontWeight: 800,
              }}>{alertes}</span>
              Rupture de stock
            </>
          ) : (
            'Aucune alerte'
          )}
        </button>

        {/* Zone utilisateur */}
        {estVisiteur ? (
          <button
            onClick={onLoginClick}
            style={{
              padding: '6px 16px',
              background: '#1565c0',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: '0.02em',
            }}
          >
            Connexion
          </button>
        ) : (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOuvert(o => !o)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '5px 10px 5px 5px',
                background: 'white',
                border: '1px solid #e1e8f0',
                borderRadius: 5,
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 4,
                background: '#1565c0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}>
                {userActif.nom?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#0a1929' }}>
                  {userActif.nom} {userActif.prenom}
                </span>
                <span style={{ fontSize: 10, color: '#5a8ab5' }}>{droitLabel}</span>
              </div>
              <span style={{ color: '#90a4ae', fontSize: 9 }}>▾</span>
            </button>

            {menuOuvert && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOuvert(false)} />
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  background: 'white',
                  border: '1px solid #e1e8f0',
                  borderRadius: 8,
                  padding: '8px',
                  minWidth: 200,
                  zIndex: 100,
                  boxShadow: '0 6px 24px rgba(0,0,0,.1)',
                }}>
                  <div style={{ padding: '4px 8px 10px', borderBottom: '1px solid #e1e8f0', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#0a1929' }}>{userActif.nom} {userActif.prenom}</div>
                    <div style={{ fontSize: 11, color: '#90a4ae', marginTop: 2 }}>{userActif.email}</div>
                  </div>
                  <button
                    onClick={() => { setMenuOuvert(false); onLogout() }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: '#e3f2fd',
                      color: '#1565c0',
                      border: 'none',
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
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
