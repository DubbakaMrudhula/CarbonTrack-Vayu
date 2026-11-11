import axiosInstance from './axiosInstance';

export const dashboardService = {
  getSummary: async (date) => {
    const params = date ? { date } : {};
    const response = await axiosInstance.get('/dashboard/summary', { params });
    return response.data;
  }
};

export default dashboardService;

