import { useState, useCallback } from 'react';
import activityService from '../api/activityService';

export default function useActivities() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchActivities = useCallback(async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await activityService.listActivities(params);
      // API returns Spring Page: { content, totalElements, totalPages, number, size }
      setActivities(data.content || []);
      setPagination({
        page: data.number ?? 0,
        size: data.size ?? 20,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0
      });
    } catch (err) {
      setError(err?.message || 'Failed to load activities.');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteActivity = useCallback(async (id) => {
    await activityService.deleteActivity(id);
  }, []);

  const updateActivity = useCallback(async (id, data) => {
    return activityService.updateActivity(id, data);
  }, []);

  return {
    activities,
    pagination,
    loading,
    error,
    fetchActivities,
    deleteActivity,
    updateActivity
  };
}

