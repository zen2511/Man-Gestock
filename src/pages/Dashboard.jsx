import { useState } from 'react'

const fmt    = n  => new Intl.NumberFormat('fr-FR').format(n || 0)
const fmtPct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0

function GraphMouvements({ mouvements }) {
  // Grouper par jour sur les 30 derniers jours
  const today = new Date()
  today.setHours(0,0,0,0)

  const jours = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    jours.push(d)
  }

  const data = jours.map(d => {
    const key = d.toISOString().slice(0, 10)
    const mvts = mouvements.filter(m => m.date && m.date.slice(0, 10) === key)
    return {
      label: d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      entrees: mvts.filter(m => m.type === 'entree').reduce((s, m) => s + (m.quantite || 0), 0),
      sorties: mvts.filter(m => m.type === 'sortie').reduce((s, m) => s + (m.quantite || 0), 0),
    }
  })

  const maxVal = Math.max(...data.map(d => Math.max(d.entrees, d.sorties)), 1)
  const totalEntrees = data.reduce((s, d) => s + d.entrees, 0)
  const totalSorties = data.reduce((s, d) => s + d.sorties, 0)

  // Dimensions SVG
  const W = 580, H = 140, PAD_L = 32, PAD_R = 8, PAD_T = 10, PAD_B = 28
  const chartW = W - PAD_L - PAD_R
  const chartH = H - PAD_T - PAD_B
  const barW   = Math.max(3, Math.floor(chartW / jours.length / 2) - 1)
  const step   = chartW / jours.length

  // Graduations Y (3 lignes)
  const ticks = [0, Math.round(maxVal / 2), maxVal]

  // Afficher seulement 1 label sur 5 pour ne pas surcharger l'axe X
  const showLabel = (i) => i % 5 === 0 || i === jours.length - 1

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#0f2847' }}>
          Mouvements de stock · 30 derniers jours
        </p>
        <div style={{ display: 'flex', gap: 14 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#1976d2', display: 'inline-block' }}/>
            Entrées <strong style={{ color: '#0f2847' }}>{fmt(totalEntrees)}</strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: '#e2e8f0', border: '1.5px solid #94a3b8', display: 'inline-block' }}/>
            Sorties <strong style={{ color: '#0f2847' }}>{fmt(totalSorties)}</strong>
          </span>
        </div>
      </div>

      {mouvements.length === 0 ? (
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, paddingBottom: 8 }}>Aucun mouvement enregistré.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          {/* Grille horizontale */}
          {ticks.map((t, i) => {
            const y = PAD_T + chartH - (t / maxVal) * chartH
            return (
              <g key={i}>
                <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y}
                  stroke={i === 0 ? '#cbd5e1' : '#f1f5f9'} strokeWidth={i === 0 ? 1 : 0.8} />
                {t > 0 && (
                  <text x={PAD_L - 4} y={y + 3.5} textAnchor="end"
                    fontSize="8" fill="#94a3b8">{t}</text>
                )}
              </g>
            )
          })}

          {/* Barres */}
          {data.map((d, i) => {
            const x     = PAD_L + i * step + step / 2
            const hE    = d.entrees > 0 ? Math.max(2, (d.entrees / maxVal) * chartH) : 0
            const hS    = d.sorties > 0 ? Math.max(2, (d.sorties / maxVal) * chartH) : 0
            const yBase = PAD_T + chartH

            return (
              <g key={i}>
                {/* Barre entrée */}
                {hE > 0 && (
                  <rect x={x - barW - 1} y={yBase - hE} width={barW} height={hE}
                    fill="#1976d2" rx="1.5" opacity="0.9" />
                )}
                {/* Barre sortie */}
                {hS > 0 && (
                  <rect x={x + 1} y={yBase - hS} width={barW} height={hS}
                    fill="#94a3b8" rx="1.5" opacity="0.7" />
                )}
                {/* Label axe X */}
                {showLabel(i) && (
                  <text x={x} y={H - 4} textAnchor="middle"
                    fontSize="7.5" fill="#94a3b8">{d.label}</text>
                )}
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

// ── Helpers stats mensuelles ────────────────────────────────────────────────
function getDebutMois() {
  const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d
}

function statsStock(produits, mouvements) {
  const debut = getDebutMois()

  // Mouvements du mois en cours
  const mvtsMois = mouvements.filter(m => m.date && new Date(m.date) >= debut)

  // Valeur totale du stock actuel
  const valeurStockActuel = produits.reduce(
    (s, p) => s + (p.prixUnitaire || 0) * (p.stock || 0), 0
  )

  // Valeur des entrées du mois (qté × prix unitaire du produit)
  const valeurEntreesMois = mvtsMois
    .filter(m => m.type === 'entree')
    .reduce((s, m) => {
      const p = produits.find(p => p.id === m.produitId)
      return s + (p?.prixUnitaire || 0) * (m.quantite || 0)
    }, 0)

  // Valeur des sorties du mois
  const valeurSortiesMois = mvtsMois
    .filter(m => m.type === 'sortie')
    .reduce((s, m) => {
      const p = produits.find(p => p.id === m.produitId)
      return s + (p?.prixUnitaire || 0) * (m.quantite || 0)
    }, 0)

  // Nombre total de mouvements du mois
  const nbMouvementsMois = mvtsMois.length

  // Produits en rupture et en stock faible
  const produitsRupture = produits.filter(p => (p.stock || 0) <= 0)
  const produitsFaibles = produits.filter(p => {
    const q = p.stock || 0; return q > 0 && q <= (p.stockMin || 5)
  })

  // Marge brute estimée du mois (sorties − coût d'achat des entrées)
  const margeBrute = valeurSortiesMois - valeurEntreesMois

  return {
    valeurStockActuel,
    valeurEntreesMois,
    valeurSortiesMois,
    nbMouvementsMois,
    produitsRupture,
    produitsFaibles,
    margeBrute,
  }
}

function Dashboard({ produits = [], categories = [], mouvements = [], setPageActive }) {
  const [modalRuptures, setModalRuptures] = useState(false)
  const valeurStock   = produits.reduce((s, p) => s + (p.prixUnitaire || p.prix || 0) * (p.stock || p.quantite || 0), 0)
  const totalArticles = produits.reduce((s, p) => s + (p.stock || p.quantite || 0), 0)
  const ruptures      = produits.filter(p => (p.stock || p.quantite || 0) <= 0)
  const faibles       = produits.filter(p => {
    const q = p.stock ?? p.quantite ?? 0
    return q > 0 && q <= (p.stockMin || 5)
  })

  // Stats mensuelles pour l'expert comptable
  const statsMois = statsStock(produits, mouvements)

  const repartition = categories
    .map(cat => ({
      ...cat,
      count: produits.filter(p => p.categorieId === cat.id || p.categorie === cat.nom).length,
    }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const top5 = [...produits]
    .sort((a, b) => {
      const va = (a.prixUnitaire || a.prix || 0) * (a.stock || a.quantite || 0)
      const vb = (b.prixUnitaire || b.prix || 0) * (b.stock || b.quantite || 0)
      return vb - va
    })
    .slice(0, 5)

  const maxVal = top5[0]
    ? (top5[0].prixUnitaire || top5[0].prix || 0) * (top5[0].stock || top5[0].quantite || 0)
    : 1

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: '#0f172a' }}>

      {/* En-tête */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase' }}>
          MAN Gestion de Stock
        </p>
        <h2 style={{ margin: '4px 0 0', fontSize: 22, fontWeight: 700, color: '#0f172a' }}>
          Vue d'ensemble
        </h2>
      </div>

      {/* Ligne principale : 3 métriques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>

        {/* Valeur stock — carte accentuée */}
        <div
          onClick={() => setPageActive('produits')}
          style={{
            background: '#0f2847',
            borderRadius: 10,
            padding: '20px 22px',
            cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.92'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#64b5f6', textTransform: 'uppercase' }}>
            Valeur du stock
          </p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {fmt(Math.round(valeurStock))}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#90caf9' }}>FCFA</p>
        </div>

        {/* Produits */}
        <div
          onClick={() => setPageActive('produits')}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 10,
            padding: '20px 22px',
            cursor: 'pointer',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#93c5fd'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
        >
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
            Références
          </p>
          <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#0f2847', lineHeight: 1 }}>
            {produits.length}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>{fmt(totalArticles)} unités en stock</p>
        </div>

        {/* Alertes */}
        <div
          onClick={() => ruptures.length > 0 || faibles.length > 0 ? setModalRuptures(true) : null}
          style={{
            background: ruptures.length > 0 ? '#fff5f5' : '#fff',
            border: `1px solid ${ruptures.length > 0 ? '#fecaca' : '#e2e8f0'}`,
            borderRadius: 10,
            padding: '20px 22px',
            cursor: ruptures.length > 0 || faibles.length > 0 ? 'pointer' : 'default',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { if (ruptures.length > 0 || faibles.length > 0) e.currentTarget.style.borderColor = ruptures.length > 0 ? '#f87171' : '#93c5fd' }}
          onMouseLeave={e => e.currentTarget.style.borderColor = ruptures.length > 0 ? '#fecaca' : '#e2e8f0'}
        >
          <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase' }}>
            Alertes stock
          </p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 26, fontWeight: 700, color: ruptures.length > 0 ? '#dc2626' : '#16a34a', lineHeight: 1 }}>
              {ruptures.length}
            </p>
            {faibles.length > 0 && (
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f97316' }}>
                +{faibles.length} faibles
              </p>
            )}
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>
            {ruptures.length === 0 ? 'Aucune rupture' : 'en rupture'}
          </p>
        </div>
      </div>

      {/* Ligne secondaire : top produits + catégories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* Top produits par valeur */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#0f2847' }}>
            Top produits · valeur
          </p>
          {top5.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Aucun produit.</p>
          ) : top5.map((p, i) => {
            const val = (p.prixUnitaire || p.prix || 0) * (p.stock || p.quantite || 0)
            const pct = fmtPct(val, maxVal)
            return (
              <div key={p.id} style={{ marginBottom: i < top5.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#334155', maxWidth: '65%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.designation || p.nom}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1e40af' }}>
                    {fmt(Math.round(val))} F
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#1976d2', borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Répartition par catégorie */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 700, color: '#0f2847' }}>
            Répartition · catégories
          </p>
          {repartition.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Aucune catégorie.</p>
          ) : repartition.map((cat, i) => {
            const pct = fmtPct(cat.count, produits.length)
            return (
              <div key={cat.id} style={{ marginBottom: i < repartition.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: '#334155' }}>
                    {cat.icone ? `${cat.icone} ` : ''}{cat.nom}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                    {cat.count} <span style={{ color: '#94a3b8', fontWeight: 400 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: '#f1f5f9', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#64b5f6', borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Graphe mouvements */}
      <div style={{ marginTop: 12 }}>
        <GraphMouvements mouvements={mouvements} />
      </div>

      {/* ── Rapport mensuel expert comptable ── */}
      <div style={{ marginTop: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '18px 20px' }}>
        <p style={{ margin: '0 0 14px', fontSize: 12, fontWeight: 700, color: '#0f2847' }}>
          Rapport du mois · {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valeur stock actuel</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1565c0' }}>{fmt(Math.round(statsMois.valeurStockActuel))} F</p>
          </div>
          <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Entrées du mois</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#16a34a' }}>{fmt(Math.round(statsMois.valeurEntreesMois))} F</p>
          </div>
          <div style={{ background: '#fff7ed', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sorties du mois</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#c2410c' }}>{fmt(Math.round(statsMois.valeurSortiesMois))} F</p>
          </div>
          <div style={{ background: statsMois.margeBrute >= 0 ? '#f0fdf4' : '#fff5f5', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Marge brute estimée</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: statsMois.margeBrute >= 0 ? '#16a34a' : '#dc2626' }}>
              {statsMois.margeBrute >= 0 ? '+' : ''}{fmt(Math.round(statsMois.margeBrute))} F
            </p>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mouvements du mois</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f2847' }}>{statsMois.nbMouvementsMois}</p>
          </div>
          <div style={{ background: statsMois.produitsRupture.length > 0 ? '#fff5f5' : '#f8fafc', borderRadius: 8, padding: '12px 14px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ruptures / Faibles</p>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: statsMois.produitsRupture.length > 0 ? '#dc2626' : '#64748b' }}>
              {statsMois.produitsRupture.length} / {statsMois.produitsFaibles.length}
            </p>
          </div>
        </div>
      </div>

      {/* Ruptures (conditionnel) */}
      {ruptures.length > 0 && (
        <div style={{ marginTop: 12, background: '#fff', border: '1px solid #fecaca', borderRadius: 10, padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
            Ruptures de stock · {ruptures.length} produit{ruptures.length > 1 ? 's' : ''}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ruptures.map(p => (
              <span key={p.id} style={{
                fontSize: 11, fontWeight: 600, color: '#dc2626',
                background: '#fef2f2', border: '1px solid #fecaca',
                padding: '3px 10px', borderRadius: 20,
              }}>
                {p.designation || p.nom}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal détail ruptures ── */}
      {modalRuptures && (
        <>
          <div onClick={() => setModalRuptures(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,25,41,0.45)', zIndex: 200 }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            zIndex: 201, background: '#fff', borderRadius: 12,
            width: '90%', maxWidth: 480, maxHeight: '82vh',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 12px 50px rgba(10,25,41,0.22)',
            border: '1px solid #fecaca',
          }}>
            {/* En-tête */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#7f1d1d' }}>🔔 Alertes stock</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {ruptures.length} rupture{ruptures.length > 1 ? 's' : ''}
                  {faibles.length > 0 && ` · ${faibles.length} stock${faibles.length > 1 ? 's' : ''} faible${faibles.length > 1 ? 's' : ''}`}
                </div>
              </div>
              <button onClick={() => setModalRuptures(false)}
                style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 9px', cursor: 'pointer', color: '#dc2626', fontSize: 16, lineHeight: 1 }}>×</button>
            </div>

            {/* Corps */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>

              {ruptures.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                    En rupture ({ruptures.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {ruptures.map(p => (
                      <div key={p.id} style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.designation || p.nom}
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                              {p.reference && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px' }}>Réf : {p.reference}</span>}
                              {(p.categorie || p.categorieNom) && <span style={{ fontSize: 10, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px' }}>{p.categorie || p.categorieNom}</span>}
                              {p.ral && <span style={{ fontSize: 10, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px' }}>RAL {p.ral}</span>}
                              {p.serie && <span style={{ fontSize: 10, color: '#475569', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px' }}>{p.serie}</span>}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>0</div>
                            <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>en stock</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 14, marginTop: 8, paddingTop: 8, borderTop: '1px solid #fee2e2' }}>
                          {p.prixUnitaire != null && <span style={{ fontSize: 11, color: '#475569' }}>Prix : <strong style={{ color: '#0f172a' }}>{new Intl.NumberFormat('fr-FR').format(p.prixUnitaire)} FCFA</strong></span>}
                          {p.stockMin != null && <span style={{ fontSize: 11, color: '#475569' }}>Stock min : <strong style={{ color: '#dc2626' }}>{p.stockMin}</strong></span>}
                          {p.fournisseur && <span style={{ fontSize: 11, color: '#475569' }}>Fourn. : <strong>{p.fournisseur}</strong></span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {faibles.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: 8 }}>
                    Stock faible ({faibles.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {faibles.map(p => {
                      const q = p.stock ?? p.quantite ?? 0
                      const min = p.stockMin || 5
                      const pct = Math.round((q / min) * 100)
                      return (
                        <div key={p.id} style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.designation || p.nom}</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                                {p.reference && <span style={{ fontSize: 10, color: '#64748b', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 4, padding: '1px 6px' }}>Réf : {p.reference}</span>}
                                {(p.categorie || p.categorieNom) && <span style={{ fontSize: 10, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 4, padding: '1px 6px' }}>{p.categorie || p.categorieNom}</span>}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontSize: 18, fontWeight: 800, color: '#f97316', lineHeight: 1 }}>{q}</div>
                              <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 1 }}>min : {min}</div>
                            </div>
                          </div>
                          <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: '#fed7aa', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: '#f97316', borderRadius: 2 }} />
                          </div>
                          <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: 'right' }}>{pct}% du seuil minimum</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pied */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid #fee2e2', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => { setModalRuptures(false); setPageActive('produits') }}
                style={{ padding: '7px 16px', background: '#1565c0', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                Gérer les produits →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Dashboard
