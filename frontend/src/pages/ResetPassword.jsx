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
        <h2>Reset Password</h2>
        <p className="reset-subtitle">Enter your new secure password below.</p>

        {status === 'success' ? (
          <div className="reset-success">
            {message} Redirecting to login...
          </div>
        ) : (
          <>
            {status === 'error' && <div className="reset-error">{message}</div>}
            
            <form onSubmit={handleSubmit} className="reset-form">
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6}
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                className="reset-submit-btn" 
                disabled={status === 'loading' || !token}
              >
                {status === 'loading' ? 'Updating...' : 'Set New Password'}
              </button>
            </form>
          </>
        )}
        
        <div className="reset-footer">
          <a href="/">Back to Home</a>
        </div>
      </div>
    </div>
  );
}
