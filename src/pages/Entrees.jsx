import { useState } from 'react'
import { genId } from '../utils/storage'
import { MODAL_CSS } from '../utils/modalStyles'

const FORM_VIDE = {
  commandeFournisseurId: '',
  produitId: '',
  nouvelleQte: '', pcp: '', pur: '',
  dateEntree: new Date().toISOString().slice(0, 10), note: '',
}

const FORM_COMMANDE_VIDE = {
  numero: '', numeroFacture: '', fournisseurId: '', dateCommande: new Date().toISOString().slice(0, 10),
}

// ── Helpers ─────────────────────────────────────────────────
const norm = (txt) =>
  String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0)

function Entrees({ produits, entrees, mouvements, commandesFournisseur, categories: categoriesArg = [], fournisseurs: fournisseursArg = [], droits }) {
  const { donnees, ajouter, modifier, effacer } = entrees
  const modifierProduit  = produits?.modifier  || (() => {})
  const ajouterMouvement = mouvements?.ajouter  || (() => {})

  const categories   = Array.isArray(categoriesArg)   ? categoriesArg   : (categoriesArg.donnees   || [])
  const fournisseurs = Array.isArray(fournisseursArg) ? fournisseursArg : (fournisseursArg.donnees || [])

  // ── Commandes fournisseur — une entrée doit toujours être rattachée à
  // une commande existante (traçabilité de la réception). ─────────────
  const listeCommandes  = commandesFournisseur?.donnees || []
  const ajouterCommande = commandesFournisseur?.ajouter  || (() => {})
  const modifierCommande = commandesFournisseur?.modifier || (() => {})

  const [recherche,        setRecherche]        = useState('')
  const [modal,            setModal]            = useState(false)
  const [entreeEditee,     setEntreeEditee]     = useState(null)
  const [form,             setForm]             = useState(FORM_VIDE)
  const [rechercheProduit, setRechercheProduit] = useState('')
  const [resultatsOuverts, setResultatsOuverts] = useState(false)
  const [rechercheCommande,   setRechercheCommande]   = useState('')
  const [creationCommande,    setCreationCommande]    = useState(false)
  const [formCommande,        setFormCommande]        = useState(FORM_COMMANDE_VIDE)

  // ── Styles (cohérents avec la page Produits) ───────────────
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

  // ── Résolution catégorie ────────────────────────────────────
  const resoudreCat = (p) =>
    categories.find(c => c.id === p?.categorieId) ||
    categories.find(c => norm(c.nom) === norm(p?.categorie))

  const commandeChoisie = listeCommandes.find(c => c.id === form.commandeFournisseurId) || null

  // ── Recherche produit (remplace la liste déroulante) ───────
  // Une fois une commande choisie, on ne propose que les produits du
  // fournisseur de cette commande — une entrée doit rester cohérente avec
  // le fournisseur de la commande à laquelle elle est rattachée.
  // Le filtre porte UNIQUEMENT sur la référence (pas la désignation).
  const resultatsProduits = rechercheProduit.trim()
    ? produits.donnees
        .filter(p => {
          if (commandeChoisie && p.fournisseurId && commandeChoisie.fournisseurId && p.fournisseurId !== commandeChoisie.fournisseurId) return false
          return norm(p.reference).includes(norm(rechercheProduit))
        })
        .slice(0, 8)
    : []

  const choisirCommande = (c) => {
    setForm(f => ({ ...f, commandeFournisseurId: c.id }))
    setRechercheCommande('')
  }

  const changerCommande = () => {
    setForm(f => ({ ...f, commandeFournisseurId: '', produitId: '' }))
    setRechercheCommande('')
    setRechercheProduit('')
  }

  const commandesFiltrees = listeCommandes
    .filter(c => {
      if (!rechercheCommande) return true
      const cible = norm([c.numero, c.fournisseurNom].filter(Boolean).join(' '))
      return cible.includes(norm(rechercheCommande))
    })
    .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))

  const sauvegarderCommandeRapide = () => {
    if (!formCommande.numero.trim()) { alert('Indiquez un numéro de commande.'); return }
    if (!formCommande.fournisseurId) { alert('Sélectionnez un fournisseur.'); return }
    const doublon = listeCommandes.find(c => norm(c.numero) === norm(formCommande.numero))
    if (doublon) { alert('Ce numéro de commande existe déjà.'); return }
    const fourn = fournisseurs.find(f => f.id === formCommande.fournisseurId)
    const nouvelle = {
      id: genId(), numero: formCommande.numero.trim(), numeroFacture: formCommande.numeroFacture.trim(),
      fournisseurId: formCommande.fournisseurId,
      fournisseurNom: fourn?.nom || '', dateCommande: formCommande.dateCommande,
      statut: 'en_attente', note: '', dateCreation: new Date().toISOString(),
    }
    ajouterCommande(nouvelle)
    setForm(f => ({ ...f, commandeFournisseurId: nouvelle.id }))
    setCreationCommande(false)
    setFormCommande(FORM_COMMANDE_VIDE)
  }

  const choisirProduit = (p) => {
    setForm(f => ({ ...f, produitId: p.id }))
    setRechercheProduit('')
    setResultatsOuverts(false)
  }

  const changerProduit = () => {
    setForm(f => ({ ...f, produitId: '' }))
    setRechercheProduit('')
  }

  const produitChoisi = produits.donnees.find(p => p.id === form.produitId)
  const catChoisie     = produitChoisi ? resoudreCat(produitChoisi) : null

  // ── Calcul automatique du P.C.P (prix pondéré) ───────────────
  // P.C.P = (PU × Qté stock actuelle + PUR × nouvelle qté) / (Qté stock actuelle + nouvelle qté)
  // PU              = ancien prix unitaire, actuellement au catalogue (produit.prixUnitaire)
  // Qté stock actuelle = quantité déjà en stock avant cette entrée (produit.stock)
  //   ⚠️ ce n'est PAS le champ "Qté. base" (produit.qteBase), qui est une
  //   quantité de référence indépendante du stock réel et ne doit jamais
  //   servir au calcul du prix pondéré.
  // PUR             = prix de cette réception, saisi dans le formulaire (form.pur)
  const calculerPCP = (pu, stockActuel, pur, nouvelleQte) => {
    const diviseur = (Number(stockActuel) || 0) + (Number(nouvelleQte) || 0)
    if (diviseur <= 0) return Number(pur) || 0
    return ((Number(pu) || 0) * (Number(stockActuel) || 0) + (Number(pur) || 0) * (Number(nouvelleQte) || 0)) / diviseur
  }

  const pcpAuto = calculerPCP(
    produitChoisi?.prixUnitaire,
    produitChoisi?.stock,
    form.pur,
    form.nouvelleQte,
  )

  // Qté stock (après entrée) = qté stock actuelle + nouvelle qté
  const qteStockApres = (Number(produitChoisi?.stock) || 0) + (Number(form.nouvelleQte) || 0)

  // ── Ouverture modal ─────────────────────────────────────────
  const ouvrirAjout = () => {
    setEntreeEditee(null)
    setForm(FORM_VIDE)
    setRechercheProduit('')
    setRechercheCommande('')
    setCreationCommande(false)
    setFormCommande(FORM_COMMANDE_VIDE)
    setModal(true)
  }

  const ouvrirEdition = (e) => {
    setEntreeEditee(e)
    setForm({
      commandeFournisseurId: e.commandeFournisseurId || '',
      produitId:    e.produitId,
      nouvelleQte:  e.nouvelleQte ?? e.quantite ?? '',
      pcp:          e.pcp ?? '',
      pur:          e.pur ?? e.prixUnitaire ?? '',
      dateEntree:   e.dateEntree || new Date().toISOString().slice(0, 10),
      note:         e.note || '',
    })
    setRechercheProduit('')
    setRechercheCommande('')
    setCreationCommande(false)
    setModal(true)
  }

  // ── Sauvegarde ───────────────────────────────────────────────
  const sauvegarder = () => {
    // Une entrée doit toujours être rattachée à une commande fournisseur
    // existante — c'est cette commande qui justifie la réception.
    const commande = listeCommandes.find(c => c.id === form.commandeFournisseurId)
    if (!commande) {
      alert("Sélectionnez d'abord une commande fournisseur (ou créez-en une).")
      return
    }
    // Une entrée n'est possible que pour un produit qui existe déjà dans
    // le catalogue Produits — on ne saisit jamais un produit "à la volée"
    // depuis cette page.
    const produit = produits.donnees.find(p => p.id === form.produitId)
    if (!produit) {
      alert("Sélectionnez d'abord un produit existant dans le catalogue Produits.")
      return
    }
    const qte = Number(form.nouvelleQte)
    if (!qte || qte <= 0) {
      alert('Indiquez une nouvelle quantité valide.')
      return
    }
    const pur = form.pur !== '' ? Number(form.pur) : (produit.prixUnitaire || 0)
    // P.C.P calculé automatiquement — le prix unitaire du produit au
    // catalogue (P.U.) est mis à jour avec cette moyenne pondérée, jamais
    // remplacé directement par le P.U.R. brut de la réception.
    const pcp = calculerPCP(produit.prixUnitaire, produit.stock, pur, qte)

    if (entreeEditee) {
      // Réajuste le stock du produit selon l'écart entre l'ancienne et la
      // nouvelle quantité de cette entrée.
      const delta = qte - (entreeEditee.nouvelleQte ?? entreeEditee.quantite ?? 0)
      modifierProduit(produit.id, { stock: Math.max(0, (produit.stock || 0) + delta), prixUnitaire: pcp })
      modifier(entreeEditee.id, {
        commandeFournisseurId: commande.id, numeroCommande: commande.numero, numeroFacture: commande.numeroFacture,
        nouvelleQte: qte, pcp, pur,
        dateEntree: form.dateEntree, note: form.note,
      })
    } else {
      modifierProduit(produit.id, { stock: (produit.stock || 0) + qte, prixUnitaire: pcp })
      ajouter({
        id: genId(),
        commandeFournisseurId: commande.id,
        numeroCommande:  commande.numero,
        numeroFacture:   commande.numeroFacture,
        produitId:       produit.id,
        // ── Données figées, reprises du produit au moment de l'entrée ──
        reference:       produit.reference,
        designation:     produit.designation,
        ral:             produit.ral,
        categorieId:     produit.categorieId,
        categorie:       produit.categorie,
        fournisseurId:   produit.fournisseurId,
        fournisseurNom:  produit.fournisseurNom,
        uniteVente:      produit.uniteVente || produit.unite,
        conditionnement: produit.conditionnement,
        uniteMatiere:    produit.uniteMatiere,
        qteBase:         produit.qteBase,
        qteStockAvant:   produit.stock || 0,
        // ── Données de cette nouvelle entrée, seules éditables ──
        nouvelleQte:  qte,
        pcp,
        pur,
        dateEntree:   form.dateEntree,
        note:         form.note,
        dateCreation: new Date().toISOString(),
      })
      ajouterMouvement({
        id: genId(), produitId: produit.id, produitNom: produit.designation,
        type: 'entree', quantite: qte,
        note: form.note || 'Entrée de stock',
        date: form.dateEntree ? new Date(form.dateEntree).toISOString() : new Date().toISOString(),
      })
      // Une commande qui reçoit sa première entrée passe automatiquement
      // de "En attente" à "Partiellement reçue" (le passage à "Reçue" reste
      // manuel depuis la page Commandes fournisseur, faute de lignes prévues).
      if (commande.statut === 'en_attente') {
        modifierCommande(commande.id, { statut: 'partiellement_recue' })
      }
    }
    setModal(false)
  }

  const supprimerEntree = (e) => {
    if (!window.confirm('Supprimer cette entrée ? Le stock du produit sera réajusté en conséquence.')) return
    const produit = produits.donnees.find(p => p.id === e.produitId)
    if (produit) modifierProduit(produit.id, { stock: Math.max(0, (produit.stock || 0) - (e.nouvelleQte ?? e.quantite ?? 0)) })
    effacer(e.id)
  }

  // ── Filtrage / stats ────────────────────────────────────────
  const entreesFiltrees = donnees
    .filter(e => {
      if (!recherche) return true
      const cible = norm([e.reference, e.designation, e.fournisseurNom].filter(Boolean).join(' '))
      return cible.includes(norm(recherche))
    })
    .sort((a, b) => new Date(b.dateEntree || b.dateCreation || 0) - new Date(a.dateEntree || a.dateCreation || 0))

  const quantiteTotale = donnees.reduce((s, e) => s + (Number(e.nouvelleQte ?? e.quantite) || 0), 0)
  const entreesCeMois = (() => {
    const debut = new Date(); debut.setDate(1); debut.setHours(0, 0, 0, 0)
    return donnees.filter(e => e.dateEntree && new Date(e.dateEntree) >= debut).length
  })()

  return (
    <div>
      <style>{MODAL_CSS}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
            Entrées ({donnees.length})
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Réceptions de stock sur des produits existants</p>
        </div>
        {droits?.modifierProduits !== false && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={ouvrirAjout} style={sBtn}>+ Ajouter</button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #0f2847' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Total entrées</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2847' }}>{donnees.length}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Quantité totale reçue</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>{fmt(quantiteTotale)}</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #1565c0' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Entrées ce mois</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1565c0' }}>{entreesCeMois}</div>
        </div>
      </div>

      {/* Recherche (tableau) */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher par référence, désignation ou fournisseur..."
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
              {['Date', 'N° commande', 'N° facture', 'Réf.', 'Désignation', 'Catégorie', 'Nouvelle qté', 'P.C.P', 'P.U.R.', 'Total', 'Fournisseur', 'Note', 'Action'].map(col => (
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
            {entreesFiltrees.length === 0 ? (
              <tr><td colSpan={13} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune entrée enregistrée
              </td></tr>
            ) : (
              entreesFiltrees.map((e, i) => {
                const produit = produits.donnees.find(p => p.id === e.produitId)
                const cat     = produit ? resoudreCat(produit) : null
                const qte     = e.nouvelleQte ?? e.quantite ?? 0
                const pur     = e.pur ?? e.prixUnitaire ?? 0
                return (
                  <tr key={e.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      {e.dateEntree ? new Date(e.dateEntree).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                      {e.numeroCommande || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      {e.numeroFacture || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{e.reference || '—'}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847', minWidth: 160 }}>
                      {e.designation || '—'}
                      {!produit && (
                        <div style={{ fontSize: 10, fontWeight: 400, color: '#ef4444', marginTop: 2 }}>
                          Produit introuvable dans le catalogue
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {cat ? (
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: (cat.couleur || '#0f2847') + '18',
                          color: cat.couleur || '#0f2847',
                          border: `1px solid ${(cat.couleur || '#0f2847') + '30'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {cat.icone} {cat.nom}
                        </span>
                      ) : e.categorie ? (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {e.categorie}
                        </span>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#16a34a', fontSize: 15 }}>+{fmt(qte)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                      {e.pcp ? fmt(e.pcp) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                      {pur ? fmt(pur) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                      {pur ? fmt(qte * pur) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.fournisseurNom || '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.note || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {droits?.modifierProduits !== false && (
                          <button onClick={() => ouvrirEdition(e)}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>
                            ✏️
                          </button>
                        )}
                        {droits?.supprimerDonnees !== false && (
                          <button onClick={() => supprimerEntree(e)}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal ajout / édition d'entrée ── */}
      {modal && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="mg-card mg-card-scroll" style={{ maxWidth: 580 }}>
            <div className="mg-header">
              <div>
                <div className="mg-title">{entreeEditee ? "Modifier l'entrée" : 'Nouvelle entrée de stock'}</div>
                <div className="mg-subtitle">Uniquement pour un produit déjà présent dans le catalogue</div>
              </div>
              <button className="mg-close" onClick={() => setModal(false)}>×</button>
            </div>

            <div className="mg-card-body">

              {/* ── Étape 1 : commande fournisseur obligatoire ── */}
              {!form.commandeFournisseurId ? (
                <div className="mg-field" style={{ position: 'relative' }}>
                  <label className="mg-label">Commande fournisseur *</label>
                  {!creationCommande ? (
                    <>
                      <input
                        className="mg-input"
                        placeholder="Rechercher par numéro ou fournisseur..."
                        value={rechercheCommande}
                        onChange={e => setRechercheCommande(e.target.value)}
                        autoFocus
                      />
                      <div style={{
                        marginTop: 6, border: '1px solid #e2e8f0', borderRadius: 8,
                        maxHeight: 220, overflowY: 'auto',
                      }}>
                        {commandesFiltrees.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>Aucune commande trouvée</div>
                        ) : commandesFiltrees.map(c => (
                          <div
                            key={c.id}
                            onClick={() => choisirCommande(c)}
                            style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, color: '#0f2847', fontSize: 13 }}>{c.numero}</div>
                              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                                {c.fournisseurNom || '—'}{c.numeroFacture ? ` · Facture ${c.numeroFacture}` : ''}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: '#f1f5f9', color: '#64748b', whiteSpace: 'nowrap' }}>
                              {c.statut === 'recue' ? 'Reçue' : c.statut === 'partiellement_recue' ? 'Partiellement reçue' : c.statut === 'annulee' ? 'Annulée' : 'En attente'}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setCreationCommande(true)} style={{ marginTop: 8, border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        + Nouvelle commande fournisseur
                      </button>
                    </>
                  ) : (
                    <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 12, marginTop: 6 }}>
                      <div className="mg-field-grid-2">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Numéro *</label>
                          <input className="mg-input mg-input-no-mb" value={formCommande.numero}
                            onChange={e => setFormCommande({ ...formCommande, numero: e.target.value })}
                            placeholder="Ex: CMD-0001" />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">N° facture</label>
                          <input className="mg-input mg-input-no-mb" value={formCommande.numeroFacture}
                            onChange={e => setFormCommande({ ...formCommande, numeroFacture: e.target.value })}
                            placeholder="Ex: FACT-0001" />
                        </div>
                      </div>
                      <div className="mg-field-grid-2" style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Fournisseur *</label>
                          <select className="mg-select mg-select-no-mb" value={formCommande.fournisseurId}
                            onChange={e => setFormCommande({ ...formCommande, fournisseurId: e.target.value })}>
                            <option value="">Sélectionner un fournisseur</option>
                            {fournisseurs.map(f => (
                              <option key={f.id} value={f.id}>{f.nom}</option>
                            ))}
                          </select>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                          <label className="mg-label">Date de commande</label>
                          <input type="date" className="mg-input mg-input-no-mb" value={formCommande.dateCommande}
                            onChange={e => setFormCommande({ ...formCommande, dateCommande: e.target.value })} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                        <button className="mg-btn-ghost" onClick={() => { setCreationCommande(false); setFormCommande(FORM_COMMANDE_VIDE) }}>Annuler</button>
                        <button className="mg-btn-primary" onClick={sauvegarderCommandeRapide}>Créer et sélectionner</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2847' }}>Commande {commandeChoisie?.numero || '—'}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {commandeChoisie?.fournisseurNom || '—'}{commandeChoisie?.numeroFacture ? ` · Facture ${commandeChoisie.numeroFacture}` : ''}
                      </div>
                    </div>
                    {!entreeEditee && (
                      <button onClick={changerCommande} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ↺ Changer de commande
                      </button>
                    )}
                  </div>

              {/* ── Recherche produit (remplace la liste déroulante) ── */}
              {!form.produitId ? (
                <div className="mg-field" style={{ position: 'relative' }}>
                  <label className="mg-label">Rechercher un produit *</label>
                  <input
                    className="mg-input"
                    placeholder="Tapez une référence..."
                    value={rechercheProduit}
                    onChange={e => { setRechercheProduit(e.target.value); setResultatsOuverts(true) }}
                    onFocus={() => setResultatsOuverts(true)}
                    onBlur={() => setTimeout(() => setResultatsOuverts(false), 150)}
                    autoFocus
                  />
                  {resultatsOuverts && rechercheProduit.trim() && (
                    <div style={{
                      position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 4,
                      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(15,40,71,0.14)', maxHeight: 260,
                      overflowY: 'auto', zIndex: 30,
                    }}>
                      {resultatsProduits.length === 0 ? (
                        <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8' }}>Aucun produit trouvé</div>
                      ) : resultatsProduits.map(p => (
                        <div
                          key={p.id}
                          onMouseDown={e => e.preventDefault()}
                          onClick={() => choisirProduit(p)}
                          style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                        >
                          <div style={{ fontWeight: 600, color: '#0f2847', fontSize: 13 }}>{p.designation || '—'}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                            {p.reference || '—'}{p.categorie ? ` · ${p.categorie}` : ''} · Stock : {fmt(p.stock || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                    {!entreeEditee && (
                      <button onClick={changerProduit} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        ↺ Changer de produit
                      </button>
                    )}
                  </div>

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
                      <label className="mg-label">Qté stock (après entrée)</label>
                      <input className="mg-input-no-mb" style={sChampFige} value={qteStockApres} disabled />
                      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Qté stock actuelle ({produitChoisi?.stock || 0}) + nouvelle qté</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">P.U. (ancien)</label>
                      <input className="mg-input-no-mb" style={sChampFige} value={produitChoisi?.prixUnitaire ? fmt(produitChoisi.prixUnitaire) : 0} disabled />
                      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Prix actuellement au catalogue (avant cette entrée)</span>
                    </div>
                  </div>

                  {/* Section — Nouveau stock (rien n'est figé ici) */}
                  <div className="mg-divider" style={{ marginTop: 6 }}>
                    <div className="mg-divider-line" /><span className="mg-divider-label">Nouveau stock</span><div className="mg-divider-line" />
                  </div>
                  <div className="mg-field-grid-3">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">Nouvelle qté *</label>
                      <input type="number" min="1" className="mg-input mg-input-no-mb" value={form.nouvelleQte}
                        onChange={e => setForm({ ...form, nouvelleQte: e.target.value })} placeholder="0" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">P.C.P (calcul auto)</label>
                      <input className="mg-input-no-mb" style={sChampFige} value={pcpAuto ? fmt(pcpAuto) : 0} disabled />
                      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>(P.U.×Qté stock actuelle + P.U.R.×nouvelle qté) / (Qté stock actuelle + nouvelle qté)</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">P.U.R.</label>
                      <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.pur}
                        onChange={e => setForm({ ...form, pur: e.target.value })} placeholder="0" />
                      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>Prix de cette réception</span>
                    </div>
                  </div>
                  <div className="mg-field-grid-2" style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">Date d'entrée</label>
                      <input type="date" className="mg-input mg-input-no-mb" value={form.dateEntree}
                        onChange={e => setForm({ ...form, dateEntree: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">Note</label>
                      <input className="mg-input mg-input-no-mb" value={form.note}
                        onChange={e => setForm({ ...form, note: e.target.value })}
                        placeholder="Ex: Bon de livraison n°..." />
                    </div>
                  </div>
                </>
              )}
                </>
              )}

              {/* Actions */}
              <div className="mg-actions mg-actions-border" style={{ marginTop: 18 }}>
                <button className="mg-btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button className="mg-btn-primary" onClick={sauvegarder} disabled={!form.commandeFournisseurId || !form.produitId}>
                  {entreeEditee ? 'Enregistrer les modifications' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Entrees
