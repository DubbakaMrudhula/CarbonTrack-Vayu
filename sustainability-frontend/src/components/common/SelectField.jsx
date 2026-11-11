import React from 'react';

export default function SelectField({
  id,
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="form-label">
          {label} {required && <span aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        className={`form-select ${error ? 'has-error' : ''}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hint && !error && (
        <span id={`${selectId}-hint`} className="form-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${selectId}-error`} className="form-error" aria-live="polite">
          {error}
        </span>
      )}
    </div>
  );
}
