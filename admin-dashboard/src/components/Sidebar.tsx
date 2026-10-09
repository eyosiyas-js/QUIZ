import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/sidebar.css';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '📊', section: 'Overview' },
  { to: '/users', label: 'Users', icon: '👥', section: 'Management' },
  { to: '/questions', label: 'Questions', icon: '❓', section: 'Management' },
  { to: '/quiz-results', label: 'Quiz Results', icon: '📝', section: 'Management' },
  { to: '/rewards', label: 'Rewards', icon: '🎁', section: 'Management' },
  { to: '/lottery', label: 'Lottery Winners', icon: '🎰', section: 'Management' },
  { to: '/feedback', label: 'Feedback', icon: '💬', section: 'Management' },
  { to: '/customize', label: 'Frontend Customization', icon: '🎨', section: 'System' },
  { to: '/settings', label: 'Settings', icon: '⚙️', section: 'System' },
];

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();

  const sections = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">E</div>
        <div className="sidebar-brand">
          <span className="sidebar-brand-name">ETEX Admin</span>
          <span className="sidebar-brand-sub">Management</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section}>
            <div className="sidebar-section-label">{section}</div>
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link" onClick={logout}>
          <span className="nav-icon">🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
