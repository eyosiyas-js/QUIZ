import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/questions': 'Question Management',
  '/quiz-results': 'Quiz Results',
  '/rewards': 'Reward Management',
  '/lottery': 'Lottery Winners',
  '/feedback': 'Feedback',
};

export default function Header() {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Dashboard';

  return (
    <header className="header">
      <div className="header-left">
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
