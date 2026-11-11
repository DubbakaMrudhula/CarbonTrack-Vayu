import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getInitials } from '../../utils/formatters';
import {
  VayuMark,
  PlusIcon,
  LayoutDashboardIcon,
  PlusCircleIcon,
  ListIcon,
  TargetIcon,
  BarChartIcon,
  AwardIcon,
  UserIcon,
  SettingsIcon
} from '../common/VayuIcons';

const NAV_GROUPS = [
  {
    title: 'Core',
    items: [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboardIcon size={16} className="sidebar-icon" />
      },
      {
        path: '/log-activity',
        label: 'Activity Logging',
        icon: <PlusCircleIcon size={16} className="sidebar-icon" />
      },
      {
        path: '/my-activities',
        label: 'My Activities',
        icon: <ListIcon size={16} className="sidebar-icon" />
      }
    ]
  },
  {
    title: 'Roadmap',
    items: [
      {
        path: '/goals',
        label: 'Goals',
        soon: true,
        icon: <TargetIcon size={16} className="sidebar-icon" />
      },
      {
        path: '/insights',
        label: 'Insights',
        soon: true,
        icon: <BarChartIcon size={16} className="sidebar-icon" />
      },
      {
        path: '/leaderboard',
        label: 'Leaderboard',
        soon: true,
        icon: <AwardIcon size={16} className="sidebar-icon" />
      }
    ]
  },
  {
    title: 'Account',
    items: [
      {
        path: '/profile',
        label: 'Profile',
        icon: <UserIcon size={16} className="sidebar-icon" />
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: <SettingsIcon size={16} className="sidebar-icon" />
      }
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const initials = user ? getInitials(user.name) : '?';

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand-block">
          <div className="sidebar-logo-row">
            <span className="sidebar-brand-emblem" aria-hidden="true">
              <VayuMark size={20} />
            </span>
            <div>
              <div className="sidebar-brand-title">
                Vayu <span className="sidebar-brand-devanagari" lang="sa">वायु</span>
              </div>
              <div className="sidebar-brand-tagline">Carbon Ledger</div>
            </div>
          </div>

          <Link
            to="/log-activity"
            className="sidebar-cta-btn"
            onClick={onClose}
          >
            <PlusIcon size={15} />
            <span>Log activity</span>
          </Link>
        </div>

        <nav className="sidebar-scroll" aria-label="Main navigation">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="sidebar-group">
              <span className="sidebar-group-label">{group.title}</span>
              <ul className="sidebar-nav" role="list">
                {group.items.map((item) => (
                  <li key={item.path} role="listitem">
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `sidebar-link ${isActive ? 'active' : ''}`
                      }
                      onClick={onClose}
                    >
                      <span className="sidebar-icon-wrap" aria-hidden="true">
                        {item.icon}
                      </span>
                      <span className="sidebar-link-label">{item.label}</span>
                      {item.soon && <span className="sidebar-soon-tag">Soon</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user-card" onClick={onClose}>
            <span className="sidebar-user-avatar" aria-hidden="true">
              {initials}
            </span>
            <span className="sidebar-user-meta">
              <span className="sidebar-user-name">{user?.name || 'Member'}</span>
              <span className="sidebar-user-email">{user?.email || 'Account profile'}</span>
            </span>
          </Link>
        </div>
      </aside>
    </>
  );
}
