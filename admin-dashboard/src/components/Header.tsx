import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/questions': 'Question Management',
  '/quiz-results': 'Quiz Results',
  '/rewards': 'Reward Management',
  '/lottery': 'Lottery Winners',
  '/feedback': 'Feedback',
  '/customize': 'Frontend Customization',
  '/settings': 'Settings',
};

interface HeaderProps {
  collapsed?: boolean;
  onToggleSidebar?: () => void;
}

export default function Header({ collapsed, onToggleSidebar }: HeaderProps) {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="header">
      <div className="header-left">
        {onToggleSidebar && (
          <button
            type="button"
            className="header-toggle-btn"
            onClick={onToggleSidebar}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        <div className="header-breadcrumb">
          Admin / <span>{title}</span>
        </div>
      </div>
      <div className="header-right">
        <div className="header-admin">
          <div className="header-avatar">A</div>
          <span className="header-admin-name">Admin</span>
        </div>
      </div>
    </header>
  );
}
