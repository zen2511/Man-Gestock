import { useState, useEffect } from 'react'
import { login } from '../utils/auth'

export default function LoginModal({ onConnecte, onFermer }) {
  const [email, setEmail]     = useState('')
  const [mdp, setMdp]         = useState('')
  const [erreur, setErreur]   = useState('')
  const [loading, setLoading] = useState(false)
  const [voirMdp, setVoirMdp] = useState(false)

  // Fermer avec Échap
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFermer])

  const handleSubmit = (e) => {
    e.preventDefault()
    setErreur('')
    if (!email || !mdp) { setErreur('Remplis tous les champs.'); return }
    setLoading(true)
    setTimeout(() => {
      const res = login(email, mdp)
      setLoading(false)
      if (res.succes) {
        onConnecte(res.user)
      } else {
        setErreur(res.message)
      }
    }, 400)
  }

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onFermer()}>
      <div style={styles.modal}>

        {/* Bouton fermer */}
        <button onClick={onFermer} style={styles.btnClose} title="Fermer">×</button>

        {/* En-tête */}
        <div style={styles.header}>
          <div style={styles.logoWrap}>
            <svg width="32" height="32" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#f97316"/>
              <path d="M10 26V16l8-6 8 6v10H22v-6h-4v6H10z" fill="white"/>
            </svg>
          </div>
          <h2 style={styles.titre}>Connexion</h2>
          <p style={styles.sousTitre}>Identifie-toi pour modifier les données</p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {erreur && (
            <div style={styles.errBox}>⚠️ &nbsp;{erreur}</div>
          )}

          <div style={styles.champ}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrap}>
              <span style={styles.ico}>✉️</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="exemple@email.com"
                style={styles.input}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.champ}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrap}>
              <span style={styles.ico}>🔒</span>
              <input
                type={voirMdp ? 'text' : 'password'}
                value={mdp}
                onChange={e => setMdp(e.target.value)}
                placeholder="••••••••"
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setVoirMdp(v => !v)}
                style={styles.toggleMdp}
              >{voirMdp ? '🙈' : '👁️'}</button>
            </div>
          </div>

          <button type="submit" style={styles.btnLogin} disabled={loading}>
            {loading
              ? <span style={styles.spinner} />
              : '🔑 Se connecter'
            }
          </button>

          <button type="button" onClick={onFermer} style={styles.btnVisiteur}>
            Continuer en visiteur
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes slideUp { from { opacity:0; transform:translateY(30px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(15,23,42,.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 2000,
  },
  modal: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 20,
    padding: '36px 32px 28px',
    width: '100%', maxWidth: 400,
    position: 'relative',
    animation: 'slideUp .3s ease',
    boxShadow: '0 30px 70px rgba(0,0,0,.5)',
    fontFamily: "'Segoe UI', sans-serif",
  },
  btnClose: {
    position: 'absolute', top: 14, right: 16,
    background: 'none', border: 'none',
    fontSize: 26, color: '#64748b',
    cursor: 'pointer', lineHeight: 1,
    transition: 'color .2s',
  },
  header: { textAlign: 'center', marginBottom: 28 },
  logoWrap: { display: 'inline-flex', marginBottom: 10 },
  titre: { margin: '0 0 6px', fontSize: 22, fontWeight: 800, color: '#f8fafc' },
  sousTitre: { margin: 0, fontSize: 13, color: '#94a3b8' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  errBox: {
    background: '#fee2e2', color: '#dc2626',
    borderRadius: 8, padding: '10px 14px', fontSize: 13,
  },
  champ: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrap: { position: 'relative', display: 'flex', alignItems: 'center' },
  ico: { position: 'absolute', left: 12, fontSize: 15, pointerEvents: 'none' },
  input: {
    width: '100%', padding: '11px 14px 11px 38px',
    background: '#0f172a', border: '1.5px solid #334155',
    borderRadius: 9, color: '#f8fafc', fontSize: 14,
    outline: 'none', boxSizing: 'border-box',
  },
  toggleMdp: {
    position: 'absolute', right: 10,
    background: 'none', border: 'none',
    cursor: 'pointer', fontSize: 15, padding: 4,
  },
  btnLogin: {
    marginTop: 4,
    padding: '12px',
    background: 'linear-gradient(135deg, #f97316, #ea580c)',
    color: 'white', border: 'none', borderRadius: 9,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 46,
  },
  btnVisiteur: {
    padding: '10px',
    background: 'transparent',
    color: '#64748b', border: '1.5px solid #334155',
    borderRadius: 9, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textAlign: 'center',
  },
  spinner: {
    width: 18, height: 18,
    border: '3px solid rgba(255,255,255,.3)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin .7s linear infinite',
    display: 'inline-block',
  },
}
