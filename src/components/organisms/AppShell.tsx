import type { ReactNode } from "react";
import { Box } from "@mui/material";
import AppHeader from "./AppHeader";

interface AppShellProps {
  children: ReactNode;
}

/**
 * Chrome for the non-builder pages: the app header plus a full-height content region.
 *
 * The builder deliberately does not use this — BuilderPage renders its own BuilderTopbar and a
 * fixed-height workspace, so it stays outside the shell.
 */
export default function AppShell({ children }: AppShellProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <AppHeader />
      <Box component="main" sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {children}
      </Box>
    </Box>
  );
}
