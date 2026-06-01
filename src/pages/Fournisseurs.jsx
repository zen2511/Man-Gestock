import { useState } from 'react'
import { genId } from '../utils/storage'
import * as XLSX from 'xlsx'

const CHAMPS_VIDES = {
  nom: '', adresse: '', telephone: '', email: '',
  categoriesLivrees: [], note: ''
}

const norm = (txt) =>
  String(txt || '').trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')

function Fournisseurs({ fournisseurs, produits = [], categories = [], droits }) {
  const { donnees, ajouter, modifier, effacer } = fournisseurs

  const [recherche,        setRecherche]        = useState('')
  const [modal,            setModal]            = useState(false)
  const [fournisseurEdite, setFournisseurEdite] = useState(null)
  const [form,             setForm]             = useState(CHAMPS_VIDES)
  const [confirmation,     setConfirmation]     = useState(null)
  const [detail,           setDetail]           = useState(null)

  // ── Styles ──────────────────────────────────────────────
  const sInput = {
    width: '100%', padding: '10px 14px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', fontSize: 14, marginBottom: 0,
    boxSizing: 'border-box', outline: 'none', background: '#f8fafc', color: '#0f2847',
  }
  const sLabel = {
    fontSize: 11, fontWeight: 700, color: '#64748b',
    textTransform: 'uppercase', letterSpacing: '0.5px',
    display: 'block', marginBottom: 6,
  }
  const btnP = {
    padding: '9px 22px', borderRadius: 8, border: 'none',
    background: '#1565c0', color: '#fff',
    fontWeight: 700, fontSize: 14, cursor: 'pointer',
  }
  const btnS = {
    padding: '9px 22px', borderRadius: 8,
    border: '1.5px solid #e2e8f0', background: '#fff',
    fontSize: 14, cursor: 'pointer', color: '#64748b',
  }

  // ── Helpers ──────────────────────────────────────────────
  const liste = donnees.filter(f =>
    norm(f.nom).includes(norm(recherche)) ||
    (f.telephone || '').includes(recherche)
  )

  const toggleCategorie = (catId) => {
    const deja = (form.categoriesLivrees || []).includes(catId)
    setForm({
      ...form,
      categoriesLivrees: deja
        ? form.categoriesLivrees.filter(id => id !== catId)
        : [...(form.categoriesLivrees || []), catId]
    })
  }

  const getCategoriesNoms = (f) => {
    const ids = f.categoriesLivrees || []
    return ids.map(id => categories.find(c => c.id === id)).filter(Boolean)
  }

  // ── CRUD ────────────────────────────────────────────────
  const ouvrirAjout = () => {
    setFournisseurEdite(null)
    setForm(CHAMPS_VIDES)
    setModal(true)
  }

  const ouvrirEdition = (f, e) => {
    e?.stopPropagation()
    setFournisseurEdite(f)
    setForm({ ...CHAMPS_VIDES, ...f, categoriesLivrees: f.categoriesLivrees || [] })
    setModal(true)
  }

  const sauvegarder = () => {
    if (!form.nom.trim()) return
    if (fournisseurEdite) {
      modifier(fournisseurEdite.id, form)
      if (detail?.id === fournisseurEdite.id) setDetail({ ...detail, ...form })
    } else {
      ajouter({ ...form, id: genId(), dateCreation: new Date().toISOString() })
    }
    setModal(false)
  }

  const demanderSuppression = (f, e) => { e?.stopPropagation(); setConfirmation(f) }

  const supprimer = () => {
    effacer(confirmation.id)
    if (detail?.id === confirmation.id) setDetail(null)
    setConfirmation(null)
  }

  // ── Export Excel ─────────────────────────────────────────
  const exporterExcel = () => {
    const rows = donnees.map(f => ({
      'Nom':              f.nom       || '',
      'Téléphone':        f.telephone || '',
      'Email':            f.email     || '',
      'Adresse':          f.adresse   || '',
      'Catégories livrées': getCategoriesNoms(f).map(c => c.nom).join(', '),
      'Note':             f.note      || '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Fournisseurs')
    XLSX.writeFile(wb, `fournisseurs_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // ── Import Excel ─────────────────────────────────────────
  const importerExcel = (event) => {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb    = XLSX.read(new Uint8Array(e.target.result), { type: 'array' })
        const ws    = wb.Sheets[wb.SheetNames[0]]
        let lignes  = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (lignes.length === 0) { alert('Fichier vide.'); return }
        let n = 0
        lignes.forEach(l => {
          const nom = (l['Nom'] || '').toString().trim()
          if (!nom) return
          const nomsCategories = (l['Catégories livrées'] || '').toString().split(',').map(s => s.trim()).filter(Boolean)
          const categoriesLivrees = nomsCategories
            .map(nc => categories.find(c => norm(c.nom) === norm(nc)))
            .filter(Boolean)
            .map(c => c.id)
          const existant = donnees.find(f => norm(f.nom) === norm(nom))
          const data = {
            nom,
            telephone: (l['Téléphone'] || l['Telephone'] || '').toString().trim(),
            email:     (l['Email'] || '').toString().trim(),
            adresse:   (l['Adresse'] || '').toString().trim(),
            note:      (l['Note'] || '').toString().trim(),
            categoriesLivrees,
          }
          if (existant) modifier(existant.id, data)
          else ajouter({ id: genId(), ...data, dateCreation: new Date().toISOString() })
          n++
        })
        alert(`${n} fournisseur(s) importé(s) !`)
      } catch (err) {
        console.error(err)
        alert('Erreur de lecture du fichier.')
      }
    }
    reader.readAsArrayBuffer(file)
    event.target.value = ''
  }

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: 24 }}>

      {/* Colonne principale */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* En-tête */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f2847', margin: 0 }}>
              Fournisseurs
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>
              {donnees.length} fournisseur{donnees.length !== 1 ? 's' : ''} enregistré{donnees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="file" id="fourn-upload" accept=".xlsx,.xls" onChange={importerExcel} style={{ display: 'none' }} />
            <button onClick={() => document.getElementById('fourn-upload').click()} style={{ ...btnS, fontSize: 13 }}>
              Importer
            </button>
            <button onClick={exporterExcel} style={{ ...btnS, fontSize: 13 }}>
              Exporter
            </button>
            <button onClick={ouvrirAjout} style={btnP}>
              + Nouveau
            </button>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ position: 'relative', maxWidth: 420, marginBottom: 20 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 15 }}>🔍</span>
          <input
            placeholder="Rechercher par nom ou téléphone..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
            style={{ ...sInput, paddingLeft: 36 }}
          />
        </div>

        {/* Grille */}
        {liste.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: 14 }}>
            {recherche ? 'Aucun fournisseur trouvé.' : 'Aucun fournisseur. Cliquez sur "+ Nouveau".'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {liste.map(f => {
              const actif   = detail?.id === f.id
              const catNoms = getCategoriesNoms(f)
              return (
                <div
                  key={f.id}
                  onClick={() => setDetail(f)}
                  style={{
                    background: '#fff',
                    border: actif ? '2px solid #1565c0' : '1.5px solid #e2e8f0',
                    borderRadius: 14,
                    padding: '16px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    borderTop: actif ? '4px solid #1565c0' : '4px solid #e2e8f0',
                  }}
                >
                  {/* Avatar + nom */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '50%',
                      background: '#e3f2fd', color: '#1565c0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: 17, flexShrink: 0,
                    }}>
                      {f.nom.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#0f2847', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.nom}
                      </div>
                      {f.telephone && (
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {f.telephone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Badges catégories */}
                  {catNoms.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                      {catNoms.map(cat => (
                        <span key={cat.id} style={{
                          fontSize: 11, fontWeight: 700,
                          padding: '3px 10px', borderRadius: 20,
                          background: (cat.couleur || '#1565c0') + '18',
                          color: cat.couleur || '#1565c0',
                          border: `1px solid ${(cat.couleur || '#1565c0')}35`,
                        }}>
                          {cat.nom}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {f.note && (
                    <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12, fontStyle: 'italic' }}>
                      {f.note.length > 50 ? f.note.slice(0, 50) + '…' : f.note}
                    </div>
                  )}

                  {/* Boutons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={e => ouvrirEdition(f, e)} style={{ ...btnS, flex: 1, fontSize: 12, padding: '6px 0' }}>
                      Modifier
                    </button>
                    <button onClick={e => demanderSuppression(f, e)} style={{ ...btnS, flex: 1, fontSize: 12, padding: '6px 0', color: '#dc2626', borderColor: '#fecaca' }}>
                      Retirer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Panneau détail */}
      {detail && (() => {
        const catNoms = getCategoriesNoms(detail)
        return (
          <div style={{
            width: 290, flexShrink: 0,
            background: '#fff', border: '1.5px solid #e2e8f0',
            borderRadius: 16, padding: '22px 20px',
            alignSelf: 'flex-start', position: 'sticky', top: 0,
          }}>
            <button onClick={() => setDetail(null)} style={{ float: 'right', background: 'none', border: 'none', fontSize: 22, color: '#94a3b8', cursor: 'pointer' }}>×</button>

            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              background: '#e3f2fd', color: '#1565c0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 24, margin: '0 auto 14px',
            }}>
              {detail.nom.charAt(0).toUpperCase()}
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f2847' }}>{detail.nom}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>Fournisseur</div>
            </div>

            {/* Infos */}
            {[
              { label: 'Téléphone', val: detail.telephone },
              { label: 'Email',     val: detail.email },
              { label: 'Adresse',   val: detail.adresse },
              { label: 'Note',      val: detail.note },
            ].map(({ label, val }) => val ? (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 13, color: '#1e293b' }}>{val}</div>
              </div>
            ) : null)}

            {/* Catégories livrées */}
            {catNoms.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 8 }}>
                  Catégories livrées
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {catNoms.map(cat => (
                    <span key={cat.id} style={{
                      fontSize: 12, fontWeight: 700,
                      padding: '4px 12px', borderRadius: 20,
                      background: (cat.couleur || '#1565c0') + '18',
                      color: cat.couleur || '#1565c0',
                      border: `1px solid ${(cat.couleur || '#1565c0')}35`,
                    }}>
                      {cat.nom}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {detail.dateCreation && (
              <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 16, textAlign: 'center' }}>
                Ajouté le {new Date(detail.dateCreation).toLocaleDateString('fr-FR')}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={e => ouvrirEdition(detail, e)} style={{ ...btnP, flex: 1, fontSize: 13 }}>Modifier</button>
              <button onClick={e => demanderSuppression(detail, e)} style={{ ...btnS, flex: 1, fontSize: 13, color: '#dc2626', borderColor: '#fecaca' }}>Retirer</button>
            </div>
          </div>
        )
      })()}

      {/* Modal ajout / édition */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '28px 30px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f2847', marginBottom: 22, marginTop: 0 }}>
              {fournisseurEdite ? 'Modifier le fournisseur' : '+ Nouveau fournisseur'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={sLabel}>Nom *</label>
                <input style={sInput} value={form.nom}
                  onChange={e => setForm({ ...form, nom: e.target.value })}
                  placeholder="Nom société ou personne" />
              </div>
              <div>
                <label style={sLabel}>Adresse</label>
                <input style={sInput} value={form.adresse}
                  onChange={e => setForm({ ...form, adresse: e.target.value })}
                  placeholder="Ville, quartier..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={sLabel}>Téléphone</label>
                  <input style={sInput} value={form.telephone}
                    onChange={e => setForm({ ...form, telephone: e.target.value })}
                    placeholder="699 123 456" />
                </div>
                <div>
                  <label style={sLabel}>Email</label>
                  <input style={sInput} value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemple.com" />
                </div>
              </div>

              {/* Catégories livrées */}
              <div>
                <label style={sLabel}>Catégories livrées</label>
                {categories.length === 0 ? (
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>Aucune catégorie disponible. Créez-en dans Catégories.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0' }}>
                    {categories.map(cat => {
                      const selectionne = (form.categoriesLivrees || []).includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          onClick={() => toggleCategorie(cat.id)}
                          style={{
                            padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
                            cursor: 'pointer', transition: 'all 0.12s',
                            background: selectionne ? (cat.couleur || '#1565c0') : '#fff',
                            color: selectionne ? '#fff' : (cat.couleur || '#1565c0'),
                            border: `2px solid ${cat.couleur || '#1565c0'}`,
                          }}
                        >
                          {cat.nom}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <div>
                <label style={sLabel}>Note</label>
                <input style={sInput} value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Note optionnelle..." />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setModal(false)} style={btnS}>Annuler</button>
              <button onClick={sauvegarder} style={btnP}>
                {fournisseurEdite ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmation suppression */}
      {confirmation && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: '26px 28px', width: '100%', maxWidth: 360 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginTop: 0 }}>Retirer ce fournisseur ?</h3>
            <p style={{ color: '#64748b', fontSize: 14 }}>
              <strong>{confirmation.nom}</strong> sera supprimé définitivement.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmation(null)} style={btnS}>Annuler</button>
              <button onClick={supprimer} style={{ ...btnP, background: '#dc2626' }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Fournisseurs
