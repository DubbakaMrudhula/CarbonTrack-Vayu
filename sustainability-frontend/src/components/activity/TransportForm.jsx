import React, { useState } from 'react';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { todayISO } from '../../utils/formatters';

export default function TransportForm({ factors, onSubmit, loading, serverErrors = {} }) {
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
    if (!form.activityType) e.activityType = 'Please select a transport mode.';
    const qty = parseFloat(form.quantity);
    if (!form.quantity) {
      e.quantity = 'Distance is required.';
    } else if (isNaN(qty) || qty <= 0) {
      e.quantity = 'Distance must be a positive number.';
    } else if (selectedFactor && qty > selectedFactor.maxQuantity) {
      e.quantity = `Distance cannot exceed ${selectedFactor.maxQuantity} ${selectedFactor.unit}.`;
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
      category: 'TRANSPORTATION',
      activityType: form.activityType,
      quantity: parseFloat(form.quantity),
      unit: selectedFactor?.unit || 'km',
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
        id="transport-type"
        label="Transport mode"
        value={form.activityType}
        onChange={set('activityType')}
        error={errors.activityType || serverErrors.activityType}
        options={typeOptions}
        placeholder="Select mode"
        required
      />
      <InputField
        id="transport-distance"
        label={`Distance${selectedFactor ? ` (${selectedFactor.unit})` : ''}`}
        type="number"
        min="0.0001"
        step="any"
        value={form.quantity}
        onChange={set('quantity')}
        error={errors.quantity || serverErrors.quantity}
        required
      />
      <InputField
        id="transport-date"
        label="Date"
        type="date"
        value={form.logDate}
        max={todayISO()}
        onChange={set('logDate')}
        error={errors.logDate || serverErrors.logDate}
        required
      />
      <InputField
        id="transport-notes"
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
