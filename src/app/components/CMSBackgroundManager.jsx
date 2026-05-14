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
  Slider,
  IconButton,
  Alert,
  CircularProgress,
  Input,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  Edit,
  Delete,
  Visibility,
  VisibilityOff,
  Add,
} from "@mui/icons-material";
import { deleteBackground, getBackgrounds, updateBackground, createBackground, moveBackgroundLayer } from "@/services/BackgroundService";
import { useLanguage } from "@/app/context/LanguageContext";
import ConfirmationDialog from "./ConfirmationDialog";

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

export default function CMSBackgroundManager() {
  const { language } = useLanguage();

  const translations = {
    en: {
      backgroundManager: "Background Manager",
      addBackground: "Add Background",
      uploadImage: "Upload English Image",
      uploadImageAr: "Upload Arabic Image",
      currentImage: "Current English Image",
      currentImageAr: "Current Arabic Image",
      orUploadNew: "Or upload a new English image",
      orUploadNewAr: "Or upload a new Arabic image",
      title: "Title",
      description: "Description",
      positionX: "Position X",
      positionY: "Position Y",
      width: "Width",
      height: "Height",
      opacity: "Opacity",
      rotation: "Rotation",
      noBackgrounds: "No backgrounds added yet",
      preview: "Preview",
      layer: "Layer",
      moveForward: "Move Forward",
      moveBackward: "Move Backward",
      deactivate: "Deactivate",
      activate: "Activate",
      edit: "Edit",
      delete: "Delete",
      cancel: "Cancel",
      save: "Save",
      deleteConfirm: "Are you sure you want to delete this background?",
      titleRequired: "Title is required",
      imageRequired: "Image is required for new backgrounds",
      successDelete: "Background deleted",
      successCreate: "Background created",
      successUpdate: "Background updated",
      successMoved: "Moved",
      forward: "forward",
      backward: "backward",
      failedDelete: "Failed to delete background",
      failedMove: "Failed to move layer",
      errorSaving: "Error saving background",
      removeMedia: "Remove Media",
      removeMediaConfirm: "Are you sure you want to remove this media asset?",
    },
    ar: {
      backgroundManager: "مدير الخلفيات",
      addBackground: "إضافة خلفية",
      uploadImage: "تحميل الصورة الإنجليزية",
      uploadImageAr: "تحميل الصورة العربية",
      currentImage: "الصورة الإنجليزية الحالية",
      currentImageAr: "الصورة العربية الحالية",
      orUploadNew: "أو تحميل صورة إنجليزية جديدة",
      orUploadNewAr: "أو تحميل صورة عربية جديدة",
      title: "العنوان",
      description: "الوصف",
      positionX: "الموضع X",
      positionY: "الموضع Y",
      width: "العرض",
      height: "الارتفاع",
      opacity: "الشفافية",
      rotation: "الدوران",
      noBackgrounds: "لم تتم إضافة خلفيات حتى الآن",
      preview: "معاينة",
      layer: "الطبقة",
      moveForward: "تحريك للأمام",
      moveBackward: "تحريك للخلف",
      deactivate: "إلغاء التفعيل",
      activate: "تفعيل",
      edit: "تعديل",
      delete: "حذف",
      cancel: "إلغاء",
      save: "حفظ",
      deleteConfirm: "هل أنت متأكد أنك تريد حذف هذه الخلفية؟",
      titleRequired: "العنوان مطلوب",
      imageRequired: "الصورة مطلوبة للخلفيات الجديدة",
      successDelete: "تم حذف الخلفية",
      successCreate: "تم إنشاء الخلفية",
      successUpdate: "تم تحديث الخلفية",
      successMoved: "تم التحريك",
      forward: "للأمام",
      backward: "للخلف",
      failedDelete: "فشل حذف الخلفية",
      failedMove: "فشل تحريك الطبقة",
      errorSaving: "خطأ في حفظ الخلفية",
      removeMedia: "إزالة الوسائط",
      removeMediaConfirm: "هل أنت متأكد أنك تريد إزالة أصل الوسائط هذا؟",
    },
  };

  const t = translations[language];

  const [backgrounds, setBackgrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBg, setEditingBg] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [selectedFileEn, setSelectedFileEn] = useState(null);
  const [selectedFileAr, setSelectedFileAr] = useState(null);
  const [previewEn, setPreviewEn] = useState(null);
  const [previewAr, setPreviewAr] = useState(null);
  const [typeEn, setTypeEn] = useState(null);
  const [typeAr, setTypeAr] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    opacity: 1,
    rotation: 0,
    removeImageEn: false,
    removeImageAr: false,
  });

  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [removeLang, setRemoveLang] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedBgId, setSelectedBgId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch backgrounds
  const fetchBackgrounds = async () => {
    try {
      const backgrounds = await getBackgrounds();
      setBackgrounds(backgrounds || []);
    } catch (error) {
      console.error("Failed to fetch backgrounds:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackgrounds();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleOpenDialog = (bg = null) => {
    if (bg) {
      setEditingBg(bg);
      setFormData({
        title: bg.title,
        description: bg.description || "",
        position: bg.position || { x: 0, y: 0 },
        size: bg.size || { width: 100, height: 100 },
        opacity: bg.opacity || 1,
        rotation: bg.rotation || 0,
      });
      setPreviewEn(bg.imageUrlEn || bg.imageUrl || bg.imageUrlAr);
      setPreviewAr(bg.imageUrlAr || bg.imageUrlEn || bg.imageUrl);
      setTypeEn(bg.imageUrlEn || bg.imageUrl ? (bg.typeEn || "image") : (bg.typeAr || "image"));
      setTypeAr(bg.imageUrlAr ? (bg.typeAr || "image") : (bg.typeEn || "image"));
    } else {
      setEditingBg(null);
      setFormData({
        title: "",
        description: "",
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        opacity: 1,
        rotation: 0,
      });
      setPreviewEn(null);
      setPreviewAr(null);
      setTypeEn(null);
      setTypeAr(null);
      setFormData(prev => ({ ...prev, removeImageEn: false, removeImageAr: false }));
    }
    setSelectedFileEn(null);
    setSelectedFileAr(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBg(null);
    if (previewEn?.startsWith("blob:")) URL.revokeObjectURL(previewEn);
    if (previewAr?.startsWith("blob:")) URL.revokeObjectURL(previewAr);
    setSelectedFileEn(null);
    setSelectedFileAr(null);
    setPreviewEn(null);
    setPreviewAr(null);
    setTypeEn(null);
    setTypeAr(null);
    setUploadProgress(0);
  };

  const handleFileChange = (e, lang) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (lang === "en") {
      if (previewEn?.startsWith("blob:")) URL.revokeObjectURL(previewEn);
      const nextPreview = URL.createObjectURL(file);
      setSelectedFileEn(file);
      setPreviewEn(nextPreview);
      setTypeEn(file.type.startsWith("video/") ? "video" : "image");
      setFormData(prev => ({ ...prev, removeImageEn: false }));
    } else {
      if (previewAr?.startsWith("blob:")) URL.revokeObjectURL(previewAr);
      const nextPreview = URL.createObjectURL(file);
      setSelectedFileAr(file);
      setPreviewAr(nextPreview);
      setTypeAr(file.type.startsWith("video/") ? "video" : "image");
      setFormData(prev => ({ ...prev, removeImageAr: false }));
    }
  };

  const handleRemoveImageClick = (lang) => {
    setRemoveLang(lang);
    setRemoveConfirmOpen(true);
  };

  const confirmRemoveImage = async () => {
    const lang = removeLang;
    setUploading(true);
    
    try {
      // If editing an existing background, delete from backend
      if (editingBg) {
        const updatePayload = new FormData();
        if (lang === "en") {
          updatePayload.append("removeImageEn", "true");
        } else {
          updatePayload.append("removeImageAr", "true");
        }
        
        await updateBackground(editingBg._id, updatePayload);
        showMessage("success", `${lang.toUpperCase()} image deleted from backend`);
        
        // Clear the preview immediately (set to null, not to other language)
        if (lang === "en") {
          setPreviewEn(null);
          setSelectedFileEn(null);
        } else {
          setPreviewAr(null);
          setSelectedFileAr(null);
        }
        
        // Refresh backgrounds list for consistency
        await fetchBackgrounds();
        const updated = backgrounds.find(b => b._id === editingBg._id);
        if (updated) {
          setEditingBg(updated);
        }
      } else {
        // New background - just clear form field
        if (lang === "en") {
          if (previewEn?.startsWith("blob:")) URL.revokeObjectURL(previewEn);
          setSelectedFileEn(null);
          setPreviewEn(null);
          setFormData(prev => ({ ...prev, removeImageEn: true }));
        } else {
          if (previewAr?.startsWith("blob:")) URL.revokeObjectURL(previewAr);
          setSelectedFileAr(null);
          setPreviewAr(null);
          setFormData(prev => ({ ...prev, removeImageAr: true }));
        }
      }
    } catch (error) {
      console.error("Error removing image:", error);
      showMessage("error", error || "Failed to delete image");
    } finally {
      setUploading(false);
      setRemoveConfirmOpen(false);
      setRemoveLang(null);
    }
  };

  const handleSaveBackground = async () => {
    if (!formData.title) {
      showMessage("error", t.titleRequired);
      return;
    }

    if (!editingBg && !selectedFileEn && !selectedFileAr) {
      showMessage("error", t.imageRequired);
      return;
    }

    try {
      setUploading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("position", JSON.stringify(formData.position));
      formDataToSend.append("size", JSON.stringify(formData.size));
      formDataToSend.append("opacity", formData.opacity);
      formDataToSend.append("rotation", formData.rotation);

      if (selectedFileEn) {
        formDataToSend.append("image", selectedFileEn);
      }
      if (selectedFileAr) {
        formDataToSend.append("imageAr", selectedFileAr);
      }
      if (typeEn) formDataToSend.append("typeEn", typeEn);
      if (typeAr) formDataToSend.append("typeAr", typeAr);
      
      if (formData.removeImageEn) formDataToSend.append("removeImageEn", "true");
      if (formData.removeImageAr) formDataToSend.append("removeImageAr", "true");

      const config = {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        },
      };

      const response = editingBg
        ? await updateBackground(editingBg._id, formDataToSend, config)
        : await createBackground(formDataToSend, config);

      const responseMessage =
        response?.message ||
        (editingBg ? t.successUpdate : t.successCreate);
      showMessage("success", responseMessage);
      handleCloseDialog();
      await fetchBackgrounds();
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", error?.response?.data?.message || t.errorSaving);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteClick = (id) => {
    setSelectedBgId(id);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBgId) return;
    setDeleting(true);

    try {
      await deleteBackground(selectedBgId);
      showMessage("success", t.successDelete);
      await fetchBackgrounds();
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", error || t.failedDelete);
    } finally {
      setDeleting(false);
      setDeleteConfirmOpen(false);
      setSelectedBgId(null);
    }
  };

  const handleMoveLayer = async (id, direction) => {
    try {
      await moveBackgroundLayer(id, direction);
      showMessage(
        "success",
        `${t.successMoved} ${direction === "up" ? t.forward : t.backward}`
      );
      await fetchBackgrounds();
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", error || t.failedMove);
    }
  };

  const handleToggleActive = async (bg) => {
    try {
      await updateBackground(bg._id, {
        isActive: !bg.isActive,
      });
      await fetchBackgrounds();
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", error || "Failed to update background");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sortedBackgrounds = [...backgrounds].sort(
    (first, second) => (second.layer || 0) - (first.layer || 0)
  );

  return (
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {t.backgroundManager}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          {t.addBackground}
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ mt: 3, maxWidth: "800px", mx: "auto" }}>
        {backgrounds.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            {t.noBackgrounds}
          </Typography>
        ) : (
          sortedBackgrounds.map((bg, index) => {
            const isAtTop = index === 0;
            const isAtBottom = index === sortedBackgrounds.length - 1;

            return (
            <Box
              key={bg._id}
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                border: "1px solid #ddd",
                backgroundColor: bg.isActive ? "#fafafa" : "#f5f5f5",
              }}
            >
              {/* Preview Section */}
              <Box sx={{ flex: "0 0 320px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {t.preview} (En / Ar)
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
                  {(() => {
                    const isEnMissing = !bg.imageUrlEn && !bg.imageUrl;
                    const isArMissing = !bg.imageUrlAr;

                    const srcEn = bg.imageUrlEn || bg.imageUrl || bg.imageUrlAr || null;
                    const typeEn = (bg.imageUrlEn || bg.imageUrl) ? bg.typeEn : bg.typeAr;

                    const srcAr = bg.imageUrlAr || bg.imageUrlEn || bg.imageUrl || null;
                    const typeAr = bg.imageUrlAr ? bg.typeAr : (bg.typeEn || "image");

                    return (
                      <>
                        {/* English Preview */}
                        <Box sx={{ textAlign: "center" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="bold">EN</Typography>
                            {isEnMissing && srcEn && (
                              <Typography variant="caption" sx={{ px: 0.5, py: 0.1, bgcolor: "warning.light", color: "warning.contrastText", borderRadius: 1, fontSize: "0.65rem" }}>
                                FALLBACK
                              </Typography>
                            )}
                          </Box>
                          {srcEn ? (
                            typeEn === "video" || srcEn.match(/\.(mp4|webm|ogg)$/i) ? (
                              <Box
                                component="video"
                                src={srcEn}
                                autoPlay loop muted playsInline
                                sx={{ width: "150px", height: "100px", objectFit: "contain", bgcolor: "#000", borderRadius: 2, border: "1px solid #ddd" }}
                              />
                            ) : (
                              <Box
                                component="img"
                                src={srcEn}
                                sx={{ width: "150px", height: "100px", objectFit: "contain", bgcolor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                              />
                            )
                          ) : (
                            <Box sx={{ width: "150px", height: "100px", bgcolor: "#eee", borderRadius: 2, border: "1px solid #ddd" }} />
                          )}
                        </Box>

                        {/* Arabic Preview */}
                        <Box sx={{ textAlign: "center" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, mb: 0.5 }}>
                            <Typography variant="caption" fontWeight="bold">AR</Typography>
                            {isArMissing && srcAr && (
                              <Typography variant="caption" sx={{ px: 0.5, py: 0.1, bgcolor: "warning.light", color: "warning.contrastText", borderRadius: 1, fontSize: "0.65rem" }}>
                                FALLBACK
                              </Typography>
                            )}
                          </Box>
                          {srcAr ? (
                            typeAr === "video" || srcAr.match(/\.(mp4|webm|ogg)$/i) ? (
                              <Box
                                component="video"
                                src={srcAr}
                                autoPlay loop muted playsInline
                                sx={{ width: "150px", height: "100px", objectFit: "contain", bgcolor: "#000", borderRadius: 2, border: "1px solid #ddd" }}
                              />
                            ) : (
                              <Box
                                component="img"
                                src={srcAr}
                                sx={{ width: "150px", height: "100px", objectFit: "contain", bgcolor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                              />
                            )
                          ) : (
                            <Box sx={{ width: "150px", height: "100px", bgcolor: "#eee", borderRadius: 2, border: "1px solid #ddd" }} />
                          )}
                        </Box>
                      </>
                    );
                  })()}
                </Box>
              </Box>

              {/* Info Section */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {bg.title}
                  {bg.isActive === false && (
                    <Typography component="span" variant="caption" color="error" sx={{ ml: 1, fontWeight: "normal" }}>
                      (Disabled)
                    </Typography>
                  )}
                </Typography>
                {bg.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {bg.description}
                  </Typography>
                )}

                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.layer}: {bg.layer + 1}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.opacity}: {(bg.opacity * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.positionX}: {bg.position?.x}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.positionY}: {bg.position?.y}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.width}: {bg.size?.width}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.height}: {bg.size?.height}%
                    </Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                  <IconButton
                    size="small"
                    variant="outlined"
                    onClick={() => handleMoveLayer(bg._id, "up")}
                    title={t.moveBackward}
                    disabled={isAtTop}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    variant="outlined"
                    onClick={() => handleMoveLayer(bg._id, "down")}
                    title={t.moveForward}
                    disabled={isAtBottom}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    onClick={() => handleToggleActive(bg)}
                    title={bg.isActive ? t.deactivate : t.activate}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    {bg.isActive ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                  </IconButton>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(bg)}
                  >
                    {t.edit}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleDeleteClick(bg._id)}
                  >
                    {t.delete}
                  </Button>
                </Box>
              </Box>
            </Box>
          );
          })
        )}
      </Box>

      {/* Dialog for Add/Edit */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingBg ? t.edit : t.addBackground}</DialogTitle>
        <DialogContent>
          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2, mt: 1 }}>
              {message.text}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            {/* Title */}
            <TextField
              fullWidth
              label={t.title}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              sx={{ mb: 2 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label={t.description}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />

            {/* English Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t.uploadImage}</Typography>
              <Input
                type="file"
                fullWidth
                onChange={(e) => handleFileChange(e, "en")}
                accept="image/*,video/*"
              />
              {previewEn && (
                <Box sx={{ mt: 2, position: "relative", width: "fit-content", borderRadius: 2, overflow: "hidden" }}>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImageClick("en")}
                    sx={{ position: "absolute", top: 5, left: 5, bgcolor: "rgba(255,255,255,0.8)", zIndex: 10, "&:hover": { bgcolor: "#fff" } }}
                  >
                    <Delete fontSize="small" color="error" />
                  </IconButton>
                  {editingBg && !selectedFileEn && !editingBg.imageUrlEn && !editingBg.imageUrl && previewEn && (
                    <Typography variant="caption" sx={{ position: "absolute", top: 5, right: 5, px: 1, py: 0.2, bgcolor: "warning.main", color: "#fff", borderRadius: 1, zIndex: 5, fontWeight: "bold" }}>
                      FALLBACK FROM ARABIC
                    </Typography>
                  )}
                  {uploading && selectedFileEn instanceof File && uploadProgress > 0 && <ProgressOverlay progress={uploadProgress} />}
                  {typeEn === "video" || (previewEn.startsWith('blob:') && selectedFileEn?.type.startsWith('video/')) ? (
                    <Box
                      component="video"
                      src={previewEn}
                      autoPlay loop muted playsInline
                      sx={{ width: "200px", height: "120px", objectFit: "contain", bgcolor: "#000", borderRadius: 2, border: "1px solid #ddd" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={previewEn}
                      sx={{ width: "200px", height: "120px", objectFit: "contain", bgcolor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {/* Arabic Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t.uploadImageAr}</Typography>
              <Input
                type="file"
                fullWidth
                onChange={(e) => handleFileChange(e, "ar")}
                accept="image/*,video/*"
              />
              {previewAr && (
                <Box sx={{ mt: 2, position: "relative", width: "fit-content", borderRadius: 2, overflow: "hidden" }}>
                  <IconButton
                    size="small"
                    onClick={() => handleRemoveImageClick("ar")}
                    sx={{ position: "absolute", top: 5, left: 5, bgcolor: "rgba(255,255,255,0.8)", zIndex: 10, "&:hover": { bgcolor: "#fff" } }}
                  >
                    <Delete fontSize="small" color="error" />
                  </IconButton>
                  {editingBg && !selectedFileAr && !editingBg.imageUrlAr && previewAr && (
                    <Typography variant="caption" sx={{ position: "absolute", top: 5, right: 5, px: 1, py: 0.2, bgcolor: "warning.main", color: "#fff", borderRadius: 1, zIndex: 5, fontWeight: "bold" }}>
                      FALLBACK FROM ENGLISH
                    </Typography>
                  )}
                  {uploading && selectedFileAr instanceof File && uploadProgress > 0 && <ProgressOverlay progress={uploadProgress} />}
                  {typeAr === "video" || (previewAr.startsWith('blob:') && selectedFileAr?.type.startsWith('video/')) ? (
                    <Box
                      component="video"
                      src={previewAr}
                      autoPlay loop muted playsInline
                      sx={{ width: "200px", height: "120px", objectFit: "contain", bgcolor: "#000", borderRadius: 2, border: "1px solid #ddd" }}
                    />
                  ) : (
                    <Box
                      component="img"
                      src={previewAr}
                      sx={{ width: "200px", height: "120px", objectFit: "contain", bgcolor: "#eee", borderRadius: 2, border: "1px solid #ddd" }}
                    />
                  )}
                </Box>
              )}
            </Box>

            {/* Position X */}
            <Box>
              <Typography variant="body2">{t.positionX}: {formData.position.x}%</Typography>
              <Slider
                value={formData.position.x}
                onChange={(e, value) =>
                  setFormData({
                    ...formData,
                    position: { ...formData.position, x: value },
                  })
                }
                min={0}
                max={100}
                marks
              />
            </Box>

            {/* Position Y */}
            <Box>
              <Typography variant="body2">{t.positionY}: {formData.position.y}%</Typography>
              <Slider
                value={formData.position.y}
                onChange={(e, value) =>
                  setFormData({
                    ...formData,
                    position: { ...formData.position, y: value },
                  })
                }
                min={0}
                max={100}
                marks
              />
            </Box>

            {/* Size Width */}
            <Box>
              <Typography variant="body2">{t.width}: {formData.size.width}%</Typography>
              <Slider
                value={formData.size.width}
                onChange={(e, value) =>
                  setFormData({
                    ...formData,
                    size: { ...formData.size, width: value },
                  })
                }
                min={10}
                max={100}
                marks
              />
            </Box>

            {/* Size Height */}
            <Box>
              <Typography variant="body2">{t.height}: {formData.size.height}%</Typography>
              <Slider
                value={formData.size.height}
                onChange={(e, value) =>
                  setFormData({
                    ...formData,
                    size: { ...formData.size, height: value },
                  })
                }
                min={10}
                max={100}
                marks
              />
            </Box>

            {/* Opacity */}
            <Box>
              <Typography variant="body2">{t.opacity}: {(formData.opacity * 100).toFixed(0)}%</Typography>
              <Slider
                value={formData.opacity}
                onChange={(e, value) =>
                  setFormData({ ...formData, opacity: value })
                }
                min={0}
                max={1}
                step={0.1}
                marks
              />
            </Box>

            {/* Rotation */}
            <Box>
              <Typography variant="body2">{t.rotation}: {formData.rotation}°</Typography>
              <Slider
                value={formData.rotation}
                onChange={(e, value) =>
                  setFormData({ ...formData, rotation: value })
                }
                min={0}
                max={360}
                marks
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          {uploading && uploadProgress > 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1, ml: 2 }}>
              Uploading... {uploadProgress}%
            </Typography>
          )}
          {editingBg && (
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleDeleteClick(editingBg._id)}
              startIcon={<Delete />}
              disabled={uploading || deleting}
              sx={{ mr: "auto" }}
            >
              {deleting ? <CircularProgress size={20} /> : t.delete}
            </Button>
          )}
          <Button onClick={handleCloseDialog} disabled={uploading}>
            {t.cancel}
          </Button>
          <Button onClick={handleSaveBackground} variant="contained" disabled={uploading}>
            {uploading ? <CircularProgress size={24} /> : t.save}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        onConfirm={confirmRemoveImage}
        title={t.removeMedia || "Remove Media"}
        message={t.removeMediaConfirm || "Are you sure you want to remove this media?"}
        confirmButtonText={t.delete || "Delete"}
        cancelButtonText={t.cancel || "Cancel"}
      />

      <ConfirmationDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t.delete || "Delete"}
        message={t.deleteConfirm || "Are you sure you want to delete this background?"}
        confirmButtonText={deleting ? <CircularProgress size={20} color="inherit" /> : (t.delete || "Delete")}
        cancelButtonText={t.cancel || "Cancel"}
      />
    </Box>
  );
}
