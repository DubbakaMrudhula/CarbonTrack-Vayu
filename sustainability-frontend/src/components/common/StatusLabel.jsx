import React from 'react';

export default function StatusLabel({
  status,
  variant = 'neutral',
  className = ''
}) {
  return (
    <span className={`status-label status-label-${variant} ${className}`}>
      {status}
    </span>
  );
}

