import { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { searchSuggestions } from '../lib/supabase.js';
import { fmt } from '../data/products.js';

export default function Header({ goHome, goShop, goAbout, goWish, toggleCart, setQuery, search, wishCount, allCategories, goCategory, goAdmin, openProduct, goSearch }) {
  const { count: cartCount } = useCart();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSugg, setShowSugg] = useState(false);
  const [suggIdx, setSuggIdx] = useState(-1);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const suggRef = useRef(null);
  const debounceRef = useRef(null);
  const localInputRef = useRef(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  useEffect(() => {
    if (mobileSearchOpen && localInputRef.current) {
      localInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const doSearch = (term) => {
    setShowSugg(false);
    setMobileSearchOpen(false);
    if (goSearch) {
      goSearch(term);
    } else {
      setQuery(term);
    }
  };

  const handleInputChange = (val) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val || val.length < 2) { setSuggestions([]); setShowSugg(false); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await searchSuggestions(val, 8);
      setSuggestions(results);
      setShowSugg(true);
      setSuggIdx(-1);
    }, 250);
  };

  const handleKeyDown = (e) => {
    if (!showSugg || suggestions.length === 0) {
      if (e.key === 'Enter' && search) doSearch(search);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSuggIdx(i => Math.min(i + 1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSuggIdx(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggIdx >= 0 && suggIdx < suggestions.length) {
        openProduct(suggestions[suggIdx].id);
        setShowSugg(false);
      } else if (suggIdx === suggestions.length) {
        doSearch(search);
      } else {
        doSearch(search);
      }
    } else if (e.key === 'Escape') {
      setShowSugg(false);
      setSuggIdx(-1);
    }
  };

  const renderSuggestions = () => {
    if (!showSugg || suggestions.length === 0) return null;
    return (
      <div className="search-sugg" ref={suggRef}>
        {suggestions.map((s, i) => (
          <div
            key={s.id}
            className={'search-sugg-item' + (i === suggIdx ? ' on' : '')}
            onMouseEnter={() => setSuggIdx(i)}
            onClick={() => { openProduct(s.id); setShowSugg(false); }}
          >
            {s.img ? <img src={s.img} alt="" className="search-sugg-img" /> : <div className="search-sugg-noimg">{(s.brand || '').charAt(0)}</div>}
            <div className="search-sugg-info">
              <div className="search-sugg-name">{s.name}</div>
              <div className="search-sugg-meta">{s.brand} {s.sku ? `· ${s.sku}` : ''}</div>
            </div>
            <div className="search-sugg-price">{fmt(s.price)}</div>
          </div>
        ))}
        <div
          className={'search-sugg-all' + (suggIdx === suggestions.length ? ' on' : '')}
          onMouseEnter={() => setSuggIdx(suggestions.length)}
          onClick={() => doSearch(search)}
        >
          Voir les résultats pour « {search} »
        </div>
      </div>
    );
  };

  return (
    <header className="hdr">
      <div className="hdr-row">
        <div className="hdr-logo" onClick={goHome}>
          <img src="/logo.jpg" alt="Le Mercier" />
          <div><div className="hdr-name">LE MERCIER</div><div className="hdr-city">ALMA</div></div>
        </div>
        <div className="hdr-center">
          <div className="hdr-search" ref={searchRef}>
            <span>⌕</span>
            <input
              value={search}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (suggestions.length > 0) setShowSugg(true); }}
              onBlur={() => setTimeout(() => setShowSugg(false), 150)}
              placeholder="Rechercher un produit, une marque, une référence…"
            />
            {renderSuggestions()}
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
          <button title="Rechercher" className="icon-btn hdr-search-mobile" onClick={() => setMobileSearchOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          </button>
          <button title="Mon compte" className="icon-btn" onClick={goAdmin}>
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

      {mobileSearchOpen && (
        <div className="mobile-search-overlay">
          <div className="mobile-search-bar">
            <button className="mobile-search-back" onClick={() => setMobileSearchOpen(false)}>←</button>
            <input
              ref={localInputRef}
              value={search}
              onChange={e => handleInputChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') doSearch(search); if (e.key === 'Escape') setMobileSearchOpen(false); }}
              placeholder="Rechercher…"
            />
          </div>
          {renderSuggestions()}
        </div>
      )}
    </header>
  );
}
