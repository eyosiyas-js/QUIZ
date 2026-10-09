import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
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
              </tr>
            </thead>
            <tbody>
              {winners.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
