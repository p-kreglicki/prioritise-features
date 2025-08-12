"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Container, Typography, Box, Button } from "@mui/material";
import RiceTable from "@/components/RiceTable";
import ImportExportMenu from "@/components/ImportExportMenu";
import { useState, useEffect } from "react";
import type { Feature } from "@/lib/rice";

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

export default function Page() {
  const [features, setFeatures] = useState<Feature[]>([]);

  // Add a default feature row on startup if no features exist
  useEffect(() => {
    if (features.length === 0) {
      const nowIso = new Date().toISOString();
      const defaultFeature: Feature = {
        id: generateId(),
        name: "",
        description: "",
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
      };
      setFeatures([defaultFeature]);
    }
  }, [features.length]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          RICE Prioritization App
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Prioritize features using the RICE framework.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
          <ImportExportMenu
            features={features}
            onImport={(imported, mode) => {
              setFeatures((prev) => (mode === "replace" ? imported : prev.concat(imported)));
            }}
          />
        </Box>
        <RiceTable features={features} onChangeFeatures={setFeatures} />
      </Container>
    </ThemeProvider>
  );
}
