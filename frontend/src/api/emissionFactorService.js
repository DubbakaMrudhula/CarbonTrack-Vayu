import axiosInstance from './axiosInstance';

export const emissionFactorService = {
  getFactors: async (category) => {
    const params = category ? { category } : {};
    const response = await axiosInstance.get('/emission-factors', { params });
    return response.data;
  }
};

export default emissionFactorService;

