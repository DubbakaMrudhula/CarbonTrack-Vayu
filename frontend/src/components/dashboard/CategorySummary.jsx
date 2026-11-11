import React from 'react';
import { formatCO2e } from '../../utils/formatters';
import { CategoryIcon } from '../common/VayuIcons';

const CATEGORY_META = [
  { key: 'TRANSPORTATION', label: 'Transportation', color: 'var(--color-cat-transport)', mod: 'transport' },
  { key: 'ELECTRICITY', label: 'Electricity', color: 'var(--color-cat-electricity)', mod: 'electricity' },
  { key: 'FOOD', label: 'Food', color: 'var(--color-cat-food)', mod: 'food' },
  { key: 'SHOPPING', label: 'Shopping', color: 'var(--color-cat-shopping)', mod: 'shopping' }
];

const RING_SIZE = 156;
const STROKE_WIDTH = 18;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function CategorySummary({ categoryTotals }) {
  const totalsMap = {};
  (categoryTotals || []).forEach((ct) => {
    const raw = ct.totalEmissionKgCo2e ?? 0;
    totalsMap[ct.category] = parseFloat(raw) || 0;
  });

  const totalSum = CATEGORY_META.reduce((acc, item) => acc + (totalsMap[item.key] || 0), 0);
  const maxVal = Math.max(...CATEGORY_META.map((item) => totalsMap[item.key] || 0), 0.0001);

  const activeSegments = CATEGORY_META
    .map((item) => ({
      ...item,
      value: totalsMap[item.key] || 0
    }))
    .filter((item) => item.value > 0);

  const gapLen = activeSegments.length > 1 ? 3 : 0;
  let cumulativeOffset = 0;

  return (
    <div className="category-summary" aria-label="Emissions by category">
      <div className="category-visual-panel">
        <svg
          width={RING_SIZE}
          height={RING_SIZE}
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="category-ring-svg"
          role="img"
          aria-label={`Today's total emissions ring: ${formatCO2e(totalSum)} kg CO2e`}
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#EBF0ED"
            strokeWidth={STROKE_WIDTH}
          />
          {totalSum > 0 &&
            activeSegments.map((seg) => {
              const fraction = seg.value / totalSum;
              const rawLen = fraction * CIRCUMFERENCE;
              const segLen = Math.max(rawLen - gapLen, 2);
              const dashOffset = -cumulativeOffset;
              const share = Math.round(fraction * 100);
              cumulativeOffset += rawLen;
              return (
                <circle
                  key={seg.key}
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  strokeDasharray={`${segLen} ${CIRCUMFERENCE}`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                >
                  <title>{`${seg.label}: ${formatCO2e(seg.value)} kg CO2e (${share}%)`}</title>
                </circle>
              );
            })}
          <text
            x="50%"
            y="46%"
            textAnchor="middle"
            dominantBaseline="central"
            className="ring-center-value"
          >
            {formatCO2e(totalSum)}
          </text>
          <text
            x="50%"
            y="60%"
            textAnchor="middle"
            dominantBaseline="central"
            className="ring-center-unit"
          >
            kg CO2e
          </text>
        </svg>
        <div className="category-ring-caption">
          {totalSum > 0 ? 'Share by source' : 'No emissions recorded today'}
        </div>
      </div>

      <div className="category-rows-list">
        {CATEGORY_META.map((cat) => {
          const value = totalsMap[cat.key] || 0;
          const widthPct = value > 0 ? Math.max(Math.round((value / maxVal) * 100), 5) : 0;
          const sharePct = totalSum > 0 ? Math.round((value / totalSum) * 100) : 0;

          return (
            <div key={cat.key} className="category-row">
              <div className="category-row-head">
                <span className={`category-row-icon cat-icon-${cat.mod}`} aria-hidden="true">
                  <CategoryIcon category={cat.key} size={15} />
                </span>
                <span className="category-row-label">{cat.label}</span>
              </div>
              <span className="category-share-tag">{sharePct}%</span>
              <div
                className="category-bar-track"
                role="img"
                aria-label={`${cat.label}: ${formatCO2e(value)} kg CO2e`}
              >
                <div
                  className={`category-bar-fill cat-fill-${cat.mod}`}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className={`category-row-value${value === 0 ? ' category-row-empty' : ''}`}>
                {value > 0 ? `${formatCO2e(value)} kg` : 'No emissions'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
