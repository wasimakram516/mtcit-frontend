"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  Input,
  Snackbar,
  Alert,
} from "@mui/material";
import { Add, Delete, Edit, KeyboardArrowDown, KeyboardArrowRight, ArrowUpward, ArrowDownward } from "@mui/icons-material";
import { fetchCategories, createCategory, updateCategory, deleteCategory, reorderCategories } from "@/services/CategoryService";
import { useRef } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import ConfirmationDialog from "../components/ConfirmationDialog";

/** Siblings in display order (same order as the tree / sortOrder). */
function getSiblingsInTree(tree, row) {
  if (!row) return [];
  const parentId = row.parent != null && row.parent !== "" ? String(row.parent) : null;
  if (!parentId) {
    return Array.isArray(tree) ? tree : [];
  }
  const walk = (nodes) => {
    for (const node of nodes || []) {
      if (String(node._id) === parentId) {
        return node.children || [];
      }
      if (node.children?.length) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(tree) || [];
}

export default function CategoryManager({ onChange }) {
  const [tree, setTree] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [newName, setNewName] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [editingNameAr, setEditingNameAr] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const [selectedIcon, setSelectedIcon] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [removeIcon, setRemoveIcon] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState(null); // 'category' or 'icon'
  const [confirmTargetId, setConfirmTargetId] = useState(null);

  const newNameRef = useRef(null);
  const { language } = useLanguage();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const showSnackbar = (message, severity = "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const translations = {
    en: {
      categoryManager: "Category Manager",
      addRootCategory: "Add Root Category",
      addNewCategory: "Add New Category",
      editCategory: "Edit Category",
      categoryName: "Category Name (English)",
      categoryNameAr: "Category Name (Arabic)",
      enterCategoryName: "Enter category name in English",
      enterCategoryNameAr: "أدخل اسم الفئة بالعربية",
      noParent: "No Parent (Root Category)",
      cancel: "Cancel",
      create: "Create",
      update: "Update",
      depth: "Depth",
      actions: "Actions",
      noCategories: "No category added yet. Click Add Category to get started.",
      tip: "Tip:",
      tipMessage: "Click the add icon to create child categories. Use expand arrows to show/hide children. Depth levels are color-coded.",
      save: "Save",
      deleteConfirm: "Delete category and reparent children to its parent?",
      delete: "Delete",
      addChild: "Add child category",
      uploadIcon: "Upload Icon",
      currentIcon: "Current Icon",
      removeMedia: "Remove Media",
      removeMediaConfirm: "Are you sure you want to remove this icon?",
    },
    ar: {
      categoryManager: "مدير الفئات",
      addRootCategory: "إضافة فئة رئيسية",
      addNewCategory: "إضافة فئة جديدة",
      editCategory: "تعديل الفئة",
      categoryName: "اسم الفئة (إنجليزي)",
      categoryNameAr: "اسم الفئة (عربي)",
      enterCategoryName: "Enter category name in English",
      enterCategoryNameAr: "أدخل اسم الفئة بالعربية",
      noParent: "بدون أب (فئة رئيسية)",
      cancel: "إلغاء",
      create: "إنشاء",
      update: "تحديث",
      depth: "العمق",
      actions: "الإجراءات",
      noCategories: "لم يتم إضافة فئات بعد. أنشئ واحدة للبدء.",
      tip: "نصيحة:",
      tipMessage: "انقر على أيقونة الإضافة لإنشاء فئات فرعية. استخدم أسهم التوسيع لإظهار/إخفاء الفئات الفرعية. مستويات العمق ملونة حسب المستوى.",
      save: "حفظ",
      deleteConfirm: "هل تريد حذف الفئة ونقل الأبناء إلى الفئة الأب؟",
      delete: "حذف",
      addChild: "إضافة فئة فرعية",
      uploadIcon: "تحميل أيقونة",
      currentIcon: "الأيقونة الحالية",
      removeMedia: "إزالة الوسائط",
      removeMediaConfirm: "هل أنت متأكد أنك تريد إزالة هذه الأيقونة؟",
    },
  };

  const t = translations[language];

  const load = async () => {
    try {
      const res = await fetchCategories();
      setTree(res.data.data || []);
      if (onChange) onChange();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const flattenTree = (nodes, depth = 0) => {
    let result = [];
    nodes?.forEach((node) => {
      result.push({ ...node, depth });
      if (expandedNodes.has(node._id) && node.children?.length > 0) {
        result = result.concat(flattenTree(node.children, depth + 1));
      }
    });
    return result;
  };

  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleCreateWithFeedback = async () => {
    if (!newName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", JSON.stringify({ en: newName.trim(), ar: newNameAr.trim() }));
      if (selectedParent) formData.append("parent", selectedParent);
      if (selectedIcon) formData.append("icon", selectedIcon);

      await createCategory(formData);
      setNewName("");
      setNewNameAr("");
      setSelectedParent(null);
      setSelectedIcon(null);
      setIconPreview(null);
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to create category: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleEditSave = async (id) => {
    if (!editingName.trim()) return;
    try {
      const formData = new FormData();
      formData.append("name", JSON.stringify({ en: editingName.trim(), ar: editingNameAr.trim() }));
      if (selectedIcon) formData.append("icon", selectedIcon);
      if (removeIcon) formData.append("removeIcon", "true");

      await updateCategory(id, formData);
      setEditing(null);
      setEditingName("");
      setEditingNameAr("");
      setSelectedIcon(null);
      setIconPreview(null);
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to update category: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmTargetId(id);
    setConfirmType('category');
    setConfirmOpen(true);
  };

  const applySiblingOrder = async (siblings) => {
    // siblings: array of nodes in desired order (top-first)
    // Use ascending sortOrder: 0, 1, 2, ... (lower = first)
    try {
      const payload = siblings.map((s, idx) => ({ id: s._id, sortOrder: idx }));
      await reorderCategories(payload);
      await load();
      if (onChange) onChange();
      // Notify controller via socket to reload categoryTree
      const socketEvent = new CustomEvent('categoryReordered');
      window.dispatchEvent(socketEvent);
    } catch (err) {
      console.error('Failed to save order', err);
      const msg = err?.response?.status === 404
        ? 'Category reorder endpoint not found. Ensure backend is running and routes are updated.'
        : (err?.response?.data?.message || err.message || 'Failed to save order');
      showSnackbar(msg, "error");
    }
  };

  const handleMove = async (row, direction) => {
    const siblings = getSiblingsInTree(tree, row);
    const index = siblings.findIndex((s) => String(s._id) === String(row._id));
    if (index === -1) return;
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= siblings.length) return;
    const reordered = [...siblings];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(newIndex, 0, moved);
    await applySiblingOrder(reordered);
  };

  const handleRemoveIconClick = () => {
    setConfirmType('icon');
    setConfirmOpen(true);
  };

  const handleConfirmAction = async () => {
    if (confirmType === 'category') {
      try {
        await deleteCategory(confirmTargetId);
        await load();
      } catch (err) {
        console.error(err);
        showSnackbar("Failed to delete category: " + (err?.response?.data?.message || err.message));
      }
    } else if (confirmType === 'icon') {
      try {
        // If editing an existing category, delete icon from backend
        if (editing) {
          const formData = new FormData();
          formData.append("removeIcon", "true");
          await updateCategory(editing, formData);
          // Clear the preview immediately
          if (iconPreview?.startsWith("blob:")) URL.revokeObjectURL(iconPreview);
          setSelectedIcon(null);
          setIconPreview(null);
          setEditing(null);
          setEditingName("");
          setDialogOpen(false);
          // Refresh the tree
          await load();
        } else {
          // New category - just clear form field
          if (iconPreview?.startsWith("blob:")) URL.revokeObjectURL(iconPreview);
          setSelectedIcon(null);
          setIconPreview(null);
          setRemoveIcon(true);
        }
      } catch (err) {
        console.error(err);
        showSnackbar("Failed to delete icon: " + (err?.response?.data?.message || err.message));
      }
    }
    setConfirmOpen(false);
  };

  const openCreateDialog = (parentId = null) => {
    setSelectedParent(parentId);
    setNewName("");
    setNewNameAr("");
    setSelectedIcon(null);
    setIconPreview(null);
    setRemoveIcon(false);
    setDialogMode("create");
    setDialogOpen(true);
    setTimeout(() => newNameRef.current?.focus(), 100);
  };

  const openEditDialog = (row) => {
    setEditing(row._id);
    setEditingName(row.name?.en || "");
    setEditingNameAr(row.name?.ar || "");
    setSelectedIcon(null);
    setIconPreview(row.icon || null);
    setRemoveIcon(false);
    setDialogMode("edit");
    setDialogOpen(true);
  };

  const flatRows = flattenTree(tree);
  const allCategories = tree.flatMap(function traverse(n) {
    return [n].concat(n.children ? n.children.reduce((acc, c) => acc.concat(traverse(c)), []) : []);
  });

  const renderedRows = flatRows.length === 0 ? (
    <TableRow>
      <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.secondary" }}>
        {t.noCategories}
      </TableCell>
    </TableRow>
  ) : (
    flatRows.map((row) => {
      const siblings = getSiblingsInTree(tree, row);
      const sibIndex = siblings.findIndex((s) => String(s._id) === String(row._id));
      const canMoveUp = sibIndex > 0;
      const canMoveDown = sibIndex >= 0 && sibIndex < siblings.length - 1;

      return (
                <TableRow key={row._id} sx={{ "&:hover": { backgroundColor: "#fafafa" } }}>
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, pl: row.depth * 2 }}>
              {row.children?.length > 0 && (
                <IconButton
                  size="small"
                  onClick={() => toggleExpand(row._id)}
                  sx={{ p: 0, width: 24, height: 24 }}
                >
                  {expandedNodes.has(row._id) ? (
                    <KeyboardArrowDown fontSize="small" />
                  ) : (
                    <KeyboardArrowRight fontSize="small" />
                  )}
                </IconButton>
              )}
              {!row.children?.length && <Box sx={{ width: 24 }} />}
              {row.icon && (
                <Box
                  component="img"
                  src={row.icon}
                  sx={{ width: 24, height: 24, borderRadius: 0.5, objectFit: "contain" }}
                />
              )}
              <Typography sx={{ flex: 1 }}>
                {language === "ar" ? (row.name?.ar || row.name?.en) : (row.name?.en || row.name?.ar)}
              </Typography>
            </Box>
          </TableCell>
          <TableCell align="center">
            <Chip
              label={`${language === 'ar' ? 'المستوى' : 'Level'} ${row.depth + 1}`}
              size="small"
              variant="outlined"
              sx={{
                backgroundColor: row.depth === 0 ? "#e3f2fd" : row.depth === 1 ? "#f3e5f5" : "#fff3e0",
              }}
            />
          </TableCell>
          <TableCell>
            <Box className="row-actions" sx={{ display: "flex", gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => openCreateDialog(row._id)}
                title={t.addChild}
                color="primary"
              >
                <Add fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMove(row, 'up')}
                title="Move Up"
                color="primary"
                disabled={!canMoveUp}
              >
                <ArrowUpward fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleMove(row, 'down')}
                title="Move Down"
                color="primary"
                disabled={!canMoveDown}
              >
                <ArrowDownward fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => openEditDialog(row)}
                title={t.edit}
                color="primary"
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDeleteClick(row._id)}
                title={t.delete}
                color="error"
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </TableCell>
        </TableRow>
      );
    })
  );

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          {t.categoryManager}
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => openCreateDialog()}>
          {t.addRootCategory}
        </Button>
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "create" ? t.addNewCategory : t.editCategory}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label={t.categoryName}
              value={dialogMode === "create" ? newName : editingName}
              onChange={(e) => dialogMode === "create" ? setNewName(e.target.value) : setEditingName(e.target.value)}
              inputRef={newNameRef}
              placeholder={t.enterCategoryName}
              margin="normal"
            />
            <TextField
              fullWidth
              label={t.categoryNameAr}
              value={dialogMode === "create" ? newNameAr : editingNameAr}
              onChange={(e) => dialogMode === "create" ? setNewNameAr(e.target.value) : setEditingNameAr(e.target.value)}
              placeholder={t.enterCategoryNameAr}
              margin="normal"
              inputProps={{ dir: "rtl" }}
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>{t.uploadIcon} (Optional)</Typography>
              <Input
                type="file"
                fullWidth
                onChange={(e) => {
                  const file = e.target.files[0];
                  setSelectedIcon(file);
                  setIconPreview(file ? URL.createObjectURL(file) : null);
                  setRemoveIcon(false);
                }}
                accept="image/*"
              />
              {iconPreview && (
                <Box sx={{ mt: 1, position: "relative", width: "fit-content" }}>
                  <IconButton
                    size="small"
                    onClick={handleRemoveIconClick}
                    sx={{ position: "absolute", top: -10, left: -10, bgcolor: "rgba(255,255,255,0.8)", zIndex: 10, "&:hover": { bgcolor: "#fff" } }}
                  >
                    <Delete fontSize="small" color="error" />
                  </IconButton>
                  <Typography variant="caption">{t.currentIcon}:</Typography>
                  <Box
                    component="img"
                    src={iconPreview}
                    sx={{ width: 40, height: 40, display: "block", mt: 0.5, borderRadius: 1, objectFit: "contain", border: "1px solid #eee" }}
                  />
                </Box>
              )}
            </Box>

            {dialogMode === "create" && (
              <Select
                fullWidth
                value={selectedParent || ""}
                onChange={(e) => setSelectedParent(e.target.value || null)}
                displayEmpty
                margin="dense"
                sx={{ mt: 2 }}
              >
                <MenuItem value="">
                  <em>{t.noParent}</em>
                </MenuItem>
                {allCategories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {"  ".repeat(cat.depth || 0)} {language === "ar" ? (cat.name?.ar || cat.name?.en) : (cat.name?.en || cat.name?.ar)}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          {dialogMode === "edit" && (
            <Button
              color="error"
              variant="outlined"
              onClick={() => handleDeleteClick(editing)}
              startIcon={<Delete />}
              sx={{ mr: "auto" }}
            >
              {t.delete}
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>{t.cancel}</Button>
          <Button
            onClick={() => dialogMode === "create" ? handleCreateWithFeedback() : handleEditSave(editing)}
            variant="contained"
            disabled={dialogMode === "create" ? !newName.trim() : !editingName.trim()}

          >
            {dialogMode === "create" ? t.create : t.update}
          </Button>
        </DialogActions>
      </Dialog>

      <Paper sx={{ overflow: "auto" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold", width: "40%" }}>{t.categoryName}</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "20%" }}>{t.depth}</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "40%" }}>{t.actions}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {renderedRows}
          </TableBody>
        </Table>
      </Paper>

      <ConfirmationDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAction}
        title={confirmType === 'category' ? t.delete : t.removeMedia}
        message={confirmType === 'category' ? t.deleteConfirm : t.removeMediaConfirm}
        confirmButtonText={t.delete}
        cancelButtonText={t.cancel}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {flatRows.length > 0 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>{t.tip}</strong> {t.tipMessage}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
