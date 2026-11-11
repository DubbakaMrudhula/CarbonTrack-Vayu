import React from 'react';

export default function Spinner({ className = '', label = 'Loading...' }) {
  return (
    <span
      className={`spinner ${className}`}
      role="status"
      aria-label={label}
    />
  );
}

