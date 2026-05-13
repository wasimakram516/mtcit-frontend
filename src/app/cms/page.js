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
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
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
import { useLanguage } from "../context/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

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
    fileEn: null,
    fileAr: null,
    pinpointFile: null,
    pinpointX: "",
    pinpointY: "",
    previewEn: null,
    previewAr: null,
    pinpointPreview: null,
  });
  const [errors, setErrors] = useState({});
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState({});

  const translations = {
    en: {
      mediaManager: "Media Manager (CMS)",
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
      pinpointUpload: "Pinpoint Icon Upload (Optional)",
      pinpointUploadHelper:
        "Upload an image that will act as a pinpoint marker on your roadmap (optional).",
      pinpointPosition: "Pinpoint Position (Optional)",
      pinpointPositionHelper:
        "Set the X and Y position of the pinpoint marker as a percentage (0–100%).",
      pinpointX: "Pinpoint X Position (%)",
      pinpointY: "Pinpoint Y Position (%)",
    },
    ar: {
      mediaManager: "مدير الوسائط (CMS)",
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
      pinpointUpload: "تحميل رمز العلامة (اختياري)",
      pinpointUploadHelper:
        "قم بتحميل صورة تعمل كرمز علامة على الخريطة (اختياري).",
      pinpointPosition: "موقع العلامة (اختياري)",
      pinpointPositionHelper: "عيّن موضع العلامة بالنسبة المئوية (0-100٪).",
      pinpointX: "موضع X للعلامة (%)",
      pinpointY: "موضع Y للعلامة (%)",
    },
  };

  const t = translations[language];

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

  useEffect(() => {
    fetchMedia();
  }, []);

  const logout = () => {
    router.push("/"); // Add your logout logic here
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.category) newErrors.category = "Category is required.";

    if (!editingItem && !formData.fileEn) {
      newErrors.fileEn = "Please upload the English media file.";
    }
    if (!editingItem && !formData.fileAr) {
      newErrors.fileAr = "Please upload the Arabic media file.";
    }

    // ✅ Validate Pinpoint X (allow negative values)
    if (formData.pinpointX !== "" && formData.pinpointX !== null) {
      const x = Number(formData.pinpointX);
      if (isNaN(x) || x > 100) {
        newErrors.pinpointX =
          "X must be a number (any negative or positive value, max 100).";
      }
    }

    // ✅ Validate Pinpoint Y (allow negative values)
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

  const handleSave = async () => {
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      const payload = new FormData();
      payload.append("category", formData.category);
      payload.append("subcategory", formData.subcategory || "");
      if (formData.fileEn) payload.append("mediaEn", formData.fileEn);
      if (formData.fileAr) payload.append("mediaAr", formData.fileAr);
      if (formData.pinpointFile)
        payload.append("pinpoint", formData.pinpointFile);
      if (formData.pinpointX) payload.append("pinpointX", formData.pinpointX);
      if (formData.pinpointY) payload.append("pinpointY", formData.pinpointY);

      const res = editingItem
        ? await updateMedia(editingItem._id, payload)
        : await createMedia(payload);

      showMessage(res.message || "Saved", "success");
      setOpenDialog(false);
      setEditingItem(null);
      setFormData({
        category: "",
        subcategory: "",
        fileEn: null,
        fileAr: null,
        pinpointFile: null,
        pinpointX: "",
        pinpointY: "",
        previewEn: null,
        previewAr: null,
        pinpointPreview: null,
      });

      fetchMedia();
    } catch (err) {
      showMessage(err?.response?.data?.message || "Failed", "error");
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
    setFormData({
      category: item?.category || "",
      subcategory: item?.subcategory || "",
      fileEn: null,
      fileAr: null,
      pinpointFile: null,
      pinpointX: item?.pinpoint?.position?.x?.toString() || "",
      pinpointY: item?.pinpoint?.position?.y?.toString() || "",
      preview: item?.media?.url || null,
      previewEn: item?.media?.en.url || null,
      previewAr: item?.media?.ar.url || null,
      pinpointPreview: item?.pinpoint?.file?.url || null,
    });
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 4, position: "relative" }}>
      <LanguageSelector />
      <Typography variant="h4" fontWeight="bold">
        {t.mediaManager}
      </Typography>

      <IconButton
        sx={{ position: "absolute", top: 60, right: 20 }}
        onClick={() => setConfirmLogout(true)}
      >
        <LogoutIcon />
      </IconButton>

      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={() => openForm()}
        sx={{ mt: 2 }}
      >
        {t.addMedia}
      </Button>

      {/* Media list rendering here — unchanged */}

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

      <Box sx={{ mt: 3, maxWidth: "800px", mx: "auto" }}>
        {mediaList.map((item) => (
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
              {item.category}
            </Typography>
            <Typography color="text.secondary">
              {item.subcategory || "—"}
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
                {item.media?.en?.type === "image" ? (
                  <Box
                    component="img"
                    src={item.media.en.url}
                    alt="English Media"
                    sx={{
                      width: "200px",
                      height: "auto",
                      borderRadius: 2,
                      border: "1px solid #ddd",
                      mt: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 130,
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
                {item.media?.ar?.type === "image" ? (
                  <Box
                    component="img"
                    src={item.media.ar.url}
                    alt="Arabic Media"
                    sx={{
                      width: "200px",
                      height: "auto",
                      borderRadius: 2,
                      border: "1px solid #ddd",
                      mt: 1,
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      height: 130,
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
        ))}
      </Box>

      {/* Form Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>{editingItem ? t.editMedia : t.newMedia}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mt: 2 }}>
            {t.generalInfo}
          </Typography>
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
          {formData.previewEn && (
            <Box
              component="img"
              src={formData.previewEn}
              alt="English Media Preview"
              sx={{
                width: "150px",
                height: "auto",
                mt: 2,
                borderRadius: 2,
                border: "1px solid #ddd",
              }}
            />
          )}

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
          {formData.previewAr && (
            <Box
              component="img"
              src={formData.previewAr}
              alt="Arabic Media Preview"
              sx={{
                width: "150px",
                height: "auto",
                mt: 2,
                borderRadius: 2,
                border: "1px solid #ddd",
              }}
            />
          )}

          <Typography variant="subtitle2" sx={{ mt: 4 }}>
            {t.pinpointUpload}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t.pinpointUploadHelper}
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
            error={!!errors.pinpoint}
          />
          {formData.pinpointPreview && (
            <Box
              component="img"
              src={formData.pinpointPreview}
              alt="Pinpoint Preview"
              sx={{
                width: "100px",
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
            sx={{ mt: 2 }}
            value={formData.pinpointY}
            onChange={(e) =>
              setFormData({ ...formData, pinpointY: e.target.value })
            }
            inputProps={{ max: 100 }}
            error={!!errors.pinpointY}
            helperText={errors.pinpointY}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={actionLoading}>
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
