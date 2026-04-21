import { useAudio } from '../context/AudioContext';
import './MiniPlayer.css';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// Simple audio waveform bars animation
function WaveVisualizer({ isPlaying }) {
  return (
    <div className={`wave-visualizer ${isPlaying ? 'active' : ''}`} aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

export default function MiniPlayer() {
  const { currentVerse, isPlaying, duration, currentTime, togglePlay, seekTo, closePlayer } = useAudio();

  if (!currentVerse) return null;

  const progress = duration ? (currentTime / duration) * 100 : 0;

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    seekTo(pct * duration);
  };

  return (
    <div className="mini-player">
      {/* Left: Verse Info + Waveform */}
      <div className="mini-player-info">
        <WaveVisualizer isPlaying={isPlaying} />
        <div className="mini-player-meta">
          <span className="mini-player-title">Chapter {currentVerse.chapter} · Verse {currentVerse.verse}</span>
          <span className="mini-player-subtitle">Sanskrit Recitation 🕉️</span>
        </div>
      </div>

      {/* Center: Controls + Seek */}
      <div className="mini-player-center">
        <button className="mini-play-btn" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <div className="mini-seek" onClick={handleSeek} role="progressbar" aria-valuenow={Math.round(progress)}>
          <div className="mini-seek-track">
            <div className="mini-seek-fill" style={{ width: `${progress}%` }} />
            <div className="mini-seek-thumb" style={{ left: `${progress}%` }} />
          </div>
        </div>
        <span className="mini-time">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      {/* Right: Close */}
      <button className="mini-close-btn" onClick={closePlayer} aria-label="Close player">✕</button>
    </div>
  );
}
