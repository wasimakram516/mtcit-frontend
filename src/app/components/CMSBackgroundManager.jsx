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
import api from "@/services/api";
import { useLanguage } from "@/app/context/LanguageContext";

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

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    opacity: 1,
    rotation: 0,
  });

  // Fetch backgrounds
  const fetchBackgrounds = async () => {
    try {
      const { data } = await api.get("/backgrounds");
      setBackgrounds(data.data || []);
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
      setPreviewEn(bg.imageUrlEn || bg.imageUrl); // Fallback to old imageUrl as English
      setPreviewAr(bg.imageUrlAr || null);
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
  };

  const handleFileChange = (e, lang) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (lang === "en") {
      if (previewEn?.startsWith("blob:")) URL.revokeObjectURL(previewEn);
      const nextPreview = URL.createObjectURL(file);
      setSelectedFileEn(file);
      setPreviewEn(nextPreview);
    } else {
      if (previewAr?.startsWith("blob:")) URL.revokeObjectURL(previewAr);
      const nextPreview = URL.createObjectURL(file);
      setSelectedFileAr(file);
      setPreviewAr(nextPreview);
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

      const response = editingBg
        ? await api.put(`/backgrounds/${editingBg._id}`, formDataToSend)
        : await api.post("/backgrounds", formDataToSend);

      if (response.status >= 200 && response.status < 300) {
        const responseMessage =
          response.data?.message ||
          (editingBg ? t.successUpdate : t.successCreate);
        showMessage("success", responseMessage);
        handleCloseDialog();
        fetchBackgrounds();
      } else {
        showMessage("error", response.data?.message || t.errorSaving);
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", error?.response?.data?.message || t.errorSaving);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t.deleteConfirm)) return;

    try {
      const response = await api.delete(`/backgrounds/${id}`);

      if (response.status >= 200 && response.status < 300) {
        showMessage("success", t.successDelete);
        fetchBackgrounds();
      } else {
        showMessage("error", t.failedDelete);
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", t.errorSaving);
    }
  };

  const handleMoveLayer = async (id, direction) => {
    try {
      const response = await api.put(
        direction === "up"
          ? `/backgrounds/${id}/forward`
          : `/backgrounds/${id}/backward`
      );

      if (response.status >= 200 && response.status < 300) {
        showMessage(
          "success",
          `${t.successMoved} ${direction === "up" ? t.forward : t.backward}`
        );
        fetchBackgrounds();
      } else {
        showMessage("error", response.data?.message || t.failedMove);
      }
    } catch (error) {
      console.error("Error:", error);
      showMessage("error", error?.response?.data?.message || t.failedMove);
    }
  };

  const handleToggleActive = async (bg) => {
    try {
      const response = await api.put(`/backgrounds/${bg._id}`, {
        isActive: !bg.isActive,
      });

      if (response.status >= 200 && response.status < 300) {
        fetchBackgrounds();
      }
    } catch (error) {
      console.error("Error:", error);
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
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                opacity: bg.isActive ? 1 : 0.6,
              }}
            >
              {/* Preview Section */}
              <Box sx={{ flex: "0 0 320px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {t.preview} (En / Ar)
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                  {(() => {
                    const srcEn = bg.imageUrlEn || bg.imageUrl || null;
                    const srcAr = bg.imageUrlAr || null;

                    return (
                      <>
                        {srcEn ? (
                          <Box
                            component="img"
                            src={srcEn}
                            alt={`${bg.title} EN`}
                            sx={{
                              width: "150px",
                              height: "100px",
                              objectFit: "contain",
                              backgroundColor: "#eee",
                              borderRadius: 2,
                              border: "1px solid #ddd",
                            }}
                          />
                        ) : (
                          <Box sx={{ width: "150px", height: "100px", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }} />
                        )}

                        {srcAr ? (
                          <Box
                            component="img"
                            src={srcAr}
                            alt={`${bg.title} AR`}
                            sx={{
                              width: "150px",
                              height: "100px",
                              objectFit: "contain",
                              backgroundColor: "#eee",
                              borderRadius: 2,
                              border: "1px solid #ddd",
                            }}
                          />
                        ) : (
                          <Box sx={{ width: "150px", height: "100px", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }} />
                        )}
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
                    onClick={() => handleDelete(bg._id)}
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

      {/* Edit/Create Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth>
        <DialogTitle>
          {editingBg ? `${t.edit} ${t.backgroundManager}` : `${t.addBackground} ${t.backgroundManager}`}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* English File Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {editingBg ? t.currentImage : t.uploadImage}
              </Typography>
               {previewEn && (
                 <Box
                   component="img"
                   src={previewEn}
                   alt="English Preview"
                   sx={{
                     width: "150px",
                     height: "100px",
                     objectFit: "contain",
                     backgroundColor: "#eee",
                     borderRadius: 2,
                     border: "1px solid #ddd",
                     mb: 2,
                   }}
                 />
               )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "en")}
                fullWidth
              />
            </Box>

            {/* Arabic File Upload */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {editingBg ? t.currentImageAr : t.uploadImageAr}
              </Typography>
               {previewAr && (
                 <Box
                   component="img"
                   src={previewAr}
                   alt="Arabic Preview"
                   sx={{
                     width: "150px",
                     height: "100px",
                     objectFit: "contain",
                     backgroundColor: "#eee",
                     borderRadius: 2,
                     border: "1px solid #ddd",
                     mb: 2,
                   }}
                 />
               )}
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "ar")}
                fullWidth
              />
            </Box>

            {/* Title */}
            <TextField
              label={t.title}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />

            {/* Description */}
            <TextField
              label={t.description}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              multiline
              rows={2}
            />

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
                max={200}
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
                max={200}
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
          <Button onClick={handleCloseDialog}>{t.cancel}</Button>
          <Button
            onClick={handleSaveBackground}
            variant="contained"
            disabled={uploading || (!editingBg && !selectedFileEn && !selectedFileAr) || !formData.title}
          >
            {uploading ? <CircularProgress size={20} /> : t.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
