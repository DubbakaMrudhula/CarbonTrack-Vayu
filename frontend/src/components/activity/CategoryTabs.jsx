import React, { useRef } from 'react';
import { CategoryIcon } from '../common/VayuIcons';

// CategoryTabs renders an accessible tablist with keyboard navigation.
// Props:
//   tabs: [{ id, label }]
//   activeTab: id of the active tab
//   onChange: (tabId) => void
//   children: rendered by the parent per activeTab

export default function CategoryTabs({ tabs, activeTab, onChange, children }) {
  const tabRefs = useRef([]);

  function handleKeyDown(e, index) {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (e.key === 'Home') {
      newIndex = 0;
    } else if (e.key === 'End') {
      newIndex = tabs.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onChange(tabs[newIndex].id);
    tabRefs.current[newIndex]?.focus();
  }

  return (
    <div className="category-tabs">
      <div
        className="tab-list"
        role="tablist"
        aria-label="Activity categories"
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`tab-btn${isActive ? ' active' : ''}`}
              ref={(el) => (tabRefs.current[index] = el)}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <CategoryIcon category={tab.id} size={15} className="tab-btn-icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`tab-${tab.id}`}
          hidden={tab.id !== activeTab}
          className="tab-panel"
        >
          {tab.id === activeTab && children}
        </div>
      ))}
    </div>
  );
}
