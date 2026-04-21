import { createContext, useContext, useRef, useState, useCallback } from 'react';

const AudioContext = createContext();

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [currentVerse, setCurrentVerse] = useState(null); // { chapter, verse, sanskrit }
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const playVerse = useCallback((verse) => {
    const src = `/audio/verse_recitation/${verse.chapter}/${verse.verse}.mp3`;

    // If same verse, just toggle
    if (currentVerse?.chapter === verse.chapter && currentVerse?.verse === verse.verse) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    // New verse — stop old, load new
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio(src);
    audioRef.current = audio;
    setCurrentVerse(verse);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('error', () => { setIsPlaying(false); console.warn('[Audio] Failed to load:', src); });

    audio.play().catch(() => setIsPlaying(false));
  }, [currentVerse, isPlaying]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const seekTo = useCallback((time) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setCurrentVerse(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return (
    <AudioContext.Provider value={{
      currentVerse, isPlaying, duration, currentTime,
      playVerse, togglePlay, seekTo, closePlayer
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export const useAudio = () => useContext(AudioContext);
