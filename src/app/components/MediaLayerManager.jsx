"use client";

import { useEffect, useMemo, useState } from "react";
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
  Add,
  ExpandMore,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { Accordion, AccordionSummary, AccordionDetails } from "@mui/material";
import { useLanguage } from "@/app/context/LanguageContext";

const createLayerDraft = (layer = {}) => ({
  fileEn: layer.fileEn || null,
  fileAr: layer.fileAr || null,
  existingUrlEn: layer.fileEn?.url || layer.existingUrlEn || layer.existingUrl || "",
  existingUrlAr: layer.fileAr?.url || layer.existingUrlAr || "",
  previewEn: layer.fileEn?.url || layer.previewEn || layer.preview || layer.existingUrlEn || layer.existingUrl || "",
  previewAr: layer.fileAr?.url || layer.previewAr || layer.existingUrlAr || "",
  title: layer.title || "",
  description: layer.description || "",
  position: layer.position || { x: 0, y: 0 },
  size: layer.size || { width: 100, height: 100 },
  opacity: layer.opacity ?? 1,
  rotation: layer.rotation ?? 0,
  zIndex: layer.zIndex ?? 0,
  typeEn: layer.fileEn?.type || layer.typeEn || layer.type || "image",
  typeAr: layer.fileAr?.type || layer.typeAr || "image",
  isActive: layer.isActive !== undefined ? layer.isActive : true,
});

export default function MediaLayerManager({ layers = [], onChange }) {
  const { language } = useLanguage();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState("");
  const [draft, setDraft] = useState(createLayerDraft());

  const translations = {
    en: {
      backgroundManager: "Background Manager",
      addBackground: "Add Background",
      uploadImage: "Upload Image",
      currentImage: "Current Image",
      orUploadNew: "Or upload a new image to replace it",
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
      deleteConfirm: "Are you sure you want to delete this layer?",
      titleRequired: "Title is required",
      imageRequired: "Image is required for new layers",
      successDelete: "Layer deleted",
      successCreate: "Layer created",
      successUpdate: "Layer updated",
      successMoved: "Moved",
      forward: "forward",
      backward: "backward",
      failedDelete: "Failed to delete layer",
      failedMove: "Failed to move layer",
      errorSaving: "Error saving layer",
      layerManagerHint: "Add one or more positioned images for this media item.",
      addLayer: "Add Layer",
      removeLayer: "Remove Layer",
      uploadImage: "Upload English Image",
      uploadImageAr: "Upload Arabic Image",
      layerPreview: "English Preview",
      layerPreviewAr: "Arabic Preview",
      layerTitle: "Layer Title",
      layerDescription: "Layer Description",
    },
    ar: {
      backgroundManager: "مدير الخلفيات",
      addBackground: "إضافة خلفية",
      uploadImage: "تحميل الصورة",
      currentImage: "الصورة الحالية",
      orUploadNew: "أو حمّل صورة جديدة لاستبدالها",
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
      deleteConfirm: "هل أنت متأكد أنك تريد حذف هذه الطبقة؟",
      titleRequired: "العنوان مطلوب",
      imageRequired: "الصورة مطلوبة للطبقات الجديدة",
      successDelete: "تم حذف الطبقة",
      successCreate: "تم إنشاء الطبقة",
      successUpdate: "تم تحديث الطبقة",
      successMoved: "تم التحريك",
      forward: "للأمام",
      backward: "للخلف",
      failedDelete: "فشل حذف الطبقة",
      failedMove: "فشل تحريك الطبقة",
      errorSaving: "خطأ في حفظ الطبقة",
      layerManagerHint: "أضف صورة أو أكثر يمكن وضعها داخل هذا العنصر.",
      addLayer: "إضافة طبقة",
      removeLayer: "إزالة الطبقة",
      uploadImage: "تحميل الصورة الإنجليزية",
      uploadImageAr: "تحميل الصورة العربية",
      layerPreview: "معاينة إنجليزية",
      layerPreviewAr: "معاينة عربية",
      layerTitle: "عنوان الطبقة",
      layerDescription: "وصف الطبقة",
    },
  };

  const t = translations[language];

  const orderedLayers = useMemo(
    () => [...layers].sort((first, second) => (first.zIndex || 0) - (second.zIndex || 0)),
    [layers]
  );

  const currentPreview = selectedPreview || draft.existingUrl || "";

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 2500);
  };

  const clearDialog = () => {
    setOpenDialog(false);
    setEditingIndex(null);
    setSelectedFile(null);
    setSelectedPreview("");
    setDraft(createLayerDraft());
  };

  // We rely on the parent (CMSPage) or the browser to eventually cleanup blob URLs
  // to avoid breaking the preview in the list.

  const handleOpenDialog = (layer = null, index = null) => {
    setEditingIndex(index);
    setDraft(createLayerDraft(layer || {}));
    setSelectedFile(null);
    setSelectedPreview(layer?.preview || layer?.existingUrl || "");
    setOpenDialog(true);
  };

  const handleFileChange = (event, lang) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;

    const isVideo = file.type.startsWith("video");
    const nextType = isVideo ? "video" : "image";
    const nextPreview = URL.createObjectURL(file);

    if (lang === "en") {
      if (draft.previewEn?.startsWith("blob:")) URL.revokeObjectURL(draft.previewEn);
      setDraft((current) => ({
        ...current,
        fileEn: file,
        existingUrlEn: "",
        previewEn: nextPreview,
        typeEn: nextType,
      }));
    } else {
      if (draft.previewAr?.startsWith("blob:")) URL.revokeObjectURL(draft.previewAr);
      setDraft((current) => ({
        ...current,
        fileAr: file,
        existingUrlAr: "",
        previewAr: nextPreview,
        typeAr: nextType,
      }));
    }
  };

  const handleSaveLayer = () => {
    if (!draft.previewEn && !draft.previewAr && !draft.existingUrlEn && !draft.existingUrlAr) {
      showMessage("error", t.imageRequired);
      return;
    }

    const nextLayer = {
      ...draft,
      zIndex: editingIndex === null ? orderedLayers.length : draft.zIndex ?? orderedLayers.length,
    };

    const nextLayers = [...layers];
    if (editingIndex === null) {
      nextLayers.push(nextLayer);
    } else {
      nextLayers[editingIndex] = nextLayer;
    }

    onChange(nextLayers);
    clearDialog();
    showMessage("success", editingIndex === null ? t.successCreate : t.successUpdate);
  };

  const handleRemoveLayer = (index) => {
    if (!confirm(t.deleteConfirm)) return;
    const nextLayers = layers.filter((_, layerIndex) => layerIndex !== index);
    onChange(nextLayers);
    showMessage("success", t.successDelete);
  };

  const swapLayer = (sourceIndex, targetIndex) => {
    if (targetIndex < 0 || targetIndex >= orderedLayers.length) return;

    const source = orderedLayers[sourceIndex];
    const target = orderedLayers[targetIndex];
    const sourceZIndex = source.zIndex ?? sourceIndex;
    const targetZIndex = target.zIndex ?? targetIndex;

    const nextLayers = layers.map((layer) => {
      if (layer === source) {
        return { ...layer, zIndex: targetZIndex };
      }

      if (layer === target) {
        return { ...layer, zIndex: sourceZIndex };
      }

      return layer;
    });

    onChange(nextLayers);
  };

  const handleToggleActive = (index) => {
    const nextLayers = layers.map((l, i) => (i === index ? { ...l, isActive: !l.isActive } : l));
    onChange(nextLayers);
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", mb: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          {t.backgroundManager}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t.layerManagerHint}
        </Typography>
        <Button variant="outlined" size="small" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ mt: 1 }}>
          {t.addLayer}
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      {orderedLayers.length === 0 ? (
        <Typography color="text.secondary" sx={{ textAlign: "center", py: 3 }}>
          {t.noBackgrounds}
        </Typography>
      ) : (
        orderedLayers.map((layer) => {
          const originalIndex = layers.findIndex((l) => l === layer);
          const isAtTop = originalIndex === 0;
          const isAtBottom = originalIndex === layers.length - 1;

          return (
            <Box
              key={`${layer.preview || layer.existingUrl || originalIndex}-${originalIndex}`}
              sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                border: "1px solid #ddd",
                backgroundColor: layer.isActive !== false ? "#fafafa" : "#f5f5f5",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                opacity: layer.isActive !== false ? 1 : 0.6,
              }}
            >
              <Box sx={{ flex: "0 0 320px" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  {t.preview} (En / Ar)
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}>
                  {/* English Preview */}
                  <Box sx={{ flex: 1 }}>
                    {(() => {
                      const srcEn = layer.fileEn?.url || layer.previewEn || layer.existingUrlEn || null;
                      if (!srcEn) {
                        return (
                          <Box sx={{ width: "150px", height: "100px", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }} />
                        );
                      }

                      return layer.typeEn === "video" ? (
                        <Box
                          component="video"
                          src={srcEn}
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
                        <Box
                          component="img"
                          src={srcEn}
                          alt={`${layer.title} EN`}
                          sx={{
                            width: "150px",
                            height: "100px",
                            objectFit: "contain",
                            backgroundColor: "#eee",
                            borderRadius: 2,
                            border: "1px solid #ddd",
                          }}
                        />
                      );
                    })()}
                  </Box>

                  {/* Arabic Preview */}
                  <Box sx={{ flex: 1 }}>
                    {(() => {
                      const srcAr = layer.fileAr?.url || layer.previewAr || layer.existingUrlAr || null;
                      if (!srcAr) {
                        return (
                          <Box sx={{ width: "150px", height: "100px", backgroundColor: "#eee", borderRadius: 2, border: "1px solid #ddd" }} />
                        );
                      }

                      return layer.typeAr === "video" ? (
                        <Box
                          component="video"
                          src={srcAr}
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
                        <Box
                          component="img"
                          src={srcAr}
                          alt={`${layer.title} AR`}
                          sx={{
                            width: "150px",
                            height: "100px",
                            objectFit: "contain",
                            backgroundColor: "#eee",
                            borderRadius: 2,
                            border: "1px solid #ddd",
                          }}
                        />
                      );
                    })()}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {layer.title || `${t.layer} #${originalIndex + 1}`}
                  {layer.isActive === false && (
                    <Typography component="span" variant="caption" color="error" sx={{ ml: 1, fontWeight: "normal" }}>
                      (Disabled)
                    </Typography>
                  )}
                </Typography>
                {layer.description && (
                  <Typography variant="body2" color="text.secondary">
                    {layer.description}
                  </Typography>
                )}

                <Box sx={{ mt: 2, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.layer}: {(layer.zIndex ?? originalIndex) + 1}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.opacity}: {((layer.opacity ?? 1) * 100).toFixed(0)}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.positionX}: {layer.position?.x}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.positionY}: {layer.position?.y}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.width}: {layer.size?.width}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t.height}: {layer.size?.height}%
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
                  <IconButton
                    size="small"
                    variant="outlined"
                    onClick={() => swapLayer(originalIndex, originalIndex - 1)}
                    title={t.moveBackward}
                    disabled={originalIndex === 0}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    <ArrowUpward fontSize="small" />
                  </IconButton>

                  <IconButton
                    size="small"
                    variant="outlined"
                    onClick={() => swapLayer(originalIndex, originalIndex + 1)}
                    title={t.moveForward}
                    disabled={originalIndex === layers.length - 1}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    <ArrowDownward fontSize="small" />
                  </IconButton>

                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => handleOpenDialog(layer, originalIndex)}
                  >
                    {t.edit}
                  </Button>

                  <IconButton
                    size="small"
                    onClick={() => handleToggleActive(originalIndex)}
                    title={layer.isActive ? t.deactivate : t.activate}
                    sx={{ border: "1px solid #ddd" }}
                  >
                    {layer.isActive ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                  </IconButton>

                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleRemoveLayer(originalIndex)}
                  >
                    {t.delete}
                  </Button>
                </Box>
              </Box>
            </Box>
          );
        })
      )}

      <Dialog open={openDialog} onClose={clearDialog} fullWidth>
        <DialogTitle>
          {editingIndex === null ? t.addLayer : `${t.edit} ${t.layer}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {/* English Image */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t.uploadImage}
              </Typography>
              <Input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(e, "en")} fullWidth />
              {(() => {
                const draftSrcEn = draft.previewEn || draft.existingUrlEn || null;
                if (!draftSrcEn) return null;
                return (
                  <Box sx={{ mt: 2 }}>
                    {draft.typeEn === "video" ? (
                      <Box
                        component="video"
                        src={draftSrcEn}
                        controls
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
                      <Box
                        component="img"
                        src={draftSrcEn}
                        alt={t.layerPreview}
                        sx={{
                          width: "150px",
                          height: "100px",
                          objectFit: "contain",
                          backgroundColor: "#eee",
                          borderRadius: 2,
                          border: "1px solid #ddd",
                        }}
                      />
                    )}
                  </Box>
                );
              })()}
            </Box>

            {/* Arabic Image */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                {t.uploadImageAr}
              </Typography>
              <Input type="file" accept="image/*,video/*" onChange={(e) => handleFileChange(e, "ar")} fullWidth />
              {(() => {
                const draftSrcAr = draft.previewAr || draft.existingUrlAr || null;
                if (!draftSrcAr) return null;
                return (
                  <Box sx={{ mt: 2 }}>
                    {draft.typeAr === "video" ? (
                      <Box
                        component="video"
                        src={draftSrcAr}
                        controls
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
                      <Box
                        component="img"
                        src={draftSrcAr}
                        alt={t.layerPreviewAr}
                        sx={{
                          width: "150px",
                          height: "100px",
                          objectFit: "contain",
                          backgroundColor: "#eee",
                          borderRadius: 2,
                          border: "1px solid #ddd",
                        }}
                      />
                    )}
                  </Box>
                );
              })()}
            </Box>

            <TextField
              label={t.layerTitle}
              fullWidth
              value={draft.title}
              onChange={(e) =>
                setDraft((current) => ({ ...current, title: e.target.value }))
              }
            />

            <TextField
              label={t.layerDescription}
              fullWidth
              multiline
              rows={2}
              value={draft.description}
              onChange={(e) =>
                setDraft((current) => ({ ...current, description: e.target.value }))
              }
            />

            <Box>
              <Typography variant="body2">
                {t.positionX}: {draft.position.x}%
              </Typography>
              <Slider
                value={draft.position.x}
                onChange={(e, value) =>
                  setDraft((current) => ({
                    ...current,
                    position: { ...current.position, x: value },
                  }))
                }
                min={0}
                max={100}
                marks
              />
            </Box>

            <Box>
              <Typography variant="body2">
                {t.positionY}: {draft.position.y}%
              </Typography>
              <Slider
                value={draft.position.y}
                onChange={(e, value) =>
                  setDraft((current) => ({
                    ...current,
                    position: { ...current.position, y: value },
                  }))
                }
                min={0}
                max={100}
                marks
              />
            </Box>

            <Box>
              <Typography variant="body2">
                {t.width}: {draft.size.width}%
              </Typography>
              <Slider
                value={draft.size.width}
                onChange={(e, value) =>
                  setDraft((current) => ({
                    ...current,
                    size: { ...current.size, width: value },
                  }))
                }
                min={10}
                max={200}
                marks
              />
            </Box>

            <Box>
              <Typography variant="body2">
                {t.height}: {draft.size.height}%
              </Typography>
              <Slider
                value={draft.size.height}
                onChange={(e, value) =>
                  setDraft((current) => ({
                    ...current,
                    size: { ...current.size, height: value },
                  }))
                }
                min={10}
                max={200}
                marks
              />
            </Box>

            <Box>
              <Typography variant="body2">
                {t.opacity}: {(draft.opacity * 100).toFixed(0)}%
              </Typography>
              <Slider
                value={draft.opacity}
                onChange={(e, value) =>
                  setDraft((current) => ({
                    ...current,
                    opacity: value,
                  }))
                }
                min={0}
                max={1}
                step={0.1}
                marks
              />
            </Box>

            <Box>
              <Typography variant="body2">
                {t.rotation}: {draft.rotation}°
              </Typography>
              <Slider
                value={draft.rotation}
                onChange={(e, value) =>
                  setDraft((current) => ({
                    ...current,
                    rotation: value,
                  }))
                }
                min={0}
                max={360}
                marks
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={clearDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={handleSaveLayer}>
            {t.save}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}