import React, { createContext, useState, useEffect, useContext } from 'react';
import { getBookmarks, addBookmark, removeBookmark } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('shlokai_token'));
  const [userId, setUserId] = useState(localStorage.getItem('shlokai_user_id'));
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (token) {
      loadBookmarks();
    } else {
      setBookmarks([]);
    }
  }, [token]);

  const loadBookmarks = async () => {
    try {
      const data = await getBookmarks();
      setBookmarks(data);
    } catch (err) {
      console.error(err);
      if (err.message.includes('401')) logout(); // Token expired
    }
  };

  const login = (newToken, newUserId) => {
    localStorage.setItem('shlokai_token', newToken);
    localStorage.setItem('shlokai_user_id', newUserId);
    setToken(newToken);
    setUserId(newUserId);
  };

  const logout = () => {
    localStorage.removeItem('shlokai_token');
    localStorage.removeItem('shlokai_user_id');
    setToken(null);
    setUserId(null);
  };

  const isBookmarked = (chapter, verse) => {
    return bookmarks.some(b => b.chapter === chapter && b.verse === verse);
  };

  const toggleBookmark = async (chapter, verse) => {
    if (!token) return; // Must be logged in

    if (isBookmarked(chapter, verse)) {
      await removeBookmark(chapter, verse);
      setBookmarks(prev => prev.filter(b => !(b.chapter === chapter && b.verse === verse)));
    } else {
      await addBookmark(chapter, verse);
      // Optimistically reload
      loadBookmarks();
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      userId,
      isLoggedIn: !!token,
      bookmarks,
      login,
      logout,
      isBookmarked,
      toggleBookmark,
      loadBookmarks
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
