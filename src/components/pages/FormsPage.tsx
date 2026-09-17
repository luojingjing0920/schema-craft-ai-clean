import { useState, type JSX } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import { Link } from "react-router";
import AppShell from "../organisms/AppShell";
import FormListCard from "../molecules/FormListCard";
import { formStorage } from "../../utils/formStorage";
import { formDisplayName } from "../../utils/formDefinition";
import type { FormDefinition } from "../../types/formDefinition";

const ButtonStyles = {
  textTransform: "none",
  fontWeight: 600,
};

/**
 * Saved forms, read from local storage on mount. The header's Create Form leads to /create rather
 * than straight into the builder, because Create is where blank vs AI is chosen. The empty state
 * keeps its own Create Form CTA; the two are the same destination at different levels.
 */
export default function FormsPage(): JSX.Element {
  const [forms, setForms] = useState<FormDefinition[]>(() => formStorage.listForms());
  const [pendingDelete, setPendingDelete] = useState<FormDefinition | null>(null);

  const refresh = () => setForms(formStorage.listForms());

  const confirmDelete = () => {
    if (pendingDelete) formStorage.deleteForm(pendingDelete.id);
    setPendingDelete(null);
    refresh();
  };

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
            Create Form
          </Button>
        </Stack>

        {forms.length === 0 ? (
          <Box sx={{ mt: 8, textAlign: "center" }}>
            <FolderOutlinedIcon sx={{ fontSize: 40, color: "text.disabled" }} />
            <Typography sx={{ fontWeight: 600, mt: 1 }}>No forms yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Create a form to get started. Saved forms are kept in this browser.
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
        ) : (
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {forms.map((form) => (
              <Grid key={form.id} size={{ xs: 12, sm: 6 }}>
                <FormListCard form={form} onDelete={setPendingDelete} />
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={pendingDelete !== null} onClose={() => setPendingDelete(null)}>
          <DialogTitle>Delete form?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {pendingDelete ? `"${formDisplayName(pendingDelete)}"` : "This form"} will be removed
              from this browser. This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPendingDelete(null)} sx={ButtonStyles}>
              Cancel
            </Button>
            <Button variant="contained" disableElevation color="error" onClick={confirmDelete} sx={ButtonStyles}>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppShell>
  );
}
