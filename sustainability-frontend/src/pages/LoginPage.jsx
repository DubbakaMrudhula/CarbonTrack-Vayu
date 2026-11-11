import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { validateEmail } from '../utils/validators';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import { VayuMark } from '../components/common/VayuIcons';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Sign in | Vayu';
  }, []);

  const from = location.state?.from?.pathname || '/dashboard';

  function validate() {
    const e = {};
    const emailErr = validateEmail(email);
    if (emailErr) e.email = emailErr;
    if (!password) e.password = 'Password is required.';
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
      await login({ email: email.trim().toLowerCase(), password });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.message || 'Sign in failed. Please try again.';
      setServerError(msg);
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
        <h1 className="auth-title">Vayu</h1>
        <p className="auth-subtitle">
          Log daily activities and see your carbon footprint in kg CO2e.
        </p>
      </div>

      {serverError && (
        <Alert variant="danger" role="alert">
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <InputField
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          required
        />
        <InputField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          required
        />
        <Button type="submit" variant="primary" loading={loading} fullWidth>
          Sign in
        </Button>
      </form>

      <div className="auth-links">
        <span>New to Vayu?</span>{' '}
        <Link to="/register">Create an account</Link>
      </div>
    </div>
  );
}
