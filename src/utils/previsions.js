// ── Calcul des prévisions de commande ──────────────────────────
// Un produit apparaît dans les prévisions dès que son stock est au
// niveau ou en dessous de son seuil d'alerte (stockMin), comme pour le
// badge d'alertes du Dashboard.
//
// Pour chaque produit concerné, on calcule la "prévision" = la quantité
// à commander pour revenir à la quantité de base (qteBase) souhaitée :
//   prevision = qteBase - stock
//
// Si qteBase n'a pas encore été renseignée sur le produit, on ne peut
// pas calculer de prévision chiffrée : le produit est signalé comme
// "manqueBase" (à renseigner) plutôt que d'afficher un chiffre faux.

const SEUIL_PAR_DEFAUT = 5

export function calculerPrevisions(produits = []) {
  return produits
    .filter(p => {
      const stock = Number(p.stock) || 0
      const seuil = Number(p.stockMin) || SEUIL_PAR_DEFAUT
      return stock <= seuil
    })
    .map(p => {
      const stock = Number(p.stock) || 0
      const qteBaseBrute = p.qteBase
      const qteBaseValide =
        qteBaseBrute !== undefined && qteBaseBrute !== null && qteBaseBrute !== '' &&
        !isNaN(Number(qteBaseBrute)) && Number(qteBaseBrute) > 0

      const qteBase   = qteBaseValide ? Number(qteBaseBrute) : 0
      const manqueBase = !qteBaseValide
      const prevision  = manqueBase ? 0 : Math.max(0, qteBase - stock)

      return {
        id:             p.id,
        reference:      p.reference,
        designation:    p.designation,
        categorie:      p.categorie,
        fournisseurId:  p.fournisseurId,
        fournisseurNom: p.fournisseurNom,
        stock,
        qteBase,
        manqueBase,
        prevision,
        prixUnitaire: Number(p.prixUnitaire) || 0,
      }
    })
}

// ── Statut d'affichage d'une ligne de prévision ─────────────────
export function statutPrevision(p) {
  if (p.manqueBase) {
    return { cle: 'aRenseigner', label: 'Qté. base à renseigner', couleur: '#b45309' }
  }
  if (p.stock <= 0) {
    return { cle: 'rupture', label: 'Rupture', couleur: '#dc2626' }
  }
  return { cle: 'faible', label: 'Stock faible', couleur: '#d97706' }
}