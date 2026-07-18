import { useState } from 'react'
import { genId } from '../utils/storage'
import { MODAL_CSS } from '../utils/modalStyles'

const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0)
const norm = (txt) => String(txt || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const FORM_CHANTIER_VIDE = {
  numeroAffaire: '', clientId: '', nomChantier: '',
  dateDebut: new Date().toISOString().slice(0, 10), dateFin: '',
}

const sInput = {
  width: '100%', padding: '9px 13px', borderRadius: 7,
  border: '1.5px solid #e2e8f0', fontSize: 13, marginBottom: 0,
  boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
}
const sBtn = {
  padding: '10px 22px', borderRadius: 8, border: 'none',
  background: '#254e88', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
}

function Chantiers({ commandes, produits: produitsStore = {}, mouvements, clients = [], categories: categoriesArg = [], droits }) {
  const { donnees, ajouter, modifier, effacer } = commandes
  const produits        = produitsStore.donnees || []
  const modifierProduit = produitsStore.modifier || (() => {})
  const ajouterMouvement = mouvements?.ajouter || (() => {})
  const categories = Array.isArray(categoriesArg) ? categoriesArg : (categoriesArg.donnees || [])
  const resoudreCat = (p) =>
    categories.find(c => c.id === p?.categorieId) ||
    categories.find(c => norm(c.nom) === norm(p?.categorie))

  // ── Niveau 1 : liste des chantiers ───────────────────────────
  const [recherche,       setRecherche]       = useState('')
  const [modal,           setModal]           = useState(false)
  const [chantierEditee,  setChantierEditee]  = useState(null)
  const [form,            setForm]            = useState(FORM_CHANTIER_VIDE)
  const [aSupprimer,      setASupprimer]      = useState(null)

  // ── Niveau 2 : détail d'un chantier (ajout de produits) ──────
  const [detailId,        setDetailId]        = useState(null)
  const [ligneEditee,     setLigneEditee]     = useState(null) // index de la ligne dont la qté est en cours d'édition
  const [qteEditee,       setQteEditee]       = useState('')

  const clientNomDe = (id) => clients.find(c => c.id === id)?.nom || ''

  const montantChantier = (c) => (c.produits || []).reduce((s, l) => s + (l.prixUnitaire || 0) * (l.quantite || 0), 0)

  const chantiersFiltres = donnees
    .filter(c => {
      if (!recherche) return true
      const cible = norm([c.numeroAffaire, c.nomChantier, clientNomDe(c.clientId)].filter(Boolean).join(' '))
      return cible.includes(norm(recherche))
    })
    .sort((a, b) => new Date(b.dateCreation || 0) - new Date(a.dateCreation || 0))

  // ── Ajout / édition d'un chantier ────────────────────────────
  const ouvrirAjout = () => {
    setChantierEditee(null)
    setForm(FORM_CHANTIER_VIDE)
    setModal(true)
  }

  const ouvrirEdition = (c) => {
    setChantierEditee(c)
    setForm({
      numeroAffaire: c.numeroAffaire || '', clientId: c.clientId || '',
      nomChantier: c.nomChantier || '',
      dateDebut: c.dateDebut || new Date().toISOString().slice(0, 10),
      dateFin: c.dateFin || '',
    })
    setModal(true)
  }

  const sauvegarderChantier = () => {
    if (!form.numeroAffaire.trim()) { alert('Indiquez un N° Affaire.'); return }
    if (!form.clientId) { alert('Sélectionnez un client.'); return }
    if (!form.nomChantier.trim()) { alert('Indiquez un nom de chantier.'); return }
    const doublon = donnees.find(c => norm(c.numeroAffaire) === norm(form.numeroAffaire) && c.id !== chantierEditee?.id)
    if (doublon) { alert('Ce N° Affaire existe déjà.'); return }
    const client = clients.find(c => c.id === form.clientId)

    if (chantierEditee) {
      modifier(chantierEditee.id, {
        numeroAffaire: form.numeroAffaire.trim(), clientId: form.clientId, clientNom: client?.nom || '',
        nomChantier: form.nomChantier.trim(), dateDebut: form.dateDebut, dateFin: form.dateFin,
      })
    } else {
      ajouter({
        id: genId(),
        numeroAffaire: form.numeroAffaire.trim(), clientId: form.clientId, clientNom: client?.nom || '',
        nomChantier: form.nomChantier.trim(), dateDebut: form.dateDebut, dateFin: form.dateFin,
        produits: [],
        dateCreation: new Date().toISOString(),
      })
    }
    setModal(false)
  }

  // Supprimer un chantier restitue le stock de toutes ses lignes produits.
  const demanderSuppression = (c) => setASupprimer(c)
  const confirmerSuppression = () => {
    const c = aSupprimer
    if (c) {
      (c.produits || []).forEach(l => {
        const prod = produits.find(p => p.id === l.produitId)
        if (prod) {
          modifierProduit(prod.id, { stock: (prod.stock || 0) + (l.quantite || 0) })
          ajouterMouvement({
            id: genId(), produitId: prod.id, produitNom: prod.designation,
            type: 'entree', quantite: l.quantite || 0,
            note: `Annulation chantier ${c.numeroAffaire} (supprimé)`,
            date: new Date().toISOString(),
          })
        }
      })
      effacer(c.id)
    }
    setASupprimer(null)
  }

  // ── Détail chantier : ajout / retrait / édition de produits ──
  const chantier = donnees.find(c => c.id === detailId) || null

  const ouvrirEditionQte = (idx, qteActuelle) => {
    setLigneEditee(idx)
    setQteEditee(String(qteActuelle))
  }

  const validerEditionQte = (idx) => {
    const ligne = chantier.produits[idx]
    const nouvelleQte = Number(qteEditee)
    if (!nouvelleQte || nouvelleQte <= 0) { alert('Quantité invalide.'); return }
    const delta = nouvelleQte - ligne.quantite // >0 : on prend plus de stock ; <0 : on en rend
    const prod = produits.find(p => p.id === ligne.produitId)
    if (prod && delta > 0 && delta > (prod.stock || 0)) {
      alert(`Stock insuffisant (disponible : ${prod.stock || 0}).`)
      return
    }
    if (prod && delta !== 0) {
      modifierProduit(prod.id, { stock: (prod.stock || 0) - delta })
      ajouterMouvement({
        id: genId(), produitId: prod.id, produitNom: prod.designation,
        type: delta > 0 ? 'sortie' : 'entree', quantite: Math.abs(delta),
        note: `Ajustement chantier ${chantier.numeroAffaire}`,
        date: new Date().toISOString(),
      })
    }
    const produitsMaj = chantier.produits.map((l, i) => i === idx ? { ...l, quantite: nouvelleQte } : l)
    modifier(chantier.id, { produits: produitsMaj })
    setLigneEditee(null)
    setQteEditee('')
  }

  const retirerLigne = (idx) => {
    const ligne = chantier.produits[idx]
    const prod = produits.find(p => p.id === ligne.produitId)
    if (prod) {
      modifierProduit(prod.id, { stock: (prod.stock || 0) + (ligne.quantite || 0) })
      ajouterMouvement({
        id: genId(), produitId: prod.id, produitNom: prod.designation,
        type: 'entree', quantite: ligne.quantite || 0,
        note: `Retrait ligne — chantier ${chantier.numeroAffaire}`,
        date: new Date().toISOString(),
      })
    }
    const produitsMaj = chantier.produits.filter((_, i) => i !== idx)
    modifier(chantier.id, { produits: produitsMaj })
  }

  // ═══════════════════════════════════════════════════════════
  // ── NIVEAU 2 : détail d'un chantier ──────────────────────────
  // ═══════════════════════════════════════════════════════════
  if (chantier) {
    const total = montantChantier(chantier)
    return (
      <div>
        <style>{MODAL_CSS}</style>

        <button onClick={() => setDetailId(null)} style={{ border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 14, padding: 0 }}>
          ← Retour aux chantiers
        </button>

        {/* En-tête chantier */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: '18px 22px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>N° Affaire</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f2847', marginBottom: 6 }}>{chantier.numeroAffaire}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{chantier.nomChantier}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{chantier.clientNom || clientNomDe(chantier.clientId) || '—'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              {chantier.dateDebut ? new Date(chantier.dateDebut).toLocaleDateString('fr-FR') : '—'}
              {' → '}
              {chantier.dateFin ? new Date(chantier.dateFin).toLocaleDateString('fr-FR') : '—'}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', marginTop: 6 }}>{fmt(total)} FCFA</div>
            {droits?.modifierCommandes !== false && (
              <button onClick={() => ouvrirEdition(chantier)} style={{ marginTop: 8, padding: '6px 14px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                ✏️ Modifier le chantier
              </button>
            )}
          </div>
        </div>

        {/* Liste des produits du chantier — mêmes champs que la page Produits */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1180 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                {['Réf.', 'Teinte', 'Série', 'Désignation', 'Catégorie', 'Unité vente', 'Cond.', 'Unité matière', 'Qté. base', 'Quantité', 'P.U. (figé)', 'Sous-total', 'Fournisseur', 'Action'].map(col => (
                  <th key={col} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(chantier.produits || []).length === 0 ? (
                <tr><td colSpan={14} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Aucun produit ajouté</td></tr>
              ) : chantier.produits.map((l, idx) => {
                const prod = produits.find(p => p.id === l.produitId)
                const cat  = resoudreCat(prod || l)
                return (
                  <tr key={idx} style={{ borderTop: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                    <td style={{ padding: '11px 14px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{l.reference || prod?.reference || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{prod?.ral || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{prod?.serie || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155', minWidth: 160 }}>
                      {l.designation || prod?.designation || '—'}
                      {!prod && (
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
                      ) : l.categorie ? (
                        <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }}>
                          {l.categorie}
                        </span>
                      ) : <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{prod?.uniteVente || prod?.unite || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{prod?.conditionnement || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{prod?.uniteMatiere || '—'}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{fmt(prod?.qteBase || 0)}</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>
                      {ligneEditee === idx ? (
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                          <input type="number" min="1" value={qteEditee} onChange={e => setQteEditee(e.target.value)}
                            style={{ width: 64, padding: '4px 6px', borderRadius: 5, border: '1px solid #e2e8f0', fontSize: 12 }} autoFocus />
                          <button onClick={() => validerEditionQte(idx)} style={{ border: 'none', background: '#dcfce7', color: '#16a34a', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✓</button>
                          <button onClick={() => { setLigneEditee(null); setQteEditee('') }} style={{ border: 'none', background: '#f1f5f9', color: '#64748b', borderRadius: 5, padding: '4px 8px', cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                      ) : l.quantite}
                    </td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{fmt(l.prixUnitaire)} FCFA</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#0f2847', whiteSpace: 'nowrap' }}>{fmt((l.prixUnitaire || 0) * (l.quantite || 0))} FCFA</td>
                    <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod?.fournisseurNom || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {droits?.modifierCommandes !== false && ligneEditee !== idx && (
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => ouvrirEditionQte(idx, l.quantite)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>Qté</button>
                          <button onClick={() => retirerLigne(idx)} style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 12 }}>Retirer</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {(chantier.produits || []).length > 0 && (
              <tfoot>
                <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                  <td colSpan={11} style={{ padding: '11px 14px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#0f2847' }}>Total</td>
                  <td colSpan={3} style={{ padding: '11px 14px', fontSize: 15, fontWeight: 800, color: '#0f2847' }}>{fmt(total)} FCFA</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Modal édition chantier (réutilise le même modal que la création) */}
        {modal && (
          <ModalChantier
            form={form} setForm={setForm} clients={clients}
            chantierEditee={chantierEditee}
            onAnnuler={() => setModal(false)}
            onSauvegarder={sauvegarderChantier}
          />
        )}
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // ── NIVEAU 1 : liste des chantiers ───────────────────────────
  // ═══════════════════════════════════════════════════════════
  return (
    <div>
      <style>{MODAL_CSS}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>Chantiers ({donnees.length})</h2>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Affaires clients et produits sortis pour chaque chantier</p>
        </div>
        {droits?.modifierCommandes !== false && (
          <button onClick={ouvrirAjout} style={sBtn}>+ Nouveau chantier</button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input
          placeholder="Rechercher par N° Affaire, chantier ou client..."
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          style={{ ...sInput, flex: 1, minWidth: 220, maxWidth: 380 }}
        />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['N° Affaire', 'Nom chantier', 'Client', 'Date début', 'Date fin', 'Nb produits', 'Montant', 'Action'].map(col => (
                <th key={col} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chantiersFiltres.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 36, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Aucun chantier enregistré</td></tr>
            ) : chantiersFiltres.map((c, i) => (
              <tr key={c.id}
                onClick={() => setDetailId(c.id)}
                style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafbfc', cursor: 'pointer' }}
              >
                <td style={{ padding: '11px 14px', fontWeight: 700, color: '#0f2847', whiteSpace: 'nowrap' }}>{c.numeroAffaire}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#334155' }}>{c.nomChantier}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{c.clientNom || clientNomDe(c.clientId) || '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>{c.dateDebut ? new Date(c.dateDebut).toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>{c.dateFin ? new Date(c.dateFin).toLocaleDateString('fr-FR') : '—'}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, color: '#475569' }}>{(c.produits || []).length}</td>
                <td style={{ padding: '11px 14px', fontSize: 13, fontWeight: 700, color: '#0f2847' }}>{fmt(montantChantier(c))} FCFA</td>
                <td style={{ padding: '11px 14px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {droits?.modifierCommandes !== false && (
                      <button onClick={() => ouvrirEdition(c)} style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#dbeafe', color: '#2563eb', cursor: 'pointer', fontSize: 14 }}>✏️</button>
                    )}
                    {droits?.supprimerDonnees !== false && (
                      <button onClick={() => demanderSuppression(c)} style={{ padding: '5px 11px', borderRadius: 6, border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal ajout / édition */}
      {modal && (
        <ModalChantier
          form={form} setForm={setForm} clients={clients}
          chantierEditee={chantierEditee}
          onAnnuler={() => setModal(false)}
          onSauvegarder={sauvegarderChantier}
        />
      )}

      {/* Confirmation suppression */}
      {aSupprimer && (
        <div className="mg-overlay" onClick={e => e.target === e.currentTarget && setASupprimer(null)}>
          <div className="mg-card" style={{ maxWidth: 400 }}>
            <div className="mg-card-body">
              <p style={{ fontSize: 14, color: '#0f2847', marginTop: 0 }}>
                Supprimer le chantier <strong>{aSupprimer.numeroAffaire}</strong> ?
              </p>
              {(aSupprimer.produits || []).length > 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8' }}>
                  Le stock des {aSupprimer.produits.length} produit(s) sorti(s) pour ce chantier sera restitué.
                </p>
              )}
              <div className="mg-actions" style={{ marginTop: 16 }}>
                <button className="mg-btn-ghost" onClick={() => setASupprimer(null)}>Annuler</button>
                <button className="mg-btn-primary" style={{ background: '#dc2626' }} onClick={confirmerSuppression}>Supprimer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Modal réutilisable pour créer / modifier un chantier ───────
function ModalChantier({ form, setForm, clients, chantierEditee, onAnnuler, onSauvegarder }) {
  return (
    <div className="mg-overlay" onClick={e => e.target === e.currentTarget && onAnnuler()}>
      <div className="mg-card" style={{ maxWidth: 480 }}>
        <div className="mg-header">
          <div className="mg-title">{chantierEditee ? 'Modifier le chantier' : 'Nouveau chantier'}</div>
          <button className="mg-close" onClick={onAnnuler}>×</button>
        </div>
        <div className="mg-card-body">
          <div className="mg-field-grid-2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="mg-label">N° Affaire *</label>
              <input className="mg-input mg-input-no-mb" value={form.numeroAffaire}
                onChange={e => setForm({ ...form, numeroAffaire: e.target.value })}
                placeholder="Ex: AFF-0001" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="mg-label">Client *</label>
              <select className="mg-select mg-select-no-mb" value={form.clientId}
                onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Sélectionner un client</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.nom}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mg-field" style={{ marginTop: 12 }}>
            <label className="mg-label">Nom chantier *</label>
            <input className="mg-input mg-input-no-mb" value={form.nomChantier}
              onChange={e => setForm({ ...form, nomChantier: e.target.value })}
              placeholder="Ex: Villa Bastos — vitrage" />
          </div>
          <div className="mg-field-grid-2" style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="mg-label">Date début</label>
              <input type="date" className="mg-input mg-input-no-mb" value={form.dateDebut}
                onChange={e => setForm({ ...form, dateDebut: e.target.value })} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <label className="mg-label">Date fin</label>
              <input type="date" className="mg-input mg-input-no-mb" value={form.dateFin}
                onChange={e => setForm({ ...form, dateFin: e.target.value })} />
            </div>
          </div>

          <div className="mg-actions mg-actions-border" style={{ marginTop: 18 }}>
            <button className="mg-btn-ghost" onClick={onAnnuler}>Annuler</button>
            <button className="mg-btn-primary" onClick={onSauvegarder}>
              {chantierEditee ? 'Enregistrer les modifications' : 'Créer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chantiers
