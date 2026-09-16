import { type JSX } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { Link } from "react-router";
import AppShell from "../organisms/AppShell";

const ButtonStyles = {
  textTransform: "none",
  fontWeight: 600,
};

/**
 * The saved-forms page. Nothing is persisted yet, so the body is an empty state; the list that
 * replaces it lands with storage, which is why "New Form" leads to /create (the place that
 * chooses blank vs AI) rather than straight into the builder.
 */
export default function FormsPage(): JSX.Element {
  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Forms
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Saved forms will appear here.
            </Typography>
          </Box>

          <Button
            variant="contained"
            disableElevation
            component={Link}
            to="/create"
            startIcon={<AddIcon />}
            sx={ButtonStyles}
          >
            New Form
          </Button>
        </Stack>

        <Box sx={{ mt: 8, textAlign: "center" }}>
          <FolderOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
          <Typography sx={{ fontWeight: 600, mt: 1 }}>No forms yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Saving forms is not available yet. Create a form to get started.
          </Typography>
          <Button
            variant="outlined"
            component={Link}
            to="/create"
            sx={{ ...ButtonStyles, mt: 2, borderRadius: 1 }}
          >
            Create Form
          </Button>
        </Box>
      </Container>
    </AppShell>
  );
}
