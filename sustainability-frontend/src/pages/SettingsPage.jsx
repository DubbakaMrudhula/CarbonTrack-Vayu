import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import userService from '../api/userService';
import InputField from '../components/common/InputField';
import Button from '../components/common/Button';
import Alert from '../components/common/Alert';
import Modal from '../components/common/Modal';
import { LockIcon, FileTextIcon, AlertTriangleIcon } from '../components/common/VayuIcons';
import { validatePassword } from '../utils/validators';

export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwServerError, setPwServerError] = useState('');

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    document.title = 'Settings | Vayu';
  }, []);

  function setPw(field) {
    return (e) => setPwForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function validatePwForm() {
    const e = {};
    if (!pwForm.currentPassword) e.currentPassword = 'Current password is required.';
    const newPwErr = validatePassword(pwForm.newPassword);
    if (newPwErr) e.newPassword = newPwErr;
    if (!pwForm.confirmPassword) {
      e.confirmPassword = 'Please confirm your new password.';
    } else if (pwForm.newPassword !== pwForm.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }
    return e;
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwSuccess('');
    setPwServerError('');
    const errs = validatePwForm();
    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      return;
    }
    setPwErrors({});
    setPwSaving(true);
    try {
      await userService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword
      });
      setPwSuccess('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwServerError(err?.message || 'Failed to change password.');
    } finally {
      setPwSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      setDeleteError('Password is required to confirm deletion.');
      return;
    }
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await userService.deleteAccount({ password: deletePassword });
      logout();
      navigate('/login', { replace: true });
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete account. Check your password and try again.');
      setDeleteLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div>
        <span className="hero-eyebrow">SECURITY & PRIVACY</span>
        <h1 className="page-title">Settings</h1>
        <p className="page-sub">
          Update your account password, review legal terms, or permanently erase your data.
        </p>
      </div>

      <div className="two-col-sections">
        <section className="settings-section" aria-labelledby="change-pw-heading">
          <div className="section-heading-with-icon section-heading-compact">
            <span className="section-header-emblem" aria-hidden="true">
              <LockIcon size={15} />
            </span>
            <h2 id="change-pw-heading" className="section-title">Change password</h2>
          </div>
          {pwServerError && <Alert variant="danger">{pwServerError}</Alert>}
          {pwSuccess && <Alert variant="success">{pwSuccess}</Alert>}
          <form onSubmit={handleChangePassword} noValidate>
            <InputField
              id="current-password"
              label="Current password"
              type="password"
              value={pwForm.currentPassword}
              onChange={setPw('currentPassword')}
              error={pwErrors.currentPassword}
              autoComplete="current-password"
              required
            />
            <InputField
              id="new-password"
              label="New password"
              type="password"
              value={pwForm.newPassword}
              onChange={setPw('newPassword')}
              error={pwErrors.newPassword}
              autoComplete="new-password"
              hint="At least 8 characters, including one letter and one number."
              required
            />
            <InputField
              id="confirm-new-password"
              label="Confirm new password"
              type="password"
              value={pwForm.confirmPassword}
              onChange={setPw('confirmPassword')}
              error={pwErrors.confirmPassword}
              autoComplete="new-password"
              required
            />
            <Button type="submit" variant="primary" loading={pwSaving}>
              Change password
            </Button>
          </form>
        </section>

        <div className="settings-right-col">
          <section className="settings-section" aria-labelledby="legal-heading">
            <div className="section-heading-with-icon section-heading-compact">
              <span className="section-header-emblem" aria-hidden="true">
                <FileTextIcon size={15} />
              </span>
              <h2 id="legal-heading" className="section-title">Legal</h2>
            </div>
            <p className="section-note">
              Review our privacy commitments and service terms.
            </p>
            <ul className="settings-link-list">
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
          </section>

          <section className="settings-section settings-danger-zone" aria-labelledby="delete-heading">
            <div className="section-heading-with-icon section-heading-compact">
              <span className="section-header-emblem section-header-danger" aria-hidden="true">
                <AlertTriangleIcon size={15} />
              </span>
              <h2 id="delete-heading" className="section-title">Delete account</h2>
            </div>
            <p>
              Deleting your account permanently removes your name, email address, hashed password,
              all activity logs, and all preferences. This action cannot be undone.
              It also constitutes withdrawal of your consent to process your data.
            </p>
            <Button
              variant="danger"
              onClick={() => {
                setDeletePassword('');
                setDeleteError('');
                setShowDeleteModal(true);
              }}
            >
              Delete my account
            </Button>
          </section>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        title="Delete account"
        onClose={() => setShowDeleteModal(false)}
      >
        <p>
          This will permanently delete your account and all your data.
          Enter your password to confirm.
        </p>
        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
        <InputField
          id="delete-confirm-password"
          label="Your password"
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <div className="modal-actions">
          <Button
            variant="danger"
            loading={deleteLoading}
            onClick={handleDeleteAccount}
          >
            Permanently delete account
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleteLoading}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
