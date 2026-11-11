import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-brand">
        <span className="footer-mark" aria-hidden="true" />
        <span>Vayu (वायु): Vayu means air in Sanskrit.</span>
      </div>
      <nav className="footer-links" aria-label="Legal pages">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
      </nav>
    </footer>
  );
}
