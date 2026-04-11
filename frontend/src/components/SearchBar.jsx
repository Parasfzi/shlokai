import { useState, useRef, useEffect } from 'react';
import './SearchBar.css';

const TOPICS = ['Karma', 'Duty', 'Fear', 'Devotion', 'Soul', 'Peace', 'Meditation', 'Anger', 'Knowledge', 'Yoga'];

export default function SearchBar({ onSearch, collapsed }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Keyboard shortcut: "/" to focus
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleChip = (topic) => {
    setQuery(topic);
    onSearch(topic);
  };

  return (
    <section className={`hero ${collapsed ? 'collapsed' : ''}`}>
      <div className="hero-inner">
        {!collapsed && (
          <>
            <p className="hero-tag animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Sacred Knowledge Search Engine
            </p>
            <h1 className="hero-title animate-fade-up" style={{ animationDelay: '0.2s' }}>
              Discover the wisdom of the{' '}
              <span className="hero-scripture">Bhagavad Gita</span>
            </h1>
            <p className="hero-sub animate-fade-up" style={{ animationDelay: '0.3s' }}>
              Search through authentic Sanskrit verses and their translations.
              <br />
              Pure retrieval. No AI-generated interpretations.
            </p>
          </>
        )}

        <form className={`search-form ${collapsed ? '' : 'animate-fade-up'}`} style={collapsed ? {} : { animationDelay: '0.45s' }} onSubmit={handleSubmit}>
          <div className="search-box">
            {/* Search icon */}
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M14 14L18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>

            <input
              ref={inputRef}
              type="text"
              className="search-input"
              placeholder="Search sacred wisdom..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />

            {/* Mic button */}
            <button type="button" className="mic-btn" title="Voice input (coming soon)" aria-label="Voice input">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="5.5" y="1" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M3 7.5C3 10.26 5.24 12.5 8 12.5C10.76 12.5 13 10.26 13 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M8 12.5V15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Submit */}
            <button type="submit" className="search-btn" disabled={!query.trim()}>
              Search
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7H13M13 7L8 2M13 7L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </form>

        <div className={`chips ${collapsed ? '' : 'animate-fade-up'}`} style={collapsed ? {} : { animationDelay: '0.6s' }}>
          {TOPICS.map((t) => (
            <button key={t} className="chip" onClick={() => handleChip(t.toLowerCase())}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
