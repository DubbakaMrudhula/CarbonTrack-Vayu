import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import EarthGlobe3D from '../components/landing/EarthGlobe3D';
import {
  ProblemOverviewPanel,
  SolutionOverviewPanel,
  ImpactCategoryIcon,
  DashboardWorkspaceMockup
} from '../components/landing/LandingIllustrations';
import {
  VayuMark,
  ArrowRightIcon,
  UserIcon,
  CalendarIcon,
  BarChartIcon,
  LeafIcon,
  GlobeIcon
} from '../components/common/VayuIcons';
import '../styles/landing.css';

const STEPS = [
  {
    num: '01',
    title: 'Create Your Account',
    desc: 'Set up your personal carbon journal in under a minute.',
    icon: <UserIcon size={22} />
  },
  {
    num: '02',
    title: 'Log Your Activities',
    desc: 'Record daily commutes, home power, meals, and spend.',
    icon: <CalendarIcon size={22} />
  },
  {
    num: '03',
    title: 'View Insights',
    desc: 'Inspect daily totals and emission shares by category.',
    icon: <BarChartIcon size={22} />
  },
  {
    num: '04',
    title: 'Reduce Emissions',
    desc: 'Identify high-impact habits and make steady reductions.',
    icon: <LeafIcon size={22} />
  }
];

const CATEGORIES = [
  { id: 'TRANSPORTATION', title: 'Transportation', desc: 'Commutes, drives & transit distance', mod: 'transport' },
  { id: 'ELECTRICITY', title: 'Electricity', desc: 'Household grid & energy consumption', mod: 'electricity' },
  { id: 'FOOD', title: 'Food', desc: 'Daily meals and dietary choices', mod: 'food' },
  { id: 'SHOPPING', title: 'Shopping', desc: 'Everyday goods & discretionary spend', mod: 'shopping' }
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const primaryTarget = isAuthenticated ? '/dashboard' : '/register';
  const primaryLabel = isAuthenticated ? 'Open Dashboard' : 'Get Started';

  useEffect(() => {
    document.title = 'Vayu | Personal Carbon Footprint Tracker';
  }, []);

  return (
    <div className="landing-page">
      {/* Header Navigation */}
      <header className="landing-header-bar">
        <div className="landing-nav">
          <Link to="/" className="landing-brand" aria-label="Vayu home">
            <span className="landing-brand-icon" aria-hidden="true">
              <VayuMark size={20} />
            </span>
            <span className="landing-brand-text">Vayu</span>
          </Link>

          <nav className="landing-nav-pill" aria-label="Primary sections">
            <a href="#hero" className="landing-nav-link active">Home</a>
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#about" className="landing-nav-link">About</a>
            <a href="#insights" className="landing-nav-link">Insights</a>
            <a href="#contact" className="landing-nav-link">Contact</a>
          </nav>

          <div className="landing-nav-actions">
            {!isAuthenticated && (
              <Link to="/login" className="landing-signin-link">
                Sign in
              </Link>
            )}
            <Link to={primaryTarget} className="landing-cta-pill">
              <span>{primaryLabel}</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section with Architectural Grid Backdrop & 3D Earth Model */}
        <section id="hero" className="landing-hero-band">
          <div className="landing-hero">
            <div className="landing-hero-left">
              <div className="landing-eyebrow-pill">
                <GlobeIcon size={13} />
                <span>Track. Analyse. Reduce.</span>
              </div>
              <h1 className="landing-hero-title">
                A Greener
                <span className="landing-hero-subheadline">Tomorrow</span>
                <span className="landing-hero-highlight">Starts With You</span>
              </h1>
              <p className="landing-hero-desc">
                Monitor your personal carbon footprint, review your everyday emission sources,
                and build consistent sustainable habits in one clean workspace.
              </p>
              <div className="landing-hero-buttons">
                <Link to={primaryTarget} className="landing-btn-primary">
                  <span>{isAuthenticated ? 'Go to Workspace' : 'Start Tracking'}</span>
                  <ArrowRightIcon size={14} />
                </Link>
                <a href="#how-it-works" className="landing-btn-secondary">
                  <span>See How It Works</span>
                </a>
              </div>
            </div>

            <div className="landing-hero-right">
              <EarthGlobe3D variant="light" />
            </div>
          </div>
        </section>

        {/* Problem & Solution Two-Card Showcase */}
        <section id="about" className="landing-cards-section">
          <div className="landing-problem-solution-grid">
            <article className="landing-feature-card problem-card">
              <div className="feature-card-copy">
                <div className="card-kicker-row">
                  <span className="card-kicker kicker-muted">THE PROBLEM</span>
                </div>
                <h2 className="feature-card-title">
                  Our Planet is Running Out of Time
                </h2>
                <p className="feature-card-body">
                  Carbon emissions are accelerating, driving climate change, extreme weather,
                  and loss of biodiversity across every continent.
                </p>
                <a href="#how-it-works" className="landing-btn-dark card-action-btn">
                  <span>Learn More</span>
                  <ArrowRightIcon size={14} />
                </a>
              </div>
              <ProblemOverviewPanel />
            </article>

            <article className="landing-feature-card solution-card">
              <div className="feature-card-copy">
                <div className="card-kicker-row">
                  <span className="card-kicker kicker-green">OUR SOLUTION</span>
                </div>
                <h2 className="feature-card-title">
                  Smart. Simple. Impactful.
                </h2>
                <p className="feature-card-body">
                  Vayu helps you understand your carbon footprint, track daily activities,
                  and discover realistic ways to live more sustainably.
                </p>
                <a href="#features" className="landing-btn-primary card-action-btn">
                  <span>Explore Features</span>
                  <ArrowRightIcon size={14} />
                </a>
              </div>
              <SolutionOverviewPanel />
            </article>
          </div>
        </section>

        {/* 4-Step How It Works Band */}
        <section id="how-it-works" className="landing-band-white">
          <div className="landing-section-centered">
            <div className="journey-header">
              <span className="how-pill-badge">HOW IT WORKS</span>
              <h2 className="landing-section-heading">A Simple 4-Step Journey</h2>
            </div>

            <div className="steps-grid">
              {STEPS.map((step) => (
                <div key={step.num} className="step-card">
                  <div className="step-card-top">
                    <span className="step-icon-box" aria-hidden="true">
                      {step.icon}
                    </span>
                    <span className="step-num-badge">{step.num}</span>
                  </div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workspace Preview Left + Track Every Impact Right */}
        <section id="insights" className="landing-impact-showcase">
          <div id="features" className="landing-impact-left">
            <DashboardWorkspaceMockup />
          </div>

          <div className="landing-impact-right">
            <h2 className="impact-showcase-title">Track Every Impact</h2>
            <p className="impact-showcase-sub">
              From transportation to shopping, monitor your footprint across every
              aspect of daily life.
            </p>

            <div className="impact-categories-row">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  to={isAuthenticated ? `/log-activity?category=${cat.id}` : '/register'}
                  className="impact-tile-card"
                >
                  <div className={`impact-tile-icon cat-icon-${cat.mod}`}>
                    <ImpactCategoryIcon category={cat.id} />
                  </div>
                  <div className="impact-tile-text">
                    <span className="impact-tile-title">{cat.title}</span>
                    <span className="impact-tile-desc">{cat.desc}</span>
                  </div>
                  <ArrowRightIcon size={14} className="impact-tile-arrow" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom Architectural CTA */}
        <section id="contact" className="landing-cta-horizon">
          <div className="landing-cta-foreground">
            <h2 className="landing-cta-title">Be the Change</h2>
            <p className="landing-cta-sub">
              Start tracking your carbon footprint today and be part of a sustainable future.
            </p>
            <Link to={primaryTarget} className="landing-btn-primary">
              <span>{primaryLabel}</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </section>
      </main>

      {/* Editorial Light Footer */}
      <footer className="landing-footer-bar">
        <div className="landing-footer">
          <div className="landing-footer-brand">
            <span className="landing-brand-icon" aria-hidden="true">
              <VayuMark size={18} />
            </span>
            <div>
              <div className="landing-footer-name">Vayu</div>
              <div className="landing-footer-tagline">Small Changes. Big Impact.</div>
            </div>
          </div>

          <nav className="landing-footer-links" aria-label="Footer navigation">
            <a href="#about">About</a>
            <a href="#features">Features</a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a href="#contact">Contact</a>
          </nav>

          <div className="landing-footer-note">
            Personal Carbon Ledger
          </div>
        </div>
      </footer>
    </div>
  );
}
