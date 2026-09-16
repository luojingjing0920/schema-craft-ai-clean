import { useState, type JSX } from "react";
import { Button, Container, Stack, TextField, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AppShell from "../organisms/AppShell";

const ButtonStyles = {
  textTransform: "none",
  fontWeight: 600,
};

/**
 * The real shape of the AI entry point, minus the generation itself: the prompt is a controlled
 * field so wiring a request later means replacing the button handler, not restructuring the page.
 * Nothing is sent anywhere yet, so Generate stays disabled and says so in plain text.
 */
export default function AiCreatePage(): JSX.Element {
  const [prompt, setPrompt] = useState("");

  return (
    <AppShell>
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Generate with AI
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Describe the form you need, and review the draft before using it.
        </Typography>

        <TextField
          label="Describe your form"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          multiline
          rows={6}
          fullWidth
          placeholder="Create a job application form with name, email, education, skills and work experience."
          sx={{ mt: 3 }}
        />

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
          <Button
            variant="contained"
            disableElevation
            disabled
            startIcon={<AutoAwesomeIcon />}
            sx={ButtonStyles}
          >
            Generate draft
          </Button>
          <Typography variant="caption" color="text.secondary">
            AI generation is not connected yet.
          </Typography>
        </Stack>
      </Container>
    </AppShell>
  );
}
