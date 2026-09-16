import { Chip, Box, Paper } from "@mui/material";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import { useState, useEffect } from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { customFields } from "../fields";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import CanvasFieldTemplate from "../fields/CanvasFieldTemplate";
import PanelHeader from "../atoms/PanelHeader";
import {
  CANVAS_ID_PREFIX,
  CANVAS_ID_SEPARATOR,
  toCanvasDndId,
  type CanvasContext,
} from "../../utils/canvasSelection";

interface FormPreviewProps {
  fieldsCount: number;
  schema: any;
  uiSchema: any;
  title?: string;
  /** Only passed by the desktop canvas. Omitting it keeps the preview purely presentational. */
  canvas?: CanvasContext;
}

/** Panel chrome comes from the workspace layout; this fills its column frame-free. */
const PanelStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  bgcolor: "background.paper",
};

/** The canvas surface the form sheet sits on. */
const CanvasStyles = {
  flex: 1,
  overflow: "auto",
  p: 2,
  bgcolor: "grey.50",
};

const EmptyStateStyles = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 4,
  bgcolor: "grey.50",
};

const FormStyles = {
  p: 2.5,
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
};

const CountChipStyles = {
  height: 20,
  fontSize: "0.6875rem",
  fontWeight: 600,
};

export default function FormPreview({
  fieldsCount,
  schema,
  uiSchema,
  title = "Live Preview",
  canvas,
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

  return (
    <Box sx={PanelStyles}>
      <PanelHeader
        title={title}
        action={
          fieldsCount > 0 ? (
            <Chip
              label={`${fieldsCount} field${fieldsCount !== 1 ? "s" : ""}`}
              variant="outlined"
              size="small"
              sx={CountChipStyles}
            />
          ) : undefined
        }
      />

      {fieldsCount === 0 ? (
        <Box sx={EmptyStateStyles}>
          <Box sx={{ textAlign: "center" }}>
            <AddBoxOutlinedIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Box sx={{ fontWeight: 600, fontSize: "0.875rem", mb: 0.5 }}>No fields yet</Box>
            <Box sx={{ fontSize: "0.8125rem", color: "text.secondary" }}>
              Add a component from the library to start building.
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={CanvasStyles}>
          <Paper elevation={0} sx={FormStyles}>
            <SortableContext
              items={canvas ? canvas.fields.map((field) => toCanvasDndId(field.id)) : []}
              strategy={rectSortingStrategy}
            >
            <Form
              key={JSON.stringify(Object.keys(schema.properties || {}))}
              schema={schema}
              uiSchema={formUiSchema}
              formData={formData}
              formContext={{ formData, canvas }}
              idPrefix={CANVAS_ID_PREFIX}
              idSeparator={CANVAS_ID_SEPARATOR}
              templates={canvas ? { FieldTemplate: CanvasFieldTemplate } : undefined}
              onChange={({ formData: newFormData }) => setFormData(newFormData)}
              validator={validator}
              fields={customFields}
              onSubmit={({ formData }) => {
                alert(JSON.stringify(formData, null, 2));
              }}
            >
              <div />
            </Form>
            </SortableContext>
          </Paper>
        </Box>
      )}
    </Box>
  );
}
