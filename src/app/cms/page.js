"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Input,
  MenuItem,
  IconButton,
  Avatar,
  CircularProgress,
  Autocomplete,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { Add, Delete, Edit, ExpandMore } from "@mui/icons-material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useRouter } from "next/navigation";
import { useMessage } from "@/app/context/MessageContext";
import {
  getMedia,
  createMedia,
  updateMedia,
  deleteMedia,
} from "@/services/DisplayMediaService";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";
import MediaLayerManager from "@/app/components/MediaLayerManager";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import CMSBackgroundManager from "../components/CMSBackgroundManager";
import { Tabs, Tab } from "@mui/material";
import useWebSocketController from "@/hooks/useWebSocketController";
import CategoryManager from "./CategoryManager";
import { getAccessToken, logoutUser } from "@/services/authService";

export default function CMSPage() {
  const router = useRouter();
  const { showMessage } = useMessage();
  const { language } = useLanguage();

  const [mediaList, setMediaList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    subcategory: "",
    categoryPath: [],
    fileEn: null,
    fileAr: null,
    pinpointFile: null,
    pinpointX: "",
    pinpointY: "",
    previewEn: null,
    previewAr: null,
    pinpointPreview: null,
    layers: [],
  });
  const [errors, setErrors] = useState({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  const translations = {
    en: {
      adminDashboard: "Admin Dashboard",
      mediaManager: "Media Manager",
      addMedia: "Add Media",
      editMedia: "Edit Media & Pinpoint Details",
      newMedia: "Add New Media & Pinpoint",
      deleteMedia: "Delete Media",
      deleteMessage: "Are you sure you want to delete this media?",
      logoutTitle: "Confirm Logout",
      logoutMessage: "Are you sure you want to log out of your account?",
      logout: "Logout",
      cancel: "Cancel",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      englishMedia: "English Media",
      arabicMedia: "Arabic Media",
      pinpointPositionLabel: "Pinpoint Position:",
      generalInfo: "General Info",
      category: "Category",
      categoryHelper: "Select or type a new category name.",
      subcategory: "Subcategory",
      subcategoryHelper: "Select or type a new subcategory name (optional).",
      englishUpload: "English Media Upload",
      arabicUpload: "Arabic Media Upload",
      mediaLayers: "Media Layers",
      addLayer: "Add Layer",
      removeLayer: "Remove Layer",
      layerImage: "Layer Image",
      layerPreview: "Layer Preview",
      layerPosition: "Layer Position",
      layerSize: "Layer Size",
      layerOpacity: "Layer Opacity",
      layerRotation: "Layer Rotation",
      layerX: "Layer X Position (%)",
      layerY: "Layer Y Position (%)",
      layerWidth: "Layer Width (%)",
      layerHeight: "Layer Height (%)",
      layerTypeHelper: "Upload one or more positioned images for this media item.",
      pinpointUpload: "Media Logo Upload (Optional)",
      pinpointUploadHelper:
        "Upload an image that will act as a logo for this media item (optional).",
      pinpointPosition: "Logo Position (Optional)",
      pinpointPositionHelper: "Set the X and Y position of the logo as a percentage (0–100%).",
      pinpointX: "Logo X Position (%)",
      pinpointY: "Logo Y Position (%)",
      backgroundManager: "Background Manager",
    },
    ar: {
      adminDashboard: "لوحة التحكم",
      mediaManager: "مدير الوسائط",
      addMedia: "إضافة وسائط",
      editMedia: "تعديل الوسائط وتفاصيل العلامة",
      newMedia: "إضافة وسائط جديدة وعلامة",
      deleteMedia: "حذف الوسائط",
      deleteMessage: "هل أنت متأكد أنك تريد حذف هذه الوسائط؟",
      logoutTitle: "تأكيد تسجيل الخروج",
      logoutMessage: "هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟",
      logout: "تسجيل الخروج",
      cancel: "إلغاء",
      save: "حفظ",
      edit: "تعديل",
      delete: "حذف",
      englishMedia: "الوسائط الإنجليزية",
      arabicMedia: "الوسائط العربية",
      pinpointPositionLabel: "موقع العلامة:",
      generalInfo: "معلومات عامة",
      category: "الفئة",
      categoryHelper: "اختر أو اكتب اسم فئة جديدة.",
      subcategory: "الفئة الفرعية",
      subcategoryHelper: "اختر أو اكتب اسم فئة فرعية جديدة (اختياري).",
      englishUpload: "تحميل الوسائط الإنجليزية",
      arabicUpload: "تحميل الوسائط العربية",
      mediaLayers: "طبقات الوسائط",
      addLayer: "إضافة طبقة",
      removeLayer: "إزالة الطبقة",
      layerImage: "صورة الطبقة",
      layerPreview: "معاينة الطبقة",
      layerPosition: "موضع الطبقة",
      layerSize: "حجم الطبقة",
      layerOpacity: "شفافية الطبقة",
      layerRotation: "دوران الطبقة",
      layerX: "موضع X للطبقة (%)",
      layerY: "موضع Y للطبقة (%)",
      layerWidth: "عرض الطبقة (%)",
      layerHeight: "ارتفاع الطبقة (%)",
      layerTypeHelper: "قم بتحميل صورة أو أكثر يمكن وضعها داخل هذا العنصر.",
      pinpointUpload: "تحميل شعار الوسائط (اختياري)",
      pinpointUploadHelper: "قم بتحميل صورة تعمل كشعار لهذه الوسائط (اختياري).",
      pinpointPosition: "موقع الشعار (اختياري)",
      pinpointPositionHelper: "عيّن موضع الشعار بالنسبة المئوية (0-100٪).",
      pinpointX: "موضع X للشعار (%)",
      pinpointY: "موضع Y للشعار (%)",
      backgroundManager: "مدير الخلفيات",
    },
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const t = translations[language];

  const { connected, sendCategorySelection, sendCarbonMode, categoryOptions, categoryTree } = useWebSocketController();

  const createEmptyLayer = (layer = {}) => ({
    fileEn: layer.fileEn || layer.file || null,
    fileAr: layer.fileAr || null,
    existingUrlEn: layer.existingUrlEn || layer.existingUrl || "",
    existingUrlAr: layer.existingUrlAr || "",
    previewEn: layer.previewEn || layer.preview || "",
    previewAr: layer.previewAr || "",
    title: layer.title || "",
    description: layer.description || "",
    typeEn: layer.typeEn || layer.type || "image",
    typeAr: layer.typeAr || "image",
    position: layer.position || { x: 0, y: 0 },
    size: layer.size || { width: 100, height: 100 },
    opacity: layer.opacity ?? 1,
    rotation: layer.rotation ?? 0,
    zIndex: layer.zIndex ?? 0,
    isActive: layer.isActive !== undefined ? layer.isActive : true,
  });

  const fetchMedia = async () => {
    try {
      const res = await getMedia();
      const mediaItems = res.data || [];
      setMediaList(mediaItems);
      const options = {};
      mediaItems.forEach((item) => {
        const cat = item.category;
        const subcat = item.subcategory || "";
        if (!options[cat]) {
          options[cat] = subcat ? [subcat] : [];
        } else if (subcat && !options[cat].includes(subcat)) {
          options[cat].push(subcat);
        }
      });
      setDynamicOptions(options);
    } catch {
      showMessage("Failed to load media.", "error");
    }
  };

  const logout = async () => {
    await logoutUser();
  };

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push("/login");
    } else {
      fetchMedia();
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};

    // require either legacy category string or the new categoryPath selection
    if ((!formData.category || formData.category === "") && (!formData.categoryPath || formData.categoryPath.length === 0)) {
      newErrors.category = "Category is required.";
    }

    if (!editingItem && !formData.fileEn) {
      newErrors.fileEn = "Please upload the English media file.";
    }
    if (!editingItem && !formData.fileAr) {
      newErrors.fileAr = "Please upload the Arabic media file.";
    }

    // Validate Pinpoint X (allow negative values)
    if (formData.pinpointX !== "" && formData.pinpointX !== null) {
      const x = Number(formData.pinpointX);
      if (isNaN(x) || x > 100) {
        newErrors.pinpointX =
          "X must be a number (any negative or positive value, max 100).";
      }
    }

    // Validate Pinpoint Y (allow negative values)
    if (formData.pinpointY !== "" && formData.pinpointY !== null) {
      const y = Number(formData.pinpointY);
      if (isNaN(y) || y > 100) {
        newErrors.pinpointY =
          "Y must be a number (any negative or positive value, max 100).";
      }
    }

    setErrors(newErrors);

    // ✅ If there are errors, show them using MessageContext
    if (Object.keys(newErrors).length > 0) {
      const { fileEn, fileAr, category, pinpointX, pinpointY } = newErrors;
      let errorMessage = "Please fix the following:\n";
      if (category) errorMessage += `- ${category}\n`;
      if (fileEn) errorMessage += `- ${fileEn}\n`;
      if (fileAr) errorMessage += `- ${fileAr}\n`;
      if (pinpointX) errorMessage += `- ${pinpointX}\n`;
      if (pinpointY) errorMessage += `- ${pinpointY}\n`;

      showMessage(errorMessage.trim(), "error");
      return false;
    }

    return true;
  };

  const updateLayerAtIndex = (index, key, value) => {
    setFormData((current) => ({
      ...current,
      layers: current.layers.map((layer, layerIndex) =>
        layerIndex === index ? { ...layer, [key]: value } : layer
      ),
    }));
  };

  const updateLayerPosition = (index, axis, value) => {
    setFormData((current) => ({
      ...current,
      layers: current.layers.map((layer, layerIndex) =>
        layerIndex === index
          ? {
              ...layer,
              position: { ...layer.position, [axis]: value },
            }
          : layer
      ),
    }));
  };

  const updateLayerSize = (index, dimension, value) => {
    setFormData((current) => ({
      ...current,
      layers: current.layers.map((layer, layerIndex) =>
        layerIndex === index
          ? {
              ...layer,
              size: { ...layer.size, [dimension]: value },
            }
          : layer
      ),
    }));
  };

  const addLayer = () => {
    setFormData((current) => ({
      ...current,
      layers: [...current.layers, createEmptyLayer()],
    }));
  };

  const removeLayer = (index) => {
    setFormData((current) => ({
      ...current,
      layers: current.layers.filter((_, layerIndex) => layerIndex !== index),
    }));
  };

  const setLayerFile = (index, file) => {
    setFormData((current) => ({
      ...current,
      layers: current.layers.map((layer, layerIndex) =>
        layerIndex === index
          ? {
              ...layer,
              file,
              existingUrl: file ? "" : layer.existingUrl,
              preview: file ? URL.createObjectURL(file) : layer.existingUrl,
            }
          : layer
      ),
    }));
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);

    // Revoke main previews if they are blob URLs
    [formData.previewEn, formData.previewAr, formData.pinpointPreview].forEach(
      (url) => {
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      }
    );

    // Revoke layer previews
    formData.layers.forEach((layer) => {
      if (layer.previewEn?.startsWith("blob:")) URL.revokeObjectURL(layer.previewEn);
      if (layer.previewAr?.startsWith("blob:")) URL.revokeObjectURL(layer.previewAr);
      if (layer.preview?.startsWith("blob:")) URL.revokeObjectURL(layer.preview);
    });

    setFormData({
      category: "",
      subcategory: "",
      categoryPath: [],
      fileEn: null,
      fileAr: null,
      pinpointFile: null,
      pinpointX: "",
      pinpointY: "",
      previewEn: null,
      previewAr: null,
      pinpointPreview: null,
      layers: [],
    });
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload = new FormData();
      payload.append("category", formData.category);
      payload.append("subcategory", formData.subcategory || "");
      if (formData.categoryPath && formData.categoryPath.length) {
        payload.append("categoryPath", JSON.stringify(formData.categoryPath));
      }
      if (formData.fileEn) payload.append("mediaEn", formData.fileEn);
      if (formData.fileAr) payload.append("mediaAr", formData.fileAr);
      if (formData.pinpointFile)
        payload.append("pinpoint", formData.pinpointFile);
      if (formData.pinpointX) payload.append("pinpointX", formData.pinpointX);
      if (formData.pinpointY) payload.append("pinpointY", formData.pinpointY);

      const mediaLayerFilesEn = [];
      const mediaLayerFilesAr = [];
      const mediaLayerPayload = formData.layers
        .filter((layer) => 
          layer.fileEn || layer.fileAr || layer.existingUrlEn || layer.existingUrlAr || layer.existingUrl
        )
        .map((layer, index) => {
          const isFileEn = layer.fileEn instanceof File;
          const isFileAr = layer.fileAr instanceof File;

          const fileIndexEn = isFileEn ? mediaLayerFilesEn.length : null;
          if (isFileEn) mediaLayerFilesEn.push(layer.fileEn);

          const fileIndexAr = isFileAr ? mediaLayerFilesAr.length : null;
          if (isFileAr) mediaLayerFilesAr.push(layer.fileAr);

          return {
            fileIndex: fileIndexEn,
            existingUrl: layer.existingUrlEn || (!layer.fileEn ? layer.existingUrl : ""),
            fileIndexEn,
            fileIndexAr,
            existingUrlEn: layer.existingUrlEn || (!layer.fileEn ? layer.existingUrl : ""),
            existingUrlAr: layer.existingUrlAr || "",
            position: layer.position,
            size: layer.size,
            opacity: layer.opacity,
            rotation: layer.rotation,
            title: layer.title || "",
            description: layer.description || "",
            type: layer.typeEn || layer.type || "image", // Backward compatibility
            typeEn: layer.typeEn || layer.type || "image",
            typeAr: layer.typeAr || "image",
            isActive: layer.isActive !== undefined ? layer.isActive : true,
            zIndex: layer.zIndex ?? index,
          };
        });

      payload.append("layers", JSON.stringify(mediaLayerPayload));
      mediaLayerFilesEn.forEach((file) => payload.append("mediaLayers", file));
      mediaLayerFilesAr.forEach((file) => payload.append("mediaLayersAr", file));

      const res = editingItem
        ? await updateMedia(editingItem._id, payload)
        : await createMedia(payload);

      showMessage(res.message || "Saved", "success");
      handleCloseDialog();

      fetchMedia();
    } catch (err) {
      console.error("❌ Save error:", err);
      console.error("Response:", err?.response?.data);
      const errorMsg = err?.response?.data?.message || err?.message || "Failed to save";
      showMessage(errorMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await deleteMedia(selectedId);
      showMessage(res.message || "Deleted", "success");
      fetchMedia();
    } catch {
      showMessage("Failed to delete", "error");
    } finally {
      setActionLoading(false);
      setConfirmationOpen(false);
      setSelectedId(null);
    }
  };

  const openForm = (item = null) => {
    setEditingItem(item);
    if (item?.layers?.length) {
      item.layers.forEach((layer) => {
        if (layer.file?.url?.startsWith("blob:")) {
          URL.revokeObjectURL(layer.file.url);
        }
      });
    }
    setFormData({
      category: item?.category || "",
      subcategory: item?.subcategory || "",
      categoryPath: item?.categoryPath || [],
      fileEn: null,
      fileAr: null,
      pinpointFile: null,
      pinpointX: item?.pinpoint?.position?.x?.toString() || "",
      pinpointY: item?.pinpoint?.position?.y?.toString() || "",
      preview: item?.media?.url || null,
      previewEn: item?.media?.en.url || null,
      previewAr: item?.media?.ar.url || null,
      pinpointPreview: item?.pinpoint?.file?.url || null,
      layers:
        item?.layers?.map((layer) =>
          createEmptyLayer({
            existingUrlEn: layer.fileEn?.url || layer.file?.url || "",
            existingUrlAr: layer.fileAr?.url || "",
            previewEn: layer.fileEn?.url || layer.file?.url || "",
            previewAr: layer.fileAr?.url || "",
            fileEn: null,
            fileAr: null,
            title: layer.title || "",
            description: layer.description || "",
            typeEn: layer.fileEn?.type || layer.file?.type || "image",
            typeAr: layer.fileAr?.type || "image",
            position: layer.position || { x: 0, y: 0 },
            size: layer.size || { width: 100, height: 100 },
            opacity: layer.opacity ?? 1,
            rotation: layer.rotation ?? 0,
            zIndex: layer.zIndex ?? 0,
            isActive: layer.isActive !== undefined ? layer.isActive : true,
          })
        ) || [],
    });
    setOpenDialog(true);
  };

  // Render N-level chained selects when categoryTree is available
  const renderCategoryChain = () => {
    if (!categoryTree || !Array.isArray(categoryTree)) return null;

    const selectedPath = formData.categoryPath || [];
    if (!Array.isArray(selectedPath)) return null;

    const getOptionsForLevel = (level) => {
      if (level === 0) return categoryTree;
      let node = null;
      for (let i = 0; i < level; i++) {
        const id = selectedPath[i];
        if (!id) return [];
        const searchIn = node ? node.children : categoryTree;
        node = searchIn.find((n) => String(n._id) === String(id));
        if (!node) return [];
      }
      return node.children || [];
    };

    const levels = [];
    const computeMaxDepth = (nodes) => {
      let max = 0;
      const dfs = (n, depth) => {
        max = Math.max(max, depth);
        (n.children || []).forEach((c) => dfs(c, depth + 1));
      };
      nodes.forEach((node) => dfs(node, 1));
      return max;
    };

    const maxDepth = computeMaxDepth(categoryTree);
    for (let i = 0; i < maxDepth; i++) {
      const opts = getOptionsForLevel(i);
      if (!opts || opts.length === 0) break;

      levels.push(
        <TextField
          key={`cat-level-${i}`}
          select
          label={`Level ${i + 1}`}
          value={(selectedPath && selectedPath[i]) || ""}
          onChange={(e) => {
            const newId = e.target.value;
            setFormData((cur) => ({
              ...cur,
              categoryPath: [...cur.categoryPath.slice(0, i), newId],
            }));
          }}
          fullWidth
          margin="normal"
        >
          {opts.map((o) => (
            <MenuItem key={o._id} value={o._id}>
              {o.name?.en || o.name?.ar || o._id}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    return <Box sx={{ mt: 1 }}>{levels}</Box>;
  };

  return (
    <Box sx={{ p: 4, position: "relative" }}>
      <LanguageSelector />
      <Typography variant="h4" fontWeight="bold">
        {t.adminDashboard}
      </Typography>

      <IconButton
        sx={{ position: "absolute", top: 60, right: 20 }}
        onClick={() => setConfirmLogout(true)}
      >
        <LogoutIcon />
      </IconButton>

      <Box sx={{ mt: 3, mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label={t.mediaManager} />
          <Tab label="Category Manager" />
          <Tab label={t.backgroundManager} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box sx={{ mt: 3, maxWidth: "900px", mx: "auto" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              {t.mediaManager}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => openForm()}
            >
              {t.addMedia}
            </Button>
          </Box>

          <Box>
            {mediaList.map((item) => {
              // Helper to build category display name from categoryPath + categoryTree
              const buildCategoryDisplay = () => {
                if (item.categoryPath && item.categoryPath.length > 0 && categoryTree) {
                  // Build a map of node IDs to their names from categoryTree
                  const nodeMap = {};
                  const traverse = (node) => {
                    nodeMap[node._id] = node;
                    if (node.children) node.children.forEach(traverse);
                  };
                  categoryTree.forEach(traverse);
                  
                  // Build the display path
                  const names = item.categoryPath
                    .map(id => nodeMap[id]?.name?.en || '?')
                    .filter(Boolean);
                  return names.join(' / ');
                }
                return item.category + (item.subcategory ? ' / ' + item.subcategory : '');
              };
              
              return (
              <Box
                key={item._id}
                sx={{
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  border: "1px solid #ddd",
                  backgroundColor: "#fafafa",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                }}
              >
            {/* Top Section: Category Info */}
            <Typography fontWeight="bold" variant="subtitle1">
              {buildCategoryDisplay()}
            </Typography>

            {/* Media Section */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                mt: 2,
              }}
            >
              {/* English Media */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t.englishMedia}
                </Typography>
                {item.media?.en?.type === "image" && item.media.en?.url ? (
                  <Box
                    component="img"
                    src={item.media.en.url}
                    alt="English Media"
                    sx={{
                      width: "150px",
                      height: "100px",
                      objectFit: "contain",
                      backgroundColor: "#eee",
                      borderRadius: 2,
                      border: "1px solid #ddd",
                      mt: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "150px",
                      height: "100px",
                      borderRadius: 2,
                      backgroundColor: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      mt: 1,
                    }}
                  >
                    🎥
                  </Box>
                )}
              </Box>

              {/* Arabic Media */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  {t.arabicMedia}
                </Typography>
                {item.media?.ar?.type === "image" && item.media.ar?.url ? (
                  <Box
                    component="img"
                    src={item.media.ar.url}
                    alt="Arabic Media"
                    sx={{
                      width: "150px",
                      height: "100px",
                      objectFit: "contain",
                      backgroundColor: "#eee",
                      borderRadius: 2,
                      border: "1px solid #ddd",
                      mt: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "150px",
                      height: "100px",
                      borderRadius: 2,
                      backgroundColor: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 32,
                      mt: 1,
                    }}
                  >
                    🎥
                  </Box>
                )}
              </Box>
            </Box>

            {/* Layers Section */}
            {item.layers && item.layers.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="text.secondary">
                  Layers ({item.layers.length})
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                  {item.layers.map((layer, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        p: 1,
                        border: "1px solid #ccc",
                        borderRadius: 1,
                        backgroundColor: "#fff",
                        fontSize: "0.75rem",
                      }}
                    >
                      {(layer.fileEn?.url || layer.file?.url) ? (
                        <Box
                          component="img"
                          src={layer.fileEn?.url || layer.file?.url}
                          alt={`Layer ${idx + 1}`}
                          sx={{ width: "40px", height: "40px", borderRadius: 1, objectFit: "cover" }}
                        />
                      ) : (
                        <Box sx={{ width: "40px", height: "40px", backgroundColor: "#eee", borderRadius: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>📦</Box>
                      )}
                      <Box>
                        <Typography variant="caption" fontWeight="bold">{layer.title || `Layer ${idx + 1}`}</Typography>
                        <Typography variant="caption" display="block" color="text.secondary">Z: {layer.zIndex ?? 0}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Pinpoint Section */}
            {item.pinpoint?.file?.url && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Box
                  component="img"
                  src={item.pinpoint.file.url}
                  alt="Pinpoint"
                  sx={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    border: "1px solid #ddd",
                  }}
                />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    {t.pinpointPositionLabel}
                  </Typography>
                  <Typography variant="body2">
                    X: {item.pinpoint?.position?.x ?? "0"}%, Y:{" "}
                    {item.pinpoint?.position?.y ?? "0"}%
                  </Typography>
                </Box>
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 1,
                mt: 2,
              }}
            >
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => openForm(item)}
                startIcon={<Edit />}
              >
                {t.edit}
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setSelectedId(item._id);
                  setConfirmationOpen(true);
                }}
                startIcon={<Delete />}
              >
                {t.delete}
              </Button>
            </Box>
          </Box>
              );
            })}
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ mt: 3, maxWidth: "1000px", mx: "auto" }}>
          <CategoryManager onChange={fetchMedia} />
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ mt: 3, maxWidth: "900px", mx: "auto" }}>
          <CMSBackgroundManager />
        </Box>
      )}

      {/* Logout Confirmation */}
      <ConfirmationDialog
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={logout}
        title={t.logoutTitle}
        message={t.logoutMessage}
        confirmButtonText={t.logout}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
        onConfirm={handleDelete}
        title={t.deleteMedia}
        message={t.deleteMessage}
        confirmButtonText={
          actionLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            t.deleteMedia
          )
        }
        confirmButtonProps={{ disabled: actionLoading }}
      />
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>{editingItem ? t.editMedia : t.newMedia}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            {t.generalInfo}
          </Typography>
          {categoryTree ? (
            renderCategoryChain()
          ) : (
            <>
              <Autocomplete
                freeSolo
                options={Object.keys(dynamicOptions)}
                value={formData.category}
                onChange={(e, newValue) => {
                  setFormData({
                    ...formData,
                    category: newValue || "",
                    subcategory: "",
                  });
                }}
                onInputChange={(e, newInputValue) => {
                  setFormData({ ...formData, category: newInputValue || "" });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t.category}
                    fullWidth
                    sx={{ mt: 1 }}
                    error={!!errors.category}
                    helperText={errors.category || t.categoryHelper}
                  />
                )}
              />

              <Autocomplete
                freeSolo
                options={dynamicOptions[formData.category] || []}
                value={formData.subcategory}
                onChange={(e, newValue) =>
                  setFormData({ ...formData, subcategory: newValue || "" })
                }
                onInputChange={(e, newInputValue) => {
                  setFormData({ ...formData, subcategory: newInputValue || "" });
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t.subcategory}
                    fullWidth
                    sx={{ mt: 2 }}
                    error={!!errors.subcategory}
                    helperText={errors.subcategory || t.subcategoryHelper}
                  />
                )}
              />
            </>
          )}

          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            {t.englishUpload}
          </Typography>
          <Input
            type="file"
            sx={{ mt: 1 }}
            onChange={(e) => {
              const file = e.target.files[0];
              setFormData({
                ...formData,
                fileEn: file,
                previewEn: file ? URL.createObjectURL(file) : null,
              });
            }}
            error={!!errors.fileEn}
          />
          {(() => {
            const previewEnSrc = formData.previewEn || formData.preview || editingItem?.media?.en?.url || null;
            if (!previewEnSrc) return null;
            return (
              <Box sx={{ mt: 2 }}>
                {formData.fileEn?.type?.startsWith("video") || editingItem?.media?.en?.type === "video" ? (
                  <Box
                    component="video"
                    src={previewEnSrc}
                    sx={{ width: "150px", height: "100px", objectFit: "contain", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={previewEnSrc}
                    alt="English Media Preview"
                    sx={{ width: "150px", height: "100px", objectFit: "contain", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                  />
                )}
              </Box>
            );
          })()}

          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            {t.arabicUpload}
          </Typography>
          <Input
            type="file"
            sx={{ mt: 1 }}
            onChange={(e) => {
              const file = e.target.files[0];
              setFormData({
                ...formData,
                fileAr: file,
                previewAr: file ? URL.createObjectURL(file) : null,
              });
            }}
            error={!!errors.fileAr}
          />
          {(() => {
            const previewArSrc = formData.previewAr || editingItem?.media?.ar?.url || null;
            if (!previewArSrc) return null;
            return (
              <Box sx={{ mt: 2 }}>
                {formData.fileAr?.type?.startsWith("video") || editingItem?.media?.ar?.type === "video" ? (
                  <Box
                    component="video"
                    src={previewArSrc}
                    sx={{ width: "150px", height: "100px", objectFit: "contain", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={previewArSrc}
                    alt="Arabic Media Preview"
                    sx={{ width: "150px", height: "100px", objectFit: "contain", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                  />
                )}
              </Box>
            );
          })()}

          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            {t.pinpointUpload}
          </Typography>
          <Input
            type="file"
            sx={{ mt: 1 }}
            onChange={(e) => {
              const file = e.target.files[0];
              setFormData({
                ...formData,
                pinpointFile: file,
                pinpointPreview: file ? URL.createObjectURL(file) : null,
              });
            }}
          />
          {formData.pinpointPreview && (
            <Box
              component="img"
              src={formData.pinpointPreview}
              alt="Logo Preview"
              sx={{
                width: "100px",
                height: "100px",
                objectFit: "contain",
                backgroundColor: "#eee",
                mt: 2,
                borderRadius: 2,
                border: "1px solid #ddd",
              }}
            />
          )}

          <Typography variant="subtitle2" sx={{ mt: 4 }}>
            {t.pinpointPosition}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t.pinpointPositionHelper}
          </Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              label={t.pinpointX}
              type="number"
              fullWidth
              sx={{ mt: 1 }}
              value={formData.pinpointX}
              onChange={(e) =>
                setFormData({ ...formData, pinpointX: e.target.value })
              }
              inputProps={{ max: 100 }}
              error={!!errors.pinpointX}
              helperText={errors.pinpointX}
            />

            <TextField
              label={t.pinpointY}
              type="number"
              fullWidth
              sx={{ mt: 1 }}
              value={formData.pinpointY}
              onChange={(e) =>
                setFormData({ ...formData, pinpointY: e.target.value })
              }
              inputProps={{ max: 100 }}
              error={!!errors.pinpointY}
              helperText={errors.pinpointY}
            />
          </Box>

          <Box sx={{ mt: 4 }}>
            <Accordion variant="outlined" sx={{ borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography fontWeight="bold">{t.backgroundManager}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <MediaLayerManager
                  layers={formData.layers}
                  onChange={(nextLayers) =>
                    setFormData((current) => ({ ...current, layers: nextLayers }))
                  }
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={actionLoading}>
            {t.cancel}
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              t.save
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
