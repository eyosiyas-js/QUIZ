import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import ConfirmDialog from '../components/ConfirmDialog';
import '../styles/table.css';

interface Winner {
  id: number;
  drawId: number;
  userId: string;
  rewardType: string;
  drawTime: string;
  user: { name: string; email: string; phoneNumber: string };
}

export default function LotteryWinners() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState<string | null>(null);
  const [drawResult, setDrawResult] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Winner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchWinners = () => {
    setLoading(true);
    client
      .get('/admin/lottery-winners')
      .then((res) => setWinners(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWinners(); }, []);

  const handleDraw = async (type: 'mini' | 'grand') => {
    setDrawing(type);
    setDrawResult(null);
    try {
      const res = await client.post(`/lottery/draw/${type}`);
      setDrawResult(`🎉 Winner: ${res.data.winner} (${res.data.phone_number})`);
      fetchWinners();
    } catch (err: any) {
      setDrawResult(`❌ ${err.response?.data?.error || 'Draw failed'}`);
    } finally {
      setDrawing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.delete(`/admin/lottery-winners/${deleteTarget.id}`);
      setWinners((prev) => prev.filter((w) => w.id !== deleteTarget.id));
      setDrawResult(`🗑️ Removed ${deleteTarget.user.name} from lottery records. User is now eligible again.`);
      setDeleteTarget(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete lottery winner record');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Lottery Winners</h1>
      <p className="page-subtitle">View past winners and trigger new lottery draws</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={() => handleDraw('mini')}
          disabled={!!drawing}
        >
          {drawing === 'mini' ? '🎰 Drawing...' : '🎰 Draw Mini Lottery'}
        </button>
        <button
          className="btn btn-primary"
          style={{ background: 'var(--gradient-amber)' }}
          onClick={() => handleDraw('grand')}
          disabled={!!drawing}
        >
          {drawing === 'grand' ? '🎰 Drawing...' : '🏆 Draw Grand Lottery'}
        </button>
      </div>

      {drawResult && (
        <div
          className="glass-card"
          style={{
            padding: '16px 20px',
            marginBottom: '24px',
            fontSize: '0.95rem',
            animation: 'fadeInUp 0.4s ease',
          }}
        >
          {drawResult}
        </div>
      )}

      <div className="table-toolbar">
        <span className="table-count">{winners.length} winners</span>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Draw #</th>
                <th>Winner</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Type</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>
                    No lottery winners yet
                  </td>
                </tr>
              ) : (
                winners.map((w) => (
                  <tr key={w.id}>
                    <td>#{w.drawId}</td>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                      {w.user.name}
                    </td>
                    <td>{w.user.email}</td>
                    <td>{w.user.phoneNumber}</td>
                    <td>
                      <span
                        className={`badge ${w.rewardType === 'GRAND' ? 'badge-amber' : 'badge-blue'}`}
                      >
                        {w.rewardType}
                      </span>
                    </td>
                    <td>{new Date(w.drawTime).toLocaleString()}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-icon danger"
                          title="Undo / Delete Winner Record"
                          onClick={() => setDeleteTarget(w)}
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
        title="Undo Lottery Draw"
        message={`Are you sure you want to delete the lottery win record for ${deleteTarget?.user.name} (Draw #${deleteTarget?.drawId})? This will return the user to the eligible pool for future draws.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  );
}
