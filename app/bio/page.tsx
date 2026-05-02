import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agência BBold — Links",
  description: "Design Estratégico & Presença Digital. Atendemos todo o Brasil.",
};

export default function BioPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .bio-root {
          font-family: 'Barlow', sans-serif;
          background: #0A0A0A;
          color: #F0EFE8;
          min-height: 100svh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          position: relative;
          overflow-x: hidden;
        }

        .bio-root::before {
          content: 'BBOLD';
          font-family: 'Bebas Neue', sans-serif;
          font-size: clamp(180px, 50vw, 380px);
          position: fixed;
          bottom: -40px;
          right: -20px;
          color: rgba(245,197,24,0.03);
          line-height: 1;
          pointer-events: none;
          user-select: none;
          z-index: 0;
        }

        .bio-wrapper {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .bio-logo-wrap {
          margin-bottom: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        .bio-logo-icon {
          width: 100px;
          height: 86px;
          animation: bio-float 3.2s ease-in-out infinite;
          filter: drop-shadow(0 18px 24px rgba(245,197,24,0.18));
        }

        .bio-logo-shadow {
          width: 60px;
          height: 8px;
          background: radial-gradient(ellipse, rgba(245,197,24,0.25) 0%, transparent 70%);
          border-radius: 50%;
          animation: bio-shadow-pulse 3.2s ease-in-out infinite;
        }

        @keyframes bio-float {
          0%, 100% { transform: translateY(0px); filter: drop-shadow(0 18px 24px rgba(245,197,24,0.18)); }
          50% { transform: translateY(-12px); filter: drop-shadow(0 30px 32px rgba(245,197,24,0.08)); }
        }

        @keyframes bio-shadow-pulse {
          0%, 100% { transform: scaleX(1); opacity: 1; }
          50% { transform: scaleX(0.6); opacity: 0.4; }
        }

        .bio-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 28px;
          letter-spacing: 0.08em;
          color: #F0EFE8;
          margin-bottom: 4px;
          text-align: center;
        }

        .bio-handle {
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #F5C518;
          margin-bottom: 10px;
          text-align: center;
        }

        .bio-tag {
          font-size: 13px;
          color: rgba(240,239,232,0.45);
          text-align: center;
          line-height: 1.6;
          margin-bottom: 36px;
          max-width: 280px;
        }

        .bio-divider {
          width: 40px;
          height: 2px;
          background: #F5C518;
          border-radius: 2px;
          margin-bottom: 36px;
          opacity: 0.6;
        }

        .bio-links {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 40px;
        }

        .bio-btn {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
          padding: 18px 24px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.02em;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .bio-btn:active { transform: scale(0.97); }

        .bio-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.2s;
        }

        .bio-btn:hover::after { background: rgba(255,255,255,0.04); }

        .bio-btn--primary {
          background: #F5C518;
          color: #0A0A0A;
          animation: bio-pulse 2.5s infinite;
        }

        .bio-btn--primary:hover { box-shadow: 0 8px 32px rgba(245,197,24,0.25); }

        @keyframes bio-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(245,197,24,0.35); }
          70%  { box-shadow: 0 0 0 12px rgba(245,197,24,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,197,24,0); }
        }

        .bio-btn--secondary {
          background: #1E1E1E;
          color: #F0EFE8;
          border: 1px solid rgba(240,239,232,0.1);
        }

        .bio-btn--secondary:hover {
          border-color: rgba(245,197,24,0.3);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }

        .bio-btn--portfolio {
          background: #141414;
          color: #F0EFE8;
          border: 1px solid rgba(245,197,24,0.15);
        }

        .bio-btn--portfolio:hover {
          border-color: rgba(245,197,24,0.35);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }

        .bio-btn-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
          background: rgba(0,0,0,0.15);
        }

        .bio-btn--secondary .bio-btn-icon,
        .bio-btn--portfolio .bio-btn-icon {
          background: rgba(245,197,24,0.08);
        }

        .bio-btn-text { flex: 1; }

        .bio-btn-label {
          display: block;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          opacity: 0.55;
          margin-bottom: 2px;
        }

        .bio-btn-title {
          display: block;
          font-size: 15px;
          font-weight: 700;
        }

        .bio-btn-arrow {
          font-size: 18px;
          opacity: 0.4;
          flex-shrink: 0;
          transition: transform 0.2s, opacity 0.2s;
        }

        .bio-btn:hover .bio-btn-arrow {
          transform: translateX(4px);
          opacity: 0.8;
        }

        .bio-social {
          display: flex;
          gap: 16px;
          margin-bottom: 32px;
        }

        .bio-social-link {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #1E1E1E;
          border: 1px solid rgba(240,239,232,0.07);
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          font-size: 16px;
          transition: border-color 0.2s, transform 0.2s;
        }

        .bio-social-link:hover {
          border-color: rgba(245,197,24,0.4);
          transform: translateY(-2px);
        }

        .bio-footer {
          font-size: 11px;
          color: rgba(240,239,232,0.2);
          text-align: center;
          letter-spacing: 1px;
        }

        .bio-footer span { color: rgba(245,197,24,0.4); }
      `}</style>

      <div className="bio-root">
        <div className="bio-wrapper">

          {/* Logo animado */}
          <div className="bio-logo-wrap">
            <svg className="bio-logo-icon" viewBox="0 0 835.49 712.87" xmlns="http://www.w3.org/2000/svg" aria-label="Agência BBold">
              <path fill="#F5C518" d="M10.18,355.51C10.18,130.42,132.44,22.98,417.74,22.98s407.57,108.37,407.57,332.53-123.19,334.39-407.57,334.39S10.18,581.53,10.18,355.51ZM584.48,355.51c0-67.62-16.11,2.52-158.76,2.52s-174.7-71.06-174.7-2.52,25.01,130.61,166.73,130.61,166.73-62.07,166.73-130.61Z"/>
            </svg>
            <div className="bio-logo-shadow"></div>
          </div>

          {/* Perfil */}
          <div className="bio-name">Agência BBold</div>
          <div className="bio-handle">@agencia.bbold</div>
          <div className="bio-tag">Design Estratégico &amp; Presença Digital<br />Atendemos em todo o Brasil 🇧🇷</div>

          <div className="bio-divider"></div>

          {/* Links */}
          <div className="bio-links">
            <a className="bio-btn bio-btn--primary" href="https://wa.me/5527997341557" target="_blank" rel="noopener noreferrer">
              <div className="bio-btn-icon">💬</div>
              <div className="bio-btn-text">
                <span className="bio-btn-label">Atendimento</span>
                <span className="bio-btn-title">Fale conosco</span>
              </div>
              <span className="bio-btn-arrow">→</span>
            </a>

            <a className="bio-btn bio-btn--secondary" href="https://agenciabbold.com.br" target="_blank" rel="noopener noreferrer">
              <div className="bio-btn-icon">🌐</div>
              <div className="bio-btn-text">
                <span className="bio-btn-label">Saiba mais</span>
                <span className="bio-btn-title">Conheça nosso site</span>
              </div>
              <span className="bio-btn-arrow">→</span>
            </a>

            <a className="bio-btn bio-btn--portfolio" href="https://agenciabbold.com.br/projetos" target="_blank" rel="noopener noreferrer">
              <div className="bio-btn-icon">🎨</div>
              <div className="bio-btn-text">
                <span className="bio-btn-label">Nossos projetos</span>
                <span className="bio-btn-title">Veja nosso portfólio</span>
              </div>
              <span className="bio-btn-arrow">→</span>
            </a>
          </div>

          {/* Social */}
          <div className="bio-social">
            <a className="bio-social-link" href="https://www.instagram.com/agenciabbold" target="_blank" rel="noopener noreferrer" title="Instagram">📸</a>
            <a className="bio-social-link" href="https://www.linkedin.com/company/agenciabbold" target="_blank" rel="noopener noreferrer" title="LinkedIn">💼</a>
            <a className="bio-social-link" href="mailto:contato@agenciabbold.com.br" title="E-mail">✉️</a>
          </div>

          {/* Footer */}
          <p className="bio-footer">© 2026 <span>BBOLD Studio</span> · Serra, ES</p>

        </div>
      </div>
    </>
  );
}
