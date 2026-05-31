import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Produits from './pages/Produits'
import Categories from './pages/Categories'
import Clients from './pages/Clients'
import Fournisseurs from './pages/Fournisseurs'
import Chantiers from './pages/Commandes'
import Parametres from './pages/Parametres'
import LoginModal from './pages/LoginModal'

import { useStore } from './utils/useStore'
import { CLES, PRODUITS_DEFAUT, CLIENTS_DEFAUT, FOURNISSEURS_DEFAUT, CATEGORIES_DEFAUT, COMMANDES_DEFAUT } from './utils/storage'
import { getSession, logout, DROITS, VISITEUR_ANONYME } from './utils/auth'

// ── Réinitialisation unique au déploiement ───────────────────
// Changer la valeur 'v1' pour forcer un nouveau nettoyage
const VERSION = 'v1'
const CLE_VERSION = 'mansa_version'
if (localStorage.getItem(CLE_VERSION) !== VERSION) {
  Object.values(CLES).forEach(cle => localStorage.removeItem(cle))
  localStorage.setItem(CLE_VERSION, VERSION)
}

function App() {
  const [pageActive, setPageActive]   = useState('dashboard')
  const [userActif, setUserActif]     = useState(() => getSession() ?? VISITEUR_ANONYME)
  const [modalLoginVisible, setModalLoginVisible] = useState(false)
  const [collapsed, setCollapsed]     = useState(false)

  const produits     = useStore(CLES.produits,     PRODUITS_DEFAUT)
  const clients      = useStore(CLES.clients,      CLIENTS_DEFAUT)
  const fournisseurs = useStore(CLES.fournisseurs, FOURNISSEURS_DEFAUT)
  const commandes    = useStore(CLES.commandes,    COMMANDES_DEFAUT)
  const mouvements   = useStore(CLES.mouvements,   [])
  const categories   = useStore(CLES.categories,   CATEGORIES_DEFAUT)

  const alertes = produits.donnees.filter(p => p.quantite <= (p.quantiteMin || 5)).length
  const droits  = DROITS[userActif.role]?.peut ?? DROITS.visiteur.peut

  const handleConnecte = (user) => { setUserActif(user); setModalLoginVisible(false) }
  const handleLogout   = () => { logout(); setUserActif(VISITEUR_ANONYME); setPageActive('dashboard') }

  const renderPage = () => {
    if (pageActive === 'parametres' && !droits.voirParametres) {
      return (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:12 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#374151' }}>Accès refusé</div>
          <div style={{ color: '#6b7280', fontSize: 14 }}>Cette page est réservée aux administrateurs.</div>
        </div>
      )
    }
    switch (pageActive) {
      case 'dashboard':    return <Dashboard produits={produits.donnees} clients={clients.donnees} fournisseurs={fournisseurs.donnees} commandes={commandes.donnees} mouvements={mouvements.donnees} categories={categories.donnees} setPageActive={setPageActive} />
      case 'produits':     return <Produits produits={produits} mouvements={mouvements} fournisseurs={fournisseurs.donnees} categories={categories.donnees} droits={droits} />
      case 'categories':   return <Categories categories={categories} produits={produits} droits={droits} />
      case 'clients':      return <Clients clients={clients} droits={droits} />
      case 'fournisseurs': return <Fournisseurs fournisseurs={fournisseurs} droits={droits} />
      case 'commandes':    return <Chantiers commandes={commandes} produits={produits.donnees} clients={clients.donnees} fournisseurs={fournisseurs.donnees} droits={droits} />
      case 'parametres':   return <Parametres userActif={userActif} />
      default:             return <Dashboard produits={produits.donnees} clients={clients.donnees} fournisseurs={fournisseurs.donnees} commandes={commandes.donnees} mouvements={mouvements.donnees} categories={categories.donnees} />
    }
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI', system-ui, sans-serif" }}>
      <Sidebar
        pageActive={pageActive}
        setPageActive={setPageActive}
        droits={droits}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f0f4fa', minWidth:0, transition:'margin 0.25s' }}>
        <Header
          pageActive={pageActive}
          alertes={alertes}
          setPageActive={setPageActive}
          userActif={userActif}
          onLoginClick={() => setModalLoginVisible(true)}
          onLogout={handleLogout}
        />
        <main style={{ flex:1, padding:'28px 32px', overflowY:'auto' }}>
          {renderPage()}
        </main>
      </div>
      {modalLoginVisible && (
        <LoginModal onConnecte={handleConnecte} onFermer={() => setModalLoginVisible(false)} />
      )}
    </div>
  )
}

export default App
