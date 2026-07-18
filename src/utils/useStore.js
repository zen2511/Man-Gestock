import { useState, useEffect, useCallback, useRef } from 'react'
import { db } from './firebase'
import {
  collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch,
} from 'firebase/firestore'

// Même interface qu'avant (donnees, ajouter, modifier, effacer,
// sauvegarder) — aucune page (Produits, Entrees, Categories...) n'a
// besoin d'être modifiée. Seule la source de vérité change :
// localStorage (par PC) → Firestore (partagé entre tous les PC).
export function useStore(cle, defaut = []) {
  const [donnees, setDonnees]   = useState(defaut)
  const [charge,  setCharge]    = useState(false)
  const donneesRef = useRef(defaut)

  useEffect(() => {
    const ref = collection(db, cle)
    const desabonner = onSnapshot(
      ref,
      snapshot => {
        const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        donneesRef.current = docs
        setDonnees(docs)
        setCharge(true)
      },
      erreur => {
        console.error(`Firestore (${cle}) — erreur de lecture :`, erreur)
      }
    )
    return () => desabonner()
  }, [cle])

  // item doit déjà contenir son id (genId() est toujours appelé par les
  // pages avant d'appeler ajouter) — on l'utilise comme identifiant du
  // document Firestore, donc les id restent identiques partout ailleurs
  // dans l'app (produit.id, categorieId, etc.).
  const ajouter = useCallback((item) => {
    const id = item.id ?? (Date.now().toString(36) + Math.random().toString(36).slice(2))
    setDoc(doc(db, cle, id), { ...item, id }).catch(erreur => {
      console.error(`Firestore (${cle}) — erreur d'ajout :`, erreur)
    })
  }, [cle])

  const modifier = useCallback((id, changes) => {
    updateDoc(doc(db, cle, id), changes).catch(erreur => {
      console.error(`Firestore (${cle}) — erreur de modification :`, erreur)
    })
  }, [cle])

  const effacer = useCallback((id) => {
    deleteDoc(doc(db, cle, id)).catch(erreur => {
      console.error(`Firestore (${cle}) — erreur de suppression :`, erreur)
    })
  }, [cle])

  // Remplace en une fois tout le contenu de la collection par le tableau
  // fourni (ajoute/modifie les éléments présents, supprime ceux qui ont
  // disparu). Utilisé plus rarement que ajouter/modifier/effacer.
  const sauvegarder = useCallback((nouvelles) => {
    const batch = writeBatch(db)
    const idsNouveaux = new Set(nouvelles.map(n => n.id))
    donneesRef.current.forEach(item => {
      if (!idsNouveaux.has(item.id)) batch.delete(doc(db, cle, item.id))
    })
    nouvelles.forEach(item => {
      batch.set(doc(db, cle, item.id), item)
    })
    batch.commit().catch(erreur => {
      console.error(`Firestore (${cle}) — erreur d'enregistrement global :`, erreur)
    })
  }, [cle])

  return { donnees, ajouter, modifier, effacer, sauvegarder, charge }
}
