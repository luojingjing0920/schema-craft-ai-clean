import { type JSX } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
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

export default function NotFoundPage(): JSX.Element {
  return (
    <Box sx={PageStyles}>
      <Header
        title="SchemaCraft AI"
        subtitle="Page not found"
        iconPath="/json.svg"
      />

      <Box sx={ContentStyles}>
        <Stack spacing={2} alignItems="center" sx={{ maxWidth: 480, textAlign: "center" }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: "text.secondary" }}>
            404
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            This page does not exist
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The URL you opened does not match any page in SchemaCraft AI.
          </Typography>

          <Button variant="contained" component={Link} to="/create" sx={ButtonStyles}>
            ← Back to Create
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
