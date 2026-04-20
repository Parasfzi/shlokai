import './ResultsSection.css';
import VerseCard from './VerseCard';

export default function ResultsSection({ results, query, loading, error, onClear, onAuthRequired }) {
  if (!loading && !results && !error) return null;

  return (
    <section className="results-section" aria-live="polite">
      {/* LOADING */}
      {loading && (
        <div className="state-loading">
          <div className="loader">
            <div className="loader-ring" />
            <span className="loader-om">ॐ</span>
          </div>
          <p className="state-text">Searching sacred texts...</p>
        </div>
      )}

      {/* ERROR */}
      {error && !loading && (
        <div className="state-error">
          <div className="state-icon">⚠️</div>
          <p className="state-title">Connection Error</p>
          <p className="state-text">
            Could not reach the backend. Make sure the FastAPI server is running on
            <code> localhost:8000</code>
          </p>
        </div>
      )}

      {/* NO RESULTS */}
      {!loading && !error && results && results.length === 0 && (
        <div className="state-empty">
          <div className="state-icon">🙏</div>
          <p className="state-title">No relevant shlok found.</p>
          <p className="state-text">Try a different query or use the suggested topics above.</p>
        </div>
      )}

      {/* RESULTS */}
      {!loading && !error && results && results.length > 0 && (
        <>
          <div className="results-bar">
            <p className="results-info">
              Found <strong>{results.length}</strong> verse{results.length > 1 ? 's' : ''} for
              "<strong>{query}</strong>"
            </p>
            <button className="clear-btn" onClick={onClear}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Clear
            </button>
          </div>

          <div className="results-list">
            {results.map((verse, i) => (
              <VerseCard
                key={`${verse.chapter}-${verse.verse}`}
                verse={verse}
                index={i}
                onAuthRequired={onAuthRequired}
                searchQuery={query}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
