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

/** Full document by globally unique slug (CMS duplicate check, etc.) */
export const getMediaBySlug = async (slug) => {
  try {
    const { data } = await api.get(`/display-media/by-slug/${encodeURIComponent(slug)}`);
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to fetch media!";
  }
};

/** List { slug, title, _id } for a leaf category */
export const listMediaByCategoryLeaf = async (leafId) => {
  try {
    const { data } = await api.get(`/display-media/by-category/${leafId}`);
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to fetch media list!";
  }
};

// Create new media entry
export const createMedia = async (formData, { onUploadProgress } = {}) => {
  try {
    const { data } = await api.post("/display-media", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    });
    return data;
  } catch (error) {
    throw error?.response?.data?.message || "Failed to create media!";
  }
};

// Update existing media entry
export const updateMedia = async (id, formData, { onUploadProgress } = {}) => {
  try {
    const { data } = await api.put(`/display-media/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
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
