import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function Header({ goHome, goShop, goAbout, goWish, toggleCart, setQuery, search, wishCount, allCategories, goCategory, goAdmin }) {
  const { count: cartCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  return (
    <header className="hdr">
      <div className="hdr-row">
        <div className="hdr-logo" onClick={goHome}>
          <img src="/logo.jpg" alt="Le Mercier" />
          <div><div className="hdr-name">LE MERCIER</div><div className="hdr-city">ALMA</div></div>
        </div>
        <div className="hdr-center">
          <div className="hdr-search">
            <span>⌕</span>
            <input value={search} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un produit, une marque…" />
          </div>
          <nav className="hdr-nav">
            <span onClick={goHome}>Accueil</span>
            <span onClick={() => goShop('Nouveautés')}>Nouveautés</span>
            <div className="nav-dropdown" ref={dropdownRef}>
              <span className="nav-dropdown-trigger" onClick={() => setDropdownOpen(o => !o)}>
                Boutique <span className={'nav-chevron' + (dropdownOpen ? ' open' : '')}>▾</span>
              </span>
              {dropdownOpen && (
                <div className="nav-dropdown-menu">
                  {(allCategories || []).map(c => (
                    <div key={c} className="nav-dropdown-item" onClick={() => { setDropdownOpen(false); goCategory(c); }}>
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="sale" onClick={() => goShop('Soldes')}>Soldes</span>
            <span onClick={goAbout}>À propos</span>
          </nav>
        </div>
        <div className="hdr-icons">
          <button title="Mon compte" className="icon-btn" onClick={() => { console.log('goAdmin clicked'); goAdmin(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ pointerEvents: 'none' }}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>
          </button>
          <button title="Liste de souhaits" className="icon-btn" onClick={goWish}>
            ♡{wishCount > 0 && <span className="badge">{wishCount}</span>}
          </button>
          <button className="cart-btn" onClick={toggleCart}>Panier<span>{cartCount}</span></button>
        </div>
      </div>
      {allCategories && allCategories.length > 0 && (
        <div className="hdr-catbar">
          <div className="wrap hdr-catbar-inner">
            {allCategories.map(c => (
              <span key={c} className="hdr-catbar-item" onClick={() => goCategory(c)}>{c}</span>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
