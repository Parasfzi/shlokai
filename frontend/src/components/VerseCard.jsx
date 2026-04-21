import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { explainVerse } from '../api';
import './VerseCard.css';

export default function VerseCard({ verse, index, onAuthRequired, searchQuery }) {
  const cardRef = useRef(null);
  const [showHindi, setShowHindi] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [explainStatus, setExplainStatus] = useState('idle'); // idle, streaming, done, error
  const [explanation, setExplanation] = useState('');
  const { isLoggedIn, isBookmarked, toggleBookmark } = useAuth();
  
  const bookmarked = isBookmarked(verse.chapter, verse.verse);

  const handleExplain = async () => {
    // If already fetched — just toggle visibility
    if (explainStatus === 'done') {
      setShowExplain(prev => !prev);
      return;
    }
    setShowExplain(true);
    setExplanation('');
    setExplainStatus('streaming');

    try {
      const response = await explainVerse(verse.chapter, verse.verse, searchQuery || '');
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        setExplanation(fullText);
      }

      setExplainStatus('done');
    } catch (err) {
      console.error('[Explain Stream Error]', err);
      setExplainStatus('error');
    }
  };

  // Parse structured explanation into 3 sections
  const parseExplanation = (text) => {
    const sections = [];
    const markers = [
      { key: 'connection', icon: '\uD83D\uDD17', label: 'Connection' },
      { key: 'meaning',    icon: '\uD83D\uDCD6', label: 'Meaning' },
      { key: 'insight',   icon: '\uD83D\uDCA1', label: 'Insight' },
    ];
    markers.forEach(({ icon, label }) => {
      const regex = new RegExp(`${icon}\\s*${label}:\\s*([\\s\\S]*?)(?=${markers.map(m => m.icon).join('|')}|$)`, 'i');
      const match = text.match(regex);
      if (match) sections.push({ icon, label, content: match[1].trim() });
    });
    // Fallback: if parsing fails, return raw text
    return sections.length ? sections : [{ icon: '\uD83D\uDD49\uFE0F', label: '', content: text }];
  };

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

        <div className="card-hindi-section">
          <button
            className="hindi-toggle"
            onClick={() => setShowHindi(prev => !prev)}
            aria-expanded={showHindi}
          >
            <span className="hindi-toggle-icon">{showHindi ? '\u25b2' : '\u25bc'}</span>
            {'\u0939\u093f\u0928\u094d\u0926\u0940 \u0905\u0928\u0941\u0935\u093e\u0926'}
          </button>

          {showHindi && (
            <p className="card-hindi-translation" lang="hi">
              {verse.hindi_translation}
            </p>
          )}
        </div>
      

      {/* AI Explain Button + Panel */}
      <div className="card-explain-section">
        <button
          className={`explain-btn ${showExplain ? 'active' : ''}`}
          onClick={handleExplain}
          disabled={explainStatus === 'streaming'}
        >
          {explainStatus === 'streaming' ? (
            <><span className="explain-spinner" /> Streaming...</>           
          ) : (
            <>{showExplain && explainStatus === 'done' ? '\u25b2 Hide Explanation' : '\u2728 Explain This Verse'}</>
          )}
        </button>

        {showExplain && (
          <div className="explain-panel">
            {explainStatus === 'streaming' && !explanation && (
              <div className="explain-loading">
                <span className="explain-spinner large" />
                <span>Krishna is thinking...</span>
              </div>
            )}
            {explainStatus === 'error' && (
              <p className="explain-error">Could not generate explanation. Please try again.</p>
            )}
            {(explainStatus === 'streaming' || explainStatus === 'done') && explanation && (
              <>
                {parseExplanation(explanation).map((section, i) => (
                  <div key={i} className="explain-section">
                    {section.label && (
                      <div className="explain-section-header">
                        <span className="explain-icon">{section.icon}</span>
                        <span className="explain-label">{section.label}</span>
                      </div>
                    )}
                    <p className="explain-content">{section.content}</p>
                  </div>
                ))}
                {explainStatus === 'streaming' && <span className="stream-cursor" />}
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
