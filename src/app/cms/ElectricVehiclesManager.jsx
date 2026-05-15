"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { fetchCategories, updateCategory } from "@/services/CategoryService";

function flattenCategories(nodes, parentNames = []) {
  return (nodes || []).flatMap((node) => {
    const currentNames = [...parentNames, node.name?.en || node.name?.ar || String(node._id)];
    const currentNode = {
      _id: String(node._id),
      label: currentNames.join(" / "),
      metadata: node.metadata || {},
      name: node.name || {},
    };
    return [currentNode, ...flattenCategories(node.children || [], currentNames)];
  });
}

function findDefaultElectricVehiclesCategory(items) {
  return items.find((item) => {
    const en = String(item.name?.en || "").trim().toLowerCase();
    const ar = String(item.name?.ar || "").trim();
    return en === "electric vehicles" || ar === "المركبات الكهربائية";
  });
}

export default function ElectricVehiclesManager() {
  const [tree, setTree] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [defaultYearIndex, setDefaultYearIndex] = useState("9");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const categories = useMemo(() => flattenCategories(tree), [tree]);
  const activeCategory = useMemo(
    () => categories.find((item) => item.metadata?.electricVehicles?.enabled),
    [categories]
  );

  const load = async () => {
    const res = await fetchCategories();
    const nextTree = res.data?.data || [];
    setTree(nextTree);
    const flatCategories = flattenCategories(nextTree);
    const active = flatCategories.find((item) => item.metadata?.electricVehicles?.enabled);
    const defaultCategory = findDefaultElectricVehiclesCategory(flatCategories);
    const resolvedCategory = active || defaultCategory || null;
    setSelectedCategoryId(resolvedCategory?._id || "");
    setDefaultYearIndex(String(resolvedCategory?.metadata?.electricVehicles?.defaultYearIndex ?? 9));
  };

  useEffect(() => {
    load().catch((error) => {
      console.error(error);
      setMessage({ type: "error", text: "Failed to load categories." });
    });
  }, []);

  const save = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      if (!selectedCategoryId) {
        setMessage({ type: "error", text: "Please choose a category before saving." });
        return;
      }

      const safeYearIndex = Math.max(0, Math.min(9, Math.round(Number(defaultYearIndex) || 0)));

      if (activeCategory && activeCategory._id !== selectedCategoryId) {
        await updateCategory(activeCategory._id, {
          metadata: {
            electricVehicles: {
              enabled: false,
              defaultYearIndex: 9,
            },
          },
        });
      }

      await updateCategory(selectedCategoryId, {
        metadata: {
          electricVehicles: {
            enabled: true,
            defaultYearIndex: safeYearIndex,
          },
        },
      });

      await load();
      setMessage({ type: "success", text: "Electric Vehicles mapping saved." });
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Failed to save Electric Vehicles mapping." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3, maxWidth: "900px", mx: "auto" }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        Electric Vehicles
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
            Choose the saved category that should open the Electric Vehicles experience on the
            controller and mirror it on the big screen.
          </Typography>

          {!activeCategory && selectedCategoryId && (
            <Alert severity="info">
              A category named Electric Vehicles was detected and preselected for mapping.
            </Alert>
          )}

          <Select
            displayEmpty
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            fullWidth
          >
            <MenuItem value="">No category selected</MenuItem>
            {categories.map((category) => (
              <MenuItem key={category._id} value={category._id}>
                {category.label}
              </MenuItem>
            ))}
          </Select>

          <TextField
            label="Default year index"
            type="number"
            inputProps={{ min: 0, max: 9 }}
            value={defaultYearIndex}
            onChange={(event) => setDefaultYearIndex(event.target.value)}
            helperText="Initial year position when the experience opens. 0 = 2017, 9 = 2026."
            fullWidth
          />

          {activeCategory && (
            <Alert severity="info">
              Currently active category: {activeCategory.label}
            </Alert>
          )}

          <Box>
            <Button variant="contained" onClick={save} disabled={loading}>
              {loading ? "Saving..." : "Save Mapping"}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
