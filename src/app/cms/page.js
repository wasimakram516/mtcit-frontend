"use client";
import { useCallback, useEffect, useState } from "react";
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
  Alert,
} from "@mui/material";
import { Add, Delete, Edit, ExpandMore, ImageNotSupportedOutlined } from "@mui/icons-material";
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
import { normalizeSlug } from "@/utils/slugify";

const CMS_TAB_STORAGE_KEY = "cmsActiveTab";

function readStoredCmsTab() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(CMS_TAB_STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return n >= 0 && n <= 2 ? n : 0;
  } catch {
    return 0;
  }
}

const ProgressOverlay = ({ progress }) => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: "rgba(0, 0, 0, 0.6)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      borderRadius: "inherit",
      backdropFilter: "blur(2px)",
    }}
  >
    <CircularProgress variant="determinate" value={progress} color="primary" size={40} />
    <Typography variant="caption" sx={{ color: "white", mt: 1, fontWeight: "bold" }}>
      {progress}%
    </Typography>
  </Box>
);

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
    layers: [],
    mediaLayers: [],
    title: "",
    slug: "",
    slugTouched: false,
    pinpointFile: null,
    pinpointX: "",
    pinpointY: "",
    pinpointPreview: null,
    removePinpoint: false,
  });
  const [errors, setErrors] = useState({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    setActiveTab(readStoredCmsTab());
  }, []);
  const [internalMessage, setInternalMessage] = useState({ type: "", text: "" });
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // 'en', 'ar', 'pinpoint'

  const translations = {
    en: {
      adminDashboard: "Admin Dashboard",
      mediaManager: "Media Manager",
      addMedia: "Add Media",
      editMedia: "Edit Media",
      newMedia: "Add New Media",
      deleteMedia: "Delete Media",
      deleteMessage: "Are you sure you want to delete this media?",
      exitTitle: "Confirm Exit",
      exitMessage: "Are you sure you want to exit the CMS? Any unsaved changes will be lost.",
      exit: "Exit",
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
      accordionForegroundTitle: "Foreground media (big screen center)",
      accordionForegroundDescription:
        "Add images or videos that appear in the centered content area on the display (~70% of the stage). Order, size, and position apply only inside that frame.",
      accordionBackgroundTitle: "Stage backgrounds (90% display area)",
      accordionBackgroundDescription:
        "Layers that fill the centered stage container (about 90% of the screen—the rounded display viewport). They sit behind the foreground media in that same area, not behind the entire browser window.",
      accordionForegroundSummaryHint: "Center-stage images & videos · stack, size, and position",
      accordionBackgroundSummaryHint: "Backdrop inside the 90% stage · behind centered foreground media",
      listStripForegroundHeading: "Foreground media",
      listStripForegroundEmpty: "No foreground media layers configured.",
      listStripBackgroundHeading: "Stage backgrounds (90% area)",
      listStripBackgroundEmpty: "No stage background layers configured.",
      categoryManager: "Category Manager",
      removeMedia: "Remove Media",
      removeMediaConfirm: "Are you sure you want to remove this media asset?",
      addCategoryFirst: "Please add a category first in the Category Manager tab",
      noMedia: "No media added yet. Click Add Media to get started.",
      mediaTitle: "Title",
      mediaSlug: "Slug",
      slugInvalid: "Slug must contain only letters, numbers, and hyphens (at least 2 characters).",
    },
    ar: {
      adminDashboard: "لوحة التحكم",
      mediaManager: "مدير الوسائط",
      addMedia: "إضافة وسائط",
      editMedia: "تعديل الوسائط",
      newMedia: "إضافة وسائط",
      deleteMedia: "حذف الوسائط",
      deleteMessage: "هل أنت متأكد أنك تريد حذف هذه الوسائط؟",
      exitTitle: "تأكيد الخروج",
      exitMessage: "هل أنت متأكد أنك تريد الخروج من نظام إدارة المحتوى؟ سيتم فقدان أي تغييرات غير محفوظة.",
      exit: "خروج",
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
      accordionForegroundTitle: "وسائط المقدمة (وسط الشاشة الكبيرة)",
      accordionForegroundDescription:
        "أضف صورًا أو مقاطع فيديو تظهر في منطقة المحتوى الوسطى على العرض (حوالي 70٪ من المسرح). الترتيب والحجم والموضع ينطبقان فقط داخل هذه المنطقة.",
      accordionBackgroundTitle: "خلفيات المسرح (منطقة العرض ~90٪)",
      accordionBackgroundDescription:
        "طبقات تملأ الحاوية الوسطية للمسرح (حوالي 90٪ من الشاشة — نافذة العرض ذات الزوايا المدورة). تظهر خلف وسائط المقدمة في ذلك الإطار نفسه، وليس خلف كامل نافذة المتصفح.",
      accordionForegroundSummaryHint: "صور وفيديوهات المقدمة · الترتيب والحجم والموضع",
      accordionBackgroundSummaryHint: "خلفية داخل مسرح 90٪ · خلف وسائط المقدمة الوسطى",
      listStripForegroundHeading: "وسائط المقدمة",
      listStripForegroundEmpty: "لم يُضبط طبق وسائط للمقدمة.",
      listStripBackgroundHeading: "خلفيات المسرح (90٪)",
      listStripBackgroundEmpty: "لم تُضبط طبقات خلفية للمسرح.",
      categoryManager: "مدير الفئات",
      removeMedia: "إزالة الوسائط",
      removeMediaConfirm: "هل أنت متأكد أنك تريد إزالة أصل الوسائط هذا؟",
      addCategoryFirst: "يرجى إضافة فئة أولاً في علامة تبويب مدير الفئات",
      noMedia: "لم يتم إضافة وسائط بعد. انقر على 'إضافة وسائط' للبدء.",
      mediaTitle: "العنوان",
      mediaSlug: "المعرّف",
      slugInvalid: "يجب أن يحتوي المعرّف على أحرف وأرقام وشرطات فقط (حرفان على الأقل).",
    },
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    try {
      sessionStorage.setItem(CMS_TAB_STORAGE_KEY, String(newValue));
    } catch {
      /* ignore quota / private mode */
    }
  };

  const t = translations[language];

  const { connected, sendCategorySelection, sendCarbonMode, categoryOptions, categoryTree, requestCategoryReload } =
    useWebSocketController();

  const createEmptyLayer = (layer = {}) => ({
    fileEn: layer.fileEn || null,
    fileAr: layer.fileAr || null,
    existingUrlEn: layer.existingUrlEn || "",
    existingUrlAr: layer.existingUrlAr || "",
    previewEn: layer.previewEn || "",
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

  const fetchMedia = useCallback(async () => {
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
  }, [showMessage]);

  const syncMediaAndCategories = useCallback(() => {
    fetchMedia();
    requestCategoryReload();
  }, [fetchMedia, requestCategoryReload]);

  useEffect(() => {
    if (activeTab === 0) {
      syncMediaAndCategories();
    }
  }, [activeTab, syncMediaAndCategories]);

  const showInternalMessage = (text, type = "success") => {
    setInternalMessage({ text, type });
    setTimeout(() => setInternalMessage({ text: "", type: "" }), 3000);
  };

  const handleExit = () => {
    router.push("/");
  };

  const validateForm = () => {
    const newErrors = {};

    if (categoryTree && categoryTree.length > 0) {
      if (!formData.categoryPath || formData.categoryPath.length === 0) {
        newErrors.category = "Category is required.";
      }
    } else if ((!formData.category || formData.category === "") && (!formData.categoryPath || formData.categoryPath.length === 0)) {
      newErrors.category = "Category is required.";
    }

    const titleTrim = String(formData.title || "").trim();
    if (!titleTrim) {
      newErrors.title = "Title is required.";
    }

    const slugNorm = normalizeSlug(formData.slug || formData.title || "");
    if (slugNorm.length < 2) {
      newErrors.slug = t.slugInvalid;
    }

    // Validate Pinpoint X (allow negative values)
    if (formData.pinpointX !== "" && formData.pinpointX !== null) {
      const x = Number(formData.pinpointX);
      if (isNaN(x) || x > 100) {
        newErrors.pinpointX = "X must be a number (any negative or positive value, max 100).";
      }
    }

    // Validate Pinpoint Y (allow negative values)
    if (formData.pinpointY !== "" && formData.pinpointY !== null) {
      const y = Number(formData.pinpointY);
      if (isNaN(y) || y > 100) {
        newErrors.pinpointY = "Y must be a number (any negative or positive value, max 100).";
      }
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const { category, title, slug, pinpointX, pinpointY } = newErrors;
      let errorMessage = "Please fix the following:\n";
      if (category) errorMessage += `- ${category}\n`;
      if (title) errorMessage += `- ${title}\n`;
      if (slug) errorMessage += `- ${slug}\n`;
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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);

    // Revoke pinpoint preview blob URL
    if (formData.pinpointPreview?.startsWith("blob:")) URL.revokeObjectURL(formData.pinpointPreview);

    // Revoke layer previews
    formData.layers.forEach((layer) => {
      if (layer.previewEn?.startsWith("blob:")) URL.revokeObjectURL(layer.previewEn);
      if (layer.previewAr?.startsWith("blob:")) URL.revokeObjectURL(layer.previewAr);
    });
    (formData.mediaLayers || []).forEach((layer) => {
      if (layer.previewEn?.startsWith("blob:")) URL.revokeObjectURL(layer.previewEn);
      if (layer.previewAr?.startsWith("blob:")) URL.revokeObjectURL(layer.previewAr);
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
      mediaLayers: [],
      title: "",
      slug: "",
      slugTouched: false,
      removeEn: false,
      removeAr: false,
      removePinpoint: false,
    });
    setInternalMessage({ type: "", text: "" });
  };

  const handleRemoveMediaClick = (target) => {
    setRemoveTarget(target);
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveMedia = async () => {
    setActionLoading(true);
    try {
      if (removeTarget === 'pinpoint') {
        if (editingItem) {
          const payload = new FormData();
          payload.append("removePinpoint", "true");
          await updateMedia(editingItem._id, payload);
          showInternalMessage("Logo removed", "success");
          const res = await getMedia();
          const updated = res.data?.find(m => m._id === editingItem._id);
          if (updated) setEditingItem(updated);
        }
        if (formData.pinpointPreview?.startsWith("blob:")) URL.revokeObjectURL(formData.pinpointPreview);
        setFormData(prev => ({ ...prev, pinpointFile: null, pinpointPreview: null, removePinpoint: !editingItem }));
      }
    } catch (err) {
      console.error("Error removing pinpoint:", err);
      showInternalMessage("Failed to remove logo", "error");
    } finally {
      setActionLoading(false);
      setRemoveConfirmOpen(false);
      setRemoveTarget(null);
    }
  };

  /**
   * Serialize a layers array into { metaPayload, filesEn, filesAr } for FormData submission.
   */
  const serializeLayers = (layerList = []) => {
    const filesEn = [];
    const filesAr = [];
    const meta = layerList
      .filter((l) => l.fileEn || l.fileAr || l.existingUrlEn || l.existingUrlAr)
      .map((layer, index) => {
        const isFileEn = layer.fileEn instanceof File;
        const isFileAr = layer.fileAr instanceof File;
        const fileIndexEn = isFileEn ? filesEn.length : null;
        if (isFileEn) filesEn.push(layer.fileEn);
        const fileIndexAr = isFileAr ? filesAr.length : null;
        if (isFileAr) filesAr.push(layer.fileAr);
        return {
          fileIndex: fileIndexEn,
          fileIndexEn,
          fileIndexAr,
          existingUrlEn: layer.existingUrlEn || "",
          existingUrlAr: layer.existingUrlAr || "",
          position: layer.position,
          size: layer.size,
          opacity: layer.opacity,
          rotation: layer.rotation,
          title: layer.title || "",
          description: layer.description || "",
          type: layer.typeEn || layer.type || "image",
          typeEn: layer.typeEn || layer.type || "image",
          typeAr: layer.typeAr || "image",
          isActive: layer.isActive !== undefined ? layer.isActive : true,
          zIndex: layer.zIndex ?? index,
        };
      });
    return { meta, filesEn, filesAr };
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const bgSerialized = serializeLayers(formData.layers);
      const mlSerialized = serializeLayers(formData.mediaLayers);

      const cleanPayload = new FormData();
      cleanPayload.append("category", formData.category);
      cleanPayload.append("subcategory", formData.subcategory || "");
      if (formData.categoryPath && formData.categoryPath.length)
        cleanPayload.append("categoryPath", JSON.stringify(formData.categoryPath));

      cleanPayload.append("title", String(formData.title || "").trim());
      cleanPayload.append("slug", normalizeSlug(formData.slug || formData.title || ""));

      // Pinpoint / Logo
      if (formData.pinpointFile) cleanPayload.append("pinpoint", formData.pinpointFile);
      if (formData.pinpointX) cleanPayload.append("pinpointX", formData.pinpointX);
      if (formData.pinpointY) cleanPayload.append("pinpointY", formData.pinpointY);
      if (formData.removePinpoint) cleanPayload.append("removePinpoint", "true");

      // Background layers: JSON meta + En/Ar files
      cleanPayload.append("layers", JSON.stringify(bgSerialized.meta));
      bgSerialized.filesEn.forEach(f => cleanPayload.append("mediaLayers", f));
      bgSerialized.filesAr.forEach(f => cleanPayload.append("mediaLayersAr", f));

      // Media content layers: JSON meta + En/Ar files (distinct multer field names)
      cleanPayload.append("mediaLayersMeta", JSON.stringify(mlSerialized.meta));
      mlSerialized.filesEn.forEach(f => cleanPayload.append("mediaLayerFiles", f));
      mlSerialized.filesAr.forEach(f => cleanPayload.append("mediaLayerFilesAr", f));

      const onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(pct);
        }
      };

      const res = editingItem
        ? await updateMedia(editingItem._id, cleanPayload, { onUploadProgress })
        : await createMedia(cleanPayload, { onUploadProgress });

      showInternalMessage(res.message || "Saved", "success");
      setTimeout(() => {
        handleCloseDialog();
        fetchMedia();
        requestCategoryReload();
      }, 1500);
    } catch (err) {
      console.error("❌ Save error:", err);
      console.error("Response:", err?.response?.data);
      const errorMsg =
        typeof err === "string"
          ? err
          : err?.response?.data?.message || err?.message || "Failed to save";
      showInternalMessage(errorMsg, "error");
    } finally {
      setActionLoading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setActionLoading(true);
    try {
      const res = await deleteMedia(selectedId);
      showMessage(res.message || "Deleted", "success");
      await fetchMedia();
      requestCategoryReload();
    } catch (error) {
      console.error("Delete error:", error);
      showMessage("Failed to delete", "error");
    } finally {
      setActionLoading(false);
      setConfirmationOpen(false);
      setSelectedId(null);
    }
  };

  const mapLayerToFormLayer = (layer) =>
    createEmptyLayer({
      existingUrlEn: layer.fileEn?.url || "",
      existingUrlAr: layer.fileAr?.url || "",
      previewEn: layer.fileEn?.url || "",
      previewAr: layer.fileAr?.url || "",
      fileEn: null,
      fileAr: null,
      title: layer.title || "",
      description: layer.description || "",
      typeEn: layer.fileEn?.type || "image",
      typeAr: layer.fileAr?.type || "image",
      position: layer.position || { x: 0, y: 0 },
      size: layer.size || { width: 100, height: 100 },
      opacity: layer.opacity ?? 1,
      rotation: layer.rotation ?? 0,
      zIndex: layer.zIndex ?? 0,
      isActive: layer.isActive !== undefined ? layer.isActive : true,
    });

  const openForm = (item = null) => {
    requestCategoryReload();
    setEditingItem(item);
    setErrors({});
    setFormData({
      category: item?.category || "",
      subcategory: item?.subcategory || "",
      categoryPath: item?.categoryPath || [],
      title: item?.title || "",
      slug: item?.slug || "",
      slugTouched: !!item,
      layers: item?.layers?.map(mapLayerToFormLayer) || [],
      mediaLayers: item?.mediaLayers?.map(mapLayerToFormLayer) || [],
      pinpointFile: null,
      pinpointX: item?.pinpoint?.position?.x?.toString() || "",
      pinpointY: item?.pinpoint?.position?.y?.toString() || "",
      pinpointPreview: item?.pinpoint?.file?.url || null,
      removePinpoint: false,
    });
    setOpenDialog(true);
  };

  // Render N-level chained selects when categoryTree is available
  const renderCategoryChain = () => {
    if (!categoryTree || !Array.isArray(categoryTree) || categoryTree.length === 0) {
      return (
        <TextField
          fullWidth
          disabled
          label={t.category}
          value=""
          placeholder={t.addCategoryFirst}
          helperText={t.addCategoryFirst}
          margin="normal"
          error
        />
      );
    }

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
    <Box sx={{ p: 4 }}>
      {/* Header with Title and Controls */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          {t.adminDashboard}
        </Typography>
        
        <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
          <LanguageSelector absolute={false} />
          <IconButton
            onClick={() => setConfirmExit(true)}
            title={t.exit}
            sx={{ border: "1px solid #eee", p: 1 }}
          >
            <LogoutIcon color="error" />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ mt: 3, mb: 2, borderBottom: 1, borderColor: "divider" }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          variant="scrollable" 
          scrollButtons="auto" 
          allowScrollButtonsMobile
          sx={{ '& .MuiTabs-flexContainer': { justifyContent: { sm: 'center' } } }}
        >
          <Tab label={t.mediaManager} />
          <Tab label={t.categoryManager} />
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
            {mediaList.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center", border: "1px dashed #ccc", borderRadius: 2, bgcolor: "#fafafa" }}>
                <Typography color="text.secondary">{t.noMedia}</Typography>
              </Box>
            ) : (
              mediaList.map((item) => {
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
                    <Typography fontWeight="bold" variant="subtitle1">
                      {buildCategoryDisplay()}
                    </Typography>
                    {item.title && (
                      <Typography variant="h6" sx={{ mt: 0.5 }}>
                        {item.title}
                      </Typography>
                    )}
                    {item.slug && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {item.slug}
                      </Typography>
                    )}

                    {/* Media Layers Preview */}
                    {(() => {
                      const renderLayerStrip = (layers, heading, emptyLabel) => {
                        if (!layers || layers.length === 0) {
                          return (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">{emptyLabel}</Typography>
                            </Box>
                          );
                        }

                        return (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                              {heading} ({layers.length})
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              {layers.map((layer, idx) => {
                                const hasEn = !!layer.fileEn?.url;
                                const hasAr = !!layer.fileAr?.url;
                                const enSrc = layer.fileEn?.url;
                                const arSrc = layer.fileAr?.url;
                                const enIsVideo = layer.fileEn?.type === "video";
                                const arIsVideo = layer.fileAr?.type === "video";
                                
                                return (
                                  <Box key={idx} sx={{ display: "flex", alignItems: "center", gap: 1, p: 0.5, border: "1px solid #eee", borderRadius: 1, bgcolor: "#fff" }}>
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                      {/* EN Preview */}
                                      <Box sx={{ position: "relative" }}>
                                        <Typography variant="caption" sx={{ position: "absolute", top: 0, left: 0, bgcolor: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.5rem", px: 0.5, zIndex: 1 }}>EN</Typography>
                                        {hasEn ? (
                                          enIsVideo ? (
                                            <Box component="video" src={enSrc} sx={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: 1, bgcolor: "#eee" }} />
                                          ) : (
                                            <Box component="img" src={enSrc} sx={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: 1, bgcolor: "#eee" }} />
                                          )
                                        ) : (
                                          <Box
                                            sx={{
                                              width: "50px",
                                              height: "50px",
                                              backgroundColor: "#eee",
                                              borderRadius: 1,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                            aria-label="No English asset"
                                          >
                                            <ImageNotSupportedOutlined sx={{ fontSize: 22, color: "text.disabled" }} />
                                          </Box>
                                        )}
                                      </Box>
                                      {/* AR Preview */}
                                      <Box sx={{ position: "relative" }}>
                                        <Typography variant="caption" sx={{ position: "absolute", top: 0, left: 0, bgcolor: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.5rem", px: 0.5, zIndex: 1 }}>AR</Typography>
                                        {hasAr ? (
                                          arIsVideo ? (
                                            <Box component="video" src={arSrc} sx={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: 1, bgcolor: "#eee" }} />
                                          ) : (
                                            <Box component="img" src={arSrc} sx={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: 1, bgcolor: "#eee" }} />
                                          )
                                        ) : (
                                          <Box
                                            sx={{
                                              width: "50px",
                                              height: "50px",
                                              backgroundColor: "#eee",
                                              borderRadius: 1,
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                            }}
                                            aria-label="No Arabic asset"
                                          >
                                            <ImageNotSupportedOutlined sx={{ fontSize: 22, color: "text.disabled" }} />
                                          </Box>
                                        )}
                                      </Box>
                                    </Box>
                                    <Box>
                                      <Typography variant="caption" fontWeight="bold">{layer.title || `Layer ${idx + 1}`}</Typography>
                                      <Typography variant="caption" display="block" color="text.secondary">Z: {layer.zIndex ?? 0}</Typography>
                                    </Box>
                                  </Box>
                                );
                              })}
                            </Box>
                          </Box>
                        );
                      };

                      return (
                        <>
                          {renderLayerStrip(
                            item.mediaLayers,
                            t.listStripForegroundHeading,
                            t.listStripForegroundEmpty
                          )}
                          {renderLayerStrip(
                            item.layers,
                            t.listStripBackgroundHeading,
                            t.listStripBackgroundEmpty
                          )}
                        </>
                      );
                    })()}

                    {/* Pinpoint Section */}
                    {item.pinpoint?.file?.url && (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
                        <Box component="img" src={item.pinpoint.file.url} alt="Pinpoint" sx={{ width: "60px", height: "60px", borderRadius: "50%", border: "1px solid #ddd" }} />
                        <Box>
                          <Typography variant="caption" color="text.secondary">{t.pinpointPositionLabel}</Typography>
                          <Typography variant="body2">X: {item.pinpoint?.position?.x ?? "0"}%, Y: {item.pinpoint?.position?.y ?? "0"}%</Typography>
                        </Box>
                      </Box>
                    )}

                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
                      <Button variant="outlined" color="secondary" onClick={() => openForm(item)} startIcon={<Edit />}>{t.edit}</Button>
                      <Button variant="outlined" color="error" onClick={() => { setSelectedId(item._id); setConfirmationOpen(true); }} startIcon={<Delete />}>{t.delete}</Button>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ mt: 3, maxWidth: "1000px", mx: "auto" }}>
          <CategoryManager onChange={syncMediaAndCategories} />
        </Box>
      )}

      {activeTab === 2 && (
        <Box sx={{ mt: 3, maxWidth: "900px", mx: "auto" }}>
          <CMSBackgroundManager />
        </Box>
      )}

      {/* Exit Confirmation */}
      <ConfirmationDialog
        open={confirmExit}
        onClose={() => setConfirmExit(false)}
        onConfirm={handleExit}
        title={t.exitTitle}
        message={t.exitMessage}
        confirmButtonText={t.exit}
        cancelButtonText={t.cancel}
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

      {/* Remove Media Preview Confirmation */}
      <ConfirmationDialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={confirmRemoveMedia}
        title="Remove Media"
        message={`Are you sure you want to remove the ${removeTarget?.toUpperCase()} media?`}
        confirmButtonText="Remove"
      />

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>{editingItem ? t.editMedia : t.newMedia}</DialogTitle>
        <DialogContent>
          {internalMessage.text && (
            <Alert severity={internalMessage.type} sx={{ mb: 2, mt: 1 }}>
              {internalMessage.text}
            </Alert>
          )}
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            {t.generalInfo}
          </Typography>
          {categoryTree && categoryTree.length > 0 ? (
            renderCategoryChain()
          ) : (
            <>
              {Object.keys(dynamicOptions).length === 0 ? (
                <TextField
                  fullWidth
                  disabled
                  label={t.category}
                  value=""
                  placeholder={t.addCategoryFirst}
                  helperText={t.addCategoryFirst}
                  margin="normal"
                  error
                />
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
            </>
          )}

          <TextField
            fullWidth
            label={t.mediaTitle}
            value={formData.title}
            onChange={(e) => {
              const v = e.target.value;
              setFormData((prev) => ({
                ...prev,
                title: v,
                slug: prev.slugTouched ? prev.slug : normalizeSlug(v),
              }));
            }}
            margin="normal"
            sx={{ mt: 2 }}
            error={!!errors.title}
            helperText={errors.title}
          />

          <TextField
            fullWidth
            label={t.mediaSlug}
            value={formData.slug}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                slug: e.target.value,
                slugTouched: true,
              }))
            }
            margin="normal"
            error={!!errors.slug}
            helperText={errors.slug}
          />

          {/* ── Logo / Pinpoint (kept as-is) ── */}
          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            {t.pinpointUpload}
          </Typography>
          <Input
            type="file"
            sx={{ mt: 1 }}
            inputProps={{ accept: "image/*" }}
            onChange={(e) => {
              const file = e.target.files[0];
              setFormData((prev) => ({
                ...prev,
                pinpointFile: file,
                pinpointPreview: file ? URL.createObjectURL(file) : null,
                removePinpoint: false,
              }));
            }}
          />
          {formData.pinpointPreview && (
            <Box sx={{ mt: 2, position: "relative", width: "fit-content", borderRadius: 2, overflow: "hidden" }}>
              <IconButton
                size="small"
                onClick={() => handleRemoveMediaClick("pinpoint")}
                sx={{ position: "absolute", top: 5, left: 5, bgcolor: "rgba(255,255,255,0.8)", zIndex: 10, "&:hover": { bgcolor: "#fff" } }}
              >
                <Delete fontSize="small" color="error" />
              </IconButton>
              {actionLoading && formData.pinpointFile instanceof File && uploadProgress > 0 && <ProgressOverlay progress={uploadProgress} />}
              <Box
                component="img"
                src={formData.pinpointPreview}
                alt="Logo Preview"
                sx={{ width: "100px", height: "100px", objectFit: "contain", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
              />
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mt: 3 }}>
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
              onChange={(e) => setFormData((prev) => ({ ...prev, pinpointX: e.target.value }))}
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
              onChange={(e) => setFormData((prev) => ({ ...prev, pinpointY: e.target.value }))}
              inputProps={{ max: 100 }}
              error={!!errors.pinpointY}
              helperText={errors.pinpointY}
            />
          </Box>

          {/* Foreground media (center) — listed first in the modal */}
          <Box sx={{ mt: 4 }}>
            <Accordion variant="outlined" sx={{ borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box>
                  <Typography fontWeight="bold">{t.accordionForegroundTitle}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", pr: 1 }}>
                    {t.accordionForegroundSummaryHint}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  {t.accordionForegroundDescription}
                </Typography>
                <MediaLayerManager
                  layers={formData.mediaLayers}
                  onChange={(nextLayers) =>
                    setFormData((current) => ({ ...current, mediaLayers: nextLayers }))
                  }
                  uploadProgress={uploadProgress}
                  isUploading={actionLoading}
                />
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Stage backgrounds (90% centered viewport) */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Accordion variant="outlined" sx={{ borderRadius: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box>
                  <Typography fontWeight="bold">{t.accordionBackgroundTitle}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", pr: 1 }}>
                    {t.accordionBackgroundSummaryHint}
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  {t.accordionBackgroundDescription}
                </Typography>
                <MediaLayerManager
                  layers={formData.layers}
                  onChange={(nextLayers) =>
                    setFormData((current) => ({ ...current, layers: nextLayers }))
                  }
                  uploadProgress={uploadProgress}
                  isUploading={actionLoading}
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        </DialogContent>
        <DialogActions>
          {actionLoading && uploadProgress > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, ml: 2 }}>
              Uploading... {uploadProgress}%
            </Typography>
          )}
          {editingItem && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => { setSelectedId(editingItem._id); setConfirmationOpen(true); }}
              startIcon={<Delete />}
              disabled={actionLoading}
              sx={{ mr: "auto" }}
            >
              {t.delete}
            </Button>
          )}
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
