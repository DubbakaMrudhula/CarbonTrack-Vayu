import React from 'react';
import StatusLabel from '../common/StatusLabel';
import { CategoryIcon } from '../common/VayuIcons';
import { formatCO2e, formatQuantity, formatDate } from '../../utils/formatters';

const CATEGORY_VARIANT = {
  TRANSPORTATION: 'info',
  ELECTRICITY: 'warning',
  FOOD: 'success',
  SHOPPING: 'neutral'
};

export default function EmissionResultCard({ result }) {
  if (!result) return null;

  const {
    emissionKgCo2e,
    quantity,
    unit,
    displayName,
    activityType,
    category,
    logDate
  } = result;

  return (
    <div className="emission-result-card" role="region" aria-label="Emission calculation result">
      <div className="emission-result-header">
        <div className="emission-result-heading-row">
          <span className="emission-result-icon" aria-hidden="true">
            <CategoryIcon category={category} size={16} />
          </span>
          <h3 className="emission-result-title">Emission calculated</h3>
        </div>
        {category && (
          <StatusLabel
            variant={CATEGORY_VARIANT[category] || 'neutral'}
            status={category.charAt(0) + category.slice(1).toLowerCase()}
          />
        )}
      </div>

      <dl className="emission-result-list">
        <div className="emission-result-row">
          <dt>Activity</dt>
          <dd>{displayName || activityType}</dd>
        </div>
        <div className="emission-result-row">
          <dt>Quantity</dt>
          <dd>
            {formatQuantity(quantity)} {unit}
          </dd>
        </div>
        {logDate && (
          <div className="emission-result-row">
            <dt>Date logged</dt>
            <dd>{formatDate(logDate)}</dd>
          </div>
        )}
        <div className="emission-result-row emission-result-total">
          <dt>CO2e</dt>
          <dd className="emission-result-highlight">{formatCO2e(emissionKgCo2e)} kg</dd>
        </div>
      </dl>
    </div>
  );
}
