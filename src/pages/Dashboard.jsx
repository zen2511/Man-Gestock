const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0)

function Dashboard({ produits = [], clients = [], fournisseurs = [], commandes = [], mouvements = [], categories = [], setPageActive }) {

  const rupture     = produits.filter(p => (p.stock || 0) <= 0)
  const stockFaible = produits.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= (p.stockMin || 5))
  const valeurStock = 0
  const commandesEnCours = commandes.filter(c => c.statut === 'en_cours' || c.statut === 'en_attente')

  const derniersMvt = [...mouvements]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)

  // Répartition par catégorie
  const repartition = categories.map(cat => ({
    ...cat,
    count: produits.filter(p => p.categorieId === cat.id || p.categorie === cat.nom).length,
  })).filter(c => c.count > 0)

  return (
    <div>
      {/* Titre */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f2847', margin: 0 }}>
          Tableau de bord
        </h2>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>
          Vue d'ensemble
        </p>
      </div>

      {/* KPI cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {[
          { label: 'Produits',        valeur: produits.length,        couleur: '#0f2847', bg: '#e8eef7', icone: '📦' },
          { label: 'Catégories',      valeur: categories.length,      couleur: '#1e5fa8', bg: '#dbeafe', icone: '🗂️' },
          { label: 'Clients',         valeur: clients.length,         couleur: '#8b5cf6', bg: '#ede9fe', icone: '👥' },
          { label: 'Fournisseurs',    valeur: fournisseurs.length,    couleur: '#d97706', bg: '#fef3c7', icone: '🚚' },
          { label: 'Chantiers',       valeur: commandes.length,       couleur: '#059669', bg: '#d1fae5', icone: '🏗️' },
        ].map(carte => (
          <div key={carte.label} style={{
            background: '#ffffff',
            border: '1px solid #e8eef7',
            borderRadius: 14,
            padding: '18px 20px',
            borderLeft: `4px solid ${carte.couleur}`,
            cursor: 'pointer',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>{carte.label}</div>
                <div style={{ fontSize: 30, fontWeight: 800, color: carte.couleur }}>{carte.valeur}</div>
              </div>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: carte.bg, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 18,
              }}>
                {carte.icone}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Valeur stock + Chantiers en cours */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0f2847, #1e5fa8)',
          borderRadius: 14, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#93b8d8', fontWeight: 600, marginBottom: 6 }}>Valeur totale du stock</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>
              {fmt(Math.round(valeurStock))}
            </div>
            <div style={{ fontSize: 12, color: '#7aa3cc', marginTop: 2 }}>FCFA</div>
          </div>
          <div style={{ fontSize: 36 }}>💰</div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #c0392b, #e74c3c)',
          borderRadius: 14, padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#fca5a5', fontWeight: 600, marginBottom: 6 }}>Chantiers en cours</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#ffffff' }}>{commandesEnCours.length}</div>
            <div style={{ fontSize: 12, color: '#fca5a5', marginTop: 2 }}>à traiter</div>
          </div>
          <div style={{ fontSize: 36 }}>📋</div>
        </div>
      </div>

      {/* Alertes + Catégories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Alertes stock */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            ⚠️ Alertes stock
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444', background: '#fef2f2', padding: '3px 10px', borderRadius: 20 }}>
              {rupture.length + stockFaible.length} alerte(s)
            </span>
          </div>
          {rupture.length === 0 && stockFaible.length === 0 ? (
            <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>✅ Aucune alerte</p>
          ) : (
            <>
              {rupture.slice(0, 3).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#7f1d1d' }}>{p.designation || p.nom}</span>
                  <span style={{ fontWeight: 700, color: '#ef4444', background: '#fef2f2', padding: '1px 8px', borderRadius: 20, fontSize: 11 }}>RUPTURE</span>
                </div>
              ))}
              {stockFaible.slice(0, 3).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                  <span style={{ color: '#78350f' }}>{p.designation || p.nom}</span>
                  <span style={{ fontWeight: 700, color: '#f97316', background: '#fff7ed', padding: '1px 8px', borderRadius: 20, fontSize: 11 }}>Stock: {p.stock}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Répartition catégories */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginBottom: 14 }}>
            🗂️ Produits par catégorie
          </div>
          {repartition.slice(0, 6).map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ fontSize: 14 }}>{cat.icone}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#334155' }}>{cat.nom}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 60, height: 6, borderRadius: 3, background: '#f1f5f9', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(100, (cat.count / produits.length) * 100)}%`,
                    background: cat.couleur || '#0f2847',
                  }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: cat.couleur || '#0f2847', minWidth: 20 }}>{cat.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Derniers mouvements */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '18px 20px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#0f2847', marginBottom: 14 }}>
          🔄 Derniers mouvements de stock
        </div>
        {derniersMvt.length === 0 ? (
          <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
            Aucun mouvement enregistré.
          </p>
        ) : (
          derniersMvt.map((m, i) => {
            const produit = produits.find(p => p.id === m.produitId)
            const entree  = m.type === 'entree'
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 0', borderBottom: '1px solid #f8fafc', fontSize: 13,
              }}>
                <span style={{
                  padding: '3px 12px', borderRadius: 20, fontWeight: 700, fontSize: 12, minWidth: 52, textAlign: 'center',
                  background: entree ? '#dcfce7' : '#fee2e2',
                  color: entree ? '#16a34a' : '#dc2626',
                  border: `1px solid ${entree ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {entree ? `+${m.quantite}` : `-${m.quantite}`}
                </span>
                <span style={{ flex: 1, color: '#334155', fontWeight: 500 }}>
                  {produit ? produit.nom : 'Produit supprimé'}
                </span>
                {m.note && <span style={{ color: '#94a3b8', fontSize: 12 }}>{m.note}</span>}
                <span style={{ color: '#cbd5e1', fontSize: 12, flexShrink: 0 }}>
                  {new Date(m.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Dashboard
