// ── Clés localStorage ────────────────────────────────────────
const CLE_USERS   = 'gstock_users'
const CLE_SESSION = 'gstock_session'

// ── Visiteur anonyme (pas de session) ───────────────────────
export const VISITEUR_ANONYME = {
  id: 'visiteur',
  nom: 'Visiteur',
  prenom: '',
  email: '',
  role: 'visiteur',
}

// ── Utilisateurs par défaut ──────────────────────────────────
const USERS_DEFAUT = [
  {
    id: '1',
    nom: 'Admin',
    prenom: 'Principal',
    email: 'admin@mangestock.com',
    motDePasse: 'admin123',
    role: 'admin',
    actif: true,
    dateCreation: new Date().toISOString(),
  }
]

// ── Droits par rôle ──────────────────────────────────────────
export const DROITS = {
  admin: {
    label: 'Administrateur',
    couleur: '#ef4444',
    peut: {
      voirDashboard:       true,
      voirMagasin:         true,
      voirProduits:        true,
      voirClients:         true,
      voirFournisseurs:    true,
      voirCommandes:       true,
      voirParametres:      true,
      modifierProduits:    true,
      modifierClients:     true,
      modifierFournisseurs:true,
      modifierCommandes:   true,
      supprimerDonnees:    true,
      gererUtilisateurs:   true,
    }
  },
  gestionnaire: {
    label: 'Gestionnaire',
    couleur: '#f97316',
    peut: {
      voirDashboard:       true,
      voirMagasin:         true,
      voirProduits:        true,
      voirClients:         true,
      voirFournisseurs:    true,
      voirCommandes:       true,
      voirParametres:      false,
      modifierProduits:    true,
      modifierClients:     true,
      modifierFournisseurs:true,
      modifierCommandes:   true,
      supprimerDonnees:    false,
      gererUtilisateurs:   false,
    }
  },
  visiteur: {
    label: 'Visiteur',
    couleur: '#6b7280',
    peut: {
      voirDashboard:       true,
      voirMagasin:         true,
      voirProduits:        true,
      voirClients:         true,
      voirFournisseurs:    true,
      voirCommandes:       true,
      voirParametres:      false,
      modifierProduits:    false,
      modifierClients:     false,
      modifierFournisseurs:false,
      modifierCommandes:   false,
      supprimerDonnees:    false,
      gererUtilisateurs:   false,
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────
export function getUsers() {
  try {
    const data = localStorage.getItem(CLE_USERS)
    if (!data) {
      localStorage.setItem(CLE_USERS, JSON.stringify(USERS_DEFAUT))
      return USERS_DEFAUT
    }
    return JSON.parse(data)
  } catch {
    return USERS_DEFAUT
  }
}

export function saveUsers(users) {
  localStorage.setItem(CLE_USERS, JSON.stringify(users))
}

// Retourne la session stockée, ou null si pas connecté
export function getSession() {
  try {
    const data = localStorage.getItem(CLE_SESSION)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function login(email, motDePasse) {
  const users = getUsers()
  const user = users.find(
    u => u.email === email && u.motDePasse === motDePasse && u.actif
  )
  if (!user) return { succes: false, message: 'Email ou mot de passe incorrect.' }
  const session = { ...user, motDePasse: undefined, loginAt: new Date().toISOString() }
  localStorage.setItem(CLE_SESSION, JSON.stringify(session))
  return { succes: true, user: session }
}

export function logout() {
  localStorage.removeItem(CLE_SESSION)
}

export function ajouterUser(data) {
  const users = getUsers()
  const nouveau = {
    id: Date.now().toString(),
    ...data,
    actif: true,
    dateCreation: new Date().toISOString()
  }
  users.push(nouveau)
  saveUsers(users)
  return nouveau
}

export function modifierUser(id, data) {
  const users = getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return false
  users[idx] = { ...users[idx], ...data }
  saveUsers(users)
  return true
}

export function supprimerUser(id) {
  const users = getUsers()
  saveUsers(users.filter(u => u.id !== id))
}
