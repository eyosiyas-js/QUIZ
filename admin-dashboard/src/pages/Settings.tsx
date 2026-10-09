import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import '../styles/dashboard.css';
import '../styles/table.css';

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    client
      .get('/admin/settings')
      .then((res) => setSettings(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value ? 'true' : 'false' }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await client.put('/admin/settings', { settings });
      setMessage({ text: 'Settings saved successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to save settings', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="page-container">
      <h1 className="page-title">System Settings</h1>
      <p className="page-subtitle">Configure global platform behavior</p>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '20px',
            borderRadius: 'var(--radius-md)',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: message.type === 'success' ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
            animation: 'fadeIn 0.3s ease',
          }}
        >
          {message.text}
        </div>
      )}

      <div className="glass-card" style={{ padding: '32px', maxWidth: '600px' }}>
        <h3 style={{ marginBottom: '24px', fontSize: '1.1rem', color: 'var(--text-primary)' }}>
          Quiz Configuration
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Allow Multiple Quiz Attempts
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              If disabled, users can only take the quiz once. Subsequent attempts will be blocked.
            </div>
          </div>
          
          <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '28px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings['allowMultipleQuizAttempts'] === 'true'}
              onChange={(e) => handleToggle('allowMultipleQuizAttempts', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: settings['allowMultipleQuizAttempts'] === 'true' ? 'var(--accent-emerald)' : 'rgba(255, 255, 255, 0.1)',
                transition: '.3s',
                borderRadius: '34px',
              }}
            />
            <span
              style={{
                position: 'absolute',
                content: '""',
                height: '20px',
                width: '20px',
                left: '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '.3s',
                borderRadius: '50%',
                transform: settings['allowMultipleQuizAttempts'] === 'true' ? 'translateX(22px)' : 'translateX(0)',
              }}
            />
          </label>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Quiz Cooldown Duration (Hours)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              If multiple attempts are allowed, how long should a user wait before taking the quiz again? (0 for no wait). For example, 24 for 1 day, 72 for 3 days.
            </div>
          </div>
          
          <input
            type="number"
            min="0"
            step="0.5"
            value={settings['quizCooldownHours'] || '0'}
            onChange={(e) => setSettings((prev) => ({ ...prev, quizCooldownHours: e.target.value }))}
            style={{
              width: '100px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              outline: 'none',
              opacity: settings['allowMultipleQuizAttempts'] === 'true' ? 1 : 0.5,
            }}
            disabled={settings['allowMultipleQuizAttempts'] !== 'true'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Number of Questions Per Quiz
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              How many questions should be randomly selected and shown to the user in each quiz attempt.
            </div>
          </div>
          
          <input
            type="number"
            min="1"
            value={settings['numberOfQuestionsPerQuiz'] || '10'}
            onChange={(e) => setSettings((prev) => ({ ...prev, numberOfQuestionsPerQuiz: e.target.value }))}
            style={{
              width: '100px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <h3 style={{ marginBottom: '24px', fontSize: '1.1rem', color: 'var(--text-primary)', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
          Lottery Configuration
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Eligibility Score Threshold
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              The minimum score required for a user to be eligible for the lottery.
            </div>
          </div>
          
          <input
            type="number"
            min="0"
            value={settings['eligibilityScoreThreshold'] || '7'}
            onChange={(e) => setSettings((prev) => ({ ...prev, eligibilityScoreThreshold: e.target.value }))}
            style={{
              width: '100px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <div style={{ flex: 1, paddingRight: '24px' }}>
            <div style={{ fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              Lottery Time Window (Hours)
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Determine the time frame for eligible quiz sessions (e.g., 2 for last 2 hours). Set to 0 for All Time (no restriction).
            </div>
          </div>
          
          <input
            type="number"
            min="0"
            step="0.5"
            value={settings['lotteryTimeWindow'] || '0'}
            onChange={(e) => setSettings((prev) => ({ ...prev, lotteryTimeWindow: e.target.value }))}
            style={{
              width: '100px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.2)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
