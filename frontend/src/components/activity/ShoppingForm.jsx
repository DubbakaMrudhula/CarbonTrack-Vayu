import React, { useState } from 'react';
import SelectField from '../common/SelectField';
import InputField from '../common/InputField';
import Button from '../common/Button';
import { todayISO } from '../../utils/formatters';

export default function ShoppingForm({
  factors,
  onSubmit,
  loading,
  currency = 'INR',
  serverErrors = {}
}) {
  const [form, setForm] = useState({
    activityType: '',
    quantity: '',
    logDate: todayISO(),
    notes: ''
  });
  const [errors, setErrors] = useState({});

  // Prefer factors matching the user's currency if available
  const matchingCurrencyFactors = factors.filter((f) => f.unit === currency);
  const availableFactors = matchingCurrencyFactors.length > 0 ? matchingCurrencyFactors : factors;

  const selectedFactor = availableFactors.find(
    (f) => f.activityType === form.activityType
  );

  const typeOptions = availableFactors.map((f) => ({
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
    if (!form.activityType) e.activityType = 'Please select a product category.';
    const qty = parseFloat(form.quantity);
    if (!form.quantity) {
      e.quantity = 'Spend amount is required.';
    } else if (isNaN(qty) || qty <= 0) {
      e.quantity = 'Spend amount must be a positive number.';
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
      category: 'SHOPPING',
      activityType: form.activityType,
      quantity: parseFloat(form.quantity),
      unit: selectedFactor?.unit || currency,
      logDate: form.logDate,
      notes: form.notes || null
    };
    const ok = await onSubmit(payload);
    if (ok) {
      setForm({ activityType: '', quantity: '', logDate: todayISO(), notes: '' });
    }
  }

  const displayUnit = selectedFactor?.unit || currency;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <SelectField
        id="shopping-type"
        label="Product category"
        value={form.activityType}
        onChange={set('activityType')}
        error={errors.activityType || serverErrors.activityType}
        options={typeOptions}
        placeholder="Select category"
        required
      />
      <InputField
        id="shopping-amount"
        label={`Spend amount (${displayUnit})`}
        type="number"
        min="0.01"
        step="any"
        value={form.quantity}
        onChange={set('quantity')}
        error={errors.quantity || serverErrors.quantity}
        required
      />
      <InputField
        id="shopping-date"
        label="Date"
        type="date"
        value={form.logDate}
        max={todayISO()}
        onChange={set('logDate')}
        error={errors.logDate || serverErrors.logDate}
        required
      />
      <InputField
        id="shopping-notes"
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
