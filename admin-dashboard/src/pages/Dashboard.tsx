import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import '../styles/dashboard.css';

interface Stats {
  totalUsers: number;
  totalQuestions: number;
  totalSessions: number;
  totalFeedback: number;
  totalWinners: number;
  eligibleUsers: number;
  recentRegistrations: number;
  averageScore: number;
  averageFeedbackRating: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/admin/stats')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (!stats) return <div className="empty-state"><p>Failed to load stats</p></div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', colorClass: 'blue' },
    { label: 'Quiz Sessions', value: stats.totalSessions, icon: '📝', colorClass: 'emerald' },
    { label: 'Avg Score', value: stats.averageScore.toFixed(1), icon: '📊', colorClass: 'amber' },
    { label: 'Lottery Winners', value: stats.totalWinners, icon: '🏆', colorClass: 'rose' },
    { label: 'Eligible Users', value: stats.eligibleUsers, icon: '✅', colorClass: 'cyan' },
    { label: 'Feedback', value: stats.totalFeedback, icon: '💬', colorClass: 'violet' },
    { label: 'Questions', value: stats.totalQuestions, icon: '❓', colorClass: 'blue' },
    { label: 'Recent Signups', value: stats.recentRegistrations, icon: '🆕', colorClass: 'emerald' },
    { label: 'Avg Rating', value: `${stats.averageFeedbackRating.toFixed(1)} ★`, icon: '⭐', colorClass: 'amber' },
  ];

  return (
    <div className="page-container">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Overview of your platform activity and metrics</p>

      <div className="stats-grid">
        {cards.map((card, i) => (
          <div
            key={card.label}
            className="stat-card"
            style={{ animationDelay: `${i * 0.06}s` } as React.CSSProperties}
          >
            <div className={`stat-icon ${card.colorClass}`}>{card.icon}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
