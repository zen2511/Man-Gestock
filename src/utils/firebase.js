import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// Config de ton projet Firebase (man-gestock).
// Cette clé n'est pas un secret : la sécurité réelle des données se
// configure via les règles Firestore (Firestore Database > Règles),
// pas en la cachant.
export const firebaseConfig = {
  apiKey: "AIzaSyB4C9lbAWNWJLW7AdRWh5HXsuY_CxuUz_o",
  authDomain: "man-gestock.firebaseapp.com",
  projectId: "man-gestock",
  storageBucket: "man-gestock.firebasestorage.app",
  messagingSenderId: "39965002212",
  appId: "1:39965002212:web:b76d93d254f08752389ff1",
  measurementId: "G-Y2BTPBKMNF",
}

const app = initializeApp(firebaseConfig)

// Instance Firestore partagée par tout le reste de l'app.
// IMPORTANT : ce projet a une base Firestore nommée "default" (ID
// littéral) plutôt que la base spéciale réservée "(default)" que le SDK
// utilise par défaut. On doit donc préciser l'ID explicitement, sinon
// le SDK cherche une base qui n'existe pas et échoue silencieusement.
export const db = getFirestore(app, 'default')

// Instance Firebase Authentication (nécessaire pour que les règles
// Firestore puissent exiger request.auth != null).
export const auth = getAuth(app)
