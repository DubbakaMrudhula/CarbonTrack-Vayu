import axiosInstance from './axiosInstance';

export const userService = {
  getProfile: async () => {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await axiosInstance.put('/users/me', data);
    return response.data;
  },

  getPreferences: async () => {
    const response = await axiosInstance.get('/users/me/preferences');
    return response.data;
  },

  updatePreferences: async (data) => {
    const response = await axiosInstance.put('/users/me/preferences', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await axiosInstance.patch('/users/me/password', data);
    return response.data;
  },

  deleteAccount: async (data) => {
    const response = await axiosInstance.delete('/users/me', { data });
    return response.data;
  }
};

export default userService;

