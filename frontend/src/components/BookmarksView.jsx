import { useAuth } from '../context/AuthContext';
import VerseCard from './VerseCard';
import './BookmarksView.css';

export default function BookmarksView({ onClose }) {
  const { bookmarks, logout } = useAuth();

  return (
    <div className="bookmarks-view">
      <div className="bookmarks-header">
        <div className="bookmarks-title-row">
          <h2>Your Saved Shlokas</h2>
          <div className="bookmarks-actions">
            <button className="auth-logout-btn" onClick={logout}>Log Out</button>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>
        <p>A sacred collection of verses you have bookmarked.</p>
      </div>

      <div className="bookmarks-list">
        {bookmarks.length === 0 ? (
          <div className="empty-bookmarks">
            <span className="empty-icon">🔖</span>
            <h3>No bookmarks yet</h3>
            <p>Save your favorite verses by clicking the heart icon on any card.</p>
          </div>
        ) : (
          bookmarks.map((verse, idx) => (
            <VerseCard key={verse.id} verse={verse} index={idx} />
          ))
        )}
      </div>
    </div>
  );
}
