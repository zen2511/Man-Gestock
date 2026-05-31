import { useState } from 'react'
import { genId } from '../utils/storage'

const champStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  color: '#0f2847',
  background: '#f8fafc',
  boxSizing: 'border-box',
  outline: 'none',
}

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

function FormProduit({ produit, fournisseurs, onSauvegarder, onAnnuler }) {

  const [form, setForm] = useState({
    nom:          produit?.nom          || '',
    categorie:    produit?.categorie    || '',
    quantite:     produit?.quantite     || 0,
    quantiteMin:  produit?.quantiteMin  || 5,
    prix:         produit?.prix         || 0,
    fournisseurId:produit?.fournisseurId|| '',
  })

  const changer = (champ, valeur) => {
    setForm(prev => ({ ...prev, [champ]: valeur }))
  }

  const soumettre = () => {
    if (!form.nom.trim()) return alert('Le nom du produit est obligatoire')
    if (form.quantiteMin < 0)  return alert('La quantité minimum doit être positive')

    const nouveauProduit = {
      id: produit?.id || genId(),
      ...form,
      quantite:    Number(form.quantite),
      quantiteMin: Number(form.quantiteMin),
      prix:        Number(form.prix),
    }
    onSauvegarder(nouveauProduit)
  }

  return (
    <div>
      {/* Nom */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Nom du produit *</label>
        <input
          style={champStyle}
          value={form.nom}
          onChange={e => changer('nom', e.target.value)}
          placeholder="Ex: Riz Basmati 50kg"
        />
      </div>

      {/* Catégorie */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Catégorie</label>
        <input
          style={champStyle}
          value={form.categorie}
          onChange={e => changer('categorie', e.target.value)}
          placeholder="Ex: Alimentation, Hygiène..."
        />
      </div>

      {/* Quantité + Quantité min (côte à côte) */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Quantité en stock</label>
          <input
            style={champStyle}
            type="number" min="0"
            value={form.quantite}
            onChange={e => changer('quantite', e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Quantité minimum ⚠️</label>
          <input
            style={champStyle}
            type="number" min="0"
            value={form.quantiteMin}
            onChange={e => changer('quantiteMin', e.target.value)}
          />
        </div>
      </div>

      {/* Prix unitaire */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Prix unitaire (FCFA)</label>
        <input
          style={champStyle}
          type="number" min="0"
          value={form.prix}
          onChange={e => changer('prix', e.target.value)}
          placeholder="0"
        />
      </div>

      {/* Fournisseur */}
      <div style={{ marginBottom: 24 }}>
        <label style={labelStyle}>Fournisseur</label>
        <select
          style={{ ...champStyle, appearance: 'none' }}
          value={form.fournisseurId}
          onChange={e => changer('fournisseurId', e.target.value)}
        >
          <option value="">-- Sélectionner --</option>
          {fournisseurs.map(f => (
            <option key={f.id} value={f.id}>{f.nom}</option>
          ))}
        </select>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button
          onClick={onAnnuler}
          style={{
            padding: '9px 20px', borderRadius: 8,
            border: '1px solid #cbd5e1', background: '#fff',
            color: '#64748b', cursor: 'pointer', fontWeight: 600,
          }}
        >
          Annuler
        </button>
        <button
          onClick={soumettre}
          style={{
            padding: '9px 20px', borderRadius: 8,
            border: 'none', background: '#2563eb',
            color: '#fff', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {produit ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}

export default FormProduit