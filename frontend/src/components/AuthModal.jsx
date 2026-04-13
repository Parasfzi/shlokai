import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { registerUser, loginUser, forgotPassword } from '../api';
import './AuthModal.css';

export default function AuthModal({ onClose }) {
  const { login } = useAuth();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        const res = await forgotPassword(email);
        setSuccess(res.message);
      } else {
        const data = mode === 'login' 
          ? await loginUser(email, password) 
          : await registerUser(email, password);
        login(data.access_token, data.user_id);
        onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>&times;</button>
        <h2>
          {mode === 'login' && 'Welcome Back'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'forgot' && 'Reset Password'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login' && 'Login to view your saved Shlokas.'}
          {mode === 'signup' && 'Join to save your favorite verses.'}
          {mode === 'forgot' && 'Enter your email to receive a reset link.'}
        </p>

        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="name@example.com"
            />
          </div>
          {mode !== 'forgot' && (
            <div className="form-group">
              <div className="label-with-link">
                <label>Password</label>
                {mode === 'login' && (
                  <button type="button" className="text-link" onClick={() => setMode('forgot')}>
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                minLength={6}
              />
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (
              mode === 'login' ? 'Log In' : 
              mode === 'signup' ? 'Sign Up' : 'Send Reset Link'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'login' && (
            <>Don't have an account? <button onClick={() => setMode('signup')}>Sign Up</button></>
          )}
          {mode === 'signup' && (
            <>Already have an account? <button onClick={() => setMode('login')}>Log In</button></>
          )}
          {mode === 'forgot' && (
            <button onClick={() => setMode('login')}>Back to Log In</button>
          )}
        </div>
      </div>
    </div>
  );
}
