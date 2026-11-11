import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useActivities from '../hooks/useActivities';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import SelectField from '../components/common/SelectField';
import InputField from '../components/common/InputField';
import Alert from '../components/common/Alert';
import Spinner from '../components/common/Spinner';
import StatusLabel from '../components/common/StatusLabel';
import { CategoryIcon, PlusIcon } from '../components/common/VayuIcons';
import { formatDate, formatCO2e, formatQuantity, todayISO } from '../utils/formatters';
import activityService from '../api/activityService';

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'ELECTRICITY', label: 'Electricity' },
  { value: 'FOOD', label: 'Food' },
  { value: 'SHOPPING', label: 'Shopping' }
];

const CATEGORY_VARIANT = {
  TRANSPORTATION: 'info',
  ELECTRICITY: 'warning',
  FOOD: 'success',
  SHOPPING: 'neutral'
};

export default function MyActivitiesPage() {
  const { activities, pagination, loading, error, fetchActivities } = useActivities();

  const [filters, setFilters] = useState({ category: '', from: '', to: '' });
  const [page, setPage] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    document.title = 'My Activities | Vayu';
  }, []);

  const load = useCallback(() => {
    const params = { page, size: 20 };
    if (filters.category) params.category = filters.category;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    fetchActivities(params);
  }, [page, filters, fetchActivities]);

  useEffect(() => {
    load();
  }, [load]);

  function handleFilterChange(field) {
    return (e) => {
      setFilters((prev) => ({ ...prev, [field]: e.target.value }));
      setPage(0);
    };
  }

  function clearFilters() {
    setFilters({ category: '', from: '', to: '' });
    setPage(0);
  }

  const hasActiveFilters = Boolean(filters.category || filters.from || filters.to);

  function openDeleteModal(activity) {
    setDeleteTarget(activity);
    setDeleteError('');
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteError('');
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await activityService.deleteActivity(deleteTarget.id);
      closeDeleteModal();
      load();
    } catch (err) {
      setDeleteError(err?.message || 'Failed to delete activity.');
    } finally {
      setDeleteLoading(false);
    }
  }

  function openEditModal(activity) {
    setEditTarget(activity);
    setEditForm({
      quantity: String(activity.quantity),
      logDate: activity.logDate,
      notes: activity.notes || ''
    });
    setEditError('');
  }

  function closeEditModal() {
    setEditTarget(null);
    setEditError('');
  }

  function setEdit(field) {
    return (e) => setEditForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function confirmEdit(e) {
    e.preventDefault();
    if (!editTarget) return;
    const qty = parseFloat(editForm.quantity);
    if (isNaN(qty) || qty <= 0) {
      setEditError('Quantity must be a positive number.');
      return;
    }
    if (!editForm.logDate) {
      setEditError('Date is required.');
      return;
    }
    if (editForm.logDate > todayISO()) {
      setEditError('Date cannot be in the future.');
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      await activityService.updateActivity(editTarget.id, {
        category: editTarget.category,
        activityType: editTarget.activityType,
        quantity: qty,
        unit: editTarget.unit,
        logDate: editForm.logDate,
        notes: editForm.notes || null
      });
      closeEditModal();
      load();
    } catch (err) {
      setEditError(err?.message || 'Failed to update activity.');
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="page-header-row">
        <div>
          <span className="hero-eyebrow">ACTIVITY LEDGER</span>
          <h1 className="page-title">My Activities</h1>
          <p className="page-sub">
            Review, filter, edit, or delete your logged emission records.
          </p>
        </div>
        <div className="page-header-actions">
          {!loading && (
            <span className="ledger-count-badge">
              {pagination.totalElements} {pagination.totalElements === 1 ? 'record' : 'records'}
            </span>
          )}
          <Link to="/log-activity" className="btn btn-primary">
            <PlusIcon size={15} />
            <span>Log activity</span>
          </Link>
        </div>
      </div>

      <div className="filters-card">
        <div className="filters-row">
          <SelectField
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={handleFilterChange('category')}
            options={CATEGORY_OPTIONS}
          />
          <InputField
            id="filter-from"
            label="From date"
            type="date"
            value={filters.from}
            onChange={handleFilterChange('from')}
            max={todayISO()}
          />
          <InputField
            id="filter-to"
            label="To date"
            type="date"
            value={filters.to}
            onChange={handleFilterChange('to')}
            max={todayISO()}
          />
        </div>
        {hasActiveFilters && (
          <div className="filters-reset-row">
            <Button variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <Spinner label="Loading activities..." />
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state-text">No activities logged yet.</p>
          <Link to="/log-activity" className="btn btn-primary">
            Log your first activity
          </Link>
        </div>
      ) : (
        <>
          <div className="data-table-container">
            <table className="data-table" aria-label="Activity log">
              <thead>
                <tr>
                  <th>Activity</th>
                  <th>Category</th>
                  <th className="col-right">Quantity</th>
                  <th>Unit</th>
                  <th className="col-right">CO2e (kg)</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="activity-cell-wrap">
                        <span className="activity-cell-icon" aria-hidden="true">
                          <CategoryIcon category={a.category} size={14} />
                        </span>
                        <div>
                          <div className="activity-cell-title">{a.displayName || a.activityType}</div>
                          {a.notes && <div className="activity-cell-meta">{a.notes}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusLabel
                        variant={CATEGORY_VARIANT[a.category] || 'neutral'}
                        status={a.category.charAt(0) + a.category.slice(1).toLowerCase()}
                      />
                    </td>
                    <td className="col-right">{formatQuantity(a.quantity)}</td>
                    <td>{a.unit}</td>
                    <td className="col-right td-strong">{formatCO2e(a.emissionKgCo2e)}</td>
                    <td>{formatDate(a.logDate)}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-link"
                        onClick={() => openEditModal(a)}
                        aria-label={`Edit ${a.displayName || a.activityType}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-link btn-link-danger"
                        onClick={() => openDeleteModal(a)}
                        aria-label={`Delete ${a.displayName || a.activityType}`}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination" role="navigation" aria-label="Pagination">
              <Button
                variant="secondary"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="pagination-label">
                Page {pagination.page + 1} of {pagination.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= pagination.totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={!!editTarget}
        title={editTarget ? `Edit: ${editTarget.displayName || editTarget.activityType}` : 'Edit activity'}
        onClose={closeEditModal}
      >
        {editTarget && (
          <>
            {editError && <Alert variant="danger">{editError}</Alert>}
            <form onSubmit={confirmEdit} noValidate>
              <InputField
                id="edit-quantity"
                label={`Quantity (${editTarget.unit})`}
                type="number"
                min="0.0001"
                step="any"
                value={editForm.quantity}
                onChange={setEdit('quantity')}
                required
              />
              <InputField
                id="edit-date"
                label="Date"
                type="date"
                value={editForm.logDate}
                max={todayISO()}
                onChange={setEdit('logDate')}
                required
              />
              <InputField
                id="edit-notes"
                label="Notes (optional)"
                type="text"
                value={editForm.notes}
                onChange={setEdit('notes')}
                maxLength={500}
              />
              <div className="modal-actions">
                <Button type="submit" variant="primary" loading={editLoading}>
                  Save changes
                </Button>
                <Button type="button" variant="secondary" onClick={closeEditModal}>
                  Cancel
                </Button>
              </div>
            </form>
          </>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteTarget}
        title="Delete activity"
        onClose={closeDeleteModal}
      >
        {deleteTarget && (
          <>
            {deleteError && <Alert variant="danger">{deleteError}</Alert>}
            <p>
              Delete <strong>{deleteTarget.displayName || deleteTarget.activityType}</strong> logged
              on {formatDate(deleteTarget.logDate)}? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <Button
                variant="danger"
                loading={deleteLoading}
                onClick={confirmDelete}
              >
                Delete
              </Button>
              <Button variant="secondary" onClick={closeDeleteModal}>
                Cancel
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
