import { useState, useEffect } from 'react';
import { resetPassword } from '../api';
import './ResetPassword.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const t = urlParams.get('token');
    if (t) {
      setToken(t);
    } else {
      setStatus('error');
      setMessage('Invalid or missing reset token.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    setStatus('loading');
    try {
      const data = await resetPassword(token, password);
      setStatus('success');
      setMessage(data.message);
      // After success, wait a bit then redirect home
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  };

  return (
    <div className="reset-container">
      <div className="reset-card">
        <div className="reset-header-icon">🕉️</div>
        <h2>Reset Password</h2>
        <p className="reset-subtitle">Enter your new secure password below to restore access.</p>

        {status === 'success' ? (
          <div className="reset-success">
            <div className="success-icon">✓</div>
            <p>{message}</p>
            <p className="redirect-note">Redirecting to login in a moment...</p>
          </div>
        ) : (
          <>
            {status === 'error' && <div className="reset-error">{message}</div>}
            
            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                    minLength={6}
                    placeholder="Enter new password"
                  />
                  <div className="input-focus-line"></div>
                </div>
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <div className="input-wrapper">
                  <input 
                    type="password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    required 
                    minLength={6}
                    placeholder="Confirm new password"
                  />
                  <div className="input-focus-line"></div>
                </div>
              </div>
              <button 
                type="submit" 
                className="reset-submit-btn" 
                disabled={status === 'loading' || !token}
              >
                {status === 'loading' ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Updating...
                  </span>
                ) : 'Set New Password'}
              </button>
            </form>
          </>
        )}
        
        <div className="reset-footer">
          <a href="/" className="back-link">
            <span className="back-arrow">←</span> Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
