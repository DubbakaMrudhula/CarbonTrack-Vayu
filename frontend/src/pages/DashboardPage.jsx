import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import dashboardService from '../api/dashboardService';
import StatCard from '../components/common/StatCard';
import CategorySummary from '../components/dashboard/CategorySummary';
import RecentActivities from '../components/dashboard/RecentActivities';
import EarthGlobe3D from '../components/landing/EarthGlobe3D';
import Spinner from '../components/common/Spinner';
import Alert from '../components/common/Alert';
import Button from '../components/common/Button';
import {
  ActivityIcon,
  CalendarIcon,
  TrendingUpIcon,
  PieChartIcon,
  PlusCircleIcon,
  ClockIcon,
  PlusIcon,
  ArrowRightIcon,
  CategoryIcon
} from '../components/common/VayuIcons';
import { formatDate, formatCO2e, formatNumber, todayISO } from '../utils/formatters';

const CATEGORY_LABELS = {
  TRANSPORTATION: 'Transportation',
  ELECTRICITY: 'Electricity',
  FOOD: 'Food',
  SHOPPING: 'Shopping'
};

const QUICK_CATEGORIES = [
  { id: 'TRANSPORTATION', label: 'Transportation', hint: 'Distance in km', mod: 'transport' },
  { id: 'ELECTRICITY', label: 'Electricity', hint: 'Energy in kWh', mod: 'electricity' },
  { id: 'FOOD', label: 'Food', hint: 'Meal servings', mod: 'food' },
  { id: 'SHOPPING', label: 'Shopping', hint: 'Purchase spend', mod: 'shopping' }
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Dashboard | Vayu';
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await dashboardService.getSummary(todayISO());
      setSummary(data);
    } catch (err) {
      setError(err?.message || 'Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const today = formatDate(todayISO());

  const totalsMap = {};
  (summary?.categoryTotals || []).forEach((item) => {
    totalsMap[item.category] = parseFloat(item.totalEmissionKgCo2e) || 0;
  });

  const totalNum = summary ? parseFloat(summary.totalEmissionKgCo2e) || 0 : 0;

  let topCategoryLabel = 'No activity today';
  let topCategoryMeta = 'Log an entry to see your leading source';

  if (summary?.categoryTotals && summary.categoryTotals.length > 0 && totalNum > 0) {
    const sorted = QUICK_CATEGORIES
      .map((c) => ({ category: c.id, label: c.label, value: totalsMap[c.id] || 0 }))
      .sort((a, b) => b.value - a.value);

    if (sorted[0].value > 0) {
      const share = Math.round((sorted[0].value / totalNum) * 100);
      topCategoryLabel = CATEGORY_LABELS[sorted[0].category] || sorted[0].label;
      topCategoryMeta = `${share}% share of today's emissions`;
    }
  }

  return (
    <div className="page-container">
      {/* Structured Workspace Overview with Interactive 3D Earth Model */}
      <section className="dashboard-hero" aria-label="Carbon workspace overview">
        <div className="dashboard-hero-copy">
          <div className="hero-eyebrow-row">
            <span className="hero-date-chip">
              <CalendarIcon size={13} />
              <span>{today}</span>
            </span>
          </div>
          <h1 className="page-title dashboard-hero-title">
            Welcome, {user?.name || 'there'}
          </h1>
          <p className="dashboard-hero-sub">
            Monitor daily travel, home power, meals, and spend in transparent kg CO2e across your ledger.
          </p>
          <div className="hero-actions">
            <Link to="/log-activity" className="btn btn-primary">
              <PlusIcon size={15} />
              <span>Log activity</span>
            </Link>
            <Link to="/my-activities" className="btn btn-secondary">
              <ClockIcon size={15} />
              <span>View activity history</span>
            </Link>
          </div>
        </div>

        <div className="hero-earth-stage">
          <EarthGlobe3D variant="light" compact showHint={false} />
        </div>
      </section>

      {loading && <Spinner label="Loading dashboard..." />}

      {error && !loading && (
        <div>
          <Alert variant="danger">{error}</Alert>
          <Button variant="secondary" onClick={load}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !error && summary && (
        <>
          <div className="stat-cards-row">
            <StatCard
              accent
              label="Today's CO2e"
              value={`${formatCO2e(summary.totalEmissionKgCo2e)} kg`}
              meta="Daily footprint logged today"
              icon={<ActivityIcon size={16} />}
            />
            <StatCard
              label="Total activities"
              value={formatNumber(summary.totalActivityCount ?? 0, 0)}
              meta="Activities logged in total"
              icon={<CalendarIcon size={16} />}
            />
            <StatCard
              label="Leading source today"
              value={topCategoryLabel}
              meta={topCategoryMeta}
              icon={<TrendingUpIcon size={16} />}
            />
          </div>

          <div className="dashboard-bento-grid">
            <section
              className="studio-panel"
              aria-labelledby="category-summary-heading"
            >
              <div className="section-header">
                <div className="section-heading-with-icon">
                  <span className="section-header-emblem" aria-hidden="true">
                    <PieChartIcon size={16} />
                  </span>
                  <div>
                    <h2 id="category-summary-heading" className="section-title">
                      Today&apos;s emissions by category
                    </h2>
                    <p className="section-note">
                      Proportional breakdown across daily emission sources.
                    </p>
                  </div>
                </div>
              </div>
              <CategorySummary categoryTotals={summary.categoryTotals || []} />
            </section>

            <aside
              className="studio-panel"
              aria-labelledby="quick-log-heading"
            >
              <div className="section-header">
                <div className="section-heading-with-icon">
                  <span className="section-header-emblem" aria-hidden="true">
                    <PlusCircleIcon size={16} />
                  </span>
                  <div>
                    <h2 id="quick-log-heading" className="section-title">
                      Quick log by category
                    </h2>
                    <p className="section-note quicklog-note">
                      Jump straight to an activity entry form.
                    </p>
                  </div>
                </div>
              </div>

              <div className="quick-log-grid">
                {QUICK_CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/log-activity?category=${cat.id}`}
                    className="quick-log-card"
                  >
                    <span className={`quick-log-icon cat-icon-${cat.mod}`} aria-hidden="true">
                      <CategoryIcon category={cat.id} size={18} />
                    </span>
                    <span className="quick-log-info">
                      <span className="quick-log-name">{cat.label}</span>
                      <span className="quick-log-hint">{cat.hint}</span>
                    </span>
                    <ArrowRightIcon size={14} className="quick-log-arrow" />
                  </Link>
                ))}
              </div>
            </aside>
          </div>

          {summary.totalActivityCount === 0 ? (
            <div className="empty-state empty-state-studio">
              <div className="empty-state-content">
                <p className="empty-state-title">Your carbon ledger is ready</p>
                <p className="empty-state-text">No activities logged yet.</p>
                <Link to="/log-activity" className="btn btn-primary">
                  Log your first activity
                </Link>
              </div>
              <div className="empty-workflow-strip" aria-label="How logging works">
                <div className="empty-workflow-step">
                  <span className="empty-step-tag">01</span>
                  <span className="empty-step-label">Pick a category</span>
                </div>
                <ArrowRightIcon size={14} />
                <div className="empty-workflow-step">
                  <span className="empty-step-tag">02</span>
                  <span className="empty-step-label">Enter activity details</span>
                </div>
                <ArrowRightIcon size={14} />
                <div className="empty-workflow-step">
                  <span className="empty-step-tag">03</span>
                  <span className="empty-step-label">Review daily total</span>
                </div>
              </div>
            </div>
          ) : (
            <section aria-labelledby="recent-activities-heading">
              <h2 id="recent-activities-heading" className="visually-hidden">
                Recent activities
              </h2>
              <RecentActivities activities={summary.recentActivities || []} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
