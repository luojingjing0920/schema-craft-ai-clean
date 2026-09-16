import { type JSX } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { Link } from "react-router";
import Header from "../organisms/Header";

const PageStyles = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  bgcolor: "#fafafa",
};

const ContentStyles = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 3,
};

const ButtonStyles = {
  textTransform: "none",
  fontWeight: 600,
  borderRadius: 2,
};

export default function AiCreatePage(): JSX.Element {
  return (
    <Box sx={PageStyles}>
      <Header
        title="SchemaCraft AI"
        subtitle="Generate with AI"
        iconPath="/json.svg"
      />

      <Box sx={ContentStyles}>
        <Stack spacing={2} alignItems="center" sx={{ maxWidth: 480, textAlign: "center" }}>
          <Typography variant="h4" sx={{ opacity: 0.5 }}>
            ✨
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Generate with AI
          </Typography>

          <Chip label="Not implemented yet" size="small" color="warning" variant="outlined" />

          <Typography variant="body2" color="text.secondary">
            AI-assisted form generation is not available in this version. This page is a
            placeholder for that feature.
          </Typography>

          <Button variant="outlined" component={Link} to="/create" sx={ButtonStyles}>
            ← Back to Create
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
