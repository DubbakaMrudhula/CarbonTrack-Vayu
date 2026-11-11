import React from 'react';

export default function StatCard({
  label,
  value,
  meta,
  icon = null,
  accent = false,
  className = ''
}) {
  return (
    <div className={`stat-card${accent ? ' stat-card-accent' : ''} ${className}`}>
      <div className="stat-card-top">
        <span className="stat-label">{label}</span>
        {icon && (
          <span className="stat-icon-box" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
      <span className="stat-value" title={typeof value === 'string' ? value : undefined}>
        {value}
      </span>
      {meta && <span className="stat-meta">{meta}</span>}
    </div>
  );
}
