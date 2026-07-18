import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Dashboard from './pages/Dashboard'
import Produits from './pages/Produits'
import Entrees from './pages/Entrees'
import Sortie from './pages/Sortie'
import CommandesFournisseur from './pages/CommandesFournisseur'
import Previsions, { calculerPrevisions } from './pages/Previsions'
import Categories from './pages/Categories'
import Familles from './pages/Familles'
import Clients from './pages/Clients'
import Fournisseurs from './pages/Fournisseurs'
import Chantiers from './pages/Commandes'
import Parametres from './pages/Parametres'
import LoginModal from './pages/LoginModal'

import { useStore } from './utils/useStore'
import { CLES, PRODUITS_DEFAUT, CLIENTS_DEFAUT, FOURNISSEURS_DEFAUT, CATEGORIES_DEFAUT, COMMANDES_DEFAUT } from './utils/storage'
import { getSession, logout, DROITS, VISITEUR_ANONYME } from './utils/auth'

const VERSION   = 'v1'
const CLE_VERSION = 'mansa_version'

function reinitialiserSiNouvelleVersion() {
  try {
    if (localStorage.getItem(CLE_VERSION) !== VERSION) {
      Object.values(CLES).forEach(cle => localStorage.removeItem(cle))
      localStorage.setItem(CLE_VERSION, VERSION)
    }
  } catch (e) {
    console.warn('Impossible de vérifier la version localStorage', e)
  }
}

function App() {
  reinitialiserSiNouvelleVersion()

  const [pageActive, setPageActive]   = useState('dashboard')
  const [userActif, setUserActif]     = useState(() => getSession() ?? VISITEUR_ANONYME)
  const [modalLoginVisible, setModalLoginVisible] = useState(false)
  const [collapsed, setCollapsed]     = useState(false)
  const [prefillFournisseurId, setPrefillFournisseurId] = useState(null)

  const produits     = useStore(CLES.produits,     PRODUITS_DEFAUT)
  const clients      = useStore(CLES.clients,      CLIENTS_DEFAUT)
  const fournisseurs = useStore(CLES.fournisseurs, FOURNISSEURS_DEFAUT)
  const commandes    = useStore(CLES.commandes,    COMMANDES_DEFAUT)
  const mouvements   = useStore(CLES.mouvements,   [])
  const categories   = useStore(CLES.categories,   CATEGORIES_DEFAUT)
  const familles      = useStore('mansa_familles', [])
  const entrees       = useStore('mansa_entrees', [])
  const commandesFournisseur = useStore('mansa_commandes_fournisseur', [])

  const alertes = produits.donnees.filter(p => (p.stock || 0) <= (p.stockMin || 5)).length
  const nbPrevisions = calculerPrevisions(produits.donnees).length
  const droits  = DROITS[userActif.role]?.peut ?? DROITS.visiteur.peut

  const handleConnecte = (user) => { setUserActif(user); setModalLoginVisible(false) }
  const handleLogout   = () => { logout(); setUserActif(VISITEUR_ANONYME); setPageActive('dashboard') }

  // Depuis la page Prévisions : basculer vers Cmd. fournisseur et ouvrir
  // directement le formulaire de nouvelle commande pour ce fournisseur.
  const creerCommandeDepuisPrevisions = (fournisseurId) => {
    setPrefillFournisseurId(fournisseurId)
    setPageActive('commandesFournisseur')
  }

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
      case 'dashboard':
        return <Dashboard
          produits={produits.donnees}
          clients={clients.donnees}
          fournisseurs={fournisseurs.donnees}
          commandes={commandes.donnees}
          mouvements={mouvements.donnees}
          categories={categories.donnees}
          setPageActive={setPageActive}
        />
      case 'produits':
        return <Produits
          produits={produits}
          mouvements={mouvements}
          fournisseurs={fournisseurs}
          categories={categories}
          familles={familles}
          chantiers={commandes.donnees}
          droits={droits}
        />
      case 'entrees':
        return <Entrees
          produits={produits}
          entrees={entrees}
          commandesFournisseur={commandesFournisseur}
          mouvements={mouvements}
          categories={categories}
          fournisseurs={fournisseurs}
          droits={droits}
        />
      case 'sortie':
        return <Sortie
          commandes={commandes}
          produits={produits}
          mouvements={mouvements}
          clients={clients.donnees}
          categories={categories}
          droits={droits}
        />
      case 'commandesFournisseur':
        return <CommandesFournisseur
          commandes={commandesFournisseur}
          entrees={entrees}
          fournisseurs={fournisseurs.donnees}
          droits={droits}
          prefillFournisseurId={prefillFournisseurId}
          onPrefillConsumed={() => setPrefillFournisseurId(null)}
        />
      case 'previsions':
        return <Previsions
          produits={produits.donnees}
          fournisseurs={fournisseurs.donnees}
          droits={droits}
          onCreerCommande={creerCommandeDepuisPrevisions}
        />
      case 'categories':
        return <Categories
          categories={categories}
          produits={produits}
          familles={familles}
          droits={droits}
        />
      case 'familles':
        return <Familles
          familles={familles}
          categories={categories}
          produits={produits}
          droits={droits}
        />
      case 'clients':
        return <Clients clients={clients} droits={droits} />
      case 'fournisseurs':
        return <Fournisseurs
          fournisseurs={fournisseurs}
          produits={produits.donnees}
          categories={categories.donnees}
          droits={droits}
        />
      case 'commandes':
        return <Chantiers
          commandes={commandes}
          produits={produits}
          mouvements={mouvements}
          clients={clients.donnees}
          categories={categories}
          droits={droits}
        />
      case 'parametres':
        return <Parametres
          userActif={userActif}
          produits={produits.donnees}
          fournisseurs={fournisseurs.donnees}
          clients={clients.donnees}
          mouvements={mouvements.donnees}
          categories={categories.donnees}
          familles={familles.donnees}
        />
      default:
        return <Dashboard
          produits={produits.donnees}
          clients={clients.donnees}
          fournisseurs={fournisseurs.donnees}
          commandes={commandes.donnees}
          mouvements={mouvements.donnees}
          categories={categories.donnees}
          setPageActive={setPageActive}
        />
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
        badges={{ previsions: nbPrevisions }}
      />
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#f0f4fa', minWidth:0, transition:'margin 0.25s' }}>
        <Header
          pageActive={pageActive}
          alertes={alertes}
          setPageActive={setPageActive}
          userActif={userActif}
          onLoginClick={() => setModalLoginVisible(true)}
          onLogout={handleLogout}
          produits={produits.donnees}
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
