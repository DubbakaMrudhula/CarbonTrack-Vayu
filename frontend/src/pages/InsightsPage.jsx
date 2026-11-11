import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../components/common/StatusLabel';
import { TrendingUpIcon, LeafIcon, PieChartIcon } from '../components/common/VayuIcons';

export default function InsightsPage() {
  useEffect(() => {
    document.title = 'Insights | Vayu';
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <span className="hero-eyebrow">UPCOMING FEATURE</span>
          <h1 className="page-title">Insights</h1>
        </div>
        <StatusLabel status="Coming soon" variant="info" />
      </div>

      <p className="coming-soon-text">
        Insights and analytics are not yet available. This feature is planned for a future release.
      </p>

      <div className="roadmap-blueprint-grid" aria-label="Planned capabilities">
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <TrendingUpIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Multi-week trends</span>
          </div>
          <p className="roadmap-slot-text">
            Compare your footprint across weeks and months to spot lasting improvements.
          </p>
        </div>
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <LeafIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Lifestyle highlights</span>
          </div>
          <p className="roadmap-slot-text">
            Discover your biggest opportunities to cut down everyday emissions.
          </p>
        </div>
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <PieChartIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Available today</span>
          </div>
          <p className="roadmap-slot-text">
            View today&apos;s category breakdown on your Dashboard or browse My Activities.
          </p>
          <Link to="/dashboard" className="roadmap-action-link">
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
