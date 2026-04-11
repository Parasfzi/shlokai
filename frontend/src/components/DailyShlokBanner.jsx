import { useState, useEffect } from 'react';
import { getDailyShlok } from '../api';
import './DailyShlokBanner.css';

export default function DailyShlokBanner() {
  const [shlok, setShlok] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    // Check if user already dismissed it today
    const lastDismissed = localStorage.getItem('shlokai_daily_dismissed');
    const today = new Date().toDateString();
    
    if (lastDismissed === today) {
      setClosed(true);
      return;
    }

    const fetchDaily = async () => {
      try {
        const data = await getDailyShlok();
        setShlok(data);
      } catch (err) {
        console.error('Failed to load daily shlok', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDaily();
  }, []);

  const handleDismiss = () => {
    setClosed(true);
    localStorage.setItem('shlokai_daily_dismissed', new Date().toDateString());
  };

  if (closed || loading || !shlok) return null;

  return (
    <div className="daily-banner">
      <div className="daily-banner-content">
        <span className="daily-badge">✨ Shlok of the Day</span>
        <div className="daily-text">
          <span className="daily-sanskrit">{shlok.sanskrit} </span>
          <span className="daily-translation">"{shlok.translation}"</span>
        </div>
        <span className="daily-reference">— Chapter {shlok.chapter}, Verse {shlok.verse}</span>
      </div>
      <button className="daily-close" onClick={handleDismiss} title="Dismiss">
        &times;
      </button>
    </div>
  );
}
