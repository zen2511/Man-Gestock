import { useState } from 'react'
import { genId } from '../utils/storage'
import { MODAL_CSS } from '../utils/modalStyles'

const FORM_VIDE = {
  chantierId: '',
  produitId: '',
  quantite: '',
  dateSortie: new Date().toISOString().slice(0, 10),
  note: '',
}

const FORM_CHANTIER_VIDE = {
  numeroAffaire: '', clientId: '', nomChantier: '',
  dateDebut: new Date().toISOString().slice(0, 10), dateFin: '',
}

// ── Helpers ─────────────────────────────────────────────────
const norm = (txt) =>
  String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0)

function Sortie({ commandes, produits, mouvements, clients: clientsArg = [], categories: categoriesArg = [], droits }) {
  // `commandes` = le store des chantiers (mêmes données que la page Chantiers).
  // Une sortie n'est jamais stockée à part : elle est ajoutée directement dans
  // le tableau `produits` du chantier choisi, exactement comme le fait déjà
  // la page Chantiers — cette page n'en est qu'une autre porte d'entrée.
  const donneesChantiers  = commandes?.donnees  || []
  const ajouterChantier   = commandes?.ajouter  || (() => {})
  const modifierChantier  = commandes?.modifier || (() => {})

  const modifierProduit  = produits?.modifier  || (() => {})
  const ajouterMouvement = mouvements?.ajouter  || (() => {})

  const clients = Array.isArray(clientsArg) ? clientsArg : (clientsArg.donnees || [])
  const clientNomDe = (id) => clients.find(c => c.id === id)?.nom || ''

  const categories = Array.isArray(categoriesArg) ? categoriesArg : (categoriesArg.donnees || [])
  const resoudreCat = (p) =>
    categories.find(c => c.id === p?.categorieId) ||
    categories.find(c => norm(c.nom) === norm(p?.categorie))

  const [recherche,          setRecherche]          = useState('')
  const [modal,              setModal]              = useState(false)
  const [ligneEditee,        setLigneEditee]        = useState(null) // { chantierId, idx, quantite }
  const [form,               setForm]               = useState(FORM_VIDE)

  const [rechercheChantier,  setRechercheChantier]  = useState('')
  const [creationChantier,   setCreationChantier]   = useState(false)
  const [formChantier,       setFormChantier]       = useState(FORM_CHANTIER_VIDE)

  const [rechercheProduit,   setRechercheProduit]   = useState('')
  const [panier,             setPanier]             = useState([]) // [{ produitId, reference, designation, prixUnitaire, quantite }] — construit pas à pas, uniquement pour un nouvel ajout
  const [produitEnCoursId,   setProduitEnCoursId]   = useState('') // produit actuellement sélectionné, pas encore ajouté au panier
  const [quantiteEnCours,    setQuantiteEnCours]    = useState('')

  // ── Styles (cohérents avec la page Entrées) ────────────────
  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13, marginBottom: 0,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }
  const sBtn = {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    background: '#254e88', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  }
  const sChampFige = {
    width: '100%', padding: '9px 13px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13,
    boxSizing: 'border-box', outline: 'none', background: '#f1f5f9', color: '#475569',
    cursor: 'not-allowed',
  }

  const chantierChoisi = donneesChantiers.find(c => c.id === form.chantierId) || null
  const produitChoisi  = produits.donnees.find(p => p.id === form.produitId) || null
  const catChoisie     = produitChoisi ? resoudreCat(produitChoisi) : null

  // Stock disponible : si on édite une ligne existante, la quantité déjà
  // sortie est restituée au calcul (elle n'est pas perdue tant qu'on n'a
  // pas validé la nouvelle quantité).
  const stockDisponible = (produitChoisi?.stock || 0) + (ligneEditee?.quantite || 0)

  // Qté stock (après sortie) = stock disponible − quantité saisie
  const qteStockApres = Math.max(0, stockDisponible - (Number(form.quantite) || 0))

  // ── Étape 1 : recherche / création d'un chantier ───────────
  const chantiersFiltres = donneesChantiers
    .filter(c => {
      if (!rechercheChantier) return true
      const cible = norm([c.numeroAffaire, c.nomChantier, c.clientNom || clientNomDe(c.clientId)].filter(Boolean).join(' '))
      return cible.includes(norm(rechercheChantier))
    })
    .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))

  const choisirChantier = (c) => {
    setForm(f => ({ ...f, chantierId: c.id }))
    setRechercheChantier('')
  }

  const changerChantier = () => {
    setForm(f => ({ ...f, chantierId: '', produitId: '' }))
    setRechercheChantier('')
    setRechercheProduit('')
  }

  const sauvegarderChantierRapide = () => {
    if (!formChantier.numeroAffaire.trim()) { alert('Indiquez un N° Affaire.'); return }
    if (!formChantier.clientId) { alert('Sélectionnez un client.'); return }
    if (!formChantier.nomChantier.trim()) { alert('Indiquez un nom de chantier.'); return }
    const doublon = donneesChantiers.find(c => norm(c.numeroAffaire) === norm(formChantier.numeroAffaire))
    if (doublon) { alert('Ce N° Affaire existe déjà.'); return }
    const client = clients.find(c => c.id === formChantier.clientId)
    const nouveau = {
      id: genId(),
      numeroAffaire: formChantier.numeroAffaire.trim(), clientId: formChantier.clientId, clientNom: client?.nom || '',
      nomChantier: formChantier.nomChantier.trim(), dateDebut: formChantier.dateDebut, dateFin: formChantier.dateFin,
      produits: [],
      dateCreation: new Date().toISOString(),
    }
    ajouterChantier(nouveau)
    setForm(f => ({ ...f, chantierId: nouveau.id }))
    setCreationChantier(false)
    setFormChantier(FORM_CHANTIER_VIDE)
  }

  // ── Étape 2 : recherche produit (remplace la liste déroulante) ──
  const resultatsProduits = rechercheProduit.trim()
    ? produits.donnees.filter(p =>
        norm(p.reference || '').includes(norm(rechercheProduit)) ||
        norm(p.designation || '').includes(norm(rechercheProduit))
      ).slice(0, 30)
    : produits.donnees.slice(0, 30)

  const produitEnCours = produits.donnees.find(p => p.id === produitEnCoursId) || null

  // Quantité déjà réservée dans le panier pour ce produit (pour ne pas dépasser le stock réel)
  const dejaDansPanier = panier.filter(l => l.produitId === produitEnCoursId).reduce((s, l) => s + l.quantite, 0)
  const stockDispoPourAjout = Math.max(0, (produitEnCours?.stock || 0) - dejaDansPanier)

  const selectionnerProduitPourAjout = (p) => {
    setProduitEnCoursId(p.id)
    setQuantiteEnCours('')
    setRechercheProduit('')
  }

  const changerProduitEnCours = () => {
    setProduitEnCoursId('')
    setQuantiteEnCours('')
  }

  const ajouterAuPanier = () => {
    const qte = Number(quantiteEnCours)
    if (!produitEnCours) { alert("Sélectionnez d'abord un produit."); return }
    if (!qte || qte <= 0) { alert('Indiquez une quantité valide.'); return }
    if (qte > stockDispoPourAjout) { alert(`Stock insuffisant (disponible : ${stockDispoPourAjout}).`); return }

    setPanier(p => {
      const idx = p.findIndex(l => l.produitId === produitEnCours.id)
      if (idx >= 0) {
        const maj = [...p]
        maj[idx] = { ...maj[idx], quantite: maj[idx].quantite + qte }
        return maj
      }
      return [...p, {
        produitId: produitEnCours.id,
        reference: produitEnCours.reference,
        designation: produitEnCours.designation,
        prixUnitaire: produitEnCours.prixUnitaire || 0,
        quantite: qte,
      }]
    })
    setProduitEnCoursId('')
    setQuantiteEnCours('')
    setRechercheProduit('')
  }

  const retirerDuPanier = (produitId) => setPanier(p => p.filter(l => l.produitId !== produitId))

  // ── Ouverture modal ─────────────────────────────────────────
  const ouvrirAjout = () => {
    setLigneEditee(null)
    setForm(FORM_VIDE)
    setRechercheChantier('')
    setRechercheProduit('')
    setPanier([])
    setProduitEnCoursId('')
    setQuantiteEnCours('')
    setCreationChantier(false)
    setFormChantier(FORM_CHANTIER_VIDE)
    setModal(true)
  }

  const ouvrirEdition = (ligne) => {
    setLigneEditee({ chantierId: ligne.chantierId, idx: ligne.idx, quantite: ligne.quantite || 0 })
    setForm({
      chantierId:  ligne.chantierId,
      produitId:   ligne.produitId,
      quantite:    ligne.quantite ?? '',
      dateSortie:  ligne.dateSortie || new Date().toISOString().slice(0, 10),
      note:        ligne.note || '',
    })
    setRechercheChantier('')
    setRechercheProduit('')
    setPanier([])
    setProduitEnCoursId('')
    setQuantiteEnCours('')
    setCreationChantier(false)
    setModal(true)
  }

  // ── Sauvegarde ───────────────────────────────────────────────
  const sauvegarder = () => {
    // Une sortie n'est possible que pour un chantier déjà sélectionné...
    const chantier = donneesChantiers.find(c => c.id === form.chantierId)
    if (!chantier) {
      alert("Sélectionnez d'abord un chantier (ou créez-en un).")
      return
    }

    // ── Édition d'une ligne existante : un seul produit, logique inchangée ──
    if (ligneEditee) {
      const produit = produits.donnees.find(p => p.id === form.produitId)
      if (!produit) {
        alert("Sélectionnez d'abord un produit existant dans le catalogue Produits.")
        return
      }
      const qte = Number(form.quantite)
      if (!qte || qte <= 0) {
        alert('Indiquez une quantité valide.')
        return
      }
      const delta = qte - (ligneEditee.quantite || 0) // > 0 : on sort plus de stock ; < 0 : on en restitue
      if (delta > 0 && delta > (produit.stock || 0)) {
        alert(`Stock insuffisant (disponible : ${produit.stock || 0}).`)
        return
      }
      if (delta !== 0) {
        modifierProduit(produit.id, { stock: (produit.stock || 0) - delta })
        ajouterMouvement({
          id: genId(), produitId: produit.id, produitNom: produit.designation,
          type: delta > 0 ? 'sortie' : 'entree', quantite: Math.abs(delta),
          note: `Ajustement sortie — chantier ${chantier.numeroAffaire}`,
          date: new Date().toISOString(),
        })
      }
      const produitsMaj = (chantier.produits || []).map((l, i) =>
        i === ligneEditee.idx ? { ...l, quantite: qte, dateSortie: form.dateSortie, note: form.note } : l
      )
      modifierChantier(chantier.id, { produits: produitsMaj })
      setModal(false)
      return
    }

    // ── Nouvel ajout : on traite le panier construit pas à pas ──
    if (panier.length === 0) {
      alert('Ajoutez au moins un produit au panier.')
      return
    }

    const lignes = panier.map(l => ({ ...l, produit: produits.donnees.find(p => p.id === l.produitId) }))
    const introuvable = lignes.find(l => !l.produit)
    if (introuvable) {
      alert(`Le produit "${introuvable.designation}" n'existe plus dans le catalogue.`)
      return
    }
    const enRupture = lignes.find(l => l.quantite > (l.produit.stock || 0))
    if (enRupture) {
      alert(`Stock insuffisant pour ${enRupture.produit.designation} (disponible : ${enRupture.produit.stock || 0}).`)
      return
    }

    const nouvellesLignes = lignes.map(({ produit, quantite }) => {
      modifierProduit(produit.id, { stock: (produit.stock || 0) - quantite })
      ajouterMouvement({
        id: genId(), produitId: produit.id, produitNom: produit.designation,
        type: 'sortie', quantite,
        note: form.note || `Chantier ${chantier.numeroAffaire}`,
        date: form.dateSortie ? new Date(form.dateSortie).toISOString() : new Date().toISOString(),
      })
      return {
        produitId:     produit.id,
        reference:     produit.reference,
        designation:   produit.designation,
        categorieId:   produit.categorieId,
        categorie:     produit.categorie,
        prixUnitaire:  produit.prixUnitaire || 0, // figé au moment de la sortie
        quantite,
        dateSortie:    form.dateSortie,
        note:          form.note,
      }
    })
    modifierChantier(chantier.id, { produits: [...(chantier.produits || []), ...nouvellesLignes] })
    setPanier([])
    setModal(false)
  }

  const supprimerLigne = (ligne) => {
    if (!window.confirm('Supprimer cette sortie ? Le stock du produit sera restitué.')) return
    const chantier = donneesChantiers.find(c => c.id === ligne.chantierId)
    const produit  = produits.donnees.find(p => p.id === ligne.produitId)
    if (produit) modifierProduit(produit.id, { stock: (produit.stock || 0) + (ligne.quantite || 0) })
    if (chantier) {
      const produitsMaj = (chantier.produits || []).filter((_, i) => i !== ligne.idx)
      modifierChantier(chantier.id, { produits: produitsMaj })
    }
    ajouterMouvement({
      id: genId(), produitId: ligne.produitId, produitNom: ligne.designation,
      type: 'entree', quantite: ligne.quantite || 0,
      note: `Retrait sortie — chantier ${ligne.chantierNumero}`,
      date: new Date().toISOString(),
    })
  }

  // ── Liste à plat de toutes les sorties, tous chantiers confondus ──
  const lignesSortie = donneesChantiers.flatMap(c =>
    (c.produits || []).map((l, idx) => ({
      ...l, idx,
      chantierId:     c.id,
      chantierNumero: c.numeroAffaire,
      chantierNom:    c.nomChantier,
      clientNom:      c.clientNom || clientNomDe(c.clientId),
    }))
  )

  const lignesFiltrees = lignesSortie
    .filter(l => {
      if (!recherche) return true
      const cible = norm([l.reference, l.designation, l.chantierNumero, l.chantierNom, l.clientNom].filter(Boolean).join(' '))
      return cible.includes(norm(recherche))
    })
    .sort((a, b) => new Date(b.dateSortie || 0) - new Date(a.dateSortie || 0))

  const quantiteTotale = lignesSortie.reduce((s, l) => s + (Number(l.quantite) || 0), 0)
  const sortiesCeMois = (() => {
    const debut = new Date(); debut.setDate(1); debut.setHours(0, 0, 0, 0)
    return lignesSortie.filter(l => l.dateSortie && new Date(l.dateSortie) >= debut).length
  })()

  return (
    <div>
      <style>{MODAL_CSS}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
            Sorties ({lignesSortie.length})
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Produits sortis du stock pour un chantier</p>
        </div>
        {droits?.modifierCommandes !== false && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={ouvrirAjout} style={sBtn}>+ Ajouter</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #0f2847' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Total sorties</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2847' }}>{lignesSortie.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Quantité totale sortie</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{fmt(quantiteTotale)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #1565c0' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Sorties ce mois</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1565c0' }}>{sortiesCeMois}</div>
        </div>
      </div>

      {/* Recherche (tableau) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher par référence, désignation, chantier ou client..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 0, flex: 1, minWidth: 200, maxWidth: 360 }}
        />
      </div>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Date', 'N° Affaire', 'Chantier', 'Client', 'Réf.', 'Désignation', 'Quantité', 'P.U. (figé)', 'Total', 'Note', 'Action'].map(col => (
                <th key={col} style={{
                  padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700,
                  color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
                  borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap',
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lignesFiltrees.length === 0 ? (
              <tr><td colSpan={11} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune sortie enregistrée
              </td></tr>
            ) : (
              lignesFiltrees.map((l) => (
                <tr key={`${l.chantierId}-${l.idx}`} style={{ borderTop: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                    {l.dateSortie ? new Date(l.dateSortie).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 700, color: '#0f2847', whiteSpace: 'nowrap' }}>
                    {l.chantierNumero || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.chantierNom || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.clientNom || '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.reference || '—'}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847', minWidth: 160 }}>{l.designation || '—'}</td>
                  <td style={{ padding: '11px 14px', fontWeight: 700, color: '#dc2626', fontSize: 15 }}>-{fmt(l.quantite)}</td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                    {l.prixUnitaire ? fmt(l.prixUnitaire) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                    {l.prixUnitaire ? fmt((l.quantite || 0) * l.prixUnitaire) : '—'}
                  </td>
                  <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {l.note || '—'}
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {droits?.modifierCommandes !== false && (
                        <button onClick={() => ouvrirEdition(l)}
                          style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>
                          ✏️
                        </button>
                      )}
                      {droits?.supprimerDonnees !== false && (
                        <button onClick={() => supprimerLigne(l)}
                          style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ajout / édition d'une sortie ── */}
      {modal && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="mg-card mg-card-scroll" style={{ maxWidth: 560 }}>
            <div className="mg-header">
              <div>
                <div className="mg-title">{ligneEditee ? 'Modifier la sortie' : 'Nouvelle sortie de stock'}</div>
                <div className="mg-subtitle">Toujours rattachée à un chantier</div>
              </div>
              <button className="mg-close" onClick={() => setModal(false)}>×</button>
            </div>

            <div className="mg-card-body">

              {/* ── Étape 1 : chantier obligatoire ── */}
              {!form.chantierId ? (
                <div className="mg-field" style={{ position: 'relative' }}>
                  <label className="mg-label">Chantier *</label>
                  {!creationChantier ? (
                    <>
                      <input
                        className="mg-input"
                        placeholder="Rechercher par N° Affaire, chantier ou client..."
                        value={rechercheChantier}
                        onChange={e => setRechercheChantier(e.target.value)}
                        autoFocus
                      />
                      <div style={{
                        marginTop: 6, border: '1px solid #e2e8f0', borderRadius: 8,
                        maxHeight: 220, overflowY: 'auto',
                      }}>
                        {chantiersFiltres.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>Aucun chantier trouvé</div>
                        ) : chantiersFiltres.map(c => (
                          <div
                            key={c.id}
                            onClick={() => choisirChantier(c)}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                          >
                            <div style={{ fontWeight: 600, color: '#0f2847', fontSize: 13 }}>{c.numeroAffaire} — {c.nomChantier}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                              {c.clientNom || clientNomDe(c.clientId) || '—'}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setCreationChantier(true)} style={{ marginTop: 8, border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        + Nouveau chantier
                      </button>
                    </>
                  ) : (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginTop: 6 }}>
                      <div className="mg-field-grid-2">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">N° Affaire *</label>
                          <input className="mg-input mg-input-no-mb" value={formChantier.numeroAffaire}
                            onChange={e => setFormChantier({ ...formChantier, numeroAffaire: e.target.value })}
                            placeholder="Ex: AFF-0001" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Client *</label>
                          <select className="mg-select mg-select-no-mb" value={formChantier.clientId}
                            onChange={e => setFormChantier({ ...formChantier, clientId: e.target.value })}>
                            <option value="">Sélectionner un client</option>
                            {clients.map(c => (
                              <option key={c.id} value={c.id}>{c.nom}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mg-field" style={{ marginTop: 10 }}>
                        <label className="mg-label">Nom chantier *</label>
                        <input className="mg-input mg-input-no-mb" value={formChantier.nomChantier}
                          onChange={e => setFormChantier({ ...formChantier, nomChantier: e.target.value })}
                          placeholder="Ex: Villa Bastos — vitrage" />
                      </div>
                      <div className="mg-field-grid-2" style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Date début</label>
                          <input type="date" className="mg-input mg-input-no-mb" value={formChantier.dateDebut}
                            onChange={e => setFormChantier({ ...formChantier, dateDebut: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Date fin</label>
                          <input type="date" className="mg-input mg-input-no-mb" value={formChantier.dateFin}
                            onChange={e => setFormChantier({ ...formChantier, dateFin: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                        <button className="mg-btn-ghost" onClick={() => { setCreationChantier(false); setFormChantier(FORM_CHANTIER_VIDE) }}>Annuler</button>
                        <button className="mg-btn-primary" onClick={sauvegarderChantierRapide}>Créer et sélectionner</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2847' }}>
                        {chantierChoisi?.numeroAffaire || '—'} — {chantierChoisi?.nomChantier || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {chantierChoisi?.clientNom || clientNomDe(chantierChoisi?.clientId) || '—'}
                      </div>
                    </div>
                    {!ligneEditee && (
                      <button onClick={changerChantier} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ↺ Changer de chantier
                      </button>
                    )}
                  </div>

                  {/* ── Étape 2 : produit(s), un par un dans un panier ── */}
                  {!ligneEditee ? (
                    <div className="mg-field" style={{ position: 'relative' }}>
                      <label className="mg-label">Ajouter un produit *</label>

                      {!produitEnCours ? (
                        <>
                          <input
                            className="mg-input"
                            placeholder="Rechercher par nom ou référence..."
                            value={rechercheProduit}
                            onChange={e => setRechercheProduit(e.target.value)}
                            autoFocus
                          />
                          <div style={{ marginTop: 6, border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 220, overflowY: 'auto' }}>
                            {resultatsProduits.length === 0 ? (
                              <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>Aucun produit trouvé</div>
                            ) : resultatsProduits.map(p => (
                              <div key={p.id} onClick={() => selectionnerProduitPourAjout(p)}
                                style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <div style={{ fontWeight: 600, color: '#0f2847', fontSize: 13 }}>{p.reference || '—'}</div>
                                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.designation || '—'}</div>
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: (p.stock || 0) > 0 ? '#16a34a' : '#dc2626', whiteSpace: 'nowrap' }}>
                                  Stock : {fmt(p.stock || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2847' }}>{produitEnCours.reference} — {produitEnCours.designation}</div>
                              <div style={{ fontSize: 11, color: '#64748b' }}>P.U. : {fmt(produitEnCours.prixUnitaire)} FCFA · Stock dispo : {stockDispoPourAjout}</div>
                            </div>
                            <button onClick={changerProduitEnCours} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                              ↺ Changer
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 4 }}>Quantité</label>
                              <input type="number" min="1" max={stockDispoPourAjout} className="mg-input mg-input-no-mb" value={quantiteEnCours}
                                onChange={e => setQuantiteEnCours(e.target.value)} placeholder="0" autoFocus />
                            </div>
                            <button onClick={ajouterAuPanier} className="mg-btn-primary" style={{ whiteSpace: 'nowrap' }}>+ Ajouter au panier</button>
                          </div>
                        </div>
                      )}

                      {/* ── Panier : produits déjà ajoutés, modifiable avant validation ── */}
                      {panier.length > 0 && (
                        <div style={{ marginTop: 16 }}>
                          <div className="mg-label" style={{ marginBottom: 6 }}>Panier ({panier.length})</div>
                          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ background: '#f8fafc' }}>
                                  {['Réf.', 'Désignation', 'Qté', 'P.U.', 'Sous-total', ''].map(col => (
                                    <th key={col} style={{ padding: '7px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {panier.map(l => (
                                  <tr key={l.produitId} style={{ borderTop: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '7px 10px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.reference || '—'}</td>
                                    <td style={{ padding: '7px 10px', fontSize: 13, color: '#334155' }}>{l.designation}</td>
                                    <td style={{ padding: '7px 10px', fontSize: 13, fontWeight: 700, color: '#0f2847', whiteSpace: 'nowrap' }}>{fmt(l.quantite)}</td>
                                    <td style={{ padding: '7px 10px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>{fmt(l.prixUnitaire)} FCFA</td>
                                    <td style={{ padding: '7px 10px', fontSize: 12, fontWeight: 700, color: '#0f2847', whiteSpace: 'nowrap' }}>{fmt(l.prixUnitaire * l.quantite)} FCFA</td>
                                    <td style={{ padding: '7px 10px' }}>
                                      <button onClick={() => retirerDuPanier(l.produitId)} style={{ border: 'none', background: '#fee2e2', color: '#dc2626', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="mg-field-grid-2" style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Date de sortie</label>
                          <input type="date" className="mg-input mg-input-no-mb" value={form.dateSortie}
                            onChange={e => setForm({ ...form, dateSortie: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Note</label>
                          <input className="mg-input mg-input-no-mb" value={form.note}
                            onChange={e => setForm({ ...form, note: e.target.value })}
                            placeholder="Ex: Bon de sortie n°..." />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Section — Identification (figée) */}
                      <div className="mg-divider">
                        <div className="mg-divider-line" /><span className="mg-divider-label">Identification</span><div className="mg-divider-line" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Référence</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.reference || '—'} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Désignation</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.designation || '—'} disabled />
                        </div>
                      </div>
                      <div className="mg-field-grid-2" style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Teinte</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.ral || '—'} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Catégorie</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={catChoisie?.nom || produitChoisi?.categorie || '—'} disabled />
                        </div>
                      </div>

                      {/* Section — Classification (figée) */}
                      <div className="mg-divider" style={{ marginTop: 6 }}>
                        <div className="mg-divider-line" /><span className="mg-divider-label">Classification</span><div className="mg-divider-line" />
                      </div>
                      <div className="mg-field">
                        <label className="mg-label">Fournisseur</label>
                        <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.fournisseurNom || '—'} disabled />
                      </div>

                      {/* Section — Stock & Tarification (figée) */}
                      <div className="mg-divider" style={{ marginTop: 6 }}>
                        <div className="mg-divider-line" /><span className="mg-divider-label">Stock & Tarification</span><div className="mg-divider-line" />
                      </div>
                      <div className="mg-field-grid-3">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Unité vente</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.uniteVente || produitChoisi?.unite || '—'} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Cond.</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.conditionnement || '—'} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Unité matière</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.uniteMatiere || '—'} disabled />
                        </div>
                      </div>
                      <div className="mg-field-grid-3" style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Qté. base</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.qteBase || 0} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Qté stock (disponible)</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={fmt(stockDisponible)} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">P.U.</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.prixUnitaire ? fmt(produitChoisi.prixUnitaire) : 0} disabled />
                          <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Prix actuellement au catalogue</span>
                        </div>
                      </div>

                      {/* Section — Sortie (rien n'est figé ici) */}
                      <div className="mg-divider" style={{ marginTop: 6 }}>
                        <div className="mg-divider-line" /><span className="mg-divider-label">Sortie</span><div className="mg-divider-line" />
                      </div>
                      <div className="mg-field-grid-3">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Quantité *</label>
                          <input type="number" min="1" max={stockDisponible} className="mg-input mg-input-no-mb" value={form.quantite}
                            onChange={e => setForm({ ...form, quantite: e.target.value })} placeholder="0" />
                          <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Disponible : {fmt(stockDisponible)}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Qté stock (après sortie)</label>
                          <input className="mg-input-no-mb" style={sChampFige} value={fmt(qteStockApres)} disabled />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Date de sortie</label>
                          <input type="date" className="mg-input mg-input-no-mb" value={form.dateSortie}
                            onChange={e => setForm({ ...form, dateSortie: e.target.value })} />
                        </div>
                      </div>
                      <div className="mg-field" style={{ marginTop: 12 }}>
                        <label className="mg-label">Note</label>
                        <input className="mg-input mg-input-no-mb" value={form.note}
                          onChange={e => setForm({ ...form, note: e.target.value })}
                          placeholder="Ex: Bon de sortie n°..." />
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Actions */}
              <div className="mg-actions mg-actions-border" style={{ marginTop: 18 }}>
                <button className="mg-btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button className="mg-btn-primary" onClick={sauvegarder}
                  disabled={!form.chantierId || (ligneEditee ? !form.produitId : panier.length === 0)}>
                  {ligneEditee ? 'Enregistrer les modifications' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sortie
