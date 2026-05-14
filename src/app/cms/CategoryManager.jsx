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
} from "@mui/material";
import { Add, Delete, Edit, KeyboardArrowDown, KeyboardArrowRight } from "@mui/icons-material";
import { fetchCategories, createCategory, updateCategory, deleteCategory } from "@/services/CategoryService";
import { useRef } from "react";

export default function CategoryManager({ onChange }) {
  const [tree, setTree] = useState([]);
  const [selectedParent, setSelectedParent] = useState(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("create");
  const newNameRef = useRef(null);

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

  // Flatten tree with depth info for display
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
      await createCategory({ name: { en: newName.trim() }, parent: selectedParent });
      setNewName("");
      setSelectedParent(null);
      setDialogOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      if (status === 401) {
        alert("You must be logged in to create categories. Please log in as an admin.");
      } else if (status === 403) {
        alert("Access denied: admin role required to manage categories. Log in with an admin account.");
      } else {
        alert("Failed to create category: " + (err?.response?.data?.message || err.message));
      }
    }
  };

  const handleEditSave = async (id) => {
    if (!editingName.trim()) return;
    try {
      await updateCategory(id, { name: { en: editingName } });
      setEditing(null);
      setEditingName("");
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to update category: " + (err?.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete category and reparent children to its parent?")) return;
    try {
      await deleteCategory(id);
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete category: " + (err?.response?.data?.message || err.message));
    }
  };

  const openCreateDialog = (parentId = null) => {
    setSelectedParent(parentId);
    setNewName("");
    setDialogMode("create");
    setDialogOpen(true);
    setTimeout(() => newNameRef.current?.focus(), 100);
  };

  const flatRows = flattenTree(tree);
  const allCategories = tree.flatMap(function traverse(n) {
    return [n].concat(n.children ? n.children.reduce((acc, c) => acc.concat(traverse(c)), []) : []);
  });

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Category Manager
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => openCreateDialog()}>
          Add Root Category
        </Button>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "create" ? "Add New Category" : "Edit Category"}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Category Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              inputRef={newNameRef}
              placeholder="Enter category name"
              margin="normal"
            />
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
                  <em>No Parent (Root Category)</em>
                </MenuItem>
                {allCategories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {"  ".repeat(cat.depth || 0)} {cat.name?.en}
                  </MenuItem>
                ))}
              </Select>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateWithFeedback} variant="contained" disabled={!newName.trim()}>
            {dialogMode === "create" ? "Create" : "Update"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Categories Table */}
      <Paper sx={{ overflow: "auto" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ fontWeight: "bold", width: "40%" }}>Category Name</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "20%" }}>Depth</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "40%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flatRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3, color: "text.secondary" }}>
                  No categories yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              flatRows.map((row) => (
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
                      {editing === row._id ? (
                        <TextField
                          size="small"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          sx={{ flex: 1 }}
                        />
                      ) : (
                        <Typography sx={{ flex: 1 }}>{row.name?.en}</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`Level ${row.depth + 1}`}
                      size="small"
                      variant="outlined"
                      sx={{
                        backgroundColor: row.depth === 0 ? "#e3f2fd" : row.depth === 1 ? "#f3e5f5" : "#fff3e0",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      {editing === row._id ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleEditSave(row._id)}
                            sx={{ textTransform: "none" }}
                          >
                            Save
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setEditing(null);
                              setEditingName("");
                            }}
                            sx={{ textTransform: "none" }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => openCreateDialog(row._id)}
                            title="Add child category"
                            color="primary"
                          >
                            <Add fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditing(row._id);
                              setEditingName(row.name?.en || "");
                            }}
                            title="Edit"
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(row._id)}
                            title="Delete"
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Legend */}
      {flatRows.length > 0 && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: "#f9f9f9", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>Tip:</strong> Click the add icon to create child categories. Use expand arrows to show/hide children. Depth levels are color-coded.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
