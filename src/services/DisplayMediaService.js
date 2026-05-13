import api from "./api";

// Get all media entries
export const getMedia = async () => {
  try {
    const { data } = await api.get("/display-media");
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to fetch media!";
  }
};

// Get a single media entry by ID
export const getMediaById = async (id) => {
  try {
    const { data } = await api.get(`/display-media/${id}`);
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to fetch media!";
  }
};

// Create new media entry
export const createMedia = async (formData) => {
  try {
    const { data } = await api.post("/display-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to create media!";
  }
};

// Update existing media entry
export const updateMedia = async (id, formData) => {
  try {
    const { data } = await api.put(`/display-media/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to update media!";
  }
};

// Delete media entry
export const deleteMedia = async (id) => {
  try {
    const { data } = await api.delete(`/display-media/${id}`);
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to delete media!";
  }
};
