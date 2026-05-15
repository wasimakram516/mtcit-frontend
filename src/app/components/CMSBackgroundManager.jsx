"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Typography, Alert, CircularProgress, Button } from "@mui/material";
import { Add } from "@mui/icons-material";
import {
  createBackground,
  deleteBackground,
  getBackgrounds,
  updateBackground,
  updateLayerOrder,
} from "@/services/BackgroundService";
import { useLanguage } from "@/app/context/LanguageContext";
import BackgroundSlideManager from "./BackgroundSlideManager";
import { createEmptyBackgroundSlide } from "@/utils/backgroundSlides";

function draftToFormData(draft) {
  const fd = new FormData();
  fd.append("displayTitle", draft.displayTitle || "");
  fd.append("titlePosition", JSON.stringify(draft.titlePosition || { x: 50, y: 50 }));
  fd.append("titleFontSize", String(draft.titleFontSize ?? 100));
  fd.append("opacity", String(draft.opacity ?? 1));
  fd.append("darkOverlay", String(draft.darkOverlay ?? 0));
  fd.append("lightOverlay", String(draft.lightOverlay ?? 0));
  fd.append("isActive", draft.isActive !== false ? "true" : "false");
  if (draft.fileEn instanceof File) fd.append("imageEn", draft.fileEn);
  if (draft.fileAr instanceof File) fd.append("imageAr", draft.fileAr);
  if (draft.removeEn) fd.append("removeImageEn", "true");
  if (draft.removeAr) fd.append("removeImageAr", "true");
  if (draft.typeEn) fd.append("typeEn", draft.typeEn);
  if (draft.typeAr) fd.append("typeAr", draft.typeAr);
  return fd;
}

export default function CMSBackgroundManager() {
  const { language } = useLanguage();
  const slideManagerRef = useRef(null);
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

  const t =
    language === "ar"
      ? {
          title: "مدير الخلفيات",
          add: "إضافة خلفية",
          loadError: "تعذر تحميل الخلفيات",
          saved: "تم الحفظ",
          deleted: "تم الحذف",
          reorderError: "تعذر إعادة الترتيب",
          deleteError: "تعذر الحذف",
        }
      : {
          title: "Background Manager",
          add: "Add background",
          loadError: "Failed to load backgrounds",
          saved: "Saved",
          deleted: "Deleted",
          reorderError: "Failed to reorder",
          deleteError: "Failed to delete",
        };

  const load = useCallback(async () => {
    try {
      const rows = await getBackgrounds();
      const sorted = [...rows].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
      setSlides(
        sorted.map((row) =>
          createEmptyBackgroundSlide({
            ...row,
            _id: row._id,
          })
        )
      );
    } catch (err) {
      setMessage({ type: "error", text: err?.message || t.loadError });
    } finally {
      setLoading(false);
    }
  }, [t.loadError]);

  useEffect(() => {
    load();
  }, [load]);

  const onPersistSlide = async (draft, editingIndex) => {
    setUploading(true);
    const config = {
      onUploadProgress: (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      },
    };
    try {
      const fd = draftToFormData(draft);
      const existingId = draft._id || slides[editingIndex]?._id;
      if (editingIndex !== null && existingId) {
        await updateBackground(existingId, fd, config);
      } else {
        await createBackground(fd, config);
      }
      await load();
      setMessage({ type: "success", text: t.saved });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || t.loadError });
      throw err;
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const onDeleteSlide = async (index) => {
    const id = slides[index]?._id;
    if (!id) {
      setMessage({ type: "error", text: t.deleteError });
      return;
    }
    try {
      await deleteBackground(id);
      await load();
      setMessage({ type: "success", text: t.deleted });
    } catch (err) {
      setMessage({ type: "error", text: err?.message || t.deleteError });
      throw err;
    }
  };

  const onReorderSlides = async (ordered) => {
    const layerUpdates = ordered
      .filter((s) => s._id)
      .map((s, idx) => ({ id: String(s._id), layer: idx }));
    if (!layerUpdates.length) {
      setMessage({ type: "error", text: t.reorderError });
      return;
    }
    try {
      setSlides(ordered);
      await updateLayerOrder(layerUpdates);
      await load();
    } catch (err) {
      await load();
      setMessage({ type: "error", text: err?.message || t.reorderError });
      throw err;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {t.title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => slideManagerRef.current?.openAdd()}
        >
          {t.add}
        </Button>
      </Box>
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}
      <BackgroundSlideManager
        ref={slideManagerRef}
        slides={slides}
        onChange={setSlides}
        onPersistSlide={onPersistSlide}
        onDeleteSlide={onDeleteSlide}
        onReorderSlides={onReorderSlides}
        uploadProgress={uploadProgress}
        isUploading={uploading}
        showInlineAddButton={false}
      />
    </Box>
  );
}
