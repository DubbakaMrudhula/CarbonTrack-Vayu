import React, { useState } from 'react';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { todayISO } from '../../utils/formatters';

export default function ElectricityForm({ factors, onSubmit, loading, serverErrors = {} }) {
  const [form, setForm] = useState({
    activityType: '',
    quantity: '',
    logDate: todayISO(),
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const selectedFactor = factors.find((f) => f.activityType === form.activityType);

  const typeOptions = factors.map((f) => ({
    value: f.activityType,
    label: f.displayName
  }));

  function set(field) {
    return (e) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
    };
  }

  function validate() {
    const e = {};
    if (!form.activityType) e.activityType = 'Please select an energy source.';
    const qty = parseFloat(form.quantity);
    if (!form.quantity) {
      e.quantity = 'Energy amount is required.';
    } else if (isNaN(qty) || qty <= 0) {
      e.quantity = 'Energy amount must be a positive number.';
    } else if (selectedFactor && qty > selectedFactor.maxQuantity) {
      e.quantity = `Amount cannot exceed ${selectedFactor.maxQuantity} ${selectedFactor.unit}.`;
    }
    if (!form.logDate) e.logDate = 'Date is required.';
    else if (form.logDate > todayISO()) e.logDate = 'Date cannot be in the future.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const payload = {
      category: 'ELECTRICITY',
      activityType: form.activityType,
      quantity: parseFloat(form.quantity),
      unit: selectedFactor?.unit || 'kWh',
      logDate: form.logDate,
      notes: form.notes || null
    };
    const ok = await onSubmit(payload);
    if (ok) {
      setForm({ activityType: '', quantity: '', logDate: todayISO(), notes: '' });
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SelectField
        id="electricity-source"
        label="Energy source"
        value={form.activityType}
        onChange={set('activityType')}
        error={errors.activityType || serverErrors.activityType}
        options={typeOptions}
        placeholder="Select source"
        required
      />
      <InputField
        id="electricity-kwh"
        label={`Energy used${selectedFactor ? ` (${selectedFactor.unit})` : ' (kWh)'}`}
        type="number"
        min="0.0001"
        step="any"
        value={form.quantity}
        onChange={set('quantity')}
        error={errors.quantity || serverErrors.quantity}
        required
      />
      <InputField
        id="electricity-date"
        label="Date"
        type="date"
        value={form.logDate}
        max={todayISO()}
        onChange={set('logDate')}
        error={errors.logDate || serverErrors.logDate}
        required
      />
      <InputField
        id="electricity-notes"
        label="Notes (optional)"
        type="text"
        value={form.notes}
        onChange={set('notes')}
        error={errors.notes || serverErrors.notes}
        maxLength={500}
      />
      <Button type="submit" variant="primary" loading={loading}>
        Log activity
      </Button>
    </form>
  );
}
