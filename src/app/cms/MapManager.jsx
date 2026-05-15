"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";
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
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        borderRadius: "inherit",
        backdropFilter: "blur(2px)",
      }}
    >
      <CircularProgress variant="determinate" value={progress} color="inherit" size={42} />
      <Typography variant="caption" sx={{ color: "#fff", mt: 1, fontWeight: 700 }}>
        {progress}%
      </Typography>
    </Box>
  );
}

export default function MapManager() {
  const [tree, setTree] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [embedUrl, setEmbedUrl] = useState("");
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState("");
  const [removeQr, setRemoveQr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const categories = useMemo(() => flattenCategories(tree), [tree]);
  const configuredMapCategories = useMemo(
    () =>
      categories.filter(
        (item) => item.metadata?.mapEmbed?.enabled && String(item.metadata?.mapEmbed?.embedUrl || "").trim()
      ),
    [categories]
  );
  const selectedCategoryId = selectedPath[selectedPath.length - 1] || "";
  const selectedCategory = useMemo(
    () => categories.find((item) => item._id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );
  const rootCategories = useMemo(() => tree || [], [tree]);

  const applyCategoryConfig = (category) => {
    const config = category?.metadata?.mapEmbed || {};
    setEmbedUrl(normalizeMapEmbedUrl(config.embedUrl || ""));
    setQrPreview(config.qrImageUrl || "");
    setQrFile(null);
    setRemoveQr(false);
    setIsFormOpen(true);
  };

  const resetFormForNewRecord = (path = []) => {
    setSelectedPath(path);
    setEmbedUrl("");
    setQrFile(null);
    setQrPreview("");
    setRemoveQr(false);
    setMessage({ type: "", text: "" });
    setIsFormOpen(true);
  };

  const load = async () => {
    const res = await fetchCategories();
    const nextTree = res.data?.data || [];
    setTree(nextTree);
    const flatCategories = flattenCategories(nextTree);
    const matchedSelection = selectedCategoryId
      ? flatCategories.find((item) => item._id === selectedCategoryId)
      : null;
    const firstConfigured = flatCategories.find(
      (item) => item.metadata?.mapEmbed?.enabled && String(item.metadata?.mapEmbed?.embedUrl || "").trim()
    );
    const resolvedCategory = matchedSelection || firstConfigured || null;
    if (resolvedCategory) {
      setSelectedPath(resolvedCategory.categoryPath || []);
      applyCategoryConfig(resolvedCategory);
    } else {
      setSelectedPath([]);
      setEmbedUrl("");
      setQrFile(null);
      setQrPreview("");
      setRemoveQr(false);
      setIsFormOpen(false);
    }
  };

  useEffect(() => {
    load().catch((error) => {
      console.error(error);
      setMessage({ type: "error", text: "Failed to load categories." });
    });
  }, []);

  const handleRemoveQr = () => {
    setQrFile(null);
    setQrPreview("");
    setRemoveQr(true);
  };

  const clearFormState = () => {
    setSelectedPath([]);
    setEmbedUrl("");
    setQrFile(null);
    setQrPreview("");
    setRemoveQr(false);
    setIsFormOpen(false);
  };

  const save = async () => {
    setLoading(true);
    setUploadProgress(0);
    setMessage({ type: "", text: "" });
    try {
      if (!selectedCategoryId) {
        setMessage({ type: "error", text: "Please choose a category before saving." });
        return;
      }

      if (!String(embedUrl || "").trim()) {
        setMessage({ type: "error", text: "Please enter a map embed URL before saving." });
        return;
      }

      const formData = new FormData();
      const normalizedEmbedUrl = normalizeMapEmbedUrl(embedUrl);
      formData.append(
        "metadata",
        JSON.stringify({
          mapEmbed: {
            enabled: true,
            embedUrl: normalizedEmbedUrl,
            qrPosition: { x: 72, y: 74 },
            qrSize: { width: 16, height: 16 },
          },
        })
      );

      if (removeQr) {
        formData.append("removeMapQr", "true");
      }

      if (qrFile) {
        formData.append("mapQr", qrFile);
      }

      await updateCategoryWithProgress(selectedCategoryId, formData, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded * 100) / event.total));
      });

      await load();
      setMessage({ type: "success", text: "Map record saved." });
      clearFormState();
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save map configuration." });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 300);
    }
  };

  const deleteRecord = async (category) => {
    if (!category?._id) return;

    setLoading(true);
    setUploadProgress(0);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append(
        "metadata",
        JSON.stringify({
          mapEmbed: {
            enabled: false,
            embedUrl: "",
            qrPosition: { x: 72, y: 74 },
            qrSize: { width: 16, height: 16 },
            qrImageUrl: "",
          },
        })
      );
      formData.append("removeMapQr", "true");

      await updateCategoryWithProgress(category._id, formData, (event) => {
        if (!event.total) return;
        setUploadProgress(Math.round((event.loaded * 100) / event.total));
      });

      await load();
      if (selectedCategoryId && String(selectedCategoryId) === String(category._id)) {
        clearFormState();
      }
      setMessage({ type: "success", text: "Map record deleted." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to delete map record." });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 300);
    }
  };

  const requestDeleteRecord = (category) => {
    setDeleteTarget(category);
    setConfirmDeleteOpen(true);
  };

  return (
    <Box sx={{ mt: 3, maxWidth: "980px", mx: "auto" }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Map
      </Typography>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid rgba(0,0,0,0.08)",
          bgcolor: "#fff",
        }}
      >
        <Stack spacing={2.5}>
          {message.text && <Alert severity={message.type}>{message.text}</Alert>}

          <Typography color="text.secondary">
            Choose the saved category path for this map record, then save its embed URL and QR
            artwork. The controller will use the map for interaction, and the big screen will use
            the uploaded QR image as the main output for that selected map.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => resetFormForNewRecord(rootCategories[0]?._id ? [String(rootCategories[0]._id)] : [])}
            >
              Add For Another Subcategory
            </Button>
          </Box>

          {isFormOpen && (
          <Box>
            {(() => {
              const getOptionsForLevel = (level) => {
                if (level === 0) return tree;
                let node = null;
                for (let i = 0; i < level; i += 1) {
                  const id = selectedPath[i];
                  if (!id) return [];
                  const searchIn = node ? node.children : tree;
                  node = (searchIn || []).find((item) => String(item._id) === String(id));
                  if (!node) return [];
                }
                return node.children || [];
              };

              const computeMaxDepth = (nodes) => {
                let max = 0;
                const dfs = (node, depth) => {
                  max = Math.max(max, depth);
                  (node.children || []).forEach((child) => dfs(child, depth + 1));
                };
                nodes.forEach((node) => dfs(node, 1));
                return max;
              };

              const maxDepth = computeMaxDepth(tree);
              return Array.from({ length: maxDepth }).map((_, level) => {
                const options = getOptionsForLevel(level);
                if (!options.length) return null;
                return (
                  <TextField
                    key={`map-cat-level-${level}`}
                    select
                    fullWidth
                    margin="normal"
                    label={`Level ${level + 1}`}
                    value={selectedPath[level] || ""}
                      onChange={(event) => {
                        const nextId = event.target.value;
                        const nextPath = [...selectedPath.slice(0, level), nextId];
                        const nextCategory = categories.find(
                          (item) => item._id === nextPath[nextPath.length - 1]
                        );
                        if (nextCategory?.metadata?.mapEmbed?.enabled) {
                          setSelectedPath(nextPath);
                          applyCategoryConfig(nextCategory);
                        } else {
                          resetFormForNewRecord(nextPath);
                        }
                      }}
                    >
                    {options.map((option) => (
                      <MenuItem key={option._id} value={option._id}>
                        {option.name?.en || option.name?.ar || option._id}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              });
            })()}
          </Box>
          )}

          {isFormOpen && selectedCategory && (
            <Alert severity="info">
              Editing map record for: {selectedCategory.label}
            </Alert>
          )}

          {isFormOpen && (
          <TextField
            label="Embedded map URL"
            value={embedUrl}
            onChange={(event) => setEmbedUrl(event.target.value)}
            helperText="Paste a Google Maps/My Maps URL. We will convert supported share links to an embed URL automatically, but the map must also be shared publicly or with anyone who has the link."
            fullWidth
          />
          )}

          {isFormOpen && (
          <Box>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              QR code image / video
            </Typography>
            <Button variant="outlined" component="label">
              Upload QR Media
              <input
                hidden
                type="file"
                accept="image/*,video/*"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setQrFile(file || null);
                  setRemoveQr(false);
                  setQrPreview(file ? URL.createObjectURL(file) : "");
                }}
              />
            </Button>

            {qrPreview && (
              <Box
                sx={{
                  mt: 2,
                  width: 180,
                  height: 180,
                  borderRadius: 2,
                  overflow: "hidden",
                  position: "relative",
                  border: "1px solid rgba(0,0,0,0.08)",
                  bgcolor: "#f6f6f6",
                }}
              >
                {loading && uploadProgress > 0 && <ProgressOverlay progress={uploadProgress} />}
                <IconButton
                  size="small"
                  onClick={handleRemoveQr}
                  sx={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    bgcolor: "rgba(255,255,255,0.85)",
                    zIndex: 6,
                    "&:hover": { bgcolor: "#fff" },
                  }}
                >
                  <Delete fontSize="small" color="error" />
                </IconButton>
                {/\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(String(qrPreview || "")) ? (
                  <Box
                    component="video"
                    src={qrPreview}
                    muted
                    autoPlay
                    loop
                    playsInline
                    sx={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                  />
                ) : (
                  <Box
                    component="img"
                    src={qrPreview}
                    alt="QR preview"
                    sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                )}
              </Box>
            )}
          </Box>
          )}

          {isFormOpen && (
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button variant="contained" onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save Map Record"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setIsFormOpen(false);
                setSelectedPath([]);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
          )}

          <Divider />

          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>
              Saved Map Records
            </Typography>
            {configuredMapCategories.length === 0 ? (
              <Typography color="text.secondary">
                No map records saved yet.
              </Typography>
            ) : (
              <Stack spacing={1.2}>
                {configuredMapCategories.map((category) => (
                  <Box
                    key={category._id}
                    sx={{
                      p: 1.5,
                      border: "1px solid rgba(0,0,0,0.08)",
                      borderRadius: 2,
                      bgcolor: "#fafafa",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={600}>{category.label}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {category.metadata?.mapEmbed?.embedUrl}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Tooltip title="Edit map record">
                        <span>
                          <IconButton
                            onClick={() => {
                              setSelectedPath(category.categoryPath);
                              applyCategoryConfig(category);
                            }}
                            color="primary"
                            size="small"
                            disabled={loading}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Delete map record">
                        <span>
                          <IconButton
                            onClick={() => requestDeleteRecord(category)}
                            color="error"
                            size="small"
                            disabled={loading}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
      <ConfirmationDialog
        open={confirmDeleteOpen}
        onClose={() => {
          setConfirmDeleteOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={() => {
          const target = deleteTarget;
          setConfirmDeleteOpen(false);
          setDeleteTarget(null);
          if (target) {
            deleteRecord(target);
          }
        }}
        title="Delete Map Record"
        message={
          deleteTarget
            ? `Are you sure you want to delete the map record for ${deleteTarget.label}?`
            : "Are you sure you want to delete this map record?"
        }
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </Box>
  );
}
