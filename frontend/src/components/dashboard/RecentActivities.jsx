import React from 'react';
import { Link } from 'react-router-dom';
import StatusLabel from '../common/StatusLabel';
import { CategoryIcon } from '../common/VayuIcons';
import { formatDate, formatCO2e, formatQuantity } from '../../utils/formatters';

const CATEGORY_VARIANT = {
  TRANSPORTATION: 'info',
  ELECTRICITY: 'warning',
  FOOD: 'success',
  SHOPPING: 'neutral'
};

export default function RecentActivities({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="recent-activities">
        <h2 className="section-title">Recent activities</h2>
        <div className="empty-state">
          <p className="empty-state-text">No activities logged yet.</p>
          <Link to="/log-activity" className="btn btn-primary">
            Log your first activity
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activities studio-panel">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent activities</h2>
          <p className="section-sub">Latest recorded entries sorted chronologically</p>
        </div>
        <Link to="/my-activities" className="btn btn-secondary btn-sm">
          View all
        </Link>
      </div>
      <div className="data-table-container">
        <table className="data-table" aria-label="Recent activities">
          <thead>
            <tr>
              <th>Activity</th>
              <th>Category</th>
              <th className="col-right">CO2e (kg)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="activity-cell-wrap">
                    <span className="activity-cell-icon" aria-hidden="true">
                      <CategoryIcon category={a.category} size={14} />
                    </span>
                    <div>
                      <div className="activity-cell-title">{a.displayName || a.activityType}</div>
                      {a.quantity !== undefined && a.unit && (
                        <div className="activity-cell-meta">
                          {formatQuantity(a.quantity)} {a.unit}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td>
                  <StatusLabel
                    variant={CATEGORY_VARIANT[a.category] || 'neutral'}
                    status={a.category.charAt(0) + a.category.slice(1).toLowerCase()}
                  />
                </td>
                <td className="col-right td-strong">{formatCO2e(a.emissionKgCo2e)}</td>
                <td>{formatDate(a.logDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
