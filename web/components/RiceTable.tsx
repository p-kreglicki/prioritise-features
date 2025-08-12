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
  Tooltip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
    const missingReach = f.reach === undefined;
    const missingImpact = !f.impact;
    const missingConfidence = !f.confidence;
    const missingEffort = !f.effort;


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
            error={invalidReach}
            helperText={invalidReach ? "Reach must be a non-negative number" : missingReach ? "Reach is required" : ""}
            size="small"
            sx={{ width: 120 }}
            variant="outlined"
          />
        </TableCell>
        <TableCell align="left">
          <FormControl size="small" sx={{ width: 140 }} error={missingImpact}>
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
            {missingImpact && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                Impact is required
              </Typography>
            )}
          </FormControl>
        </TableCell>
        <TableCell align="left">
          <FormControl size="small" sx={{ width: 120 }} error={missingConfidence}>
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
            {missingConfidence && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                Confidence is required
              </Typography>
            )}
          </FormControl>
        </TableCell>
        <TableCell align="left">
          <FormControl size="small" sx={{ width: 120 }} error={missingEffort}>
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
            {missingEffort && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                Effort is required
              </Typography>
            )}
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

  return (
    <Box component="section" aria-label="RICE table" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Auto-sorted by RICE score
        </Typography>
        <Button
          variant="outlined"
          color="error"
          onClick={() => applyUpdate(() => [])}
          disabled={features.length === 0}
          size="small"
        >
          Clear Data
        </Button>
      </Box>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          <strong>Formula:</strong> (Reach × Impact × Confidence) ÷ Effort
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <strong>Reach</strong>: customers per quarter. <strong>Impact</strong>: Massive=3, High=2,
          Medium=1, Low=0.5, Minimal=0.25. <strong>Confidence</strong>: 100%=1.0, 80%=0.8, 50%=0.5.
          <strong> Effort</strong>: XS=0.5, S=1, M=2, L=4, XL=8.
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table aria-label="RICE prioritization features table">
          <TableHead>
            <TableRow>
              <TableCell>Feature Name</TableCell>
              <TableCell align="left" title="Reach: customers per quarter">Reach (customers per quarter)</TableCell>
              <TableCell align="left" title="Impact: Massive=3, High=2, Medium=1, Low=0.5, Minimal=0.25">Feature Impact</TableCell>
              <TableCell align="left" title="Confidence: 100%=1.0, 80%=0.8, 50%=0.5">Confidence</TableCell>
              <TableCell align="left" title="Effort: XS=0.5, S=1, M=2, L=4, XL=8">Effort</TableCell>
              <TableCell align="right">Score</TableCell>
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


