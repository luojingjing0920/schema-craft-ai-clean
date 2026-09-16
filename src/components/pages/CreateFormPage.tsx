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
  justifyContent: "flex-start",
  textTransform: "none",
  fontWeight: 600,
  py: 1.5,
  px: 3,
  borderRadius: 2,
};

export default function CreateFormPage(): JSX.Element {
  return (
    <Box sx={PageStyles}>
      <Header
        title="SchemaCraft AI"
        subtitle="Visual JSON Schema Form Builder"
        iconPath="/json.svg"
      />

      <Box sx={ContentStyles}>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 420 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, textAlign: "center", mb: 1 }}>
            Start a new form
          </Typography>

          <Button variant="contained" component={Link} to="/builder" size="large" sx={ButtonStyles}>
            ➕ Create Blank Form
          </Button>

          <Button variant="outlined" component={Link} to="/create/ai" size="large" sx={ButtonStyles}>
            ✨ Generate with AI
          </Button>

          <Button variant="text" component={Link} to="/forms" size="large" sx={ButtonStyles}>
            📁 View Forms
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
