import { useState, useEffect } from 'react'
import { genId } from '../utils/storage'
import { MODAL_CSS } from '../utils/modalStyles'

const FORM_VIDE = {
  numero: '', numeroFacture: '', fournisseurId: '',
  dateCommande: new Date().toISOString().slice(0, 10),
  statut: 'en_attente', note: '', lignes: [],
}

const STATUTS = [
  { valeur: 'en_attente',          label: 'En attente',          couleur: '#f59e0b' },
  { valeur: 'partiellement_recue', label: 'Partiellement reçue', couleur: '#2563eb' },
  { valeur: 'recue',               label: 'Reçue',               couleur: '#16a34a' },
  { valeur: 'annulee',             label: 'Annulée',             couleur: '#94a3b8' },
]

const norm = (txt) =>
  String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n || 0)

function CommandesFournisseur({ commandes, entrees, fournisseurs: fournisseursArg = [], droits, prefillFournisseurId, prefillLignes, onPrefillConsumed }) {
  const { donnees, ajouter, modifier, effacer } = commandes
  const fournisseurs = Array.isArray(fournisseursArg) ? fournisseursArg : (fournisseursArg.donnees || [])
  const listeEntrees  = entrees?.donnees || entrees || []

  const [recherche,      setRecherche]      = useState('')
  const [modal,          setModal]          = useState(false)
  const [commandeEditee, setCommandeEditee] = useState(null)
  const [form,           setForm]           = useState(FORM_VIDE)
  const [aSupprimer,     setASupprimer]     = useState(null)
  const [detail,         setDetail]         = useState(null)

  // ── Styles (cohérents avec les autres pages) ───────────────
  const sInput = {
    width: '100%', padding: '9px 13px', borderRadius: 7,
    border: '1.5px solid #e2e8f0', fontSize: 13, marginBottom: 0,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }
  const sBtn = {
    padding: '10px 22px', borderRadius: 8, border: 'none',
    background: '#254e88', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  }

  const infoStatut = (val) => STATUTS.find(s => s.valeur === val) || STATUTS[0]
  const nbEntreesDe = (cmd) => listeEntrees.filter(e => e.commandeFournisseurId === cmd.id).length
  const produitsDe  = (cmd) => listeEntrees.filter(e => e.commandeFournisseurId === cmd.id)

  // Pré-remplissage depuis la page Prévisions : ouvre directement le
  // formulaire de nouvelle commande avec le fournisseur ET les produits
  // (avec quantités) déjà choisis sur l'écran de sélection.
  useEffect(() => {
    if (prefillFournisseurId) {
      setCommandeEditee(null)
      setForm({ ...FORM_VIDE, fournisseurId: prefillFournisseurId, lignes: prefillLignes || [] })
      setModal(true)
      onPrefillConsumed?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillFournisseurId])

  const commandesFiltrees = donnees
    .filter(c => {
      if (!recherche) return true
      const cible = norm([c.numero, c.fournisseurNom].filter(Boolean).join(' '))
      return cible.includes(norm(recherche))
    })
    .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))

  const ouvrirAjout = () => {
    setCommandeEditee(null)
    setForm(FORM_VIDE)
    setModal(true)
  }

  const ouvrirEdition = (c) => {
    setCommandeEditee(c)
    setForm({
      numero:        c.numero || '',
      numeroFacture: c.numeroFacture || '',
      fournisseurId: c.fournisseurId || '',
      dateCommande:  c.dateCommande || new Date().toISOString().slice(0, 10),
      statut:        c.statut || 'en_attente',
      note:          c.note || '',
      lignes:        c.lignes || [],
    })
    setModal(true)
  }

  // ── Édition des lignes de produits commandés dans le formulaire ──
  const majQteLigne = (produitId, qte) => {
    setForm(f => ({
      ...f,
      lignes: f.lignes.map(l => l.produitId === produitId ? { ...l, qteCommandee: qte } : l),
    }))
  }
  const retirerLigne = (produitId) => {
    setForm(f => ({ ...f, lignes: f.lignes.filter(l => l.produitId !== produitId) }))
  }
  const totalLignes = (lignes) => lignes.reduce((s, l) => s + (Number(l.qteCommandee) || 0) * (Number(l.prixUnitaire) || 0), 0)

  const sauvegarder = () => {
    if (!form.numero.trim()) { alert('Indiquez un numéro de commande.'); return }
    if (!form.fournisseurId) { alert('Sélectionnez un fournisseur.'); return }
    const doublon = donnees.find(c => norm(c.numero) === norm(form.numero) && c.id !== commandeEditee?.id)
    if (doublon) { alert('Ce numéro de commande existe déjà.'); return }
    const fourn = fournisseurs.find(f => f.id === form.fournisseurId)

    if (commandeEditee) {
      modifier(commandeEditee.id, {
        numero:        form.numero.trim(),
        numeroFacture: form.numeroFacture.trim(),
        fournisseurId: form.fournisseurId,
        fournisseurNom: fourn?.nom || '',
        dateCommande:  form.dateCommande,
        statut:        form.statut,
        note:          form.note,
        lignes:        form.lignes,
      })
    } else {
      ajouter({
        id: genId(),
        numero:        form.numero.trim(),
        numeroFacture: form.numeroFacture.trim(),
        fournisseurId: form.fournisseurId,
        fournisseurNom: fourn?.nom || '',
        dateCommande:  form.dateCommande,
        statut:        form.statut,
        note:          form.note,
        lignes:        form.lignes,
        dateCreation:  new Date().toISOString(),
      })
    }
    setModal(false)
  }

  const demanderSuppression = (c) => {
    if (nbEntreesDe(c) > 0) {
      alert('Impossible de retirer cette commande : des entrées de stock y sont déjà rattachées.')
      return
    }
    setASupprimer(c)
  }
  const confirmerSuppression = () => {
    if (aSupprimer) effacer(aSupprimer.id)
    if (detail?.id === aSupprimer?.id) setDetail(null)
    setASupprimer(null)
  }

  return (
    <div>
      <style>{MODAL_CSS}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
            Commandes fournisseur ({donnees.length})
          </h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Bons de commande passés auprès des fournisseurs</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {droits?.modifierProduits !== false && (
            <button onClick={ouvrirAjout} style={sBtn}>+ Nouvelle commande</button>
          )}
        </div>
      </div>

      {/* Recherche */}
      {!detail && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Rechercher par numéro ou fournisseur..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{ ...sInput, flex: 1, minWidth: 200, maxWidth: 360 }}
          />
        </div>
      )}

      {!detail && (
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['N° commande', 'N° facture', 'Fournisseur', 'Date', 'Statut', 'Entrées liées', 'Note', 'Action'].map(col => (
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
            {commandesFiltrees.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
                Aucune commande fournisseur enregistrée
              </td></tr>
            ) : (
              commandesFiltrees.map((c, i) => {
                const st = infoStatut(c.statut)
                const nb = nbEntreesDe(c)
                return (
                  <tr key={c.id} onClick={() => setDetail(c)}
                    style={{ borderTop: '1px solid #f1f5f9', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f2847', whiteSpace: 'nowrap' }}>{c.numero}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{c.numeroFacture || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{c.fournisseurNom || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>
                      {c.dateCommande ? new Date(c.dateCommande).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: st.couleur + '18', color: st.couleur, border: `1px solid ${st.couleur}30`,
                        whiteSpace: 'nowrap',
                      }}>
                        {st.label}
                      </span>
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{nb}</td>
                    <td style={{ padding: '11px 14px', fontSize: 12, color: '#94a3b8', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.note || '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {droits?.modifierProduits !== false && (
                          <button onClick={e => { e.stopPropagation(); ouvrirEdition(c) }}
                            style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>
                            ✏️
                          </button>
                        )}
                        {droits?.supprimerDonnees !== false && (
                          <button onClick={e => { e.stopPropagation(); demanderSuppression(c) }}
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
      )}

      {/* ── Vue détail : uniquement les produits de la commande sélectionnée ── */}
      {detail && (() => {
        const lignes = produitsDe(detail)
        return (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {/* Retour + en-tête : numéro / fournisseur / facture */}
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <button onClick={() => setDetail(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, fontWeight: 600, padding: 0, marginBottom: 12 }}>
                ← Retour aux commandes
              </button>
              <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° commande</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f2847', marginTop: 2 }}>{detail.numero}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fournisseur</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginTop: 2 }}>{detail.fournisseurNom || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° facture</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginTop: 2 }}>{detail.numeroFacture || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date commande</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginTop: 2 }}>
                    {detail.dateCommande ? new Date(detail.dateCommande).toLocaleDateString('fr-FR') : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Produits commandés — figés au moment de la création (depuis Prévisions ou saisis manuellement) */}
            {detail.lignes && detail.lignes.length > 0 && (
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2847', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Produits commandés ({detail.lignes.length})
                </div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['Réf.', 'Désignation', 'Catégorie', 'Qté commandée', 'PU', 'Sous-total'].map(col => (
                          <th key={col} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {detail.lignes.map((l, i) => (
                        <tr key={l.produitId || i} style={{ borderTop: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '9px 12px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{l.reference || '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 600, color: '#0f2847' }}>{l.designation || '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: '#475569' }}>{l.categorie || '—'}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: '#254e88' }}>{fmt(l.qteCommandee)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: '#475569' }}>{fmt(l.prixUnitaire)}</td>
                          <td style={{ padding: '9px 12px', fontSize: 13, fontWeight: 700, color: '#0f2847' }}>{fmt((Number(l.qteCommandee) || 0) * (Number(l.prixUnitaire) || 0))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: '#0f2847', marginTop: 6 }}>
                  Total commandé : {fmt(detail.lignes.reduce((s, l) => s + (Number(l.qteCommandee) || 0) * (Number(l.prixUnitaire) || 0), 0))} FCFA
                </div>
              </div>
            )}

            {/* Produits effectivement reçus — via le module Entrées */}
            <div style={{ padding: '16px 20px 0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f2847', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Produits reçus (via Entrées)
              </div>
            </div>
            <div style={{ overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 920 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Réf.', 'Teinte', 'Désignation', 'Catégorie', 'Unité vente', 'Cond.', 'Unité matière', 'Qté. base', 'Qté reçue', 'PU', 'Prix total', 'Fournisseur'].map(col => (
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
                  {lignes.length === 0 ? (
                    <tr><td colSpan={12} style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                      Aucune entrée reçue pour l'instant sur cette commande
                    </td></tr>
                  ) : (
                    lignes.map((l, i) => {
                      const qte = l.nouvelleQte ?? l.quantite ?? 0
                      const pu  = l.pur ?? l.prixUnitaire ?? 0
                      return (
                        <tr key={l.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
                          <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.reference || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{l.ral || '—'}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#0f2847', minWidth: 160 }}>{l.designation || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{l.categorie || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{l.uniteVente || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{l.conditionnement || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{l.uniteMatiere || '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{l.qteBase || 0}</td>
                          <td style={{ padding: '11px 14px', fontWeight: 700, color: '#16a34a', fontSize: 15 }}>+{fmt(qte)}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>{pu ? fmt(pu) : '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 600, color: '#0f2847', whiteSpace: 'nowrap' }}>{pu ? fmt(qte * pu) : '—'}</td>
                          <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.fournisseurNom || '—'}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )
      })()}
      {modal && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="mg-card" style={{ maxWidth: 480 }}>
            <div className="mg-header">
              <div>
                <div className="mg-title">{commandeEditee ? 'Modifier la commande' : 'Nouvelle commande fournisseur'}</div>
              </div>
              <button className="mg-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="mg-card-body">
              <div className="mg-field-grid-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Numéro *</label>
                  <input className="mg-input mg-input-no-mb" value={form.numero}
                    onChange={e => setForm({ ...form, numero: e.target.value })}
                    placeholder="Ex: CMD-0001" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">N° facture</label>
                  <input className="mg-input mg-input-no-mb" value={form.numeroFacture}
                    onChange={e => setForm({ ...form, numeroFacture: e.target.value })}
                    placeholder="Ex: FACT-0001" />
                </div>
              </div>
              <div className="mg-field-grid-2" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Fournisseur *</label>
                  <select className="mg-select mg-select-no-mb" value={form.fournisseurId}
                    onChange={e => setForm({ ...form, fournisseurId: e.target.value })}>
                    <option value="">Sélectionner un fournisseur</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Date de commande</label>
                  <input type="date" className="mg-input mg-input-no-mb" value={form.dateCommande}
                    onChange={e => setForm({ ...form, dateCommande: e.target.value })} />
                </div>
              </div>
              <div className="mg-field-grid-2" style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Statut</label>
                  <select className="mg-select mg-select-no-mb" value={form.statut}
                    onChange={e => setForm({ ...form, statut: e.target.value })}>
                    {STATUTS.map(s => (
                      <option key={s.valeur} value={s.valeur}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <label className="mg-label">Note</label>
                  <input className="mg-input mg-input-no-mb" value={form.note}
                    onChange={e => setForm({ ...form, note: e.target.value })}
                    placeholder="Optionnel" />
                </div>
              </div>

              {/* Produits commandés — pré-remplis depuis Prévisions, modifiables ici */}
              {form.lignes.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label className="mg-label">Produits commandés ({form.lignes.length})</label>
                  <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Désignation', 'Qté', 'PU', 'Sous-total', ''].map(col => (
                            <th key={col} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {form.lignes.map(l => (
                          <tr key={l.produitId} style={{ borderTop: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '7px 10px', fontSize: 12.5, fontWeight: 600, color: '#0f2847' }}>{l.designation}</td>
                            <td style={{ padding: '7px 10px' }}>
                              <input
                                type="number" min="0" value={l.qteCommandee}
                                onChange={e => majQteLigne(l.produitId, e.target.value)}
                                style={{ width: 64, padding: '4px 6px', borderRadius: 5, border: '1px solid #cbd5e1', fontSize: 12.5 }}
                              />
                            </td>
                            <td style={{ padding: '7px 10px', fontSize: 12.5, color: '#475569' }}>{fmt(l.prixUnitaire)}</td>
                            <td style={{ padding: '7px 10px', fontSize: 12.5, fontWeight: 700, color: '#254e88' }}>
                              {fmt((Number(l.qteCommandee) || 0) * (Number(l.prixUnitaire) || 0))}
                            </td>
                            <td style={{ padding: '7px 10px' }}>
                              <button onClick={() => retirerLigne(l.produitId)} title="Retirer ce produit"
                                style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 15, fontWeight: 700, padding: 0 }}>
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12.5, fontWeight: 700, color: '#0f2847', marginTop: 6 }}>
                    Total commande : {fmt(totalLignes(form.lignes))} FCFA
                  </div>
                </div>
              )}

              <div className="mg-actions mg-actions-border" style={{ marginTop: 18 }}>
                <button className="mg-btn-ghost" onClick={() => setModal(false)}>Annuler</button>
                <button className="mg-btn-primary" onClick={sauvegarder}>
                  {commandeEditee ? 'Enregistrer les modifications' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {aSupprimer && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setASupprimer(null)}>
          <div className="mg-card" style={{ maxWidth: 380 }}>
            <div className="mg-card-body">
              <p style={{ fontSize: 14, color: '#0f2847', marginTop: 0 }}>
                Retirer la commande <strong>{aSupprimer.numero}</strong> ?
              </p>
              <div className="mg-actions" style={{ marginTop: 16 }}>
                <button className="mg-btn-ghost" onClick={() => setASupprimer(null)}>Annuler</button>
                <button className="mg-btn-primary" style={{ background: '#dc2626' }} onClick={confirmerSuppression}>Retirer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommandesFournisseur