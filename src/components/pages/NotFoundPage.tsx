import { type JSX } from "react";
import { Button, Container, Stack, Typography } from "@mui/material";
import { Link } from "react-router";
import AppShell from "../organisms/AppShell";

const ButtonStyles = {
  mt: 1,
  textTransform: "none",
  fontWeight: 600,
};

export default function NotFoundPage(): JSX.Element {
  return (
    <AppShell>
      <Container
        maxWidth="sm"
        sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}
      >
        <Stack spacing={1.5} alignItems="center" sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ fontWeight: 700, color: "text.secondary" }}>
            404
          </Typography>

          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Page not found
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The page you&apos;re looking for doesn&apos;t exist.
          </Typography>

          <Button variant="contained" disableElevation component={Link} to="/create" sx={ButtonStyles}>
            Back to Create
          </Button>
        </Stack>
      </Container>
    </AppShell>
  );
}
