import { auth, db, firebaseConfig } from './firebase'
import { initializeApp, deleteApp } from 'firebase/app'
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from 'firebase/auth'
import {
  collection, doc, getDocs, setDoc, updateDoc, deleteDoc,
} from 'firebase/firestore'

// ── Session locale (juste "qui est connecté sur cet appareil") ──
const CLE_SESSION = 'gstock_session'

// ── Collection Firestore des profils utilisateurs ────────────
// Le document id = l'UID Firebase Auth de l'utilisateur (pas un genId()).
// Ça permet de retrouver directement le profil (rôle, nom...) après un
// login, et plus tard d'écrire des règles Firestore basées sur l'UID.
const COLLECTION_USERS = 'mansa_utilisateurs'

// ── Visiteur anonyme (pas de session) ───────────────────────
export const VISITEUR_ANONYME = {
  id: 'visiteur',
  nom: 'Visiteur',
  prenom: '',
  email: '',
  role: 'visiteur',
}

// ── Droits par rôle (inchangé) ────────────────────────────────
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

// ── Session ────────────────────────────────────────────────
export function getSession() {
  try {
    const data = localStorage.getItem(CLE_SESSION)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function sauvegarderSession(user) {
  const session = { ...user, loginAt: new Date().toISOString() }
  localStorage.setItem(CLE_SESSION, JSON.stringify(session))
  return session
}

// ── Liste des profils (utilisée par la page Paramètres) ──────
// Async maintenant (lecture Firestore) — contrairement à l'ancienne
// version localStorage qui était synchrone.
export async function getUsers() {
  const snap = await getDocs(collection(db, COLLECTION_USERS))
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

// ── Connexion ────────────────────────────────────────────────
// Authentifie via Firebase Auth, puis va chercher le profil (rôle, nom...)
// dans Firestore à partir de l'UID retourné.
export async function login(email, motDePasse) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, motDePasse)
    const uid = cred.user.uid
    const profils = await getUsers()
    const profil = profils.find(u => u.id === uid)
    if (!profil || profil.actif === false) {
      await signOut(auth)
      return { succes: false, message: "Ce compte n'a pas (ou plus) accès à l'application." }
    }
    const session = sauvegarderSession({ ...profil, id: uid })
    return { succes: true, user: session }
  } catch {
    return { succes: false, message: 'Email ou mot de passe incorrect.' }
  }
}

export async function logout() {
  try { await signOut(auth) } catch { /* déjà déconnecté, sans importance */ }
  localStorage.removeItem(CLE_SESSION)
}

// ── Création d'un utilisateur (réservé aux admins) ────────────
// On crée le compte Firebase Auth via une INSTANCE FIREBASE SECONDAIRE :
// createUserWithEmailAndPassword connecte automatiquement le nouvel
// utilisateur sur l'instance qui appelle la fonction. En passant par une
// instance à part, on évite de déconnecter l'admin qui est en train de
// créer ce compte depuis la page Paramètres.
export async function ajouterUser(data) {
  if (!data.motDePasse || data.motDePasse.length < 6) {
    throw new Error('Le mot de passe doit contenir au moins 6 caractères.')
  }
  const appSecondaire = initializeApp(firebaseConfig, `secondaire-${Date.now()}`)
  // inMemoryPersistence : la session de cette instance secondaire ne
  // touche jamais IndexedDB/localStorage, pour ne pas entrer en conflit
  // avec la session déjà stockée de l'admin sur l'app principale.
  const authSecondaire = initializeAuth(appSecondaire, { persistence: inMemoryPersistence })
  try {
    const cred = await createUserWithEmailAndPassword(authSecondaire, data.email, data.motDePasse)
    const uid = cred.user.uid
    const profil = {
      nom:   data.nom,
      prenom: data.prenom || '',
      email: data.email,
      role:  data.role || 'visiteur',
      actif: data.actif !== false,
      dateCreation: new Date().toISOString(),
    }
    await setDoc(doc(db, COLLECTION_USERS, uid), profil)
    return { id: uid, ...profil }
  } finally {
    await signOut(authSecondaire).catch(() => {})
    await deleteApp(appSecondaire).catch(() => {})
  }
}

// ── Modification d'un utilisateur ────────────────────────────
// Ne touche que le profil Firestore (nom, rôle, statut...). L'email et le
// mot de passe d'un compte Firebase Auth existant ne peuvent pas être
// changés depuis ici : voir demanderReinitialisationMdp() ci-dessous
// pour le mot de passe.
export async function modifierUser(id, data) {
  const { motDePasse, email, ...profil } = data
  await updateDoc(doc(db, COLLECTION_USERS, id), profil)
}

// Envoie un email de réinitialisation de mot de passe à l'utilisateur —
// c'est la seule façon, côté client, de changer le mot de passe d'un
// compte qui n'est pas celui actuellement connecté.
export async function demanderReinitialisationMdp(email) {
  await sendPasswordResetEmail(auth, email)
}

// ── Suppression ────────────────────────────────────────────
// Retire le profil Firestore (donc l'accès à l'app). Le compte Firebase
// Auth lui-même doit être supprimé manuellement depuis la console
// Firebase (Authentication > Users) — l'app cliente n'a pas le droit de
// supprimer le compte Auth d'un autre utilisateur.
export async function supprimerUser(id) {
  await deleteDoc(doc(db, COLLECTION_USERS, id))
}
