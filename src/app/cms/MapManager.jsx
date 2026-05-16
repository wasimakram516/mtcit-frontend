"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  Chip,
} from "@mui/material";
import { Add, ArrowBack, Delete, Edit } from "@mui/icons-material";
import { fetchCategories, updateCategoryWithProgress } from "@/services/CategoryService";
import ConfirmationDialog from "@/app/components/ConfirmationDialog";
import { normalizeMapEmbedUrl } from "@/utils/mapEmbeds";

function flattenCategories(nodes, parentNames = []) {
  return (nodes || []).flatMap((node) => {
    const currentNames = [...parentNames, node.name?.en || node.name?.ar || String(node._id)];
    const currentNode = {
      _id: String(node._id),
      label: currentNames.join(" / "),
      metadata: node.metadata || {},
      name: node.name || {},
      categoryPath: [...(node.path || []).map(String), String(node._id)],
      children: node.children || [],
    };
    return [currentNode, ...flattenCategories(node.children || [], currentNames)];
  });
}

function ProgressOverlay({ progress }) {
  return (
    <Box sx={{ position: "absolute", inset: 0, bgcolor: "rgba(0,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 5, borderRadius: "inherit", backdropFilter: "blur(2px)" }}>
      <CircularProgress variant="determinate" value={progress} color="inherit" size={42} />
      <Typography variant="caption" sx={{ color: "#fff", mt: 1, fontWeight: 700 }}>{progress}%</Typography>
    </Box>
  );
}

export default function MapManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form state — null means no form open
  const [formMode, setFormMode] = useState(null); // "create" | "edit"
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedPath, setSelectedPath] = useState([]);
  const [embedUrl, setEmbedUrl] = useState("");
  const [qrFileEn, setQrFileEn] = useState(null);
  const [qrPreviewEn, setQrPreviewEn] = useState("");
  const [removeQrEn, setRemoveQrEn] = useState(false);
  const [qrFileAr, setQrFileAr] = useState(null);
  const [qrPreviewAr, setQrPreviewAr] = useState("");
  const [removeQrAr, setRemoveQrAr] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = useMemo(() => flattenCategories(tree), [tree]);
  const configuredMapCategories = useMemo(
    () => categories.filter((item) => item.metadata?.mapEmbed?.enabled && String(item.metadata?.mapEmbed?.embedUrl || "").trim()),
    [categories]
  );

  const load = async () => {
    try {
      const res = await fetchCategories();
      setTree(res.data?.data || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load categories." });
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setFormMode("create");
    setEditingCategory(null);
    setSelectedPath([]);
    setEmbedUrl("");
    setQrFileEn(null); setQrPreviewEn(""); setRemoveQrEn(false);
    setQrFileAr(null); setQrPreviewAr(""); setRemoveQrAr(false);
    setMessage({ type: "", text: "" });
  };

  const openEdit = (category) => {
    const config = category?.metadata?.mapEmbed || {};
    setFormMode("edit");
    setEditingCategory(category);
    setSelectedPath(category.categoryPath || []);
    setEmbedUrl(normalizeMapEmbedUrl(config.embedUrl || ""));
    setQrPreviewEn(config.qrImageUrlEn || config.qrImageUrl || "");
    setQrPreviewAr(config.qrImageUrlAr || "");
    setQrFileEn(null); setRemoveQrEn(false);
    setQrFileAr(null); setRemoveQrAr(false);
    setMessage({ type: "", text: "" });
  };

  const closeForm = () => {
    setFormMode(null);
    setEditingCategory(null);
    setMessage({ type: "", text: "" });
  };

  const save = async () => {
    const selectedCategoryId = selectedPath[selectedPath.length - 1] || "";
    if (!selectedCategoryId) {
      setMessage({ type: "error", text: "Please choose a category before saving." });
      return;
    }
    if (!String(embedUrl || "").trim()) {
      setMessage({ type: "error", text: "Please enter a map embed URL before saving." });
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setMessage({ type: "", text: "" });
    try {
      // If editing and the category changed, clear the old category's map config first
      if (formMode === "edit" && editingCategory && editingCategory._id !== selectedCategoryId) {
        const clearForm = new FormData();
        clearForm.append("metadata", JSON.stringify({
          mapEmbed: { enabled: false, embedUrl: "", qrImageUrl: "", qrImageUrlEn: "", qrImageUrlAr: "" },
        }));
        clearForm.append("removeMapQr", "true");
        await updateCategoryWithProgress(editingCategory._id, clearForm, () => {});
      }

      const categoryChanged = formMode === "edit" && editingCategory && editingCategory._id !== selectedCategoryId;

      const mapEmbedMeta = {
        enabled: true,
        embedUrl: normalizeMapEmbedUrl(embedUrl),
        qrPosition: { x: 72, y: 74 },
        qrSize: { width: 16, height: 16 },
      };

      // When moving to a different category, carry existing S3 URLs over so they aren't lost
      if (categoryChanged) {
        if (qrPreviewEn && !qrPreviewEn.startsWith("blob:") && !removeQrEn && !qrFileEn) {
          mapEmbedMeta.qrImageUrlEn = qrPreviewEn;
        }
        if (qrPreviewAr && !qrPreviewAr.startsWith("blob:") && !removeQrAr && !qrFileAr) {
          mapEmbedMeta.qrImageUrlAr = qrPreviewAr;
        }
      }

      const formData = new FormData();
      formData.append("metadata", JSON.stringify({ mapEmbed: mapEmbedMeta }));
      if (removeQrEn) formData.append("removeMapQrEn", "true");
      if (removeQrAr) formData.append("removeMapQrAr", "true");
      if (qrFileEn) formData.append("mapQrEn", qrFileEn);
      if (qrFileAr) formData.append("mapQrAr", qrFileAr);

      await updateCategoryWithProgress(selectedCategoryId, formData, (e) => {
        if (e.total) setUploadProgress(Math.round((e.loaded * 100) / e.total));
      });

      await load();
      setMessage({ type: "success", text: "Map record saved successfully." });
      setTimeout(closeForm, 1200);
    } catch {
      setMessage({ type: "error", text: "Failed to save map configuration." });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 300);
    }
  };

  const deleteRecord = async (category) => {
    if (!category?._id) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("metadata", JSON.stringify({ mapEmbed: { enabled: false, embedUrl: "", qrImageUrl: "", qrImageUrlEn: "", qrImageUrlAr: "" } }));
      formData.append("removeMapQr", "true");
      await updateCategoryWithProgress(category._id, formData, () => {});
      await load();
      setMessage({ type: "success", text: "Map record deleted." });
    } catch {
      setMessage({ type: "error", text: "Failed to delete map record." });
    } finally {
      setLoading(false);
    }
  };

  // ── Category chain selector ───────────────────────────────────────────────
  const renderCategorySelectors = () => {
    const getOptionsForLevel = (level) => {
      if (level === 0) return tree;
      let node = null;
      for (let i = 0; i < level; i++) {
        const id = selectedPath[i];
        if (!id) return [];
        const searchIn = node ? node.children : tree;
        node = (searchIn || []).find((n) => String(n._id) === String(id));
        if (!node) return [];
      }
      return node.children || [];
    };
    const computeMaxDepth = (nodes) => {
      let max = 0;
      const dfs = (n, depth) => { max = Math.max(max, depth); (n.children || []).forEach((c) => dfs(c, depth + 1)); };
      nodes.forEach((n) => dfs(n, 1));
      return max;
    };
    const maxDepth = computeMaxDepth(tree);
    return Array.from({ length: maxDepth }).map((_, level) => {
      const options = getOptionsForLevel(level);
      if (!options.length) return null;
      return (
        <TextField key={`level-${level}`} select fullWidth margin="normal" label={`Level ${level + 1}`}
          value={selectedPath[level] || ""}
          onChange={(e) => {
            const nextId = e.target.value;
            setSelectedPath([...selectedPath.slice(0, level), nextId]);
          }}
        >
          {options.map((o) => (
            <MenuItem key={String(o._id)} value={String(o._id)}>
              {o.name?.en || o.name?.ar || String(o._id)}
            </MenuItem>
          ))}
        </TextField>
      );
    });
  };

  // ── Form view ─────────────────────────────────────────────────────────────
  if (formMode) {
    return (
      <Box sx={{ mt: 3, maxWidth: "780px", mx: "auto" }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
          <IconButton onClick={closeForm} size="small" sx={{ bgcolor: "rgba(0,0,0,0.06)", "&:hover": { bgcolor: "rgba(0,0,0,0.12)" } }}>
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              {formMode === "edit" ? `Edit: ${editingCategory?.label || "Map Record"}` : "Add New Map Record"}
            </Typography>
            {formMode === "edit" && (
              <Typography variant="caption" color="text.secondary">
                Changes will update the big screen display for this category.
              </Typography>
            )}
          </Box>
        </Stack>

        {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: "1px solid rgba(0,0,0,0.08)" }}>
          <Stack spacing={2.5}>
            {/* Category selection */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 0.5 }}>
                Category
              </Typography>
              {renderCategorySelectors()}
            </Box>

            {/* Embed URL */}
            <TextField
              label="Embedded map URL"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              helperText="Paste a Google Maps / My Maps URL. Supported share links are converted to embed URLs automatically."
              fullWidth
            />

            {/* QR uploads */}
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
                QR Code Media
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
                {/* English QR */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>English QR</Typography>
                  <Button variant="outlined" component="label" size="small">
                    {qrPreviewEn ? "Replace English QR" : "Upload English QR"}
                    <input hidden type="file" accept="image/*,video/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      setQrFileEn(file || null);
                      setRemoveQrEn(false);
                      setQrPreviewEn(file ? URL.createObjectURL(file) : "");
                    }} />
                  </Button>
                  {qrPreviewEn && (
                    <Box sx={{ mt: 1.5, width: 140, height: 140, borderRadius: 2, overflow: "hidden", position: "relative", border: "1px solid rgba(0,0,0,0.1)", bgcolor: "#f5f5f5" }}>
                      {loading && uploadProgress > 0 && <ProgressOverlay progress={uploadProgress} />}
                      <IconButton size="small" onClick={() => { setQrFileEn(null); setQrPreviewEn(""); setRemoveQrEn(true); }}
                        sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(255,255,255,0.9)", zIndex: 6, "&:hover": { bgcolor: "#fff" } }}>
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                      <Box component="img" src={qrPreviewEn} alt="EN QR" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </Box>
                  )}
                </Box>

                {/* Arabic QR */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: "text.secondary" }}>Arabic QR (عربي)</Typography>
                  <Button variant="outlined" component="label" size="small">
                    {qrPreviewAr ? "Replace Arabic QR" : "Upload Arabic QR"}
                    <input hidden type="file" accept="image/*,video/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      setQrFileAr(file || null);
                      setRemoveQrAr(false);
                      setQrPreviewAr(file ? URL.createObjectURL(file) : "");
                    }} />
                  </Button>
                  {qrPreviewAr && (
                    <Box sx={{ mt: 1.5, width: 140, height: 140, borderRadius: 2, overflow: "hidden", position: "relative", border: "1px solid rgba(0,0,0,0.1)", bgcolor: "#f5f5f5" }}>
                      {loading && uploadProgress > 0 && <ProgressOverlay progress={uploadProgress} />}
                      <IconButton size="small" onClick={() => { setQrFileAr(null); setQrPreviewAr(""); setRemoveQrAr(true); }}
                        sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(255,255,255,0.9)", zIndex: 6, "&:hover": { bgcolor: "#fff" } }}>
                        <Delete fontSize="small" color="error" />
                      </IconButton>
                      <Box component="img" src={qrPreviewAr} alt="AR QR" sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </Box>
                  )}
                </Box>
              </Stack>
            </Box>

            {/* Actions */}
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button variant="contained" onClick={save} disabled={loading} sx={{ minWidth: 120 }}>
                {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
              </Button>
              <Button variant="outlined" onClick={closeForm} disabled={loading}>
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>
    );
  }

  // ── List view (default) ───────────────────────────────────────────────────
  return (
    <Box sx={{ mt: 3, maxWidth: "780px", mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Map Records</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
          Add Map Record
        </Button>
      </Stack>

      {message.text && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

      {configuredMapCategories.length === 0 ? (
        <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px dashed rgba(0,0,0,0.15)", textAlign: "center" }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            No map records yet. Add one to display a map on the big screen.
          </Typography>
          <Button variant="outlined" startIcon={<Add />} onClick={openCreate}>
            Add First Map Record
          </Button>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {configuredMapCategories.map((category) => {
            const config = category.metadata?.mapEmbed || {};
            const hasEnQr = Boolean(config.qrImageUrlEn || config.qrImageUrl);
            const hasArQr = Boolean(config.qrImageUrlAr);
            return (
              <Paper key={category._id} elevation={0} sx={{ p: 2.5, borderRadius: 2, border: "1px solid rgba(0,0,0,0.08)", bgcolor: "#fafafa" }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography fontWeight={700} sx={{ mb: 0.5 }}>{category.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", mb: 1 }}>
                      {config.embedUrl}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Chip size="small" label="EN QR" color={hasEnQr ? "success" : "default"} variant={hasEnQr ? "filled" : "outlined"} sx={{ fontSize: "0.7rem", height: 20 }} />
                      <Chip size="small" label="AR QR" color={hasArQr ? "success" : "default"} variant={hasArQr ? "filled" : "outlined"} sx={{ fontSize: "0.7rem", height: 20 }} />
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0.5} flexShrink={0}>
                    <Button size="small" variant="outlined" startIcon={<Edit />} onClick={() => openEdit(category)}>
                      Edit
                    </Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<Delete />}
                      onClick={() => { setDeleteTarget(category); setConfirmDeleteOpen(true); }}>
                      Delete
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            );
          })}
        </Stack>
      )}

      <ConfirmationDialog
        open={confirmDeleteOpen}
        onClose={() => { setConfirmDeleteOpen(false); setDeleteTarget(null); }}
        onConfirm={() => {
          const target = deleteTarget;
          setConfirmDeleteOpen(false);
          setDeleteTarget(null);
          if (target) deleteRecord(target);
        }}
        title="Delete Map Record"
        message={deleteTarget ? `Delete the map record for "${deleteTarget.label}"?` : "Delete this map record?"}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </Box>
  );
}
