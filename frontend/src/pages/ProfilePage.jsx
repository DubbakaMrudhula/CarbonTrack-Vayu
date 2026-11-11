import React, { useEffect, useState } from 'react';
import useAuth from '../hooks/useAuth';
import userService from '../api/userService';
import InputField from '../components/common/InputField';
import SelectField from '../components/common/SelectField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import { UserIcon, SlidersIcon } from '../components/common/VayuIcons';
import { formatDate, getInitials } from '../utils/formatters';
import {
  INDIAN_STATES,
  DIET_TYPE_OPTIONS,
  TRANSPORT_OPTIONS,
  CURRENCY_OPTIONS,
  FOCUS_CATEGORY_OPTIONS
} from '../utils/constants';

export default function ProfilePage() {
  const { user, updateUserSummary } = useAuth();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameServerError, setNameServerError] = useState('');

  const [prefs, setPrefs] = useState(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsError, setPrefsError] = useState('');
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState('');
  const [prefsSaveError, setPrefsSaveError] = useState('');

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    document.title = 'Profile | Vayu';
    loadProfile();
    loadPrefs();
  }, []);

  async function loadProfile() {
    setProfileLoading(true);
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setName(data.name || '');
    } catch (err) {
      setName(user?.name || '');
    } finally {
      setProfileLoading(false);
    }
  }

  async function loadPrefs() {
    setPrefsLoading(true);
    setPrefsError('');
    try {
      const data = await userService.getPreferences();
      setPrefs(data);
    } catch (err) {
      setPrefsError(err?.message || 'Failed to load preferences.');
    } finally {
      setPrefsLoading(false);
    }
  }

  async function handleNameSave(e) {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    setNameServerError('');
    if (!name.trim()) {
      setNameError('Name is required.');
      return;
    }
    if (name.trim().length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    setNameSaving(true);
    try {
      const updated = await userService.updateProfile({ name: name.trim() });
      updateUserSummary({ ...user, name: updated.name });
      setNameSuccess('Name updated successfully.');
    } catch (err) {
      setNameServerError(err?.message || 'Failed to update name.');
    } finally {
      setNameSaving(false);
    }
  }

  function setPrefsField(field) {
    return (e) => setPrefs((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function toggleFocusCategory(categoryValue) {
    const current = (prefs?.focusCategories || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = current.includes(categoryValue);
    const updated = exists
      ? current.filter((c) => c !== categoryValue)
      : [...current, categoryValue];
    setPrefs((prev) => ({ ...prev, focusCategories: updated.join(',') }));
  }

  async function handlePrefsSave(e) {
    e.preventDefault();
    setPrefsSaveError('');
    setPrefsSuccess('');

    const country = (prefs?.country || '').trim();
    if (!country) {
      setPrefsSaveError('Country is required.');
      return;
    }

    const hs = parseInt(prefs?.householdSize, 10);
    if (isNaN(hs) || hs < 1 || hs > 20) {
      setPrefsSaveError('Household size must be between 1 and 20.');
      return;
    }

    const dietType = prefs?.dietType || 'VEGETARIAN';
    const primaryTransport = prefs?.primaryTransport || 'METRO';
    const focusCategories = (prefs?.focusCategories || '').trim();
    if (!focusCategories) {
      setPrefsSaveError('Select at least one focus category.');
      return;
    }

    if (
      prefs?.weeklyTargetKg !== '' &&
      prefs?.weeklyTargetKg !== null &&
      prefs?.weeklyTargetKg !== undefined &&
      parseFloat(prefs.weeklyTargetKg) <= 0
    ) {
      setPrefsSaveError('Weekly target must be a positive number.');
      return;
    }

    setPrefsSaving(true);
    try {
      const payload = {
        country,
        region: prefs?.region || null,
        currency: prefs?.currency || 'INR',
        dietType,
        primaryTransport,
        householdSize: hs,
        focusCategories,
        weeklyTargetKg: prefs?.weeklyTargetKg ? parseFloat(prefs.weeklyTargetKg) : null
      };
      const saved = await userService.updatePreferences(payload);
      setPrefs(saved);
      setPrefsSuccess('Preferences saved successfully.');
    } catch (err) {
      setPrefsSaveError(err?.message || 'Failed to save preferences.');
    } finally {
      setPrefsSaving(false);
    }
  }

  const regionOptions = [
    { value: '', label: 'Not specified' },
    ...INDIAN_STATES.map((s) => ({ value: s, label: s }))
  ];

  const selectedFocus = (prefs?.focusCategories || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const initials = getInitials(profile?.name || user?.name);

  return (
    <div className="page-container">
      <div className="profile-banner">
        <div className="profile-banner-identity">
          <span className="profile-avatar-lg" aria-hidden="true">
            {initials}
          </span>
          <div>
            <span className="hero-eyebrow">ACCOUNT & PREFERENCES</span>
            <h1 className="page-title">Profile</h1>
            <p className="page-sub">
              Manage your identity details and default emission tracking preferences.
            </p>
          </div>
        </div>
        {profile?.createdAt && (
          <div className="profile-since-pill">
            <span>Member since</span>
            <strong>{formatDate(profile.createdAt.slice(0, 10))}</strong>
          </div>
        )}
      </div>

      <div className="two-col-sections">
        <section className="profile-section" aria-labelledby="profile-info-heading">
          <div className="section-heading-with-icon section-heading-compact">
            <span className="section-header-emblem" aria-hidden="true">
              <UserIcon size={15} />
            </span>
            <h2 id="profile-info-heading" className="section-title">Account information</h2>
          </div>

          {profileLoading ? (
            <Spinner label="Loading profile..." />
          ) : (
            <>
              {nameServerError && <Alert variant="danger">{nameServerError}</Alert>}
              {nameSuccess && <Alert variant="success">{nameSuccess}</Alert>}
              <form onSubmit={handleNameSave} noValidate>
                <InputField
                  id="profile-name"
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={nameError}
                  required
                />
                <div className="form-group">
                  <label className="form-label">Email address</label>
                  <p className="readonly-field">
                    {profile?.email || user?.email || ''}
                  </p>
                  <span className="form-hint">Email address cannot be changed.</span>
                </div>
                {profile?.createdAt && (
                  <div className="form-group">
                    <label className="form-label">Member since</label>
                    <p className="readonly-field">{formatDate(profile.createdAt.slice(0, 10))}</p>
                  </div>
                )}
                <Button type="submit" variant="primary" loading={nameSaving}>
                  Save name
                </Button>
              </form>
            </>
          )}
        </section>

        <section className="profile-section" aria-labelledby="prefs-heading">
          <div className="section-heading-with-icon section-heading-compact">
            <span className="section-header-emblem" aria-hidden="true">
              <SlidersIcon size={15} />
            </span>
            <h2 id="prefs-heading" className="section-title">Preferences</h2>
          </div>

          {prefsLoading ? (
            <Spinner label="Loading preferences..." />
          ) : prefsError ? (
            <Alert variant="danger">{prefsError}</Alert>
          ) : (
            <>
              {prefsSaveError && <Alert variant="danger">{prefsSaveError}</Alert>}
              {prefsSuccess && <Alert variant="success">{prefsSuccess}</Alert>}
              <form onSubmit={handlePrefsSave} noValidate>
                <div className="form-grid-two">
                  <InputField
                    id="pref-country"
                    label="Country"
                    type="text"
                    value={prefs?.country || 'India'}
                    onChange={setPrefsField('country')}
                    required
                  />
                  <SelectField
                    id="pref-region"
                    label="State or union territory (optional)"
                    value={prefs?.region || ''}
                    onChange={setPrefsField('region')}
                    options={regionOptions}
                  />
                  <SelectField
                    id="pref-currency"
                    label="Currency"
                    value={prefs?.currency || 'INR'}
                    onChange={setPrefsField('currency')}
                    options={CURRENCY_OPTIONS}
                    required
                  />
                  <InputField
                    id="pref-household"
                    label="Household size (1 to 20)"
                    type="number"
                    min="1"
                    max="20"
                    value={prefs?.householdSize ?? 1}
                    onChange={setPrefsField('householdSize')}
                    required
                  />
                  <SelectField
                    id="pref-diet"
                    label="Diet type"
                    value={prefs?.dietType || 'VEGETARIAN'}
                    onChange={setPrefsField('dietType')}
                    options={DIET_TYPE_OPTIONS}
                    required
                  />
                  <SelectField
                    id="pref-transport"
                    label="Primary transport mode"
                    value={prefs?.primaryTransport || 'METRO'}
                    onChange={setPrefsField('primaryTransport')}
                    options={TRANSPORT_OPTIONS}
                    required
                  />
                </div>

                <div className="form-group">
                  <span className="form-label">Focus categories *</span>
                  <div className="checkbox-group" role="group" aria-label="Focus categories">
                    {FOCUS_CATEGORY_OPTIONS.map((opt) => (
                      <label key={opt.value} className="form-checkbox-label checkbox-tile">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={selectedFocus.includes(opt.value)}
                          onChange={() => toggleFocusCategory(opt.value)}
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <InputField
                  id="pref-weekly-target"
                  label="Weekly CO2e target (kg, optional)"
                  type="number"
                  min="0.01"
                  step="any"
                  value={prefs?.weeklyTargetKg ?? ''}
                  onChange={setPrefsField('weeklyTargetKg')}
                />
                <Button type="submit" variant="primary" loading={prefsSaving}>
                  Save preferences
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
