import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Footer from '../components/layout/Footer';

export default function LegalLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const backTarget = isAuthenticated ? '/dashboard' : '/login';
  const backLabel = isAuthenticated ? 'Back to dashboard' : 'Back to sign in';

  return (
    <div className="legal-container">
      <header className="legal-header">
        <Link to={backTarget} className="topbar-wordmark">
          Vayu
        </Link>
        <Link to={backTarget} className="legal-back-link">
          {backLabel}
        </Link>
      </header>
      <main className="legal-body">
        <div className="legal-card">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
