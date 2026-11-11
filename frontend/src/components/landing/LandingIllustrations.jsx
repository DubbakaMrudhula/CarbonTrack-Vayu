import React from 'react';
import {
  CategoryIcon,
  VayuMark,
  TrendingUpIcon
} from '../common/VayuIcons';
import problemEmissionsImg from '../../assets/problem-emissions.jpg';
import solutionSustainableImg from '../../assets/solution-sustainable.jpg';

export function ProblemOverviewPanel() {
  return (
    <figure className="editorial-media-frame">
      <img
        src={problemEmissionsImg}
        alt="Industrial smokestacks and cracked arid earth illustrating rising carbon emissions"
        className="editorial-media-img"
        loading="lazy"
      />
    </figure>
  );
}

export function SolutionOverviewPanel() {
  return (
    <figure className="editorial-media-frame">
      <img
        src={solutionSustainableImg}
        alt="Sunlit green hills with solar panels and wind turbines illustrating sustainable living"
        className="editorial-media-img"
        loading="lazy"
      />
    </figure>
  );
}

export function ImpactCategoryIcon({ category }) {
  return <CategoryIcon category={category} size={22} />;
}

export function DashboardWorkspaceMockup() {
  return (
    <div className="mockup-stage" aria-label="Vayu workspace interface preview">
      <div className="mockup-window">
        <div className="mockup-window-bar" aria-hidden="true">
          <div className="mockup-window-dots">
            <span />
            <span />
            <span />
          </div>
          <span className="mockup-window-title">vayu / carbon-ledger</span>
        </div>

        <div className="mockup-frame">
          <div className="mockup-sidebar">
            <div className="mockup-brand">
              <VayuMark size={16} />
              <span>Vayu</span>
            </div>
            <div className="mockup-nav-item active">Dashboard</div>
            <div className="mockup-nav-item">Activity Log</div>
            <div className="mockup-nav-item">My Activities</div>
            <div className="mockup-nav-item">Goals</div>
            <div className="mockup-nav-item">Insights</div>
            <div className="mockup-nav-item">Profile</div>
            <div className="mockup-nav-item">Settings</div>
          </div>

          <div className="mockup-main">
            <div className="mockup-main-head">
              <div>
                <div className="mockup-heading">Daily Carbon Ledger</div>
                <div className="mockup-kicker">Focused visibility across all four categories</div>
              </div>
              <span className="mockup-preview-pill">Workspace Preview</span>
            </div>

            <div className="mockup-tiles-row">
              <div className="mockup-stat-box accent-box">
                <span className="mockup-stat-title">Daily Footprint</span>
                <span className="mockup-stat-sub">Live summary</span>
                <div className="mockup-stat-bar short" />
              </div>
              <div className="mockup-stat-box">
                <span className="mockup-stat-title">Activity Entries</span>
                <span className="mockup-stat-sub">Filterable history</span>
                <div className="mockup-stat-bar mid" />
              </div>
              <div className="mockup-stat-box">
                <span className="mockup-stat-title">Category Share</span>
                <span className="mockup-stat-sub">Proportional view</span>
                <div className="mockup-stat-bar full" />
              </div>
            </div>

            <div className="mockup-chart-card">
              <div className="mockup-chart-head">
                <span className="mockup-chart-label">
                  <TrendingUpIcon size={14} />
                  <span>Footprint Breakdown Overview</span>
                </span>
                <span className="mockup-chart-pill">Today</span>
              </div>
              <svg viewBox="0 0 300 84" fill="none" className="mockup-chart-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="mockupAreaWash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16A34A" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#16A34A" stopOpacity="0.01" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="22" x2="300" y2="22" stroke="#DCE5E0" strokeDasharray="3 3" />
                <line x1="0" y1="52" x2="300" y2="52" stroke="#DCE5E0" strokeDasharray="3 3" />
                <path
                  d="M8 66 C36 62, 54 44, 80 48 C106 52, 126 26, 154 30 C182 34, 200 50, 226 42 C252 34, 272 18, 294 22 L294 84 L8 84 Z"
                  fill="url(#mockupAreaWash)"
                />
                <path
                  d="M8 66 C36 62, 54 44, 80 48 C106 52, 126 26, 154 30 C182 34, 200 50, 226 42 C252 34, 272 18, 294 22"
                  stroke="#166534"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <circle cx="80" cy="48" r="3.4" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.2" />
                <circle cx="154" cy="30" r="3.4" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.2" />
                <circle cx="226" cy="42" r="3.4" fill="#16A34A" stroke="#FFFFFF" strokeWidth="1.2" />
                <circle cx="294" cy="22" r="3.8" fill="#166534" stroke="#FFFFFF" strokeWidth="1.2" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
