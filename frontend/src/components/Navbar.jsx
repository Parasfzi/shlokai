import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const SCRIPTURES = [
  { id: 'bhagavad-gita', label: 'Bhagavad Gita', active: true },
  { id: 'ramayana', label: 'Ramayana', locked: true },
  { id: 'vedas', label: 'Vedas', locked: true },
  { id: 'upanishads', label: 'Upanishads', locked: true },
];

export default function Navbar({ onScriptureChange, onOpenAuth, onOpenBookmarks }) {
  const { isLoggedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(SCRIPTURES[0]);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSelect = (scripture) => {
    if (scripture.locked) return;
    setSelected(scripture);
    setOpen(false);
    onScriptureChange?.(scripture);
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-inner">
        <a href="/" className="nav-brand">
          <img src="/logo.png" alt="ShlokAI Logo" className="brand-logo" />
          <span className="brand-name">
            Shlok<span className="brand-ai">AI</span>
          </span>
        </a>

        <div className="nav-right" ref={dropdownRef}>
          <button
            className="scripture-trigger"
            onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="trigger-dot" />
            <span className="trigger-label">{selected.label}</span>
            <svg className={`trigger-chevron ${open ? 'rotated' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <ul className={`scripture-dropdown ${open ? 'open' : ''}`} role="listbox">
            {SCRIPTURES.map((s) => (
              <li
                key={s.id}
                role="option"
                aria-selected={s.id === selected.id}
                className={`dropdown-option ${s.id === selected.id ? 'active' : ''} ${s.locked ? 'locked' : ''}`}
                onClick={() => handleSelect(s)}
              >
                <span className="option-dot" />
                {s.label}
                {s.locked && <span className="badge-soon">Soon</span>}
              </li>
            ))}
          </ul>
          
          <div className="nav-auth-section">
            {isLoggedIn ? (
              <button className="bookmarks-trigger" onClick={onOpenBookmarks} title="Saved Shlokas">
                <span className="bookmarks-icon" role="img" aria-label="bookmark">🔖</span>
                <span className="bookmarks-text">Saved Shlokas</span>
              </button>
            ) : (
              <button className="auth-trigger" onClick={onOpenAuth}>
                Log In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
