export const MODAL_CSS = `
  /* ── Overlay ── */
  .mg-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  /* ── Card (modal container) ── */
  .mg-card {
    background: #1e293b;
    border: 1px solid rgba(100, 181, 246, 0.12);
    border-radius: 14px;
    width: 100%;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.45);
    color: #e2e8f0;
  }

  .mg-card-scroll {
    max-height: 90vh;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: rgba(100, 181, 246, 0.2) transparent;
  }

  .mg-card-body {
    padding: 0 24px 24px;
  }

  /* ── Header ── */
  .mg-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 20px 24px 16px;
    border-bottom: 1px solid rgba(100, 181, 246, 0.08);
    margin-bottom: 18px;
  }

  .mg-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    background: rgba(37, 78, 136, 0.35);
    color: rgba(100, 181, 246, 0.85);
    border: 1px solid rgba(100, 181, 246, 0.18);
    border-radius: 20px;
    padding: 2px 10px;
    margin-bottom: 6px;
  }

  .mg-title {
    font-size: 17px;
    font-weight: 800;
    color: #f1f5f9;
    margin: 0;
  }

  .mg-subtitle {
    font-size: 12px;
    color: rgba(148, 190, 230, 0.6);
    margin-top: 3px;
  }

  .mg-close {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #94a3b8;
    font-size: 20px;
    line-height: 1;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .mg-close:hover {
    background: rgba(255, 255, 255, 0.12);
    color: #f1f5f9;
  }

  /* ── Divider / section label ── */
  .mg-divider {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .mg-divider-line {
    flex: 1;
    height: 1px;
    background: rgba(100, 181, 246, 0.1);
  }

  .mg-divider-label {
    font-size: 10px;
    font-weight: 800;
    color: rgba(148, 190, 230, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  /* ── Form fields ── */
  .mg-field {
    margin-bottom: 14px;
  }

  .mg-field-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 14px;
  }

  .mg-field-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    margin-bottom: 14px;
  }

  .mg-label {
    font-size: 11px;
    font-weight: 700;
    color: rgba(148, 190, 230, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: block;
    margin-bottom: 5px;
  }

  .mg-input {
    width: 100%;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1.5px solid rgba(100, 181, 246, 0.14);
    background: rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    transition: border-color 0.15s;
    margin-bottom: 14px;
  }
  .mg-input:focus {
    border-color: rgba(100, 181, 246, 0.45);
    background: rgba(255, 255, 255, 0.07);
  }
  .mg-input::placeholder {
    color: rgba(148, 190, 230, 0.3);
  }

  .mg-input-no-mb {
    margin-bottom: 0;
  }

  .mg-select {
    width: 100%;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1.5px solid rgba(100, 181, 246, 0.14);
    background: rgba(255, 255, 255, 0.04);
    color: #e2e8f0;
    font-size: 13px;
    box-sizing: border-box;
    outline: none;
    cursor: pointer;
    margin-bottom: 14px;
    transition: border-color 0.15s;
  }
  .mg-select:focus {
    border-color: rgba(100, 181, 246, 0.45);
  }
  .mg-select option {
    background: #1e293b;
    color: #e2e8f0;
  }

  .mg-select-no-mb {
    margin-bottom: 0;
  }

  /* ── Actions bar ── */
  .mg-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: wrap;
  }

  .mg-actions-border {
    border-top: 1px solid rgba(100, 181, 246, 0.08);
    padding-top: 16px;
  }

  /* ── Buttons ── */
  .mg-btn-primary {
    padding: 10px 22px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .mg-btn-primary:hover { opacity: 0.88; }

  .mg-btn-ghost {
    padding: 10px 22px;
    border-radius: 9px;
    border: 1.5px solid rgba(100, 181, 246, 0.15);
    background: transparent;
    color: #94a3b8;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .mg-btn-ghost:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
  }

  .mg-btn-danger {
    padding: 10px 22px;
    border-radius: 9px;
    border: none;
    background: linear-gradient(135deg, #b91c1c 0%, #dc2626 100%);
    color: #fff;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: opacity 0.15s;
  }
  .mg-btn-danger:hover { opacity: 0.88; }

  /* ── Confirmation modal icon ── */
  .mg-confirm-icon {
    font-size: 36px;
    margin-bottom: 12px;
    text-align: center;
  }

  /* ── Body text ── */
  .mg-body-text {
    font-size: 14px;
    color: #94a3b8;
    margin: 0 0 8px;
  }

  .mg-body-strong {
    font-weight: 700;
    color: #e2e8f0;
  }

  /* ── Responsive ── */
  @media (max-width: 560px) {
    .mg-field-grid-2,
    .mg-field-grid-3 {
      grid-template-columns: 1fr;
    }
  }
`
