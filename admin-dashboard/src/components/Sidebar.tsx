import { NavLink } from 'react-router-dom';
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

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { logout } = useAuth();

  const sections = navItems.reduce<Record<string, typeof navItems>>((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {});

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand-group">
          <div className="sidebar-logo" title="Quiz Admin">Q</div>
          {!collapsed && (
            <div className="sidebar-brand">
              <span className="sidebar-brand-name">Quiz Admin</span>
              <span className="sidebar-brand-sub">Management</span>
            </div>
          )}
        </div>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="toggle-icon"
          >
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      <nav className="sidebar-nav">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="sidebar-section-group">
            {!collapsed ? (
              <div className="sidebar-section-label">{section}</div>
            ) : (
              <div className="sidebar-section-divider" title={section} />
            )}
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon">{item.icon}</span>
                {!collapsed && <span className="sidebar-link-text">{item.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <a
          href="/statistics.html"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-link"
          style={{ textDecoration: 'none' }}
          title={collapsed ? 'Statistics Page' : 'Open Standalone Statistics Dashboard'}
        >
          <span className="nav-icon">📈</span>
          {!collapsed && <span className="sidebar-link-text">Statistics Page</span>}
        </a>
        <button
          type="button"
          className="sidebar-link logout-btn"
          onClick={logout}
          title={collapsed ? 'Logout' : undefined}
        >
          <span className="nav-icon">🚪</span>
          {!collapsed && <span className="sidebar-link-text">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
