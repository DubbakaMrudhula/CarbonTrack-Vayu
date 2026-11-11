import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getInitials, currentMonthLabel } from '../../utils/formatters';
import {
  VayuMark,
  PlusIcon,
  CalendarIcon,
  HomeIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon
} from '../common/VayuIcons';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/log-activity': 'Activity Logging',
  '/my-activities': 'My Activities',
  '/goals': 'Goals',
  '/insights': 'Insights',
  '/leaderboard': 'Leaderboard',
  '/profile': 'Profile',
  '/settings': 'Settings'
};

export default function Topbar({ onMenuToggle, sidebarOpen = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    if (dropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen]);

  function handleSignOut() {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  }

  const initials = user ? getInitials(user.name) : '?';
  const monthLabel = currentMonthLabel();
  const currentSection = ROUTE_TITLES[location.pathname] || 'Workspace';

  return (
    <header className="topbar" role="banner">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-toggle-button"
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          onClick={onMenuToggle}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            width="20"
            height="20"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <Link to="/dashboard" className="topbar-wordmark" aria-label="Vayu home">
          <VayuMark size={20} />
          <span>Vayu</span>
        </Link>
        <span className="topbar-breadcrumb">{currentSection}</span>
        <span className="topbar-date" aria-label={`Current period: ${monthLabel}`}>
          <CalendarIcon size={14} />
          <span>{monthLabel}</span>
        </span>
      </div>

      <div className="topbar-right" ref={dropdownRef}>
        <Link to="/" className="topbar-icon-link" aria-label="Home landing page" title="Home landing page">
          <HomeIcon size={16} />
        </Link>

        <Link to="/log-activity" className="topbar-quick-action">
          <PlusIcon size={14} />
          <span>Quick log</span>
        </Link>

        <button
          type="button"
          className="user-menu-button"
          aria-label={`User menu for ${user ? user.name : 'user'}`}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          onClick={() => setDropdownOpen((prev) => !prev)}
        >
          {initials}
        </button>

        {dropdownOpen && (
          <div className="user-menu-dropdown" role="menu" aria-label="User actions">
            {user && (
              <div className="user-menu-header" role="none">
                <div className="user-menu-name">{user.name}</div>
                {user.email && <div className="user-menu-email">{user.email}</div>}
              </div>
            )}
            <Link
              to="/"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <HomeIcon size={14} />
              <span>Home page</span>
            </Link>
            <Link
              to="/profile"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <UserIcon size={14} />
              <span>Profile</span>
            </Link>
            <Link
              to="/settings"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
            >
              <SettingsIcon size={14} />
              <span>Settings</span>
            </Link>
            <button
              type="button"
              className="user-menu-item user-menu-signout"
              role="menuitem"
              onClick={handleSignOut}
            >
              <LogOutIcon size={14} />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
