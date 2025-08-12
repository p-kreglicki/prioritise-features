"use client";

import { useMemo, useState, useCallback, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import { AddCircleTwoTone as AddIcon, DeleteForeverTwoTone as DeleteIcon, HelpTwoTone as HelpIcon } from '@mui/icons-material';
import ImportExportMenu from './ImportExportMenu';
import {
  DEFAULT_RICE_SCALES,
  computeRiceScore,
  compareByRice,
  type Feature,
  type ImpactLabel,
  type ConfidenceLabel,
  type EffortSize
} from "@/lib/rice";
import { saveState, loadState, createDebounced } from "@/lib/storage";

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const impactOptions: ImpactLabel[] = ["Massive", "High", "Medium", "Low", "Minimal"];
const confidenceOptions: ConfidenceLabel[] = ["100%", "80%", "50%"];
const effortOptions: EffortSize[] = ["XS", "S", "M", "L", "XL"];

const RiceTable = memo(function RiceTable({
  features: featuresProp,
  onChangeFeatures
}: {
  features?: Feature[];
  onChangeFeatures?: (next: Feature[]) => void;
} = {}) {
  const isControlled = Array.isArray(featuresProp);
  const [internalFeatures, setInternalFeatures] = useState<Feature[]>(() => {
    if (isControlled) return [];
    const loaded = loadState();
    return loaded?.features ?? [];
  });
  const features = isControlled ? (featuresProp as Feature[]) : internalFeatures;

  const sortedFeatures = useMemo(() => {
    return features.slice().sort((a, b) => compareByRice(a, b));
  }, [features]);

  const getConsolidatedErrors = useCallback(() => {
    const errors: string[] = [];
    let hasErrors = false;

    features.forEach((f) => {
      const invalidReach = f.reach !== undefined && (!Number.isFinite(f.reach) || (f.reach as number) < 0);
      const reachTouchedAndEmpty = f.reach === undefined && f.name !== "";
      const impactTouchedAndEmpty = f.impact === "" && f.name !== "";
      const confidenceTouchedAndEmpty = f.confidence === "" && f.name !== "";
      const effortTouchedAndEmpty = f.effort === "" && f.name !== "";

      if (invalidReach) {
        hasErrors = true;
        if (!errors.includes("Some features have invalid reach values (must be non-negative numbers)")) {
          errors.push("Some features have invalid reach values (must be non-negative numbers)");
        }
      }
      if (reachTouchedAndEmpty) {
        hasErrors = true;
        if (!errors.includes("Some features are missing reach values")) {
          errors.push("Some features are missing reach values");
        }
      }
      if (impactTouchedAndEmpty) {
        hasErrors = true;
        if (!errors.includes("Some features are missing impact values")) {
          errors.push("Some features are missing impact values");
        }
      }
      if (confidenceTouchedAndEmpty) {
        hasErrors = true;
        if (!errors.includes("Some features are missing confidence values")) {
          errors.push("Some features are missing confidence values");
        }
      }
      if (effortTouchedAndEmpty) {
        hasErrors = true;
        if (!errors.includes("Some features are missing effort values")) {
          errors.push("Some features are missing effort values");
        }
      }
    });

    return { hasErrors, errors };
  }, [features]);

  const applyUpdate = useCallback(
    (updater: (prev: Feature[]) => Feature[]) => {
      if (isControlled && onChangeFeatures) {
        const next = updater(features);
        onChangeFeatures(next);
      } else {
        setInternalFeatures(updater);
      }
    },
    [features, isControlled, onChangeFeatures]
  );

  const addFeature = useCallback(() => {
    const nowIso = new Date().toISOString();
    const newFeature: Feature = {
      id: generateId(),
      name: "",
      description: "",
      createdAtIso: nowIso,
      updatedAtIso: nowIso
    };
    applyUpdate((prev) => prev.concat(newFeature));
  }, [applyUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  }, []);

  const deleteFeature = useCallback(
    (id: string) => {
      applyUpdate((prev) => prev.filter((f) => f.id !== id));
    },
    [applyUpdate]
  );

  const updateFeature = useCallback(<K extends keyof Feature>(id: string, key: K, value: Feature[K]) => {
    applyUpdate((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              [key]: value,
              updatedAtIso: new Date().toISOString()
            }
          : f
      )
    );
  }, [applyUpdate]);

  const debouncedSave = useMemo(() => {
    if (isControlled) return null;
    return createDebounced((next: Feature[]) => {
      const state = { version: 1, features: next, lastSavedAtIso: new Date().toISOString() };
      saveState(state);
    }, 300);
  }, [isControlled]);

  // Persist on changes (uncontrolled only)
  useMemo(() => {
    if (!isControlled && debouncedSave) debouncedSave(features);
    return undefined;
  }, [features, debouncedSave, isControlled]);

  const renderRow = useCallback((f: Feature) => {
    const score = computeRiceScore(f, DEFAULT_RICE_SCALES);
    const scoreDisplay = score == null ? "" : (Math.round(score * 100) / 100).toFixed(2);
    const invalidReach = f.reach !== undefined && (!Number.isFinite(f.reach) || (f.reach as number) < 0);
    
    // Check if field was touched and then left empty/invalid
    const reachTouchedAndEmpty = f.reach === undefined && f.name !== ""; // Show error only if feature has other content
    const impactTouchedAndEmpty = f.impact === "" && f.name !== ""; // User selected then reverted to "Select"
    const confidenceTouchedAndEmpty = f.confidence === "" && f.name !== "";
    const effortTouchedAndEmpty = f.effort === "" && f.name !== "";

    return (
      <TableRow key={f.id}>
        <TableCell>
          <TextField
            aria-label="Feature Name"
            value={f.name}
            onChange={(e) => updateFeature(f.id, "name", e.target.value)}
            placeholder="Feature Name"
            size="small"
            fullWidth
            variant="outlined"
          />
        </TableCell>
        <TableCell align="left">
          <TextField
            aria-label="Reach per quarter"
            type="number"
            inputProps={{ min: 0, step: 1 }}
            value={f.reach ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              const num = v === "" ? undefined : Number(v);
              updateFeature(f.id, "reach", (Number.isFinite(num as number) ? (num as number) : undefined) as any);
            }}
            error={invalidReach || reachTouchedAndEmpty}
            size="small"
            sx={{ width: 120 }}
            variant="outlined"
          />
        </TableCell>
        <TableCell align="left">
          <FormControl size="small" sx={{ width: 140 }} error={impactTouchedAndEmpty}>
            <Select
              aria-label="Impact"
              value={(f.impact as string) ?? ""}
              onChange={(e) => updateFeature(f.id, "impact", e.target.value as ImpactLabel)}
              displayEmpty
              variant="outlined"
            >
              <MenuItem value="">Select</MenuItem>
              {impactOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
        <TableCell align="left">
          <FormControl size="small" sx={{ width: 120 }} error={confidenceTouchedAndEmpty}>
            <Select
              aria-label="Confidence"
              value={(f.confidence as string) ?? ""}
              onChange={(e) => updateFeature(f.id, "confidence", e.target.value as ConfidenceLabel)}
              displayEmpty
              variant="outlined"
            >
              <MenuItem value="">Select</MenuItem>
              {confidenceOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
        <TableCell align="left">
          <FormControl size="small" sx={{ width: 120 }} error={effortTouchedAndEmpty}>
            <Select
              aria-label="Effort"
              value={(f.effort as string) ?? ""}
              onChange={(e) => updateFeature(f.id, "effort", e.target.value as EffortSize)}
              displayEmpty
              variant="outlined"
            >
              <MenuItem value="">Select</MenuItem>
              {effortOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </TableCell>
        <TableCell align="right" sx={{ fontVariantNumeric: 'tabular-nums' }}>
          {scoreDisplay}
        </TableCell>
        <TableCell align="center">
          <Tooltip title={`Delete ${f.name || "feature"}`}>
            <IconButton
              onClick={() => deleteFeature(f.id)}
              onKeyDown={(e) => handleKeyDown(e, () => deleteFeature(f.id))}
              aria-label={`Delete feature: ${f.name || "unnamed"}`}
              color="error"
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>
    );
  }, [updateFeature, deleteFeature, handleKeyDown]);

  const { hasErrors, errors } = getConsolidatedErrors();

  return (
    <Box component="section" aria-label="RICE table" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <ImportExportMenu
          features={features}
          onImport={(imported, mode) => {
            applyUpdate(() => (mode === "replace" ? imported : features.concat(imported)));
          }}
        />
        <Button
          variant="outlined"
          color="error"
          onClick={() => applyUpdate(() => [])}
          disabled={features.length === 0}
          size="small"
        >
          Clear All
        </Button>
      </Box>

      {hasErrors && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" component="div">
            Please fix the following issues:
          </Typography>
          <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
            {errors.map((error, index) => (
              <li key={index}>
                <Typography variant="body2">{error}</Typography>
              </li>
            ))}
          </ul>
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table aria-label="RICE prioritization features table">
          <TableHead>
            <TableRow>
              <TableCell>Feature Name</TableCell>
              <TableCell align="left">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Reach (customers per quarter)
                  <Tooltip title="The number of customers this feature will reach in a given quarter. This represents the scale of potential impact - how many people will use or benefit from this feature.">
                    <HelpIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="left">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Feature Impact
                  <Tooltip title="How much this feature will impact each customer. Massive=3 (game-changing), High=2 (significant improvement), Medium=1 (moderate improvement), Low=0.5 (minor improvement), Minimal=0.25 (barely noticeable).">
                    <HelpIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="left">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Confidence
                  <Tooltip title="How confident you are in your estimates for reach and impact. 100% = completely certain, 80% = confident but some uncertainty, 50% = uncertain or experimental.">
                    <HelpIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="left">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  Effort
                  <Tooltip title="The amount of work required to implement this feature. XS=0.5 (very quick), S=1 (small task), M=2 (medium project), L=4 (large project), XL=8 (very large project).">
                    <HelpIcon fontSize="small" color="action" />
                  </Tooltip>
                </Box>
              </TableCell>
              <TableCell align="right">RICE Score</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedFeatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: 'text.secondary' }}>
                  No features yet. Click "Add feature" to get started.
                </TableCell>
              </TableRow>
            ) : (
              sortedFeatures.map((f) => renderRow(f))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={addFeature}
          onKeyDown={(e) => handleKeyDown(e, addFeature)}
          aria-label="Add new feature to the table"
          sx={{ 
            bgcolor: 'success.main',
            '&:hover': { bgcolor: 'success.dark' }
          }}
        >
          Add Feature
        </Button>
      </Box>
    </Box>
  );
});

export default RiceTable;


