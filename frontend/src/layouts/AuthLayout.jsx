import React from 'react';
import { Link } from 'react-router-dom';
import Footer from '../components/layout/Footer';
import { VayuMark, CategoryIcon } from '../components/common/VayuIcons';

export default function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-split">
        <aside className="auth-showcase" aria-label="About Vayu">
          <div className="auth-showcase-inner">
            <div className="auth-brand-badge">
              <VayuMark size={26} />
              <div>
                <span className="auth-brand-name">Vayu</span>
                <span className="auth-brand-sanskrit" lang="sa">वायु</span>
              </div>
            </div>

            <div className="auth-showcase-copy">
              <p className="auth-eyebrow">MINDFUL CLIMATE LIVING</p>
              <h2 className="auth-headline">
                Understand your everyday footprint in one calm space.
              </h2>
              <p className="auth-description">
                Record your daily travel, home energy, meals, and shopping to build clearer habits
                for a cleaner tomorrow.
              </p>
            </div>

            <ul className="auth-feature-grid" role="list">
              <li className="auth-feature-tile" role="listitem">
                <CategoryIcon category="TRANSPORTATION" size={16} />
                <div>
                  <div className="auth-feature-title">Daily Commutes</div>
                  <div className="auth-feature-sub">Cars, transit &amp; travel</div>
                </div>
              </li>
              <li className="auth-feature-tile" role="listitem">
                <CategoryIcon category="ELECTRICITY" size={16} />
                <div>
                  <div className="auth-feature-title">Home Energy</div>
                  <div className="auth-feature-sub">Everyday power usage</div>
                </div>
              </li>
              <li className="auth-feature-tile" role="listitem">
                <CategoryIcon category="FOOD" size={16} />
                <div>
                  <div className="auth-feature-title">Food Choices</div>
                  <div className="auth-feature-sub">Daily meals &amp; diet</div>
                </div>
              </li>
              <li className="auth-feature-tile" role="listitem">
                <CategoryIcon category="SHOPPING" size={16} />
                <div>
                  <div className="auth-feature-title">Purchases</div>
                  <div className="auth-feature-sub">Household spending</div>
                </div>
              </li>
            </ul>

            <div className="auth-legal-shortcut">
              <Link to="/">Home</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
        </aside>

        <div className="auth-container">
          {children}
        </div>
      </div>
      <Footer />
    </div>
  );
}
