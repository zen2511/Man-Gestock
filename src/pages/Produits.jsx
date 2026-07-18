import { useState } from 'react'
import { genId } from '../utils/storage'
import * as XLSX from 'xlsx'
import { MODAL_CSS } from '../utils/modalStyles'

const CLE_TEINTES = 'mansa_teintes'
const CLE_UNITES  = 'mansa_unites'
const TEINTES_DEFAUT = ['Naturel', 'Blanc', 'Bronze', 'Noir', 'Argent', 'Inox', 'Clair', 'Fumé', 'Laqué RAL sur mesure']
const UNITES_DEFAUT  = ['unité', 'ml', 'm²', 'm³', 'barre', 'rouleau', 'kg', 'tonne', 'lot', 'boîte', 'palette']

function loadLS(cle, defaut) {
  try { return JSON.parse(localStorage.getItem(cle)) || defaut } catch { return defaut }
}

const FORM_VIDE = {
  reference: '', designation: '', ral: '', categorieId: '', categorie: '',
  serie: '', stock: 0, stockMin: 5, prixUnitaire: 0, unite: '',
  dateEntree: new Date().toISOString().slice(0, 10),
  fournisseurId: '', fournisseurNom: '',
  specDiametre: '', specLongueur: '', specMateriau: '',
  conditionnement: '', uniteMatiere: '', uniteVente: '', qteBase: '',
  image: '',
}

function Produits({ produits, mouvements, fournisseurs: fournisseursArg = [], categories: categoriesArg = [], familles: famillesArg = [], chantiers: chantiersArg = [], droits }) {
  const { donnees, ajouter, modifier, effacer, sauvegarder: sauvegarderProduits } = produits

  // NOTE : catégories, fournisseurs et familles doivent être créés via leurs
  // fonctions ajouter()/modifier() respectives (celles utilisées par les pages
  // Categories.jsx / Fournisseurs.jsx / Familles.jsx elles-mêmes), et non via une
  // écriture directe dans le localStorage : c'est ce mécanisme qui garantit que
  // l'état de l'application (et donc l'écran) est bien mis à jour après l'import.
  const categories            = Array.isArray(categoriesArg) ? categoriesArg         : (categoriesArg.donnees    || [])
  const ajouterCategorie      = Array.isArray(categoriesArg) ? (() => {})            : (categoriesArg.ajouter    || (() => {}))
  const modifierCategorie     = Array.isArray(categoriesArg) ? (() => {})            : (categoriesArg.modifier   || (() => {}))

  const fournisseurs          = Array.isArray(fournisseursArg) ? fournisseursArg     : (fournisseursArg.donnees  || [])
  const ajouterFournisseur    = Array.isArray(fournisseursArg) ? (() => {})          : (fournisseursArg.ajouter  || (() => {}))

  const familles              = Array.isArray(famillesArg)   ? famillesArg           : (famillesArg.donnees      || [])
  const ajouterFamille        = Array.isArray(famillesArg)   ? (() => {})            : (famillesArg.ajouter      || (() => {}))
  const idsFamillesDe         = (cat) => cat?.familleIds || (cat?.familleId ? [cat.familleId] : [])

  const chantiers             = Array.isArray(chantiersArg)  ? chantiersArg          : (chantiersArg.donnees     || [])
  const nomChantier           = (c) => [c.reference, c.clientNom].filter(Boolean).join(' — ') || 'Chantier sans référence'

  // NOTE ARCHITECTURE : les familles regroupent des catégories (et non l'inverse).
  // Un produit n'a jamais de famille propre : il appartient à UNE seule catégorie
  // (categorieId), et c'est cette catégorie qui peut être rattachée à une ou
  // plusieurs familles (géré depuis la page Familles). Une catégorie peut aussi
  // être associée à plusieurs produits. La recherche libre (texte) se fait par
  // catégorie ; le filtre visible (boutons) se fait par famille.

  // ── Données depuis Paramètres ──────────────────────────────
  const teintes = loadLS(CLE_TEINTES, TEINTES_DEFAUT)
  const unites  = loadLS(CLE_UNITES,  UNITES_DEFAUT)

  const [recherche,        setRecherche]        = useState('')
  const [filtreFamille,    setFiltreFamille]    = useState('tous')
  const [filtreCategorie,  setFiltreCategorie]  = useState('tous')
  const [modal,            setModal]            = useState(false)
  const [produitEdite,     setProduitEdite]      = useState(null)
  const [form,             setForm]             = useState(FORM_VIDE)
  const [modalMouvement,   setModalMouvement]   = useState(null)
  const [quantiteMvt,      setQuantiteMvt]      = useState(1)
  const [noteMvt,          setNoteMvt]          = useState('')
  const [chantierMvt,      setChantierMvt]      = useState('')
  const [confirmViderStock, setConfirmViderStock] = useState(false)
  const [produitSelectionne, setProduitSelectionne] = useState(null)

  // ── Styles ────────────────────────────────────────────────
  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13, marginBottom: 0,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }
  const sBtn = {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    background: '#254e88', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  }
  const sBtnSec = {
    padding: '10px 22px', borderRadius: 8, border: '1.5px solid #e2e8f0',
    background: '#fff', fontSize: 13, cursor: 'pointer', color: '#64748b',
  }
  const sLabel = {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: 5,
  }
  const sDivider = {
    fontSize: 10, fontWeight: 800, color: '#94a3b8',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    padding: '18px 0 8px', borderBottom: '1.5px solid #f1f5f9', marginBottom: 16,
  }

  // ── Helpers ───────────────────────────────────────────────
  const norm = (txt) =>
    String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const resoudreCat = (p) =>
    categories.find(c => c.id === p.categorieId) ||
    categories.find(c => norm(c.nom) === norm(p.categorie))

  const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0)

  // ── Stats mensuelles produits (pour expert comptable) ─────
  const statsProduits = (() => {
    const debut = new Date(); debut.setDate(1); debut.setHours(0,0,0,0)
    const mvtsMois = (mouvements.donnees || []).filter(m => m.date && new Date(m.date) >= debut)

    // Valeur totale du stock actuel
    const valeurTotale = donnees.reduce((s, p) => s + (p.prixUnitaire || 0) * (p.stock || 0), 0)

    // Valeur des entrées du mois
    const valeurEntrees = mvtsMois
      .filter(m => m.type === 'entree')
      .reduce((s, m) => {
        const p = donnees.find(p => p.id === m.produitId)
        return s + (p?.prixUnitaire || 0) * (m.quantite || 0)
      }, 0)

    // Valeur des sorties du mois
    const valeurSorties = mvtsMois
      .filter(m => m.type === 'sortie')
      .reduce((s, m) => {
        const p = donnees.find(p => p.id === m.produitId)
        return s + (p?.prixUnitaire || 0) * (m.quantite || 0)
      }, 0)

    // Produits les plus sortis du mois (top 5 par quantité sortie)
    const sortiePar = {}
    mvtsMois.filter(m => m.type === 'sortie').forEach(m => {
      sortiePar[m.produitId] = (sortiePar[m.produitId] || 0) + (m.quantite || 0)
    })
    const topSorties = Object.entries(sortiePar)
      .map(([id, qte]) => ({ produit: donnees.find(p => p.id === id), qte }))
      .filter(x => x.produit)
      .sort((a, b) => b.qte - a.qte)
      .slice(0, 5)

    // Variation de stock du mois (entrées − sorties en quantité)
    const qteTotaleEntrees = mvtsMois.filter(m => m.type === 'entree').reduce((s, m) => s + (m.quantite || 0), 0)
    const qteTotaleSorties = mvtsMois.filter(m => m.type === 'sortie').reduce((s, m) => s + (m.quantite || 0), 0)
    const variationStock   = qteTotaleEntrees - qteTotaleSorties

    // Produits sans mouvement ce mois (stock dormant)
    const idsMouvementsMois = new Set(mvtsMois.map(m => m.produitId))
    const produitsDormants  = donnees.filter(p => !idsMouvementsMois.has(p.id) && (p.stock || 0) > 0).length

    return {
      valeurTotale, valeurEntrees, valeurSorties,
      qteTotaleEntrees, qteTotaleSorties, variationStock,
      topSorties, produitsDormants,
    }
  })()

  // ── Filtrage ──────────────────────────────────────────────
  // La recherche libre reste basée sur la catégorie : une catégorie identifie
  // sans ambiguïté un produit (un produit n'appartient qu'à une seule
  // catégorie). Le filtre visible (boutons), lui, se fait par FAMILLE : chaque
  // bouton correspond à une famille, et regroupe tous les produits dont la
  // catégorie est rattachée à cette famille (une catégorie — donc ses
  // produits — pouvant être rattachée à plusieurs familles à la fois, un
  // même produit peut apparaître sous plusieurs boutons famille).
  const famillesDeProduit = (p) => {
    const cat = resoudreCat(p)
    return cat ? idsFamillesDe(cat) : []
  }

  const produitsFiltres = donnees.filter(p => {
    const catResolue = resoudreCat(p)
    const nomCat = catResolue?.nom || p.categorie || ''
    const rechNorm = norm(recherche)
    const matchSearch = !recherche
      || norm(p.reference).includes(rechNorm)
      || norm(p.designation).includes(rechNorm)
      || norm(nomCat).includes(rechNorm)
    const idsFam = famillesDeProduit(p)
    const matchFamille = filtreFamille === 'tous'
      || (filtreFamille === '__sans_famille__' ? idsFam.length === 0 : idsFam.includes(filtreFamille))
    const matchCategorie = filtreCategorie === 'tous' || p.categorieId === filtreCategorie
    return matchSearch && matchFamille && matchCategorie
  })

  const ruptures = donnees.filter(p => (p.stock || 0) <= 0).length
  const faibles  = donnees.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.stockMin || 5)).length

  const badgeStock = (p) => {
    if ((p.stock || 0) <= 0)                 return { label: 'Rupture', color: '#ef4444', bg: '#fef2f2' }
    if ((p.stock || 0) <= (p.stockMin || 5)) return { label: 'Faible',  color: '#ca8a04', bg: '#fefce8' }
    return { label: 'OK', color: '#16a34a', bg: '#f0fdf4' }
  }

  // ── CRUD ──────────────────────────────────────────────────
  const ouvrirAjout = () => {
    setProduitEdite(null)
    setForm({ ...FORM_VIDE, dateEntree: new Date().toISOString().slice(0, 10) })
    setModal(true)
  }

  const ouvrirEdition = (p) => {
    setProduitEdite(p)
    setForm({ ...FORM_VIDE, ...p })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.designation.trim()) return
    const cat   = categories.find(c => c.id === form.categorieId)
    const fourn = fournisseurs.find(f => f.id === form.fournisseurId)
    const produit = {
      ...form,
      categorie:      cat?.nom   || '',
      fournisseurNom: fourn?.nom || '',
      stock:        Number(form.stock)        || 0,
      stockMin:     Number(form.stockMin)     || 5,
      prixUnitaire: Number(form.prixUnitaire) || 0,
      qteBase:           form.qteBase !== '' ? Number(form.qteBase) : 0,
      conditionnement:   form.conditionnement !== '' ? Number(form.conditionnement) : '',
    }
    if (produitEdite) {
  modifier(produitEdite.id, produit)
} else {
  const nouveauId = genId()
  ajouter({ ...produit, id: nouveauId, dateAjout: new Date().toISOString().slice(0, 10) })

  // Enregistrer le stock initial comme un mouvement d'entrée
  if (produit.stock > 0) {
    mouvements.ajouter({
      id: genId(), produitId: nouveauId,
      produitNom: produit.designation,
      type: 'entree', quantite: produit.stock,
      note: 'Stock initial à la création',
      date: produit.dateEntree
        ? new Date(produit.dateEntree).toISOString()
        : new Date().toISOString(),
    })
  }
}
setModal(false)
  }

  const supprimerProduit = (id) => {
    if (window.confirm('Supprimer ce produit ?')) effacer(id)
  }

  // ── Image du produit (stockée en base64 dans le localStorage) ──
  const gererImage = (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 1_500_000) {
      alert("Image trop lourde (max ~1,5 Mo). Choisissez une image plus légère.")
      event.target.value = ''
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => setForm(f => ({ ...f, image: e.target.result }))
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const retirerImage = () => setForm(f => ({ ...f, image: '' }))

  // ── Vider tout le stock ───────────────────────────────────
  const viderToutLeStock = () => {
    sauvegarderProduits([])
    setConfirmViderStock(false)
  }

  // ── Mouvement de stock ────────────────────────────────────
  const appliquerMouvement = () => {
    const qte = Number(quantiteMvt)
    if (qte <= 0) return
    const { produit, type } = modalMouvement
    const nouvelleQte = type === 'entree'
      ? (produit.stock || 0) + qte
      : (produit.stock || 0) - qte
    if (nouvelleQte < 0) { alert('Stock insuffisant !'); return }
    const chantier = type === 'sortie' ? chantiers.find(c => c.id === chantierMvt) : null
    modifier(produit.id, { stock: nouvelleQte })
    mouvements.ajouter({
      id: genId(), produitId: produit.id,
      produitNom: produit.designation,
      type, quantite: qte, note: noteMvt,
      chantierId: chantier?.id || null,
      chantierNom: chantier ? nomChantier(chantier) : null,
      date: new Date().toISOString(),
    })
    setModalMouvement(null); setQuantiteMvt(1); setNoteMvt(''); setChantierMvt('')
  }

  // ── Export Excel ──────────────────────────────────────────
  const exporterExcel = () => {
    const rows = donnees.map(p => {
      const cat   = resoudreCat(p)
      const fourn = fournisseurs.find(f => f.id === p.fournisseurId)
                 || fournisseurs.find(f => norm(f.nom) === norm(p.fournisseurNom))
      const famsCat = cat ? idsFamillesDe(cat).map(id => familles.find(f => f.id === id)).filter(Boolean) : []
      return {
        'Réf.':            p.reference       || '',
        'Teinte':          p.ral             || '',
        'Série':           p.serie           || '',
        'Désignation *':   p.designation     || '',
        'Catégorie *':     cat?.nom          || p.categorie     || '',
        'Famille':         famsCat.map(f => f.nom).join(', ') || '',
        'Unité vente':     p.uniteVente      || p.unite || '',
        'Cond.':           p.conditionnement || '',
        'Unité matière':   p.uniteMatiere    || '',
        'Qté. base':       p.qteBase         || 0,
        'Qté stock':       p.stock           || 0,
        'PU':              p.prixUnitaire    || 0,
        'Prix total':      (p.stock || 0) * (p.prixUnitaire || 0),
        'Stock Min':       p.stockMin        || 5,
        'Date Entrée':     p.dateEntree      || '',
        'Fournisseur':     fourn?.nom        || p.fournisseurNom || '',
      }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Produits')
    XLSX.writeFile(wb, `produits_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Import Excel ──────────────────────────────────────────
  const importerExcel = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        let lignes = XLSX.utils.sheet_to_json(ws, { defval: '', range: 2 })
        if (lignes.length === 0) lignes = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (lignes.length === 0) { alert('Fichier vide ou format non reconnu.'); return }

        // Helper : lit une colonne avec plusieurs variantes de nom possibles
        const col = (l, ...cles) => {
          for (const k of cles) { const v = l[k]; if (v !== undefined && v !== '') return v.toString().trim() }
          return ''
        }

        // ── Référentiels de travail : on part de l'état réel de l'appli
        // (donnees), on y ajoute les nouveautés au fil de l'import, et on
        // crée chaque élément manquant via ajouter()/modifier() — exactement
        // les mêmes fonctions que celles utilisées par les pages Catégories /
        // Fournisseurs / Familles. C'est ce qui garantit que les nouveautés
        // importées sont bien répercutées dans l'état de l'application (et
        // donc visibles à l'écran), contrairement à une écriture directe
        // dans le localStorage qui ne met pas l'état React à jour.
        const referentielCats   = [...categories]
        const referentielFourn  = [...fournisseurs]
        const referentielFam    = [...familles]

        const trouverOuCreerCategorie = (nomCat) => {
          if (!nomCat) return null
          let cat = referentielCats.find(c => norm(c.nom) === norm(nomCat))
          if (!cat) {
            cat = { id: genId(), nom: nomCat, description: '', dateCreation: new Date().toISOString() }
            referentielCats.push(cat)
            ajouterCategorie(cat)
          }
          return cat
        }

        const trouverOuCreerFournisseur = (nomFourn) => {
          if (!nomFourn) return null
          let f = referentielFourn.find(f => norm(f.nom) === norm(nomFourn))
          if (!f) {
            f = { id: genId(), nom: nomFourn, adresse: '', telephone: '', email: '', dateCreation: new Date().toISOString() }
            referentielFourn.push(f)
            ajouterFournisseur(f)
          }
          return f
        }

        const trouverOuCreerFamille = (nomFam) => {
          if (!nomFam) return null
          let fam = referentielFam.find(f => norm(f.nom) === norm(nomFam))
          if (!fam) {
            fam = { id: genId(), nom: nomFam, description: '', couleur: '#1565c0', dateCreation: new Date().toISOString() }
            referentielFam.push(fam)
            ajouterFamille(fam)
          }
          return fam
        }

        // Rattache une catégorie à une famille (many-to-many, comme dans Familles.jsx)
        const rattacherCategorieAFamille = (cat, fam) => {
          if (!cat || !fam) return
          const liste = idsFamillesDe(cat)
          if (!liste.includes(fam.id)) {
            const nouvelleListe = [...liste, fam.id]
            cat.familleIds = nouvelleListe // reflète immédiatement dans referentielCats pour les lignes suivantes
            // NOTE Firestore : updateDoc() rejette toute valeur `undefined`
            // dans un champ (contrairement à localStorage). On utilise donc
            // `null` pour "vider" l'ancien champ familleId — Firestore
            // l'accepte très bien, le champ reste présent mais vide.
            modifierCategorie(cat.id, { familleIds: nouvelleListe, familleId: null })
          }
        }

        // Helper : convertit une date Excel (numéro de série ou chaîne) en AAAA-MM-JJ
        const parseDate = (val) => {
          if (!val) return ''
          if (typeof val === 'number') {
            const d = new Date(Math.round((val - 25569) * 86400 * 1000))
            return d.toISOString().slice(0, 10)
          }
          const s = val.toString().trim()
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
          return s
        }

        let produitsActuels = [...donnees]
        let n = 0
        lignes.forEach(l => {
          const desig = col(l, 'Désignation *', 'Désignation', 'Designation *', 'Designation')
          if (!desig) return

          const nomCat    = col(l, 'Catégorie *', 'Catégorie', 'Categorie *', 'Categorie')
          const catFinale = trouverOuCreerCategorie(nomCat)

          const nomFourn  = col(l, 'Fournisseur')
          const fourn     = trouverOuCreerFournisseur(nomFourn)

          const nomFamBrut = col(l, 'Famille')
          if (nomFamBrut) {
            nomFamBrut.split(',').map(s => s.trim()).filter(Boolean).forEach(nomFam => {
              const fam = trouverOuCreerFamille(nomFam)
              rattacherCategorieAFamille(catFinale, fam)
            })
          }

          const reference = col(l, 'Réf.', 'Référence', 'Reference')
          const produitExistant = reference
            ? produitsActuels.find(p => norm(p.reference) === norm(reference)) : null

          const uniteVenteImport = col(l, 'Unité vente', 'Unite vente', 'Unité', 'Unite')
          const produitData = {
            reference,
            designation:    desig,
            ral:            col(l, 'Teinte', 'RAL / Couleur', 'RAL', 'Ral'),
            categorieId:    catFinale?.id  || '',
            categorie:      catFinale?.nom || nomCat,
            serie:          col(l, 'Série', 'Série / Modèle', 'Serie / Modele', 'Serie'),
            uniteMatiere:   col(l, 'Unité matière', 'Unite matiere'),
            uniteVente:     uniteVenteImport,
            unite:          uniteVenteImport,
            conditionnement: Number(col(l, 'Cond.', 'Conditionnement')) || '',
            qteBase:        Number(col(l, 'Qté. base', 'Qte base', 'Qté base')) || 0,
            prixUnitaire:   Number(col(l, 'PU', 'Prix Unitaire')) || 0,
            stock:          Number(col(l, 'Qté stock', 'Qte stock', 'Stock')) || 0,
            stockMin:       Number(col(l, 'Stock Min'))     || 5,
            dateEntree:     parseDate(col(l, 'Date Entrée', 'Date Entree')),
            fournisseurId:  fourn?.id  || '',
            fournisseurNom: fourn?.nom || nomFourn,
          }

          if (produitExistant) {
            const idx = produitsActuels.findIndex(p => p.id === produitExistant.id)
            produitsActuels[idx] = { ...produitsActuels[idx], ...produitData }
          } else {
            produitsActuels.push({ id: genId(), ...produitData, dateAjout: new Date().toISOString().slice(0, 10) })
          }
          n++
        })

        // Un seul appel pour tout le lot de produits — évite les écrasements de state
        sauvegarderProduits(produitsActuels)
        // Nommer, pas seulement compter : on distingue clairement les nouvelles
        // FAMILLES (ex: TPR, Acier) des nouvelles CATÉGORIES (ex: Profilé,
        // Accessoire) qu'elles regroupent — pour éviter toute confusion à la
        // relecture du résumé d'import.
        const idsCatsAvant  = new Set(categories.map(c => c.id))
        const idsFournAvant = new Set(fournisseurs.map(f => f.id))
        const idsFamAvant   = new Set(familles.map(f => f.id))
        const nouvellesCats  = referentielCats.filter(c => !idsCatsAvant.has(c.id))
        const nouveauxFourn  = referentielFourn.filter(f => !idsFournAvant.has(f.id))
        const nouvellesFam   = referentielFam.filter(f => !idsFamAvant.has(f.id))
        const lignesResume = [
          `${n} produit(s) importé(s) avec succès !`,
          nouvellesFam.length   > 0 ? `\n• Nouvelle(s) famille(s) : ${nouvellesFam.map(f => f.nom).join(', ')}` : '',
          nouvellesCats.length  > 0 ? `\n• Nouvelle(s) catégorie(s) : ${nouvellesCats.map(c => c.nom).join(', ')}` : '',
          nouveauxFourn.length  > 0 ? `\n• Nouveau(x) fournisseur(s) : ${nouveauxFourn.map(f => f.nom).join(', ')}` : '',
        ].join('')
        alert(lignesResume)
      } catch (err) {
        console.error(err)
        alert('Erreur de lecture du fichier Excel. Vérifiez le format.')
      }
    }
    reader.readAsArrayBuffer(file)
    event.target.value = ''
  }

  const categorieSelectionnee = categories.find(c => c.id === form.categorieId)
  const estQuincaillerie      = categorieSelectionnee?.estQuincaillerie === true

  // ── RENDER ────────────────────────────────────────────────
  return (
    <div>
      <style>{MODAL_CSS}</style>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
            Produits ({donnees.length})
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Catalogue des produits</p>
        </div>
        {droits?.modifierProduits !== false && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <input type="file" id="excel-upload" accept=".xlsx,.xls" onChange={importerExcel} style={{ display: 'none' }} />
            <button onClick={() => document.getElementById('excel-upload').click()} style={sBtnSec}>
              Importer
            </button>
            <button onClick={exporterExcel} style={sBtnSec}>Exporter</button>
            {droits?.supprimerDonnees !== false && (
              <button
                onClick={() => setConfirmViderStock(true)}
                style={{ ...sBtnSec, color: '#ef4444', borderColor: '#fecaca' }}
              >
                Vider le stock
              </button>
            )}
            <button onClick={ouvrirAjout} style={sBtn}>+ Créer</button>
          </div>
        )}
      </div>

      {/* Stats */}
      {(() => {
        const prodSel = produitSelectionne ? donnees.find(p => p.id === produitSelectionne.id) : null
        return (
      <div style={{ display: 'grid', gridTemplateColumns: prodSel ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {prodSel ? (
          <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #0f2847' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Qté stock</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2847' }}>{prodSel.stock || 0}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {prodSel.designation}
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #1565c0' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Stock base</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#1565c0' }}>{prodSel.qteBase || 0}</div>
            </div>
            {(() => {
              const prevision = (Number(prodSel.qteBase) || 0) - (Number(prodSel.stock) || 0)
              const couleur = prevision > 0 ? '#f97316' : '#16a34a'
              return (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: `4px solid ${couleur}` }}>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Prévision</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: couleur }}>{prevision}</div>
                </div>
              )
            })()}
            {/* Image du produit — en grand, pour une reconnaissance visuelle rapide */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}>
              {prodSel.image ? (
                <img src={prodSel.image} alt={prodSel.designation}
                  style={{ width: '100%', height: 90, objectFit: 'contain', borderRadius: 8 }} />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: '#cbd5e1' }}>
                  <span style={{ fontSize: 30 }}>🖼️</span>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>Aucune image</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #0f2847' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Total produits</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f2847' }}>{donnees.length}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #ef4444' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Ruptures</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ef4444' }}>{ruptures}</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #fef08a', borderRadius: 12, padding: '14px 18px', borderLeft: '4px solid #ca8a04' }}>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4, fontWeight: 600 }}>Stock faible</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#ca8a04' }}>{faibles}</div>
            </div>
          </>
        )}
      </div>
      )})()}
      {produitSelectionne && (
        <div style={{ marginTop: -12, marginBottom: 16, fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 8 }}>
          Produit sélectionné : <strong style={{ color: '#0f2847' }}>{produitSelectionne.designation}</strong>
          <button onClick={() => setProduitSelectionne(null)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
            × Désélectionner
          </button>
        </div>
      )}

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          placeholder="Rechercher par référence, désignation ou catégorie..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, marginBottom: 0, flex: 1, minWidth: 200, maxWidth: 360 }}
        />
      </div>

      {/* Filtre famille (visible, indépendant de la recherche libre) —
          une catégorie pouvant être rattachée à plusieurs familles, un même
          produit peut apparaître sous plusieurs boutons famille ici.
          Style DISTINCT du filtre catégorie ci-dessous : pastille PLEINE
          (fond de couleur) pour bien marquer que "famille" est le niveau
          large qui regroupe plusieurs catégories. */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: 2 }}>
          Famille
        </span>
        <button onClick={() => { setFiltreFamille('tous'); setFiltreCategorie('tous') }} style={{
          padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          background: filtreFamille === 'tous' ? '#0f2847' : '#fff',
          color:      filtreFamille === 'tous' ? '#fff'    : '#64748b',
          border:     `1.5px solid ${filtreFamille === 'tous' ? '#0f2847' : '#e2e8f0'}`,
        }}>
          Toutes ({donnees.length})
        </button>
        {familles.map(fam => {
          const n = donnees.filter(p => famillesDeProduit(p).includes(fam.id)).length
          if (n === 0) return null
          const actif = filtreFamille === fam.id
          return (
            <button key={fam.id} onClick={() => { setFiltreFamille(actif ? 'tous' : fam.id); setFiltreCategorie('tous') }} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: actif ? (fam.couleur || '#0f2847') : '#fff',
              color:      actif ? '#fff' : (fam.couleur || '#64748b'),
              border:     `1.5px solid ${fam.couleur || '#e2e8f0'}`,
            }}>
              {fam.nom} ({n})
            </button>
          )
        })}
        {(() => {
          const nSansFamille = donnees.filter(p => famillesDeProduit(p).length === 0).length
          if (nSansFamille === 0) return null
          const actif = filtreFamille === '__sans_famille__'
          return (
            <button onClick={() => { setFiltreFamille(actif ? 'tous' : '__sans_famille__'); setFiltreCategorie('tous') }} style={{
              padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              background: actif ? '#64748b' : '#fff',
              color:      actif ? '#fff' : '#94a3b8',
              border:     `1.5px solid ${actif ? '#64748b' : '#e2e8f0'}`,
            }}>
              Sans famille ({nSansFamille})
            </button>
          )
        })()}
      </div>

      {/* Filtre catégorie (visible) — niveau plus fin, imbriqué sous la
          famille active. Style VOLONTAIREMENT différent de la famille :
          puce FINE à contour (pas de fond plein), petit point de couleur
          reprenant celle de la famille à laquelle elle est rattachée, pour
          qu'on distingue au premier coup d'œil "famille" (pastille pleine,
          au-dessus) de "catégorie" (puce fine, ci-dessous). Ex : sous la
          famille TPR on retrouvera ainsi les puces Profilé / Accessoire. */}
      {(() => {
        const categoriesVisibles = categories.filter(cat => {
          const idsFam = idsFamillesDe(cat)
          if (filtreFamille === 'tous') return true
          if (filtreFamille === '__sans_famille__') return idsFam.length === 0
          return idsFam.includes(filtreFamille)
        }).filter(cat => donnees.some(p => resoudreCat(p)?.id === cat.id))
        if (categoriesVisibles.length === 0) return null
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', marginRight: 2 }}>
              Catégorie
            </span>
            <button onClick={() => setFiltreCategorie('tous')} style={{
              padding: '3px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              background: filtreCategorie === 'tous' ? '#f1f5f9' : '#fff',
              color: '#64748b', border: '1.5px dashed #cbd5e1',
            }}>
              Toutes
            </button>
            {categoriesVisibles.map(cat => {
              const n = donnees.filter(p => resoudreCat(p)?.id === cat.id).length
              if (n === 0) return null
              const actif = filtreCategorie === cat.id
              const idsFam = idsFamillesDe(cat)
              const famDeCat = familles.find(f => idsFam.includes(f.id))
              const couleur = famDeCat?.couleur || '#64748b'
              return (
                <button key={cat.id} onClick={() => setFiltreCategorie(actif ? 'tous' : cat.id)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  background: actif ? couleur + '18' : '#fff',
                  color: couleur, border: `1.5px solid ${couleur}55`,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: couleur, flexShrink: 0 }} />
                  {cat.icone ? `${cat.icone} ` : ''}{cat.nom} ({n})
                </button>
              )
            })}
          </div>
        )
      })()}

      <p style={{ color: '#64748b', fontSize: 13, marginBottom: 14 }}>{produitsFiltres.length} produit(s)</p>

      {/* Tableau */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Réf.', 'Teinte', 'Série', 'Désignation', 'Catégorie', 'Unité vente', 'Cond.', 'Unité matière', 'Qté. base', 'Qté stock', 'PU', 'Prix total', 'Fournisseur', 'Statut', 'Action'].map(col => (
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
            {produitsFiltres.length === 0 ? (
              <tr><td colSpan={15} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucun produit trouvé
              </td></tr>
            ) : (
              produitsFiltres.map((p, i) => {
                const badge = badgeStock(p)
                const cat   = resoudreCat(p)
                const fourn = fournisseurs.find(f => f.id === p.fournisseurId)
                           || fournisseurs.find(f => norm(f.nom) === norm(p.fournisseurNom))
                return (
                  <tr key={p.id}
                    onClick={() => setProduitSelectionne(sel => sel?.id === p.id ? null : p)}
                    style={{
                      borderTop: '1px solid #f1f5f9',
                      background: produitSelectionne?.id === p.id ? '#eff6ff' : (i % 2 === 0 ? '#fff' : '#fafbfc'),
                      cursor: 'pointer',
                    }}>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{p.reference || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.ral || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.serie || '—'}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847', minWidth: 160 }}>
                      {p.designation || '—'}
                      {(p.specDiametre || p.specLongueur || p.specMateriau) && (
                        <div style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', marginTop: 2 }}>
                          {[p.specDiametre, p.specLongueur, p.specMateriau].filter(Boolean).join(' · ')}
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
                      ) : p.categorie ? (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {p.categorie}
                        </span>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.uniteVente || p.unite || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.conditionnement || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.uniteMatiere || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{p.qteBase || 0}</td>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: badge.color, fontSize: 15 }}>{p.stock || 0}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                      {p.prixUnitaire ? fmt(p.prixUnitaire) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>
                      {(p.stock || 0) && p.prixUnitaire ? fmt((p.stock || 0) * p.prixUnitaire) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fourn?.nom || p.fournisseurNom || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: badge.bg, color: badge.color, border: `1px solid ${badge.color}40` }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {droits?.modifierProduits !== false && (
                          <>
                            <button onClick={e => { e.stopPropagation(); setModalMouvement({ produit: p, type: 'entree' }) }}
                              title="Entrée de stock"
                              style={{ padding: '5px 9px', borderRadius: 6, border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontSize: 14 }}>
                              📦
                            </button>
                            <button onClick={e => { e.stopPropagation(); setModalMouvement({ produit: p, type: 'sortie' }) }}
                              title="Sortie de stock"
                              style={{ padding: '5px 9px', borderRadius: 6, border: 'none', background: '#fef3c7', color: '#c2410c', cursor: 'pointer', fontSize: 14 }}>
                              📤
                            </button>
                          </>
                        )}
                        {droits?.modifierProduits !== false && (
                          <button onClick={e => { e.stopPropagation(); ouvrirEdition(p) }}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>
                            ✏️
                          </button>
                        )}
                        {droits?.supprimerDonnees !== false && (
                          <button onClick={e => { e.stopPropagation(); supprimerProduit(p.id) }}
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

      {/* ── Modal ajout/édition ── */}
      {modal && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="mg-card mg-card-scroll" style={{ maxWidth: 580 }}>

            {/* En-tête modal */}
            <div className="mg-header">
              <div>
                <div className="mg-badge">{produitEdite ? 'Modification' : 'Création'}</div>
                <div className="mg-title">{produitEdite ? 'Modifier le produit' : 'Nouveau produit'}</div>
                <div className="mg-subtitle">Remplissez les informations du produit</div>
              </div>
              <button className="mg-close" onClick={() => setModal(false)}>×</button>
            </div>

            <div className="mg-card-body">

              {/* Section 1 — Identification */}
              <div className="mg-divider">
                <div className="mg-divider-line" /><span className="mg-divider-label">Identification</span><div className="mg-divider-line" />
              </div>

              {/* Image du produit — facilite la reconnaissance visuelle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 10, flexShrink: 0,
                  background: form.image ? `center / cover no-repeat url(${form.image})` : '#f1f5f9',
                  border: '1.5px solid #e2e8f0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, color: '#cbd5e1',
                }}>
                  {!form.image && '🖼️'}
                </div>
                <div>
                  <input type="file" id="produit-image-upload" accept="image/*" onChange={gererImage} style={{ display: 'none' }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => document.getElementById('produit-image-upload').click()}
                      style={{ ...sBtnSec, padding: '7px 14px', fontSize: 12 }}>
                      {form.image ? 'Changer l’image' : '+ Ajouter une image'}
                    </button>
                    {form.image && (
                      <button type="button" onClick={retirerImage}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff', color: '#dc2626', fontSize: 12, cursor: 'pointer' }}>
                        Retirer
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 5 }}>Optionnel — aide à reconnaître le produit</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Référence</label>
                  <input className="mg-input mg-input-no-mb" value={form.reference}
                    onChange={e => setForm({ ...form, reference: e.target.value })}
                    placeholder="ALU-001" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Désignation <span style={{ color: '#f87171' }}>*</span></label>
                  <input className="mg-input mg-input-no-mb" value={form.designation}
                    onChange={e => setForm({ ...form, designation: e.target.value })}
                    placeholder="Nom complet du produit" />
                </div>
              </div>

              <div className="mg-field-grid-2" style={{ marginTop: 14 }}>
                {/* RAL — select depuis Paramètres avec option texte libre */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Teinte</label>
                  <select className="mg-select mg-select-no-mb" value={form.ral}
                    onChange={e => setForm({ ...form, ral: e.target.value })}>
                    <option value="">Sélectionner une teinte</option>
                    {teintes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.ral === '__autre__' && (
                    <input
                      className="mg-input"
                      style={{ marginTop: 6 }}
                      placeholder="Saisir la teinte manuellement"
                      onChange={e => setForm({ ...form, ral: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Série / Modèle</label>
                  <input className="mg-input mg-input-no-mb" value={form.serie}
                    onChange={e => setForm({ ...form, serie: e.target.value })}
                    placeholder="Ex : Série 45, T55..." />
                </div>
              </div>

              {/* Section 2 — Classification */}
              <div className="mg-divider" style={{ marginTop: 6 }}>
                <div className="mg-divider-line" /><span className="mg-divider-label">Classification</span><div className="mg-divider-line" />
              </div>
              <div className="mg-field-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Catégorie</label>
                  <select className="mg-select mg-select-no-mb" value={form.categorieId}
                    onChange={e => {
                      const cat = categories.find(c => c.id === e.target.value)
                      setForm({
                        ...form,
                        categorieId: e.target.value,
                        categorie: cat?.nom || '',
                      })
                    }}>
                    <option value="">Sélectionner une catégorie</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Fournisseur</label>
                  <select className="mg-select mg-select-no-mb" value={form.fournisseurId}
                    onChange={e => setForm({ ...form, fournisseurId: e.target.value })}>
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 3 — Stock & Prix */}
              <div className="mg-divider" style={{ marginTop: 6 }}>
                <div className="mg-divider-line" /><span className="mg-divider-label">Stock & Tarification</span><div className="mg-divider-line" />
              </div>
              <div className="mg-field-grid-3">
                {/* Unité vente — celle dans laquelle le produit sort du stock */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Unité vente</label>
                  <select className="mg-select mg-select-no-mb" value={form.uniteVente}
                    onChange={e => setForm({ ...form, uniteVente: e.target.value, unite: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {unites.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.uniteVente === '__autre__' && (
                    <input
                      className="mg-input"
                      style={{ marginTop: 6 }}
                      placeholder="Saisir l'unité"
                      onChange={e => setForm({ ...form, uniteVente: e.target.value, unite: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
                {/* Conditionnement */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Cond. (unités/carton)</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.conditionnement}
                    onChange={e => setForm({ ...form, conditionnement: e.target.value })}
                    placeholder="Ex: 200" />
                </div>
                {/* Unité matière — celle dans laquelle le produit est acheté/stocké */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Unité matière</label>
                  <select className="mg-select mg-select-no-mb" value={form.uniteMatiere}
                    onChange={e => setForm({ ...form, uniteMatiere: e.target.value })}>
                    <option value="">Sélectionner</option>
                    {unites.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                    <option value="__autre__">Autre (saisie libre)</option>
                  </select>
                  {form.uniteMatiere === '__autre__' && (
                    <input
                      className="mg-input"
                      style={{ marginTop: 6 }}
                      placeholder="Saisir l'unité"
                      onChange={e => setForm({ ...form, uniteMatiere: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>
              </div>
              <div className="mg-field-grid-3" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Qté. base</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.qteBase}
                    onChange={e => setForm({ ...form, qteBase: e.target.value })}
                    placeholder="0" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Qté stock</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">PU (FCFA)</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.prixUnitaire}
                    onChange={e => setForm({ ...form, prixUnitaire: e.target.value })}
                    placeholder="0" />
                </div>
              </div>

              {/* Section 3bis — Caractéristiques techniques (catégories quincaillerie) */}
              {estQuincaillerie && (
                <>
                  <div className="mg-divider" style={{ marginTop: 6 }}>
                    <div className="mg-divider-line" /><span className="mg-divider-label">🔩 Caractéristiques techniques</span><div className="mg-divider-line" />
                  </div>
                  <div className="mg-field-grid-3">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">Diamètre</label>
                      <input className="mg-input mg-input-no-mb" value={form.specDiametre}
                        onChange={e => setForm({ ...form, specDiametre: e.target.value })}
                        placeholder="Ex: M6, M8, M10" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">Longueur</label>
                      <input className="mg-input mg-input-no-mb" value={form.specLongueur}
                        onChange={e => setForm({ ...form, specLongueur: e.target.value })}
                        placeholder="Ex: 20mm, 40mm" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      <label className="mg-label">Matériau</label>
                      <input className="mg-input mg-input-no-mb" value={form.specMateriau}
                        onChange={e => setForm({ ...form, specMateriau: e.target.value })}
                        placeholder="Ex: Inox, Acier zingué" />
                    </div>
                  </div>
                </>
              )}

              <div className="mg-field-grid-2" style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Seuil d'alerte (stock min)</label>
                  <input type="number" min="0" className="mg-input mg-input-no-mb" value={form.stockMin}
                    onChange={e => setForm({ ...form, stockMin: e.target.value })} />
                </div>
                {!produitEdite && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                    <label className="mg-label">Date d'entrée</label>
                    <input type="date" className="mg-input mg-input-no-mb" value={form.dateEntree}
                      onChange={e => setForm({ ...form, dateEntree: e.target.value })} />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="mg-actions mg-actions-border" style={{ marginTop: 18 }}>
                <button className="mg-btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button className="mg-btn-primary" onClick={sauvegarder}>
                  {produitEdite ? 'Enregistrer les modifications' : 'Ajouter le produit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation vider stock ── */}
      {confirmViderStock && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setConfirmViderStock(false)}>
          <div className="mg-card" style={{ maxWidth: 400, textAlign: 'center' }}>
            <div className="mg-confirm-icon mg-confirm-icon-warn">⚠️</div>
            <div className="mg-title" style={{ textAlign: 'center', marginBottom: 8 }}>
              Vider tout le stock ?
            </div>
            <p className="mg-body-text" style={{ textAlign: 'center' }}>
              Les <span className="mg-body-strong">{donnees.length} produit(s)</span> du catalogue seront définitivement supprimés.
            </p>
            <p style={{ color: '#f87171', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>
              Cette action est irréversible.
            </p>
            <div className="mg-actions" style={{ justifyContent: 'center' }}>
              <button className="mg-btn-ghost" onClick={() => setConfirmViderStock(false)}>Annuler</button>
              <button className="mg-btn-danger" onClick={viderToutLeStock}>Confirmer</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal mouvement de stock ── */}
      {modalMouvement && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && (setModalMouvement(null), setChantierMvt(''))}>
          <div className="mg-card" style={{ maxWidth: 420 }}>
            <div className="mg-header">
              <div>
                <div className="mg-title">
                  {modalMouvement.type === 'entree' ? '📦 Entrée de stock' : '📤 Sortie de stock'}
                </div>
                <div className="mg-subtitle">{modalMouvement.produit.designation}</div>
              </div>
              <button className="mg-close" onClick={() => { setModalMouvement(null); setChantierMvt('') }}>×</button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 9, border: '1px solid rgba(100,181,246,0.10)' }}>
              <span style={{ fontSize: 12, color: 'rgba(148,190,230,0.55)' }}>Stock actuel :</span>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'rgba(100,181,246,0.9)' }}>{modalMouvement.produit.stock || 0}</span>
            </div>

            <div className="mg-field">
              <label className="mg-label">Quantité</label>
              <input type="number" min="1" className="mg-input" value={quantiteMvt}
                onChange={e => setQuantiteMvt(e.target.value)} />
            </div>
            <div className="mg-field">
              <label className="mg-label">Note</label>
              <input className="mg-input" value={noteMvt} onChange={e => setNoteMvt(e.target.value)}
                placeholder="Ex: Livraison fournisseur..." />
            </div>

            {modalMouvement.type === 'sortie' && chantiers.length > 0 && (
              <div className="mg-field">
                <label className="mg-label">Chantier (optionnel)</label>
                <select className="mg-select" value={chantierMvt}
                  onChange={e => setChantierMvt(e.target.value)}>
                  <option value="">Aucun chantier</option>
                  {chantiers.map(c => (
                    <option key={c.id} value={c.id}>{nomChantier(c)}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="mg-actions">
              <button className="mg-btn-ghost" onClick={() => { setModalMouvement(null); setChantierMvt('') }}>Annuler</button>
              <button className="mg-btn-primary"
                onClick={appliquerMouvement}
                style={{ background: modalMouvement.type === 'entree'
                  ? 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)'
                  : 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)' }}>
                {modalMouvement.type === 'entree' ? "Confirmer l'entrée" : "Confirmer la sortie"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Produits