"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
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
import BackgroundSlideManager from "@/app/components/BackgroundSlideManager";
import {
  createEmptyBackgroundSlide,
  serializeBackgroundSlidesForApi,
} from "@/utils/backgroundSlides";
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import CMSBackgroundManager from "../components/CMSBackgroundManager";
import { Tabs, Tab } from "@mui/material";
import useWebSocketController from "@/hooks/useWebSocketController";
import CategoryManager from "./CategoryManager";
import StrategyForecastManager from "./StrategyForecastManager";
import ElectricVehiclesManager from "./ElectricVehiclesManager";
import MapManager from "./MapManager";

const CMS_TAB_STORAGE_KEY = "cmsActiveTab";

function readStoredCmsTab() {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(CMS_TAB_STORAGE_KEY);
    if (raw == null) return 0;
    const n = Number.parseInt(raw, 10);
    return n >= 0 && n <= 5 ? n : 0;
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

const CmsPlaceholderPanel = ({ title, description }) => (
  <Box
    sx={{
      mt: 3,
      maxWidth: "900px",
      mx: "auto",
      p: 4,
      border: "1px dashed #ccc",
      borderRadius: 2,
      bgcolor: "#fafafa",
    }}
  >
    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1.5 }}>
      {title}
    </Typography>
    <Typography color="text.secondary">{description}</Typography>
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
      strategyForecast: "Strategy Forecast",
      electricVehicles: "Electric Vehicles",
      map: "Map",
      tabPlaceholder:
        "This CMS section has been added and is ready for its dedicated configuration UI.",
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
      strategyForecast: "التوقعات الاستراتيجية",
      electricVehicles: "المركبات الكهربائية",
      map: "الخريطة",
      tabPlaceholder:
        "تمت إضافة هذا القسم إلى نظام إدارة المحتوى وهو جاهز لواجهة الإعداد المخصصة.",
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

  const syncRef = useRef({ fetchMedia, requestCategoryReload });
  useEffect(() => {
    syncRef.current = { fetchMedia, requestCategoryReload };
  });

  useEffect(() => {
    if (activeTab === 0) {
      syncRef.current.fetchMedia();
      syncRef.current.requestCategoryReload();
    }
  }, [activeTab]);

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

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const { category } = newErrors;
      let errorMessage = "Please fix the following:\n";
      if (category) errorMessage += `- ${category}\n`;
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
      previewEn: null,
      previewAr: null,
      layers: [],
      mediaLayers: [],
      removeEn: false,
      removeAr: false,
    });
    setInternalMessage({ type: "", text: "" });
  };

  /**
   * Serialize a layers array into { metaPayload, filesEn, filesAr } for FormData submission.
   */
  const resolveForegroundLayerUrls = (layer = {}) => {
    const urlFromFile = (f) =>
      f && typeof f === "object" && !(f instanceof File) ? f.url || "" : "";
    const previewUrl = (p) => (p && !String(p).startsWith("blob:") ? String(p) : "");
    return {
      existingUrlEn:
        layer.existingUrlEn || urlFromFile(layer.fileEn) || previewUrl(layer.previewEn) || "",
      existingUrlAr:
        layer.existingUrlAr || urlFromFile(layer.fileAr) || previewUrl(layer.previewAr) || "",
    };
  };

  const serializeLayers = (layerList = []) => {
    const filesEn = [];
    const filesAr = [];
    const meta = layerList
      .filter((layer) => {
        const urls = resolveForegroundLayerUrls(layer);
        return (
          layer.fileEn instanceof File ||
          layer.fileAr instanceof File ||
          urls.existingUrlEn ||
          urls.existingUrlAr
        );
      })
      .map((layer, index) => {
        const urls = resolveForegroundLayerUrls(layer);
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
          existingUrlEn: urls.existingUrlEn,
          existingUrlAr: urls.existingUrlAr,
          position: layer.position,
          size: layer.size,
          opacity: layer.opacity,
          rotation: layer.rotation,
          title: String(layer.title ?? "").trim(),
          description: String(layer.description ?? "").trim(),
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
      const bgSerialized = serializeBackgroundSlidesForApi(formData.layers);
      const mlSerialized = serializeLayers(formData.mediaLayers);

      const cleanPayload = new FormData();
      cleanPayload.append("category", formData.category);
      cleanPayload.append("subcategory", formData.subcategory || "");
      if (formData.categoryPath && formData.categoryPath.length)
        cleanPayload.append("categoryPath", JSON.stringify(formData.categoryPath));

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
      console.error("❌ Save error:", err ?? "Unknown error");
      console.error("Response:", err?.response?.data ?? "No response data");
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
      layers: item?.layers?.map((l) => createEmptyBackgroundSlide(l)) || [],
      mediaLayers: item?.mediaLayers?.map(mapLayerToFormLayer) || [],
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
          <Tab label={t.backgroundManager} />
          <Tab label={t.categoryManager} />
          <Tab label={t.mediaManager} />
          <Tab label={t.strategyForecast} />
          <Tab label={t.electricVehicles} />
          <Tab label={t.map} />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <Box sx={{ mt: 3, maxWidth: "900px", mx: "auto" }}>
          <CMSBackgroundManager />
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ mt: 3, maxWidth: "1000px", mx: "auto" }}>
          <CategoryManager onChange={syncMediaAndCategories} />
        </Box>
      )}


      {activeTab === 2 && (
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
                      const renderAssetStrip = (items, heading, emptyLabel, getMeta) => {
                        if (!items || items.length === 0) {
                          return (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="caption" color="text.secondary">{emptyLabel}</Typography>
                            </Box>
                          );
                        }

                        const thumbBox = (src, isVideo) =>
                          isVideo ? (
                            <Box component="video" src={src} muted sx={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: 1, bgcolor: "#eee" }} />
                          ) : (
                            <Box component="img" src={src} sx={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: 1, bgcolor: "#eee" }} />
                          );

                        const emptyThumb = (aria) => (
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
                            aria-label={aria}
                          >
                            <ImageNotSupportedOutlined sx={{ fontSize: 22, color: "text.disabled" }} />
                          </Box>
                        );

                        return (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                              {heading} ({items.length})
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                              {items.map((item, idx) => {
                                const enSrc = item.fileEn?.url;
                                const arSrc = item.fileAr?.url;
                                const enIsVideo = item.fileEn?.type === "video";
                                const arIsVideo = item.fileAr?.type === "video";
                                const { title, subtitle } = getMeta(item, idx);

                                return (
                                  <Box
                                    key={item._id || idx}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                      p: 0.5,
                                      border: "1px solid #eee",
                                      borderRadius: 1,
                                      bgcolor: "#fff",
                                    }}
                                  >
                                    <Box sx={{ display: "flex", gap: 0.5 }}>
                                      <Box sx={{ position: "relative" }}>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            bgcolor: "rgba(0,0,0,0.5)",
                                            color: "#fff",
                                            fontSize: "0.5rem",
                                            px: 0.5,
                                            zIndex: 1,
                                          }}
                                        >
                                          EN
                                        </Typography>
                                        {enSrc ? thumbBox(enSrc, enIsVideo) : emptyThumb("No English asset")}
                                      </Box>
                                      <Box sx={{ position: "relative" }}>
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            bgcolor: "rgba(0,0,0,0.5)",
                                            color: "#fff",
                                            fontSize: "0.5rem",
                                            px: 0.5,
                                            zIndex: 1,
                                          }}
                                        >
                                          AR
                                        </Typography>
                                        {arSrc ? thumbBox(arSrc, arIsVideo) : emptyThumb("No Arabic asset")}
                                      </Box>
                                    </Box>
                                    <Box sx={{ minWidth: 0 }}>
                                      <Typography variant="caption" fontWeight="bold" noWrap>
                                        {title}
                                      </Typography>
                                      {subtitle ? (
                                        <Typography variant="caption" display="block" color="text.secondary">
                                          {subtitle}
                                        </Typography>
                                      ) : null}
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
                          {renderAssetStrip(
                            item.mediaLayers,
                            t.listStripForegroundHeading,
                            t.listStripForegroundEmpty,
                            (layer, idx) => ({
                              title: `Layer ${idx + 1}`,
                              subtitle: `Z: ${layer.zIndex ?? 0}`,
                            })
                          )}
                          {renderAssetStrip(
                            item.layers,
                            t.listStripBackgroundHeading,
                            t.listStripBackgroundEmpty,
                            (slide, idx) => ({
                              title: slide.displayTitle || slide.title || `Slide ${idx + 1}`,
                              subtitle: `Seq ${idx + 1}`,
                            })
                          )}
                        </>
                      );
                    })()}

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

      {activeTab === 3 && <StrategyForecastManager />}

      {activeTab === 4 && <ElectricVehiclesManager />}

      {activeTab === 5 && <MapManager />}

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
                <BackgroundSlideManager
                  slides={formData.layers}
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
