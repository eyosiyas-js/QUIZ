import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import '../styles/table.css';

interface QuizSession {
  id: string;
  userId: string;
  score: number;
  total: number;
  createdAt: string;
  user: { name: string; email: string; phoneNumber: string };
  answers: { id: string; questionId: number; userAnswer: string; isCorrect: boolean }[];
}

export default function QuizResults() {
  const [sessions, setSessions] = useState<QuizSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    client
      .get('/admin/quiz-sessions')
      .then((res) => setSessions(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
  };

  return (
    <div className="page-container">
      <h1 className="page-title">Quiz Results</h1>
      <p className="page-subtitle">View all quiz sessions and individual answers</p>

      <div className="table-toolbar">
        <span className="table-count">{sessions.length} sessions</span>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th></th>
                <th>User</th>
                <th>Email</th>
                <th>Score</th>
                <th>Result</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                    No quiz sessions yet
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => toggleExpand(s.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ width: '30px' }}>{expanded === s.id ? '▼' : '▶'}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {s.user.name}
                      </td>
                      <td>{s.user.email}</td>
                      <td>
                        <span className="badge badge-blue">
                          {s.score} / {s.total}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            s.score >= 7 ? 'badge-emerald' : s.score >= 4 ? 'badge-amber' : 'badge-rose'
                          }`}
                        >
                          {s.score >= 7 ? 'Pass' : s.score >= 4 ? 'Average' : 'Fail'}
                        </span>
                      </td>
                      <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                    </tr>
                    {expanded === s.id && (
                      <tr key={`${s.id}-expanded`}>
                        <td colSpan={6} style={{ padding: '0 16px 16px 48px', background: 'rgba(255,255,255,0.02)' }}>
                          <table className="data-table" style={{ margin: '8px 0' }}>
                            <thead>
                              <tr>
                                <th>Q#</th>
                                <th>User Answer</th>
                                <th>Correct</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.answers.map((a) => (
                                <tr key={a.id}>
                                  <td>{a.questionId}</td>
                                  <td>{a.userAnswer || '(no answer)'}</td>
                                  <td>
                                    <span className={`badge ${a.isCorrect ? 'badge-emerald' : 'badge-rose'}`}>
                                      {a.isCorrect ? '✓' : '✗'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
