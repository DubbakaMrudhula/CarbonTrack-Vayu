import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../components/common/StatusLabel';
import { AwardIcon, ShieldCheckIcon, PlusCircleIcon } from '../components/common/VayuIcons';

export default function LeaderboardPage() {
  useEffect(() => {
    document.title = 'Leaderboard | Vayu';
  }, []);

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <span className="hero-eyebrow">UPCOMING FEATURE</span>
          <h1 className="page-title">Leaderboard</h1>
        </div>
        <StatusLabel status="Coming soon" variant="info" />
      </div>

      <p className="coming-soon-text">
        Peer benchmarking and leaderboard are not yet available. This feature is planned for a future release.
      </p>

      <div className="roadmap-blueprint-grid" aria-label="Planned capabilities">
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <ShieldCheckIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Community inspiration</span>
          </div>
          <p className="roadmap-slot-text">
            Compare sustainable habits with community milestones in a privacy-first way.
          </p>
        </div>
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <AwardIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Green milestones</span>
          </div>
          <p className="roadmap-slot-text">
            Earn milestones for consistent tracking and lower-impact daily choices.
          </p>
        </div>
        <div className="roadmap-blueprint-card">
          <div className="roadmap-card-head">
            <span className="roadmap-icon-box" aria-hidden="true">
              <PlusCircleIcon size={16} />
            </span>
            <span className="roadmap-slot-label">Available today</span>
          </div>
          <p className="roadmap-slot-text">
            Keep recording your daily activities so you are ready when community features arrive.
          </p>
          <Link to="/log-activity" className="roadmap-action-link">
            Log an activity
          </Link>
        </div>
      </div>
    </div>
  );
}
