/* ─── API Configuration ─── */
const getApiBase = () => {
    // If explicitly set, use it
    if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;
    
    // Local development
    if (window.location.hostname === 'localhost') return 'http://localhost:8000';
    if (window.location.hostname.startsWith('192.168')) return `http://${window.location.hostname}:8000`;
    
    // Production (Vercel) default
    return 'https://parasfzi-shlokai-backend.hf.space';
};

const API_BASE = getApiBase();

/**
 * Search sacred texts via backend API.
 * Falls back to empty results on error.
 */
export async function searchVerses(query, topK = 5, mode = 'pure') {
  try {
    const response = await fetch(`${API_BASE}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: query,
        top_k: topK,
        mode,
        enhance: false,    // Disabled for speed — enable if you have a fast OpenRouter key
        smart_rank: false,  // Disabled for speed — FAISS top result is already great
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[API] Search failed:', error);
    throw error;
  }
}

/**
 * Check backend health.
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE}/health`);
    return await response.json();
  } catch {
    return { status: 'offline' };
  }
}

/* ─── Authentication & Bookmarks API ─── */

function getAuthHeader() {
  const token = localStorage.getItem('shlokai_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function registerUser(email, password) {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Registration failed');
  }
  return await response.json();
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Login failed');
  }
  return await response.json();
}

export async function addBookmark(chapter, verse) {
  const response = await fetch(`${API_BASE}/bookmarks`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...getAuthHeader()
    },
    body: JSON.stringify({ chapter, verse }),
  });
  if (!response.ok) throw new Error('Failed to bookmark');
  return await response.json();
}

export async function removeBookmark(chapter, verse) {
  const response = await fetch(`${API_BASE}/bookmarks/${chapter}/${verse}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to remove bookmark');
  return await response.json();
}

export async function getBookmarks() {
  const response = await fetch(`${API_BASE}/bookmarks`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error('Failed to fetch bookmarks');
  return await response.json();
}

export async function getDailyShlok() {
  const response = await fetch(`${API_BASE}/daily_shlok`);
  if (!response.ok) throw new Error('Failed to fetch daily shlok');
  return await response.json();
}

export async function forgotPassword(email) {
  const response = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Failed to send reset email');
  }
  return await response.json();
}

export async function resetPassword(token, newPassword) {
  const response = await fetch(`${API_BASE}/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || 'Password reset failed');
  }
  return await response.json();
}
