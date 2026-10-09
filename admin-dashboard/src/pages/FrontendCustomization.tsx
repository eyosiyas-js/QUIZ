import { useEffect, useState } from 'react';
import client from '../api/client';
import Loader from '../components/Loader';
import '../styles/dashboard.css';
import '../styles/frontend-customization.css';

const TABS = [
  { id: 'branding', label: '🏷️ Branding' },
  { id: 'theme', label: '🎨 Theme & Colors' },
  { id: 'media', label: '🖼️ Media' },
  { id: 'login', label: '🔑 Login & Signup' },
  { id: 'contest', label: '🏆 Contest Page' },
  { id: 'quiz', label: '❓ Quiz & Results' },
  { id: 'lottery', label: '🎰 Lottery' },
  { id: 'dashboard', label: '📊 Dashboard' },
  { id: 'sections', label: '⚙️ Sections' },
  { id: 'prizes', label: '🎁 Prizes' },
];

const API_BASE = 'http://localhost:5000';

export default function FrontendCustomization() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    client
      .get('/config/admin')
      .then((res) => setConfig(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = (path: string, value: any) => {
    setConfig((prev: any) => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await client.put('/config/admin', { config });
      setMessage({ text: 'Configuration saved successfully!', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.error || 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    setSaving(true);
    try {
      const res = await client.post('/config/admin/reset');
      setConfig(res.data.config);
      setMessage({ text: 'Configuration reset to defaults', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Failed to reset', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, configPath: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateConfig(configPath, `${API_BASE}${res.data.url}`);
    } catch (err) {
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <Loader />;
  if (!config) return <div>Failed to load configuration</div>;

  const renderField = (label: string, path: string, type: string = 'text', hint?: string) => {
    const keys = path.split('.');
    let value: any = config;
    for (const k of keys) value = value?.[k];

    return (
      <div className="field-group">
        <label>{label}</label>
        {type === 'textarea' ? (
          <textarea value={value || ''} onChange={(e) => updateConfig(path, e.target.value)} />
        ) : type === 'number' ? (
          <input type="number" value={value ?? ''} onChange={(e) => updateConfig(path, Number(e.target.value))} />
        ) : (
          <input type="text" value={value || ''} onChange={(e) => updateConfig(path, e.target.value)} />
        )}
        {hint && <div className="field-hint">{hint}</div>}
      </div>
    );
  };

  const renderColorField = (label: string, path: string) => {
    const keys = path.split('.');
    let value: any = config;
    for (const k of keys) value = value?.[k];

    return (
      <div className="field-group">
        <label>{label}</label>
        <div className="color-field">
          <input type="color" value={value || '#000000'} onChange={(e) => updateConfig(path, e.target.value)} />
          <input type="text" value={value || ''} onChange={(e) => updateConfig(path, e.target.value)} placeholder="#000000" />
        </div>
      </div>
    );
  };

  const renderToggle = (label: string, desc: string, path: string) => {
    const keys = path.split('.');
    let value: any = config;
    for (const k of keys) value = value?.[k];

    return (
      <div className="toggle-row">
        <div className="toggle-info">
          <div className="toggle-label">{label}</div>
          <div className="toggle-desc">{desc}</div>
        </div>
        <label className="toggle-switch">
          <input type="checkbox" checked={value !== false} onChange={(e) => updateConfig(path, e.target.checked)} />
          <span className="toggle-slider" />
        </label>
      </div>
    );
  };

  const renderImageUpload = (label: string, path: string) => {
    const keys = path.split('.');
    let value: any = config;
    for (const k of keys) value = value?.[k];

    return (
      <div className="field-group">
        <label>{label}</label>
        <div className="upload-area">
          <input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, path)} />
          <div className="upload-icon">📁</div>
          <div className="upload-text">{uploading ? 'Uploading...' : 'Click or drag to upload'}</div>
        </div>
        {value && (
          <div className="upload-preview">
            {value.match(/\.(mp4|webm)$/i) ? (
              <video src={value} style={{ maxHeight: 120, borderRadius: 8 }} controls muted />
            ) : (
              <img src={value} alt={label} />
            )}
            <button className="remove-btn" onClick={() => updateConfig(path, '')} title="Remove">✕</button>
          </div>
        )}
        <input type="text" value={value || ''} onChange={(e) => updateConfig(path, e.target.value)} placeholder="Or enter URL manually" style={{ marginTop: 8 }} />
      </div>
    );
  };

  // Prize management
  const addPrize = () => {
    const newPrizes = [...(config.prizes || []), { name: '', description: '', image: '', rank: '' }];
    updateConfig('prizes', newPrizes);
  };

  const updatePrize = (index: number, field: string, value: string) => {
    const newPrizes = [...config.prizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setConfig((prev: any) => ({ ...prev, prizes: newPrizes }));
  };

  const removePrize = (index: number) => {
    const newPrizes = config.prizes.filter((_: any, i: number) => i !== index);
    setConfig((prev: any) => ({ ...prev, prizes: newPrizes }));
  };

  return (
    <div className="page-container customize-container">
      <h1 className="page-title">Frontend Customization</h1>
      <p className="page-subtitle">Configure all frontend content, branding, and appearance from here</p>

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

      {/* Tabs */}
      <div className="customize-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`customize-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'branding' && (
        <div className="customize-section">
          <h3>Branding & Identity</h3>
          {renderField('Event Name', 'branding.eventName')}
          {renderField('Organization Name', 'branding.organizationName')}
          {renderField('Meta Title (Browser Tab)', 'branding.metaTitle')}
          {renderField('Meta Description', 'branding.metaDescription', 'textarea')}
          {renderImageUpload('Logo', 'branding.logoUrl')}
          {renderImageUpload('Favicon', 'branding.faviconUrl')}
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="customize-section">
          <h3>Theme & Colors</h3>
          <div className="field-row">
            {renderColorField('Primary Gradient From', 'theme.primaryGradientFrom')}
            {renderColorField('Primary Gradient Via', 'theme.primaryGradientVia')}
          </div>
          <div className="field-row">
            {renderColorField('Primary Gradient To', 'theme.primaryGradientTo')}
            {renderColorField('Accent Color', 'theme.accentColor')}
          </div>
          <div className="field-row">
            {renderColorField('Button Gradient From', 'theme.buttonGradientFrom')}
            {renderColorField('Button Gradient To', 'theme.buttonGradientTo')}
          </div>
          <div className="field-row">
            {renderColorField('Selected Answer Color', 'theme.selectedAnswerColor')}
            {renderField('Overlay Opacity (0-1)', 'theme.overlayOpacity', 'number')}
          </div>
          {renderField('Font Family', 'theme.fontFamily', 'text', 'e.g., Inter, Roboto, Arial')}
        </div>
      )}

      {activeTab === 'media' && (
        <div className="customize-section">
          <h3>Media & Backgrounds</h3>
          <div className="field-group">
            <label>Background Type</label>
            <select value={config.media?.backgroundType || 'video'} onChange={(e) => updateConfig('media.backgroundType', e.target.value)}>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="gradient">Gradient Only</option>
            </select>
          </div>
          {renderImageUpload('Background Video', 'media.backgroundVideoUrl')}
          {renderImageUpload('Background Image', 'media.backgroundImageUrl')}
          {renderImageUpload('QR Code Image', 'media.qrCodeUrl')}
        </div>
      )}

      {activeTab === 'login' && (
        <div className="customize-section">
          <h3>Login Page</h3>
          {renderField('Title', 'pages.login.title')}
          {renderField('Subtitle', 'pages.login.subtitle')}
          <div className="field-row">
            {renderField('Submit Button Text', 'pages.login.submitButtonText')}
            {renderField('Submitting Text', 'pages.login.submittingText')}
          </div>
          <div className="field-row">
            {renderField('Signup Link Text', 'pages.login.signupLinkText')}
            {renderField('Signup Link Label', 'pages.login.signupLinkLabel')}
          </div>

          <h3 style={{ marginTop: 28 }}>Signup Page</h3>
          {renderField('Title', 'pages.signup.title')}
          {renderField('Subtitle', 'pages.signup.subtitle')}
          <div className="field-row">
            {renderField('Submit Button Text', 'pages.signup.submitButtonText')}
            {renderField('Submitting Text', 'pages.signup.submittingText')}
          </div>
          <div className="field-row">
            {renderField('Login Link Text', 'pages.signup.loginLinkText')}
            {renderField('Login Link Label', 'pages.signup.loginLinkLabel')}
          </div>
          {renderField('Default Country Code', 'pages.signup.defaultCountry', 'text', 'e.g., ET, US, GB')}
        </div>
      )}

      {activeTab === 'contest' && (
        <div className="customize-section">
          <h3>Contest Page — Success Section</h3>
          {renderField('Success Title', 'pages.contest.successTitle')}
          {renderField('Success Message', 'pages.contest.successMessage', 'textarea', 'Use {name} as placeholder for user name')}
          {renderField('Phone Confirmation Text', 'pages.contest.phoneConfirmText')}
          <div className="field-row">
            {renderField('View Winners Button', 'pages.contest.viewWinnersText')}
            {renderField('View Lottery Button', 'pages.contest.viewLotteryText')}
          </div>

          <h3 style={{ marginTop: 28 }}>Contest Page — Quiz Section</h3>
          {renderField('Quiz Section Title', 'pages.contest.quizSectionTitle')}
          {renderField('Quiz Section Subtitle', 'pages.contest.quizSectionSubtitle')}
          {renderField('Quiz Info Title', 'pages.contest.quizInfoTitle')}
          {renderField('Quiz Info Subtitle', 'pages.contest.quizInfoSubtitle', 'text', 'e.g., "10 questions • ~10 minutes"')}
          {renderField('Completion Bonus Text', 'pages.contest.quizCompletionBonus')}
          <div className="field-row">
            {renderField('Start Quiz Button', 'pages.contest.startQuizText')}
            {renderField('Try Next Round Button', 'pages.contest.tryNextRoundText')}
          </div>
          {renderField('Quiz Completed Badge', 'pages.contest.quizCompletedText')}
        </div>
      )}

      {activeTab === 'quiz' && (
        <div className="customize-section">
          <h3>Quiz</h3>
          <div className="field-row">
            {renderField('Next Button Text', 'pages.quiz.nextButtonText')}
            {renderField('Finish Button Text', 'pages.quiz.finishButtonText')}
          </div>
          {renderField('Loading Text', 'pages.quiz.loadingText')}
          {renderField('Timer Duration (seconds)', 'pages.quiz.timerDuration', 'number')}

          <h3 style={{ marginTop: 28 }}>Celebration Messages</h3>
          <div className="field-row">
            {renderField('Perfect Score Title', 'pages.celebration.perfectTitle')}
            {renderField('Perfect Score Message', 'pages.celebration.perfectMessage')}
          </div>
          <div className="field-row">
            {renderField('High Score Title', 'pages.celebration.highTitle')}
            {renderField('High Score Message', 'pages.celebration.highMessage')}
          </div>
          <div className="field-row">
            {renderField('Medium Score Title', 'pages.celebration.mediumTitle')}
            {renderField('Medium Score Message', 'pages.celebration.mediumMessage')}
          </div>
          <div className="field-row">
            {renderField('Low Score Title', 'pages.celebration.lowTitle')}
            {renderField('Low Score Message', 'pages.celebration.lowMessage')}
          </div>
          {renderField('Redirect Text', 'pages.celebration.redirectText')}
          {renderField('Redirect Delay (seconds)', 'pages.celebration.redirectDelay', 'number')}

          <h3 style={{ marginTop: 28 }}>Results Screen</h3>
          <div className="field-row">
            {renderField('Summary Tab Label', 'pages.results.summaryTabLabel')}
            {renderField('Details Tab Label', 'pages.results.detailsTabLabel')}
          </div>
          {renderField('Score Title', 'pages.results.scoreTitle')}
          {renderField('Back Button Text', 'pages.results.backButtonText')}
          {renderField('Perfect Score Message', 'pages.results.messages.perfect')}
          {renderField('Excellent Score Message', 'pages.results.messages.excellent')}
          {renderField('Great Score Message', 'pages.results.messages.great')}
          {renderField('Good Score Message', 'pages.results.messages.good')}
          {renderField('Low Score Message', 'pages.results.messages.low')}
        </div>
      )}

      {activeTab === 'lottery' && (
        <div className="customize-section">
          <h3>Lottery Page</h3>
          {renderField('Title', 'pages.lottery.title')}
          {renderField('Subtitle', 'pages.lottery.subtitle')}
          {renderField('Start Button Text', 'pages.lottery.startButtonText')}
          {renderField('Countdown Duration (seconds)', 'pages.lottery.countdownDuration', 'number')}

          <h3 style={{ marginTop: 28 }}>Winner Display</h3>
          {renderField('Drawing Title', 'pages.lottery.drawingTitle')}
          {renderField('Drawing Subtitle', 'pages.lottery.drawingSubtitle')}
          {renderField('Congratulations Title', 'pages.lottery.congratsTitle')}
          {renderField('Congratulations Message', 'pages.lottery.congratsMessage')}
          {renderField('Claim Message', 'pages.lottery.claimMessage', 'textarea')}

          <h3 style={{ marginTop: 28 }}>Rating Modal</h3>
          {renderField('Rating Title', 'pages.rating.title')}
          {renderField('Rating Subtitle', 'pages.rating.subtitle', 'text', 'Use {name} for user name')}
          {renderField('Submit Button Text', 'pages.rating.submitButtonText')}
          {renderField('Skip Text', 'pages.rating.skipText')}
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="customize-section">
          <h3>Public Dashboard</h3>
          {renderField('Hero Title', 'pages.dashboard.heroTitle')}
          {renderField('Stats Title', 'pages.dashboard.statsTitle')}
          {renderField('Eligible Participants Title', 'pages.dashboard.eligibleTitle')}
          {renderField('Total Contestants Title', 'pages.dashboard.totalTitle')}
          {renderField('Countdown Title', 'pages.dashboard.countdownTitle')}
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="customize-section">
          <h3>Section Visibility</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Toggle sections on or off depending on what's needed for this event.
          </p>
          {renderToggle('Show Logo', 'Display the organization logo in login, signup, and contest pages', 'sections.showLogo')}
          {renderToggle('Show Background Video', 'Display the background video on pages', 'sections.showBackgroundVideo')}
          {renderToggle('Show Prizes', 'Display the prizes section on the contest page', 'sections.showPrizes')}
          {renderToggle('Show Lottery', 'Enable the lottery drawing feature', 'sections.showLottery')}
          {renderToggle('Show Dashboard', 'Enable the public participants dashboard', 'sections.showDashboard')}
          {renderToggle('Show QR Code', 'Display the QR code on the dashboard page', 'sections.showQrCode')}
          {renderToggle('Show Rating Modal', 'Show the rating/feedback modal after quiz completion', 'sections.showRatingModal')}
        </div>
      )}

      {activeTab === 'prizes' && (
        <div className="customize-section">
          <h3>Prize Management</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            Manage the prizes displayed on the contest page.
          </p>

          {(config.prizes || []).map((prize: any, index: number) => (
            <div key={index} className="prize-item">
              <div className="prize-fields">
                <input
                  placeholder="Prize name"
                  value={prize.name}
                  onChange={(e) => updatePrize(index, 'name', e.target.value)}
                />
                <input
                  placeholder="Description"
                  value={prize.description}
                  onChange={(e) => updatePrize(index, 'description', e.target.value)}
                />
                <input
                  placeholder="Image URL (or upload below)"
                  value={prize.image}
                  onChange={(e) => updatePrize(index, 'image', e.target.value)}
                />
                <input
                  placeholder="Rank (e.g., 1st, 2nd, 3rd)"
                  value={prize.rank}
                  onChange={(e) => updatePrize(index, 'rank', e.target.value)}
                />
                {prize.image && (
                  <div className="upload-preview">
                    <img src={prize.image} alt={prize.name} style={{ maxHeight: 80 }} />
                  </div>
                )}
              </div>
              <div className="prize-actions">
                <button className="prize-remove-btn" onClick={() => removePrize(index)}>
                  Remove
                </button>
              </div>
            </div>
          ))}

          <button className="btn btn-primary" onClick={addPrize} style={{ marginTop: 8 }}>
            + Add Prize
          </button>
        </div>
      )}

      {/* Save / Reset Bar */}
      <div className="customize-actions">
        <button className="btn-reset" onClick={handleReset} disabled={saving}>
          Reset to Defaults
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
