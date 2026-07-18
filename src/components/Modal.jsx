function Modal({ titre, onFermer, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.4)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: 28,
        width: 480,
        maxWidth: '90vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }}>

        {/* En-tête modal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f2847' }}>
            {titre}
          </h2>
          <button
            onClick={onFermer}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              fontSize: 16,
              color: '#64748b',
            }}
          >
            ✕
          </button>
        </div>

        {children}

      </div>
    </div>
  )
}

export default Modal