import api from './api';

// Get all backgrounds
export const getBackgrounds = async () => {
  try {
    const { data } = await api.get('/backgrounds');
    return data.data || [];
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to fetch backgrounds!';
  }
};

// Get active backgrounds
export const getActiveBackgrounds = async () => {
  try {
    const { data } = await api.get('/backgrounds/active');
    return data.data || [];
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to fetch active backgrounds!';
  }
};

// Create background
export const createBackground = async (formData, { onUploadProgress } = {}) => {
  try {
    const { data } = await api.post('/backgrounds', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data;
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to create background!';
  }
};

// Update background
export const updateBackground = async (id, formData, { onUploadProgress } = {}) => {
  try {
    const { data } = await api.put(`/backgrounds/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
    return data;
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to update background!';
  }
};

// Delete background
export const deleteBackground = async (id) => {
  try {
    const { data } = await api.delete(`/backgrounds/${id}`);
    return data;
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to delete background!';
  }
};

// Move background layer
export const moveBackgroundLayer = async (id, direction) => {
  try {
    const endpoint = direction === 'up' ? 'backward' : 'forward';
    const { data } = await api.put(`/backgrounds/${id}/${endpoint}`);
    return data;
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to move background layer!';
  }
};

// Update layer order
export const updateLayerOrder = async (layerUpdates) => {
  try {
    const { data } = await api.post('/backgrounds/layer/reorder', { layerUpdates });
    return data;
  } catch (error) {
    throw error?.response?.data?.message || 'Failed to update layer order!';
  }
};
