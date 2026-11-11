import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CategoryTabs from '../components/activity/CategoryTabs';
import TransportForm from '../components/activity/TransportForm';
import ElectricityForm from '../components/activity/ElectricityForm';
import FoodForm from '../components/activity/FoodForm';
import ShoppingForm from '../components/activity/ShoppingForm';
import EmissionResultCard from '../components/activity/EmissionResultCard';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { CategoryIcon } from '../components/common/VayuIcons';
import emissionFactorService from '../api/emissionFactorService';
import activityService from '../api/activityService';
import userService from '../api/userService';

const TABS = [
  { id: 'TRANSPORTATION', label: 'Transportation' },
  { id: 'ELECTRICITY', label: 'Electricity' },
  { id: 'FOOD', label: 'Food' },
  { id: 'SHOPPING', label: 'Shopping' }
];

const VALID_TAB_IDS = new Set(TABS.map((t) => t.id));

export default function ActivityLoggingPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category');
  const [activeTab, setActiveTab] = useState(
    VALID_TAB_IDS.has(initialCategory) ? initialCategory : 'TRANSPORTATION'
  );
  const [factorsByCategory, setFactorsByCategory] = useState({});
  const [currency, setCurrency] = useState('INR');
  const [factorsLoading, setFactorsLoading] = useState(true);
  const [factorsError, setFactorsError] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitResult, setSubmitResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.title = 'Activity Logging | Vayu';
    loadInitialData();
  }, []);

  useEffect(() => {
    if (VALID_TAB_IDS.has(initialCategory)) {
      setActiveTab(initialCategory);
    }
  }, [initialCategory]);

  async function loadInitialData() {
    setFactorsLoading(true);
    setFactorsError('');
    try {
      const [factors, prefs] = await Promise.all([
        emissionFactorService.getFactors(),
        userService.getPreferences().catch(() => null)
      ]);
      const grouped = {};
      (factors || []).forEach((f) => {
        if (!grouped[f.category]) grouped[f.category] = [];
        grouped[f.category].push(f);
      });
      setFactorsByCategory(grouped);
      if (prefs?.currency) {
        setCurrency(prefs.currency);
      }
    } catch (err) {
      setFactorsError(err?.message || 'Failed to load activity types. Please reload the page.');
    } finally {
      setFactorsLoading(false);
    }
  }

  async function handleSubmit(payload) {
    setSubmitting(true);
    setSubmitError('');
    setFieldErrors({});
    setSubmitResult(null);
    setSuccessMessage('');
    try {
      const result = await activityService.createActivity(payload);
      setSubmitResult(result);
      setSuccessMessage('Activity logged successfully.');
      return true;
    } catch (err) {
      const msg = err?.message || 'Failed to log activity.';
      setSubmitError(msg);
      if (err?.fieldErrors && Array.isArray(err.fieldErrors)) {
        const mapped = {};
        err.fieldErrors.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setFieldErrors(mapped);
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  const currentFactors = factorsByCategory[activeTab] || [];
  const activeTabInfo = TABS.find((t) => t.id === activeTab);

  function renderForm() {
    if (currentFactors.length === 0) {
      return (
        <p className="empty-state-text">
          No activity types are available for this category yet.
        </p>
      );
    }
    const props = {
      factors: currentFactors,
      onSubmit: handleSubmit,
      loading: submitting,
      serverErrors: fieldErrors
    };
    switch (activeTab) {
      case 'TRANSPORTATION':
        return <TransportForm {...props} />;
      case 'ELECTRICITY':
        return <ElectricityForm {...props} />;
      case 'FOOD':
        return <FoodForm {...props} />;
      case 'SHOPPING':
        return <ShoppingForm {...props} currency={currency} />;
      default:
        return null;
    }
  }

  if (factorsLoading) {
    return (
      <div className="page-container">
        <Spinner label="Loading activity types..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <span className="hero-eyebrow">DAILY TRACKER</span>
          <h1 className="page-title">Log Activity</h1>
          <p className="page-sub">
            Choose a category and record your everyday activity to track its footprint.
          </p>
        </div>
        <Link to="/my-activities" className="btn btn-secondary">
          My Activities
        </Link>
      </div>

      {factorsError && <Alert variant="danger">{factorsError}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {submitError && <Alert variant="danger">{submitError}</Alert>}

      <div className="log-studio-grid">
        <div className="log-activity-card">
          <CategoryTabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={(tab) => {
              setActiveTab(tab);
              setSubmitResult(null);
              setSubmitError('');
              setFieldErrors({});
              setSuccessMessage('');
            }}
          >
            {renderForm()}
          </CategoryTabs>
        </div>

        <aside className="log-studio-aside" aria-label="Supported activities">
          {submitResult && <EmissionResultCard result={submitResult} />}

          <div className="studio-panel factor-guide-card">
            <div className="factor-guide-header">
              <span className="factor-guide-icon" aria-hidden="true">
                <CategoryIcon category={activeTab} size={16} />
              </span>
              <div>
                <h2 className="section-title">
                  {activeTabInfo?.label || activeTab} choices
                </h2>
                <p className="factor-guide-sub">
                  Everyday activities you can record in this category
                </p>
              </div>
            </div>

            {activeTab === 'SHOPPING' && (
              <div className="factor-currency-note">
                <span>Preferred currency</span>
                <strong>{currency}</strong>
              </div>
            )}

            {currentFactors.length === 0 ? (
              <p className="section-note">No activity choices are available right now.</p>
            ) : (
              <ul className="factor-list" role="list">
                {currentFactors.map((f) => (
                  <li key={f.activityType} className="factor-list-item" role="listitem">
                    <div className="factor-item-name">{f.displayName}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
