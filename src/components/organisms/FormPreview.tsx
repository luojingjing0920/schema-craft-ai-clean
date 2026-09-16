import { Card, CardContent, Stack, Typography, Chip, Box, Paper, Button, alpha } from "@mui/material";
import { useState, useEffect } from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { customFields } from "../fields";
import CanvasFieldTemplate from "../fields/CanvasFieldTemplate";
import {
  CANVAS_ID_PREFIX,
  CANVAS_ID_SEPARATOR,
  type CanvasSelectionContext,
} from "../../utils/canvasSelection";

interface FormPreviewProps {
  fieldsCount: number;
  schema: any;
  uiSchema: any;
  onClearAll: () => void;
  title?: string;
  /** Only passed by the desktop canvas. Omitting it keeps the preview purely presentational. */
  selection?: CanvasSelectionContext;
}

const FormPreviewStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  borderRadius: 3,
};

const EmptyStateStyles = {
  width: 80,
  height: 80,
  borderRadius: "50%",
  bgcolor: alpha("#1976d2", 0.1),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  mx: "auto",
  mb: 2,
};

const FormStyles = {
  p: 3,
  bgcolor: "#fafafa",
  border: "1px dashed",
  borderColor: "divider",
  borderRadius: 2,
};

const ButtonStyles = {
  borderRadius: 2,
  py: 1.5,
  px: 3,
  textTransform: "none",
  fontWeight: 600,
  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.3)",
};

export default function FormPreview({
  fieldsCount,
  schema,
  uiSchema,
  onClearAll,
  title = "Live Preview",
  selection,
}: FormPreviewProps) {
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (fieldsCount === 0) {
      setFormData({});
    }
  }, [fieldsCount]);

  useEffect(() => {
    setFormData({});
  }, [schema]);

  // RJSF resolves an object's heading as `uiOptions.title ?? schema.title ?? title ?? name`, and
  // `Form` passes the id prefix ("root") as the root object's `name`, so an untitled root renders
  // a meaningless "root" heading. `ui:title` is the highest priority term, so blanking it removes
  // the heading using RJSF's own option — no schema change, no CSS, no DOM lookup.
  //
  // Only the uiSchema handed to <Form> is affected; the one we export, copy and show in the JSON
  // workspace is untouched, and it applies to the root only, so field labels are unaffected.
  const formUiSchema = { ...uiSchema, "ui:title": "" };

  const handleTestForm = () => {
    const form = document.querySelector("form");
    if (form) {
      const formData = new FormData(form);
      const data: any = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });
      alert(JSON.stringify(data, null, 2));
    }
  };

  return (
    <Card sx={FormPreviewStyles}>
      <CardContent sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
              React JSON Schema Form • Material-UI
            </Typography>
          </Box>
          {fieldsCount > 0 && (
            <Chip
              label={`${fieldsCount} field${fieldsCount !== 1 ? "s" : ""}`}
              color="success"
              variant="outlined"
              size="small"
            />
          )}
        </Stack>
      </CardContent>

      {fieldsCount === 0 ? (
        <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4 }}>
          <Box sx={{ textAlign: "center" }}>
            <Box sx={EmptyStateStyles}>
              <Typography variant="h3">📝</Typography>
            </Box>
            <Typography variant="h6" sx={{ color: "text.secondary", fontWeight: 500, mb: 1 }}>
              Ready to build your form
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Add fields from the left panel to start creating your form
            </Typography>
          </Box>
        </Box>
      ) : (
        <>
          <Box sx={{ flex: 1, overflow: "auto", px: 3, pb: 2 }}>
            <Paper sx={FormStyles}>
              <Form
                key={JSON.stringify(Object.keys(schema.properties || {}))}
                schema={schema}
                uiSchema={formUiSchema}
                formData={formData}
                formContext={{ formData, selection }}
                idPrefix={CANVAS_ID_PREFIX}
                idSeparator={CANVAS_ID_SEPARATOR}
                templates={selection ? { FieldTemplate: CanvasFieldTemplate } : undefined}
                onChange={({ formData: newFormData }) => setFormData(newFormData)}
                validator={validator}
                fields={customFields}
                onSubmit={({ formData }) => {
                  alert(JSON.stringify(formData, null, 2));
                }}
              >
                <div />
              </Form>
            </Paper>
          </Box>
          <Box sx={{ px: 3, pb: 3 }}>
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button variant="contained" onClick={handleTestForm} sx={ButtonStyles}>
                🚀 Test Form
              </Button>
              <Button variant="outlined" onClick={onClearAll} sx={ButtonStyles}>
                🗑️ Clear All
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Card>
  );
}
