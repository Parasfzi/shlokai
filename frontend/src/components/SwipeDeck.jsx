import { useState, useRef } from 'react';
import VerseCard from './VerseCard';
import './SwipeDeck.css';

export default function SwipeDeck({ results, query, onAuthRequired }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const total = results.length;

  const goNext = () => setCurrentIndex(i => Math.min(i + 1, total - 1));
  const goPrev = () => setCurrentIndex(i => Math.max(i - 1, 0));

  const onPointerDown = (e) => {
    dragStart.current = e.clientX;
    setIsDragging(true);
  };

  const onPointerMove = (e) => {
    if (!isDragging || dragStart.current === null) return;
    setDragX(e.clientX - dragStart.current);
  };

  const onPointerUp = () => {
    if (dragX < -80) goNext();
    else if (dragX > 80) goPrev();
    setDragX(0);
    setIsDragging(false);
    dragStart.current = null;
  };

  return (
    <div className="swipe-deck-wrapper">
      {/* Deck Stack Preview (cards behind) */}
      <div className="swipe-deck">
        {/* Background stacked cards */}
        {[2, 1].map((offset) => {
          const idx = currentIndex + offset;
          if (idx >= total) return null;
          return (
            <div
              key={idx}
              className="deck-card-bg"
              style={{
                transform: `translateY(${offset * 10}px) scale(${1 - offset * 0.04})`,
                zIndex: 10 - offset,
              }}
            />
          );
        })}

        {/* Active card */}
        {currentIndex < total && (
          <div
            className={`deck-card-active ${isDragging ? 'dragging' : ''}`}
            style={{
              transform: `translateX(${dragX}px) rotate(${dragX * 0.04}deg)`,
              zIndex: 20,
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          >
            <VerseCard
              verse={results[currentIndex]}
              index={0}
              onAuthRequired={onAuthRequired}
              searchQuery={query}
            />
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="deck-controls">
        <button
          className="deck-nav-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
          aria-label="Previous verse"
        >
          ←
        </button>

        {/* Dot indicators */}
        <div className="deck-dots">
          {results.map((_, i) => (
            <button
              key={i}
              className={`deck-dot ${i === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to verse ${i + 1}`}
            />
          ))}
        </div>

        <button
          className="deck-nav-btn"
          onClick={goNext}
          disabled={currentIndex === total - 1}
          aria-label="Next verse"
        >
          →
        </button>
      </div>

      <p className="deck-hint">
        <span>Swipe or use arrows to navigate</span>
        <span className="deck-counter">{currentIndex + 1} / {total}</span>
      </p>
    </div>
  );
}
