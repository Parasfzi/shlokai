import { useState, useEffect, useCallback } from 'react';
import AmbientCanvas from './components/AmbientCanvas';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import ResultsSection from './components/ResultsSection';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import BookmarksView from './components/BookmarksView';
import DailyShlokBanner from './components/DailyShlokBanner';
import { searchVerses } from './api';
import './App.css';
export default function App() {
  const [results, setResults] = useState(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Modals state
  const [showAuth, setShowAuth] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) return;

    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setResults(null);
    setHasSearched(true);

    try {
      const data = await searchVerses(searchQuery);
      // New API returns `all_results` (all FAISS candidates) and `result` (AI-ranked best).
      // We show all candidates so users can see all relevant shlokas.
      setResults(data.all_results || data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setResults(null);
    setQuery('');
    setError(null);
    setHasSearched(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Escape key to clear
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && hasSearched) handleClear();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [hasSearched, handleClear]);

  if (showBookmarks) {
    return (
      <>
        <AmbientCanvas />
        <BookmarksView onClose={() => setShowBookmarks(false)} />
      </>
    );
  }

  return (
    <>
      <AmbientCanvas />
      <Navbar 
        onOpenAuth={() => setShowAuth(true)}
        onOpenBookmarks={() => setShowBookmarks(true)}
      />
      {!hasSearched && <DailyShlokBanner />}

      <main>
        <SearchBar onSearch={handleSearch} collapsed={hasSearched} />
        <ResultsSection
          results={results}
          query={query}
          loading={loading}
          error={error}
          onClear={handleClear}
          onAuthRequired={() => setShowAuth(true)}
        />
      </main>

      <Footer />
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
