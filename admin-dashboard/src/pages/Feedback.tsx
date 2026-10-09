import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/table.css';

interface FeedbackItem {
  id: number;
  stars: number;
  comment: string | null;
  createdAt: string;
  user: { name: string; email: string; phoneNumber: string };
}

function StarDisplay({ count }: { count: number }) {
  return (
    <span className="stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= count ? '' : 'empty'}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function Feedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<FeedbackItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    client
      .get('/admin/feedback')
      .then((res) => setFeedback(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.delete(`/admin/feedback/${deleteTarget.id}`);
      setFeedback((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Feedback</h1>
      <p className="page-subtitle">View user feedback and ratings</p>

      <div className="table-toolbar">
        <span className="table-count">{feedback.length} submissions</span>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedback.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    No feedback yet
                  </td>
                </tr>
              ) : (
                feedback.map((f) => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {f.user.name}
                    </td>
                    <td>{f.user.email}</td>
                    <td>
                      <StarDisplay count={f.stars} />
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      {f.comment || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon danger"
                          title="Delete"
                          onClick={() => setDeleteTarget(f)}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Feedback"
        message="Are you sure you want to remove this feedback entry?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
