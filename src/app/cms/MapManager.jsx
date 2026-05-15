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
  Slider,
  Stack,
  TextField,
  Typography,
  IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { fetchCategories, updateCategoryWithProgress } from "@/services/CategoryService";

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
  const [qrPosition, setQrPosition] = useState({ x: 72, y: 74 });
  const [qrSize, setQrSize] = useState({ width: 16, height: 16 });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState({ type: "", text: "" });

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
    setEmbedUrl(config.embedUrl || "");
    setQrPreview(config.qrImageUrl || "");
    setQrFile(null);
    setRemoveQr(false);
    setQrPosition({
      x: Number(config.qrPosition?.x ?? 72),
      y: Number(config.qrPosition?.y ?? 74),
    });
    setQrSize({
      width: Number(config.qrSize?.width ?? 16),
      height: Number(config.qrSize?.height ?? 16),
    });
  };

  const resetFormForNewRecord = (path = []) => {
    setSelectedPath(path);
    setEmbedUrl("");
    setQrFile(null);
    setQrPreview("");
    setRemoveQr(false);
    setQrPosition({ x: 72, y: 74 });
    setQrSize({ width: 16, height: 16 });
    setMessage({ type: "", text: "" });
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
    const resolvedCategory = matchedSelection || firstConfigured || flatCategories[0] || null;
    setSelectedPath(resolvedCategory?.categoryPath || []);
    applyCategoryConfig(resolvedCategory);
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

      const safePosition = {
        x: Math.max(0, Math.min(100, Number(qrPosition.x) || 0)),
        y: Math.max(0, Math.min(100, Number(qrPosition.y) || 0)),
      };
      const safeSize = {
        width: Math.max(6, Math.min(40, Number(qrSize.width) || 16)),
        height: Math.max(6, Math.min(40, Number(qrSize.height) || 16)),
      };

      const formData = new FormData();
      formData.append(
        "metadata",
        JSON.stringify({
          mapEmbed: {
            enabled: true,
            embedUrl: String(embedUrl).trim(),
            qrPosition: safePosition,
            qrSize: safeSize,
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
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save map configuration." });
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 300);
    }
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
            settings. You can save multiple map records across different subcategories.
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => resetFormForNewRecord(rootCategories[0]?._id ? [String(rootCategories[0]._id)] : [])}
            >
              Add For Another Subcategory
            </Button>
          </Box>

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

          {selectedCategory && (
            <Alert severity="info">
              Editing map record for: {selectedCategory.label}
            </Alert>
          )}

          <TextField
            label="Embedded map URL"
            value={embedUrl}
            onChange={(event) => setEmbedUrl(event.target.value)}
            helperText="Paste the full embeddable map URL that should appear on the big screen."
            fullWidth
          />

          <Box>
            <Typography fontWeight={600} sx={{ mb: 1 }}>
              QR code image
            </Typography>
            <Button variant="outlined" component="label">
              Upload QR Code
              <input
                hidden
                type="file"
                accept="image/*"
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
                <Box
                  component="img"
                  src={qrPreview}
                  alt="QR preview"
                  sx={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </Box>
            )}
          </Box>

          <Box>
            <Typography fontWeight={600} sx={{ mb: 1.5 }}>
              QR position and size
            </Typography>
            <Stack spacing={2.2}>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  X position: {Math.round(qrPosition.x)}%
                </Typography>
                <Slider
                  min={0}
                  max={100}
                  value={qrPosition.x}
                  onChange={(_, value) =>
                    setQrPosition((current) => ({
                      ...current,
                      x: Array.isArray(value) ? value[0] : value,
                    }))
                  }
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  Y position: {Math.round(qrPosition.y)}%
                </Typography>
                <Slider
                  min={0}
                  max={100}
                  value={qrPosition.y}
                  onChange={(_, value) =>
                    setQrPosition((current) => ({
                      ...current,
                      y: Array.isArray(value) ? value[0] : value,
                    }))
                  }
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  Width: {Math.round(qrSize.width)}%
                </Typography>
                <Slider
                  min={6}
                  max={40}
                  value={qrSize.width}
                  onChange={(_, value) =>
                    setQrSize((current) => ({
                      ...current,
                      width: Array.isArray(value) ? value[0] : value,
                    }))
                  }
                />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ mb: 0.8 }}>
                  Height: {Math.round(qrSize.height)}%
                </Typography>
                <Slider
                  min={6}
                  max={40}
                  value={qrSize.height}
                  onChange={(_, value) =>
                    setQrSize((current) => ({
                      ...current,
                      height: Array.isArray(value) ? value[0] : value,
                    }))
                  }
                />
              </Box>
            </Stack>
          </Box>

          <Box>
            <Button variant="contained" onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save Map Record"}
            </Button>
          </Box>

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
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setSelectedPath(category.categoryPath);
                        applyCategoryConfig(category);
                      }}
                    >
                      Edit
                    </Button>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
