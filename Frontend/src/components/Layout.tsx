import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isAdmin, setIsAdmin } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <Link to="/" className="logo">
            🎫 Ticket Booking
          </Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
              Shows
            </Link>
            {isAdmin && (
              <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
                Admin
              </Link>
            )}
            <button
              className="auth-toggle"
              onClick={() => setIsAdmin(!isAdmin)}
              title={isAdmin ? 'Switch to User' : 'Switch to Admin'}
            >
              {isAdmin ? '👤 User' : '⚙️ Admin'}
            </button>
          </nav>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
};
