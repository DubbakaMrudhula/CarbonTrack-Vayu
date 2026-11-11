import React from 'react';

export default function Alert({
  variant = 'info',
  children,
  className = '',
  ...props
}) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className={`alert alert-${variant} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

