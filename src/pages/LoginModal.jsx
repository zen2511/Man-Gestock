import { useState, useEffect } from 'react'
import { login } from '../utils/auth'

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');

  .login-overlay {
    position: fixed; inset: 0;
    background: rgba(5, 14, 30, 0.75);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    z-index: 2000;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
  }

  .login-card {
    position: relative;
    width: 100%; max-width: 420px;
    background: linear-gradient(160deg, rgba(8,20,42,0.97) 0%, rgba(11,28,60,0.95) 100%);
    border: 1px solid rgba(100,181,246,0.12);
    border-radius: 20px;
    padding: 44px 38px 36px;
    box-shadow:
      0 40px 80px rgba(0,0,0,0.55),
      0 0 0 1px rgba(255,255,255,0.03) inset,
      0 1px 0 rgba(100,181,246,0.10) inset;
    animation: loginSlideUp 0.32s cubic-bezier(.22,.68,0,1.2);
    overflow: hidden;
  }

  .login-card::before {
    content: '';
    position: absolute;
    top: -80px; left: 50%;
    transform: translateX(-50%);
    width: 320px; height: 200px;
    background: radial-gradient(ellipse, rgba(21,101,192,0.22) 0%, transparent 70%);
    pointer-events: none;
  }

  @keyframes loginSlideUp {
    from { opacity: 0; transform: translateY(28px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .login-brand {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 36px;
    position: relative;
    z-index: 1;
  }

  .login-logo-ring {
    width: 60px; height: 60px;
    border-radius: 16px;
    background: linear-gradient(135deg, #0d3b6e, #1565c0);
    border: 1px solid rgba(100,181,246,0.25);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 18px;
    box-shadow: 0 8px 24px rgba(21,101,192,0.35), 0 0 0 6px rgba(21,101,192,0.08);
  }

  .login-title {
    font-size: 22px;
    font-weight: 800;
    color: #e8f4ff;
    letter-spacing: -0.3px;
    margin: 0 0 6px;
  }

  .login-subtitle {
    font-size: 12.5px;
    color: rgba(148,190,230,0.55);
    margin: 0;
    font-weight: 500;
  }

  .login-divider {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 24px;
  }
  .login-divider-line {
    flex: 1; height: 1px;
    background: rgba(100,181,246,0.08);
  }
  .login-divider-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(100,181,246,0.25);
  }

  .login-field {
    display: flex; flex-direction: column; gap: 6px;
    margin-bottom: 14px;
    position: relative; z-index: 1;
  }

  .login-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    text-transform: uppercase;
    color: rgba(148,190,230,0.6);
  }

  .login-input-wrap {
    position: relative;
    display: flex; align-items: center;
  }

  .login-input-icon {
    position: absolute; left: 13px;
    color: rgba(100,181,246,0.4);
    display: flex; align-items: center;
    pointer-events: none;
  }

  .login-input {
    width: 100%;
    padding: 12px 14px 12px 40px;
    background: rgba(255,255,255,0.04);
    border: 1.5px solid rgba(100,181,246,0.12);
    border-radius: 10px;
    color: #e8f4ff;
    font-size: 14px;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
  }
  .login-input::placeholder { color: rgba(148,190,230,0.25); }
  .login-input:focus {
    border-color: rgba(100,181,246,0.45);
    background: rgba(21,101,192,0.08);
    box-shadow: 0 0 0 3px rgba(21,101,192,0.12);
  }

  .login-toggle-mdp {
    position: absolute; right: 10px;
    background: none; border: none;
    cursor: pointer;
    color: rgba(100,181,246,0.35);
    display: flex; align-items: center;
    padding: 4px;
    transition: color 0.15s;
  }
  .login-toggle-mdp:hover { color: rgba(100,181,246,0.7); }

  .login-error {
    display: flex; align-items: center; gap: 8px;
    background: rgba(220,38,38,0.10);
    border: 1px solid rgba(220,38,38,0.25);
    border-radius: 9px;
    padding: 10px 14px;
    font-size: 13px;
    color: #fca5a5;
    margin-bottom: 14px;
    font-weight: 500;
    position: relative; z-index: 1;
  }

  .login-btn-primary {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14.5px;
    font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 48px;
    margin-top: 8px;
    margin-bottom: 10px;
    position: relative; z-index: 1;
    transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
    box-shadow: 0 4px 16px rgba(21,101,192,0.35), inset 0 1px 0 rgba(255,255,255,0.12);
    letter-spacing: 0.01em;
  }
  .login-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #1976d2 0%, #1e88e5 100%);
    box-shadow: 0 6px 22px rgba(21,101,192,0.5);
    transform: translateY(-1px);
  }
  .login-btn-primary:active:not(:disabled) { transform: translateY(0); }
  .login-btn-primary:disabled { opacity: 0.65; cursor: not-allowed; }

  .login-btn-ghost {
    width: 100%;
    padding: 11px;
    background: transparent;
    color: rgba(148,190,230,0.45);
    border: 1.5px solid rgba(100,181,246,0.10);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    text-align: center;
    transition: background 0.15s, border-color 0.15s, color 0.15s;
    position: relative; z-index: 1;
  }
  .login-btn-ghost:hover {
    background: rgba(255,255,255,0.04);
    border-color: rgba(100,181,246,0.22);
    color: rgba(148,190,230,0.7);
  }

  .login-close {
    position: absolute; top: 16px; right: 18px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(100,181,246,0.10);
    border-radius: 7px;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(148,190,230,0.35);
    font-size: 18px; line-height: 1;
    transition: background 0.15s, color 0.15s;
    z-index: 5;
  }
  .login-close:hover {
    background: rgba(220,38,38,0.12);
    border-color: rgba(220,38,38,0.25);
    color: #fca5a5;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
  .login-spinner {
    width: 18px; height: 18px;
    border: 2.5px solid rgba(255,255,255,0.25);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }

  .login-footer {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 22px;
    font-size: 10.5px;
    color: rgba(100,181,246,0.22);
    font-weight: 600;
    letter-spacing: 0.3px;
    position: relative; z-index: 1;
  }
`

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

const IconEye = ({ open }) => open ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

const IconShield = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)

const IconLogo = () => (
  <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
    <path d="M8 28V14l10-8 10 8v14H24v-8h-4v8H8z" fill="rgba(100,181,246,0.9)"/>
    <path d="M8 14l10-8 10 8" stroke="rgba(144,202,249,0.5)" strokeWidth="1.5" fill="none"/>
  </svg>
)

export default function LoginModal({ onConnecte, onFermer }) {
  const [email,   setEmail]   = useState('')
  const [mdp,     setMdp]     = useState('')
  const [erreur,  setErreur]  = useState('')
  const [loading, setLoading] = useState(false)
  const [voirMdp, setVoirMdp] = useState(false)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onFermer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onFermer])

  const handleSubmit = (e) => {
    e.preventDefault()
    setErreur('')
    if (!email || !mdp) { setErreur('Veuillez remplir tous les champs.'); return }
    setLoading(true)
    setTimeout(() => {
      const res = login(email, mdp)
      setLoading(false)
      if (res.succes) onConnecte(res.user)
      else setErreur(res.message)
    }, 420)
  }

  return (
    <div className="login-overlay" onClick={e => e.target === e.currentTarget && onFermer()}>
      <style>{CSS}</style>

      <div className="login-card">
        <button className="login-close" onClick={onFermer} title="Fermer">×</button>

        {/* Brand */}
        <div className="login-brand">
          <div className="login-logo-ring">
            <IconLogo />
          </div>
          <h2 className="login-title">MAN-SA Gestock</h2>
          <p className="login-subtitle">Connectez-vous pour accéder à votre espace</p>
        </div>

        <div className="login-divider">
          <div className="login-divider-line" />
          <span className="login-divider-label">Identifiants</span>
          <div className="login-divider-line" />
        </div>

        <form onSubmit={handleSubmit}>
          {erreur && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {erreur}
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Adresse email</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><IconMail /></span>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@mangestock.com"
                autoFocus
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <div className="login-input-wrap">
              <span className="login-input-icon"><IconLock /></span>
              <input
                className="login-input"
                type={voirMdp ? 'text' : 'password'}
                value={mdp}
                onChange={e => setMdp(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                className="login-toggle-mdp"
                onClick={() => setVoirMdp(v => !v)}
              >
                <IconEye open={voirMdp} />
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn-primary" disabled={loading}>
            {loading ? (
              <span className="login-spinner" />
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                  <polyline points="10 17 15 12 10 7"/>
                  <line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Se connecter
              </>
            )}
          </button>

          <button type="button" className="login-btn-ghost" onClick={onFermer}>
            Continuer en visiteur
          </button>
        </form>

        <div className="login-footer">
          <IconShield />
          Accès sécurisé · Man-Gestock v2.0
        </div>
      </div>
    </div>
  )
}
