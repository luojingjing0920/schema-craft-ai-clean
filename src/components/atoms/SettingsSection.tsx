import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

const SectionStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 1,
};

const TitleStyles = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  lineHeight: 1.6,
  color: "text.secondary",
  pb: 0.5,
  borderBottom: 1,
  borderColor: "divider",
};

/** Labelled block inside the inspector, so settings read as groups rather than one long form. */
export default function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <Box component="section" sx={SectionStyles}>
      <Typography variant="overline" sx={TitleStyles}>
        {title}
      </Typography>
      <Stack spacing={1.5} sx={{ pt: 0.5 }}>
        {children}
      </Stack>
    </Box>
  );
}
