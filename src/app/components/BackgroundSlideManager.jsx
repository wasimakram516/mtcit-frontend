"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
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
  Input,
  Switch,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import {
  ArrowUpward,
  ArrowDownward,
  Edit,
  Delete,
  Add,
  ImageNotSupportedOutlined,
} from "@mui/icons-material";
import { useLanguage } from "@/app/context/LanguageContext";
import ConfirmationDialog from "./ConfirmationDialog";
import {
  createEmptyBackgroundSlide,
  resolveSlideExistingUrls,
} from "@/utils/backgroundSlides";

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

const BackgroundSlideManager = forwardRef(function BackgroundSlideManager(
  {
    slides = [],
    onChange,
    uploadProgress = 0,
    isUploading = false,
    showInlineAddButton = true,
    /** When set (global Background API), each save/delete/reorder calls these instead of only onChange */
    onPersistSlide,
    onDeleteSlide,
    onReorderSlides,
  },
  ref
) {
  const { language } = useLanguage();
  const [message, setMessage] = useState({ type: "", text: "" });
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [draft, setDraft] = useState(createEmptyBackgroundSlide());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIndex, setConfirmIndex] = useState(null);

  const t =
    language === "ar"
      ? {
          add: "إضافة خلفية",
          edit: "تعديل",
          delete: "حذف",
          save: "حفظ",
          cancel: "إلغاء",
          sequence: "الترتيب",
          noSlides: "لم تُضف خلفيات بعد.",
          uploadEn: "تحميل إنجليزي",
          uploadAr: "تحميل عربي",
          title: "العنوان",
          titleX: "موضع العنوان X (%)",
          titleY: "موضع العنوان Y (%)",
          opacity: "شفافية الوسيط",
          darkOverlay: "تراكب داكن",
          lightOverlay: "تراكب فاتح",
          active: "نشط",
          moveUp: "أعلى في التسلسل",
          moveDown: "أسفل في التسلسل",
          imageRequired: "مطلوب ملف إنجليزي أو عربي واحد على الأقل",
          deleteConfirm: "حذف هذه الخلفية؟",
          hint: "الخلفيات تتناوب على الشاشة الكبيرة (فيديو كامل، صورة ~30 ثانية).",
        }
      : {
          add: "Add background",
          edit: "Edit",
          delete: "Delete",
          save: "Save",
          cancel: "Cancel",
          sequence: "Sequence",
          noSlides: "No backgrounds added yet.",
          uploadEn: "Upload English",
          uploadAr: "Upload Arabic",
          title: "Title",
          titleX: "Title position X (%)",
          titleY: "Title position Y (%)",
          titleSize: "Title size (px)",
          opacity: "Asset opacity",
          darkOverlay: "Dark overlay",
          lightOverlay: "Light overlay",
          active: "Active",
          moveUp: "Earlier in sequence",
          moveDown: "Later in sequence",
          imageRequired: "At least one English or Arabic file is required",
          deleteConfirm: "Delete this background slide?",
          hint: "Slides rotate on the big screen (full video, images ~30 seconds each).",
        };

  const ordered = useMemo(() => [...slides], [slides]);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 2500);
  };

  const clearDialog = () => {
    setOpenDialog(false);
    setEditingIndex(null);
    setDraft(createEmptyBackgroundSlide());
    setMessage({ type: "", text: "" });
  };

  const openEditor = (slide = null, index = null) => {
    setEditingIndex(index);
    const base = createEmptyBackgroundSlide(slide || {});
    if (index !== null && slides[index]?._id) {
      base._id = slides[index]._id;
    }
    setDraft(base);
    setOpenDialog(true);
  };

  useImperativeHandle(ref, () => ({
    openAdd: () => openEditor(),
  }));

  const handleFile = (e, lang) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const type = file.type.startsWith("video/") ? "video" : "image";
    const preview = URL.createObjectURL(file);
    if (lang === "en") {
      setDraft((d) => ({
        ...d,
        fileEn: file,
        previewEn: preview,
        existingUrlEn: "",
        typeEn: type,
        removeEn: false,
      }));
    } else {
      setDraft((d) => ({
        ...d,
        fileAr: file,
        previewAr: preview,
        existingUrlAr: "",
        typeAr: type,
        removeAr: false,
      }));
    }
  };

  const normalizeDraft = (raw) => {
    const urls = resolveSlideExistingUrls(raw);
    const normalized = {
      ...raw,
      ...urls,
      displayTitle: String(raw.displayTitle ?? "").trim(),
      titlePosition: {
        x: Number(raw.titlePosition?.x ?? 50),
        y: Number(raw.titlePosition?.y ?? 50),
      },
    };
    if (editingIndex !== null && slides[editingIndex]?._id) {
      normalized._id = slides[editingIndex]._id;
    }
    return normalized;
  };

  const saveDraft = async () => {
    const normalized = normalizeDraft(draft);
    const hasMedia =
      normalized.fileEn instanceof File ||
      normalized.fileAr instanceof File ||
      normalized.existingUrlEn ||
      normalized.existingUrlAr;
    if (!hasMedia) {
      showMessage("error", t.imageRequired);
      return;
    }
    try {
      if (onPersistSlide) {
        await onPersistSlide(normalized, editingIndex);
      } else {
        const next = [...slides];
        if (editingIndex === null) next.push(normalized);
        else next[editingIndex] = normalized;
        onChange(next);
      }
      clearDialog();
    } catch (err) {
      showMessage("error", err?.message || "Failed to save");
    }
  };

  const moveSlide = async (fromIndex, direction) => {
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= ordered.length) return;
    const next = [...ordered];
    const [item] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, item);
    try {
      if (onReorderSlides) {
        await onReorderSlides(next);
      } else {
        onChange(next);
      }
    } catch (err) {
      showMessage("error", err?.message || "Failed to reorder");
    }
  };

  const confirmDelete = async () => {
    if (confirmIndex === null) return;
    try {
      if (onDeleteSlide) {
        await onDeleteSlide(confirmIndex);
      } else {
        onChange(ordered.filter((_, i) => i !== confirmIndex));
      }
      setConfirmOpen(false);
      setConfirmIndex(null);
    } catch (err) {
      showMessage("error", err?.message || "Failed to delete");
    }
  };

  const pct = (v) => Math.round((v ?? 0) * 100);

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t.hint}
      </Typography>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      {showInlineAddButton && (
        <Button variant="contained" startIcon={<Add />} onClick={() => openEditor()} sx={{ mb: 2 }}>
          {t.add}
        </Button>
      )}

      {ordered.length === 0 ? (
        <Typography color="text.secondary">{t.noSlides}</Typography>
      ) : (
        ordered.map((slide, index) => {
          const thumb = slide.previewEn || slide.previewAr || slide.existingUrlEn || slide.existingUrlAr;
          const isVideo =
            (slide.typeEn === "video" && slide.previewEn) || (slide.typeAr === "video" && slide.previewAr);
          return (
            <Box
              key={slide._id || `slide-${index}-${thumb || "empty"}`}
              sx={{
                mb: 2,
                p: 2,
                border: "1px solid #ddd",
                borderRadius: 2,
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                opacity: slide.isActive === false ? 0.55 : 1,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  width: 80,
                  height: 56,
                  bgcolor: "#eee",
                  borderRadius: 1,
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {thumb ? (
                  isVideo ? (
                    <Box component="video" src={thumb} muted sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Box component="img" src={thumb} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                    <ImageNotSupportedOutlined color="disabled" />
                  </Box>
                )}
                {isUploading &&
                  uploadProgress > 0 &&
                  (slide.fileEn instanceof File || slide.fileAr instanceof File) && (
                    <ProgressOverlay progress={uploadProgress} />
                  )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" color="text.secondary">
                  {t.sequence} {index + 1}
                </Typography>
                <Typography fontWeight="bold" noWrap>
                  {slide.displayTitle || "—"}
                </Typography>
                <Typography variant="caption" display="block">
                  {t.opacity}: {pct(slide.opacity)}% · {t.darkOverlay}: {pct(slide.darkOverlay)}% · {t.lightOverlay}:{" "}
                  {pct(slide.lightOverlay)}%
                </Typography>
              </Box>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
                <IconButton size="small" disabled={index === 0} onClick={() => moveSlide(index, "up")} title={t.moveUp}>
                  <ArrowUpward fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={index === ordered.length - 1}
                  onClick={() => moveSlide(index, "down")}
                  title={t.moveDown}
                >
                  <ArrowDownward fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => openEditor(slide, index)} title={t.edit}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setConfirmIndex(index);
                    setConfirmOpen(true);
                  }}
                  title={t.delete}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          );
        })
      )}

      <Dialog open={openDialog} onClose={clearDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingIndex === null ? t.add : t.edit}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label={t.title}
            value={draft.displayTitle}
            onChange={(e) => setDraft((d) => ({ ...d, displayTitle: e.target.value }))}
            margin="normal"
            sx={{ mt: 1 }}
          />

          <Typography variant="body2" sx={{ mt: 1 }}>
            {t.titleX}: {draft.titlePosition?.x ?? 50}%
          </Typography>
          <Slider
            value={draft.titlePosition?.x ?? 50}
            min={0}
            max={100}
            onChange={(_, v) =>
              setDraft((d) => ({ ...d, titlePosition: { ...d.titlePosition, x: v } }))
            }
          />
          <Typography variant="body2">
            {t.titleY}: {draft.titlePosition?.y ?? 50}%
          </Typography>
          <Slider
            value={draft.titlePosition?.y ?? 50}
            min={0}
            max={100}
            onChange={(_, v) =>
              setDraft((d) => ({ ...d, titlePosition: { ...d.titlePosition, y: v } }))
            }
          />

          <Typography variant="body2">
            {(t.titleSize || "Title size (px)")}: {Math.round(draft.titleFontSize ?? 56)}px
          </Typography>
          <Slider
            value={draft.titleFontSize ?? 56}
            min={24}
            max={120}
            step={2}
            onChange={(_, v) =>
              setDraft((d) => ({ ...d, titleFontSize: Array.isArray(v) ? v[0] : v }))
            }
          />

          <Typography variant="subtitle2" sx={{ mt: 3 }}>
            {t.uploadEn}
          </Typography>
          <Input type="file" fullWidth accept="image/*,video/*" onChange={(e) => handleFile(e, "en")} />
          {draft.previewEn && (
            <Box sx={{ mt: 1, position: "relative", width: "fit-content", borderRadius: 1, overflow: "hidden" }}>
              {draft.typeEn === "video" ? (
                <Box component="video" src={draft.previewEn} muted sx={{ maxWidth: 200, maxHeight: 120 }} />
              ) : (
                <Box component="img" src={draft.previewEn} sx={{ maxWidth: 200, maxHeight: 120, objectFit: "contain" }} />
              )}
              {isUploading && draft.fileEn instanceof File && uploadProgress > 0 && (
                <ProgressOverlay progress={uploadProgress} />
              )}
            </Box>
          )}

          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            {t.uploadAr}
          </Typography>
          <Input type="file" fullWidth accept="image/*,video/*" onChange={(e) => handleFile(e, "ar")} />
          {draft.previewAr && (
            <Box sx={{ mt: 1, position: "relative", width: "fit-content", borderRadius: 1, overflow: "hidden" }}>
              {draft.typeAr === "video" ? (
                <Box component="video" src={draft.previewAr} muted sx={{ maxWidth: 200, maxHeight: 120 }} />
              ) : (
                <Box component="img" src={draft.previewAr} sx={{ maxWidth: 200, maxHeight: 120, objectFit: "contain" }} />
              )}
              {isUploading && draft.fileAr instanceof File && uploadProgress > 0 && (
                <ProgressOverlay progress={uploadProgress} />
              )}
            </Box>
          )}

          <Typography variant="body2" sx={{ mt: 2 }}>
            {t.opacity}: {pct(draft.opacity)}%
          </Typography>
          <Slider
            value={draft.opacity ?? 1}
            min={0}
            max={1}
            step={0.05}
            onChange={(_, v) => setDraft((d) => ({ ...d, opacity: v }))}
          />

          <Typography variant="body2">{t.darkOverlay}: {pct(draft.darkOverlay)}%</Typography>
          <Slider
            value={draft.darkOverlay ?? 0}
            min={0}
            max={1}
            step={0.05}
            onChange={(_, v) => setDraft((d) => ({ ...d, darkOverlay: v }))}
          />

          <Typography variant="body2">{t.lightOverlay}: {pct(draft.lightOverlay)}%</Typography>
          <Slider
            value={draft.lightOverlay ?? 0}
            min={0}
            max={1}
            step={0.05}
            onChange={(_, v) => setDraft((d) => ({ ...d, lightOverlay: v }))}
          />

          <FormControlLabel
            control={
              <Switch
                checked={draft.isActive !== false}
                onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
              />
            }
            label={t.active}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={clearDialog}>{t.cancel}</Button>
          <Button variant="contained" onClick={saveDraft} disabled={isUploading}>
            {t.save}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title={t.delete}
        message={t.deleteConfirm}
        confirmButtonText={t.delete}
        cancelButtonText={t.cancel}
      />
    </Box>
  );
});

export default BackgroundSlideManager;
