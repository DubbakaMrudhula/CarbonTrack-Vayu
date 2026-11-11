import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../components/common/StatusLabel';
import { TargetIcon, BarChartIcon, CheckCircleIcon } from '../components/common/VayuIcons';

export default function GoalsPage() {
  useEffect(() => {
    document.title = 'Goals | Vayu';
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <span className="hero-eyebrow">UPCOMING FEATURE</span>
          <h1 className="page-title">Goals</h1>
        </div>
        <StatusLabel status="Coming soon" variant="info" />
      </div>

      <p className="coming-soon-text">
        Goal tracking is not yet available. This feature is planned for a future release.
      </p>

      <div className="roadmap-blueprint-grid" aria-label="Planned capabilities">
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <TargetIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Target budgets</span>
          </div>
          <p className="roadmap-slot-text">
            Set personal weekly or monthly footprint goals tailored to your lifestyle.
          </p>
        </div>
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <BarChartIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Category progress</span>
          </div>
          <p className="roadmap-slot-text">
            Follow positive changes across transportation, electricity, food, and shopping.
          </p>
        </div>
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <CheckCircleIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Available today</span>
          </div>
          <p className="roadmap-slot-text">
            Set a personal weekly goal on your Profile and track daily activities now.
          </p>
          <Link to="/profile" className="roadmap-action-link">
            Open Profile preferences
          </Link>
        </div>
      </div>
    </div>
  );
}
