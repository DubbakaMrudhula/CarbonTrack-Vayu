import axiosInstance from './axiosInstance';

export const activityService = {
  createActivity: async (activityData) => {
    const response = await axiosInstance.post('/activities', activityData);
    return response.data;
  },

  listActivities: async (params = {}) => {
    const response = await axiosInstance.get('/activities', { params });
    return response.data;
  },

  getActivityById: async (id) => {
    const response = await axiosInstance.get(`/activities/${id}`);
    return response.data;
  },

  updateActivity: async (id, activityData) => {
    const response = await axiosInstance.put(`/activities/${id}`, activityData);
    return response.data;
  },

  patchActivity: async (id, patchData) => {
    const response = await axiosInstance.patch(`/activities/${id}`, patchData);
    return response.data;
  },

  deleteActivity: async (id) => {
    const response = await axiosInstance.delete(`/activities/${id}`);
    return response.data;
  }
};

export default activityService;

