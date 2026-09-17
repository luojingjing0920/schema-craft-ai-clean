import { useMemo, useRef, useState, type JSX } from "react";
import { Alert, Box, Button, Container, Stack, TextField, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AppShell from "../organisms/AppShell";
import FormPreview from "../organisms/FormPreview";
import { useNavigate } from "react-router";
import { AI_DRAFT_LIMITS, type FormDraftError } from "../../types/aiFormDraft";
import type { FormDefinition } from "../../types/formDefinition";
import { createFormDefinitionFromAIDraft } from "../../utils/aiFormDraft";
import { requestFormDraft } from "../../utils/formDraftClient";
import { buildSchemas } from "../../utils/schemaConverter";
import { resolveFieldWidths } from "../../utils/formLayout";
import { formStorage } from "../../utils/formStorage";

const ButtonStyles = {
  textTransform: "none",
  fontWeight: 600,
};

const PreviewFrameStyles = {
  height: "60vh",
  minHeight: 360,
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  overflow: "hidden",
};

const EXAMPLE = "Create a job application form with name, email, age, education, work experience and expected salary.";

/**
 * Turn a description into a form.
 *
 * Nothing reaches storage until the user says so: a draft lives in this component's state, so
 * regenerating as often as they like leaves no half-finished records behind.
 */
export default function AiCreatePage(): JSX.Element {
  const navigate = useNavigate();

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<FormDraftError | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);

  /**
   * The one converted instance, kept in state on purpose.
   *
   * Converting creates ids and timestamps, so calling it during render would hand the preview and
   * "Use in Builder" two different forms. Converting once, on success, is what makes those the
   * same object — what you preview is exactly what enters the builder.
   */
  const [previewDefinition, setPreviewDefinition] = useState<FormDefinition | null>(null);

  const inFlight = useRef<AbortController | null>(null);

  const preview = useMemo(() => {
    if (!previewDefinition) return null;
    const layoutFields = resolveFieldWidths(
      previewDefinition.fields,
      previewDefinition.layout.columns
    );
    return { definition: previewDefinition, ...buildSchemas(layoutFields) };
  }, [previewDefinition]);

  const generate = async () => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;

    setGenerating(true);
    setError(null);
    setSaveFailed(false);

    const result = await requestFormDraft(prompt, controller.signal);
    if (controller.signal.aborted) return;

    if (result.ok) {
      // Only a success replaces the preview; a failed regenerate leaves the last good draft alone.
      setPreviewDefinition(createFormDefinitionFromAIDraft(result.draft));
    } else {
      setError(result.error);
    }
    setGenerating(false);
  };

  const useInBuilder = () => {
    if (!previewDefinition) return;
    if (!formStorage.saveForm(previewDefinition)) {
      // Nothing was written, so the draft stays on screen and we stay put.
      setSaveFailed(true);
      return;
    }
    navigate(`/builder/${previewDefinition.id}`);
  };

  const tooLong = prompt.length > AI_DRAFT_LIMITS.promptMaxLength;

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
          rows={4}
          fullWidth
          disabled={generating}
          placeholder={EXAMPLE}
          error={tooLong}
          sx={{ mt: 3 }}
        />
        <Typography
          variant="caption"
          color={tooLong ? "error" : "text.secondary"}
          sx={{ display: "block", mt: 0.5, textAlign: "right" }}
        >
          {prompt.length} / {AI_DRAFT_LIMITS.promptMaxLength}
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1.5 }}>
          <Button
            variant="contained"
            disableElevation
            disabled={generating || prompt.trim() === "" || tooLong}
            startIcon={<AutoAwesomeIcon />}
            onClick={generate}
            sx={ButtonStyles}
          >
            {generating ? "Generating…" : previewDefinition ? "Regenerate" : "Generate draft"}
          </Button>
          {previewDefinition && !generating && (
            <Button variant="outlined" onClick={useInBuilder} sx={ButtonStyles}>
              Use in Builder
            </Button>
          )}
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">{error.message}</Typography>
            {error.errors && error.errors.length > 0 && (
              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                {error.errors.map((message) => (
                  <li key={message}>
                    <Typography variant="caption">{message}</Typography>
                  </li>
                ))}
              </Box>
            )}
          </Alert>
        )}

        {saveFailed && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Could not save the form to this browser, so it was not opened in the builder. Your draft
            is still here — try again.
          </Alert>
        )}
      </Container>

      {preview && (
        <Container maxWidth="md" sx={{ pb: 4 }}>
          <Box sx={PreviewFrameStyles}>
            {/* The same renderer the builder uses: no rails, no canvas, and no submit button, so
                none of the builder's editing affordances leak into a read-only draft. */}
            <FormPreview
              fieldsCount={preview.definition.fields.length}
              schema={preview.schema}
              uiSchema={preview.uiSchema}
              fields={preview.definition.fields}
              reactions={[]}
              showSubmitButton={false}
              submitButtonText={preview.definition.layout.submitButtonText}
              title="AI Draft"
            />
          </Box>
        </Container>
      )}
    </AppShell>
  );
}
