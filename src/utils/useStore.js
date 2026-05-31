import { useState, useCallback } from 'react'

export function useStore(cle, defaut = []) {
  const [donnees, setDonnees] = useState(() => {
    try {
      const raw = localStorage.getItem(cle)
      return raw ? JSON.parse(raw) : defaut
    } catch {
      return defaut
    }
  })

  const sauvegarder = useCallback((nouvelles) => {
    setDonnees(nouvelles)
    localStorage.setItem(cle, JSON.stringify(nouvelles))
  }, [cle])

  const ajouter = useCallback((item) => {
    setDonnees(prev => {
      const updated = [...prev, item]
      localStorage.setItem(cle, JSON.stringify(updated))
      return updated
    })
  }, [cle])

  const modifier = useCallback((id, changes) => {
    setDonnees(prev => {
      const updated = prev.map(item => item.id === id ? { ...item, ...changes } : item)
      localStorage.setItem(cle, JSON.stringify(updated))
      return updated
    })
  }, [cle])

  const effacer = useCallback((id) => {
    setDonnees(prev => {
      const updated = prev.filter(item => item.id !== id)
      localStorage.setItem(cle, JSON.stringify(updated))
      return updated
    })
  }, [cle])

  return { donnees, ajouter, modifier, effacer, sauvegarder }
}
