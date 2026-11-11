import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { validateEmail, validatePassword, validateName, validateConfirmPassword } from '../utils/validators';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { VayuMark } from '../components/common/VayuIcons';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptedTerms: false
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create account | Vayu';
  }, []);

  function set(field) {
    return (e) => {
      const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((prev) => ({ ...prev, [field]: val }));
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
    const nameErr = validateName(form.name);
    if (nameErr) e.name = nameErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    const pwErr = validatePassword(form.password);
    if (pwErr) e.password = pwErr;
    const cpErr = validateConfirmPassword(form.password, form.confirmPassword);
    if (cpErr) e.confirmPassword = cpErr;
    if (!form.acceptedTerms) e.acceptedTerms = 'You must accept the terms to continue.';
    return e;
  }

  async function handleSubmit(evt) {
    evt.preventDefault();
    setServerError('');
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        acceptedTerms: form.acceptedTerms
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err?.fieldErrors && Array.isArray(err.fieldErrors) && err.fieldErrors.length > 0) {
        const fe = {};
        err.fieldErrors.forEach(({ field, message }) => {
          fe[field] = message;
        });
        setErrors(fe);
        if (err.message) {
          setServerError(err.message);
        }
      } else {
        const msg = err?.message || 'Registration failed. Please try again.';
        if (err?.status === 409) {
          setErrors((prev) => ({ ...prev, email: msg }));
        }
        setServerError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-card-mark" aria-hidden="true">
          <VayuMark size={20} />
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          Track your daily carbon footprint with Vayu.
        </p>
      </div>

      {serverError && (
        <Alert variant="danger">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          id="name"
          label="Full name"
          type="text"
          value={form.name}
          onChange={set('name')}
          error={errors.name}
          autoComplete="name"
          required
        />
        <InputField
          id="email"
          label="Email address"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
          required
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="new-password"
          hint="At least 8 characters, including one letter and one number."
          required
        />
        <InputField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          value={form.confirmPassword}
          onChange={set('confirmPassword')}
          error={errors.confirmPassword}
          autoComplete="new-password"
          required
        />

        <div className="form-group">
          <label className="form-checkbox-label" htmlFor="acceptedTerms">
            <input
              id="acceptedTerms"
              type="checkbox"
              className="form-checkbox"
              checked={form.acceptedTerms}
              onChange={set('acceptedTerms')}
              aria-describedby={errors.acceptedTerms ? 'acceptedTerms-error' : undefined}
            />
            <span>
              I have read and agree to the{' '}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer">
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link to="/terms" target="_blank" rel="noopener noreferrer">
                Terms of Service
              </Link>
              .
            </span>
          </label>
          {errors.acceptedTerms && (
            <span className="form-error" id="acceptedTerms-error" aria-live="polite">
              {errors.acceptedTerms}
            </span>
          )}
        </div>

        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Create account
        </Button>
      </form>

      <div className="auth-links">
        <span>Already have an account?</span>{' '}
        <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
