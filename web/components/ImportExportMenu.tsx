
"use client";

import { useState, useRef } from "react";
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  ImportExport as ImportExportIcon,
  FileUpload as ImportIcon,
  SwapHoriz as ReplaceIcon,
  FileDownload as ExportIcon,
  Description as CsvIcon,
  DataObject as JsonIcon
} from '@mui/icons-material';
import { parseCsvToFeatures, parseJsonToFeatures, featuresToCsv, featuresToJson, type CsvParseResult } from "@/lib/csv";
import type { Feature } from "@/lib/rice";

export default function ImportExportMenu({
  features,
  onImport
}: {
  features: Feature[];
  onImport: (features: Feature[], mode: "replace" | "append") => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    const lower = file.name.toLowerCase();
    const parsed = lower.endsWith(".json") ? parseJsonToFeatures(text) : parseCsvToFeatures(text);
    setResult(parsed);
  };

  const triggerFileInput = (mode: "append" | "replace") => {
    fileInputRef.current?.click();
    fileInputRef.current!.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        handleFile(file).then(() => {
          if (result && result.features.length > 0) {
            onImport(result.features, mode);
            setResult(null);
          }
        });
      }
    };
    handleClose();
  };

  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    download("features.csv", featuresToCsv(features), "text/csv");
    handleClose();
  };

  const handleExportJson = () => {
    download("features.json", featuresToJson(features), "application/json");
    handleClose();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        style={{ display: "none" }}
      />
      
      <Button
        variant="outlined"
        onClick={handleClick}
        startIcon={<ImportExportIcon />}
        aria-controls={open ? 'import-export-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        Import/Export Data
      </Button>
      
      <Menu
        id="import-export-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'import-export-button',
        }}
      >
        <MenuItem onClick={() => triggerFileInput("append")}>
          <ListItemIcon>
            <ImportIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import from CSV/JSON (Append)</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={() => triggerFileInput("replace")}>
          <ListItemIcon>
            <ReplaceIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Import from CSV/JSON (Replace)</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleExportCsv}>
          <ListItemIcon>
            <CsvIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to CSV</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleExportJson}>
          <ListItemIcon>
            <JsonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Export to JSON</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
