import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './VerseCard.css';

export default function VerseCard({ verse, index, onAuthRequired }) {
  const cardRef = useRef(null);
  const [showHindi, setShowHindi] = useState(false);
  const { isLoggedIn, isBookmarked, toggleBookmark } = useAuth();
  
  const bookmarked = isBookmarked(verse.chapter, verse.verse);

  useEffect(() => {
    const timer = setTimeout(() => {
      cardRef.current?.classList.add('visible');
    }, 100 * index);
    return () => clearTimeout(timer);
  }, [index]);

  const sanskritLines = verse.sanskrit.split('\n');
  const hasHindi = verse.hindi_translation && verse.hindi_translation.trim();

  return (
    <article ref={cardRef} className="verse-card">
      <div className="card-glow" aria-hidden="true" />

      <div className="card-header">
        <div className="card-header-left">
          <span className="card-badge">
            <span className="badge-dot" aria-hidden="true" />
            Chapter {verse.chapter} · Verse {verse.verse}
          </span>
          {verse.score != null && (
            <span className="card-relevance" title="Relevance score">
              {Math.round(verse.score * 100)}% match
            </span>
          )}
        </div>
        <button 
          className={`bookmark-btn ${bookmarked ? 'saved' : ''}`}
          onClick={() => isLoggedIn ? toggleBookmark(verse.chapter, verse.verse) : onAuthRequired?.()}
          title={bookmarked ? "Remove Bookmark" : "Save Bookmark"}
        >
          {bookmarked ? '💛' : '🤍'}
        </button>
      </div>

      <div className="card-sanskrit" lang="sa">
        {sanskritLines.map((line, i) => (
          <span key={i}>
            {line}
            {i < sanskritLines.length - 1 && <br />}
          </span>
        ))}
      </div>

      {/* English Translation */}
      <p className="card-translation">{verse.translation}</p>

      {/* Hindi Translation */}
      {hasHindi && (
        <div className="card-hindi-section">
          <button
            className="hindi-toggle"
            onClick={() => setShowHindi(prev => !prev)}
            aria-expanded={showHindi}
          >
            <span className="hindi-toggle-icon">{showHindi ? '▲' : '▼'}</span>
            हिन्दी अनुवाद
          </button>
          {showHindi && (
            <p className="card-hindi-translation" lang="hi">
              {verse.hindi_translation}
            </p>
          )}
        </div>
      )}
    </article>
  );
}
