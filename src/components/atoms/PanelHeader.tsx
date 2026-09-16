import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

interface PanelHeaderProps {
  title: string;
  /** Rendered at the trailing edge, e.g. a count chip or a small action button. */
  action?: ReactNode;
}

/** Shared workspace panel bar: compact, uppercase label, single bottom divider. */
const HeaderStyles = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  flex: "0 0 auto",
  minHeight: 36,
  px: 1.5,
  borderBottom: 1,
  borderColor: "divider",
};

const TitleStyles = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  lineHeight: 1.6,
  color: "text.secondary",
};

export default function PanelHeader({ title, action }: PanelHeaderProps) {
  return (
    <Box sx={HeaderStyles}>
      <Typography variant="overline" component="h2" sx={TitleStyles}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}
