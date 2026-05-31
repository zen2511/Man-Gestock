const fmt = n => new Intl.NumberFormat('fr-FR').format(n || 0)

// Blue-only palette
const B = {
  900: '#0a1929',
  800: '#0d2137',
  700: '#0f2847',
  600: '#1565c0',
  500: '#1976d2',
  400: '#2196f3',
  300: '#64b5f6',
  200: '#bbdefb',
  100: '#e3f2fd',
  50:  '#f0f7ff',
}

function Dashboard({ produits = [], clients = [], fournisseurs = [], commandes = [], mouvements = [], categories = [], setPageActive }) {
  const rupture     = produits.filter(p => (p.quantite || 0) <= 0)
  const stockFaible = produits.filter(p => (p.quantite || 0) > 0 && (p.quantite || 0) <= (p.quantiteMin || 5))
  const valeurStock = produits.reduce((acc, p) => acc + (p.prix || 0) * (p.quantite || 0), 0)
  const commandesEnCours = commandes.filter(c => c.statut === 'en_cours' || c.statut === 'en_attente')

  const derniersMvt = [...mouvements]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6)

  const repartition = categories.map(cat => ({
    ...cat,
    count: produits.filter(p => p.categorieId === cat.id || p.categorie === cat.nom).length,
  })).filter(c => c.count > 0)

  const kpis = [
    { label: 'Produits',     valeur: produits.length,     page: 'produits'     },
    { label: 'Catégories',   valeur: categories.length,   page: 'categories'   },
    { label: 'Clients',      valeur: clients.length,      page: 'clients'      },
    { label: 'Fournisseurs', valeur: fournisseurs.length, page: 'fournisseurs' },
    { label: 'Chantiers',    valeur: commandes.length,    page: 'commandes'    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: B[900], margin: 0 }}>Tableau de bord</h2>
        <p style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
          Menuiserie Aluminium du Nord SA
        </p>
      </div>

      {/* KPI */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 10,
        marginBottom: 16,
      }}>
        {kpis.map(k => (
          <div
            key={k.label}
            onClick={() => setPageActive(k.page)}
            style={{
              background: '#fff',
              border: `1px solid ${B[200]}`,
              borderRadius: 8,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'border-color 0.12s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = B[300]}
            onMouseLeave={e => e.currentTarget.style.borderColor = B[200]}
          >
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: B[700] }}>{k.valeur}</div>
          </div>
        ))}
      </div>

      {/* Valeur stock + Chantiers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        <div style={{
          background: B[700],
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: B[300], fontWeight: 500, marginBottom: 4 }}>Valeur totale du stock</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{fmt(Math.round(valeurStock))}</div>
            <div style={{ fontSize: 11, color: B[300], marginTop: 2 }}>FCFA</div>
          </div>
        </div>

        <div style={{
          background: B[600],
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 11, color: B[200], fontWeight: 500, marginBottom: 4 }}>Chantiers en cours</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{commandesEnCours.length}</div>
            <div style={{ fontSize: 11, color: B[200], marginTop: 2 }}>à traiter</div>
          </div>
        </div>
      </div>

      {/* Alertes + Catégories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>

        {/* Alertes */}
        <div style={{ background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: B[900] }}>Alertes stock</div>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: rupture.length + stockFaible.length > 0 ? B[600] : '#64748b',
              background: rupture.length + stockFaible.length > 0 ? B[100] : '#f1f5f9',
              padding: '2px 8px', borderRadius: 20,
            }}>
              {rupture.length + stockFaible.length}
            </span>
          </div>
          {rupture.length === 0 && stockFaible.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Aucune alerte</p>
          ) : (
            <>
              {rupture.slice(0, 3).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${B[50]}`, fontSize: 12 }}>
                  <span style={{ color: B[800] }}>{p.nom}</span>
                  <span style={{ fontWeight: 600, color: B[600], background: B[100], padding: '1px 7px', borderRadius: 20, fontSize: 10 }}>RUPTURE</span>
                </div>
              ))}
              {stockFaible.slice(0, 3).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${B[50]}`, fontSize: 12 }}>
                  <span style={{ color: B[800] }}>{p.nom}</span>
                  <span style={{ fontWeight: 600, color: B[500], background: B[100], padding: '1px 7px', borderRadius: 20, fontSize: 10 }}>Qté: {p.quantite}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Catégories */}
        <div style={{ background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: B[900], marginBottom: 12 }}>
            Produits par catégorie
          </div>
          {repartition.length === 0 ? (
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Aucune catégorie configurée.</p>
          ) : repartition.slice(0, 6).map(cat => (
            <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: `1px solid ${B[50]}` }}>
              <span style={{ flex: 1, fontSize: 12, color: '#334155' }}>{cat.nom}</span>
              <div style={{ width: 50, height: 4, borderRadius: 2, background: B[100], overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (cat.count / produits.length) * 100)}%`,
                  background: B[500],
                  borderRadius: 2,
                }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: B[600], minWidth: 16, textAlign: 'right' }}>{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mouvements */}
      <div style={{ background: '#fff', border: `1px solid ${B[200]}`, borderRadius: 8, padding: '16px 18px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: B[900], marginBottom: 12 }}>
          Derniers mouvements de stock
        </div>
        {derniersMvt.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Aucun mouvement enregistré.</p>
        ) : (
          derniersMvt.map((m, i) => {
            const produit = produits.find(p => p.id === m.produitId)
            const entree  = m.type === 'entree'
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                borderBottom: `1px solid ${B[50]}`,
                fontSize: 12,
              }}>
                <span style={{
                  padding: '2px 10px',
                  borderRadius: 20,
                  fontWeight: 700,
                  fontSize: 11,
                  minWidth: 44,
                  textAlign: 'center',
                  background: entree ? B[100] : '#f0f4f8',
                  color: entree ? B[600] : '#334155',
                  border: `1px solid ${entree ? B[200] : '#dce4ee'}`,
                }}>
                  {entree ? `+${m.quantite}` : `-${m.quantite}`}
                </span>
                <span style={{ flex: 1, color: '#334155' }}>
                  {produit ? produit.nom : 'Produit supprimé'}
                </span>
                {m.note && <span style={{ color: '#94a3b8', fontSize: 11 }}>{m.note}</span>}
                <span style={{ color: '#cbd5e1', fontSize: 11, flexShrink: 0 }}>
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
