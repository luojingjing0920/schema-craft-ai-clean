import { Alert, Chip, Box, Paper, Typography } from "@mui/material";
import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import { useState, useEffect } from "react";
import Form from "@rjsf/mui";
import validator from "@rjsf/validator-ajv8";
import { customFields } from "../fields";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";
import CanvasFieldTemplate from "../fields/CanvasFieldTemplate";
import PanelHeader from "../atoms/PanelHeader";
import type { Field } from "../../types/field";
import type { FieldReaction } from "../../types/fieldReaction";
import { resolveFormLogic, type FormData } from "../../utils/fieldReactions";
import { buildRuntimeSchema, buildSubmissionData, fieldSignature } from "../../utils/formRuntime";
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
  /** Needed to evaluate conditional logic; unused when the canvas renders the form. */
  fields: Field[];
  reactions: FieldReaction[];
  /** Drives the submit button, which RJSF renders from `ui:submitButtonOptions`. */
  showSubmitButton: boolean;
  submitButtonText: string;
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
  // The app's blue-gray, so the canvas reads as a workspace behind the white form sheet rather
  // than as another panel next to the sidebars.
  bgcolor: "background.default",
};

const EmptyStateStyles = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  p: 4,
  bgcolor: "background.default",
};

const FormStyles = {
  p: 2.5,
  bgcolor: "background.paper",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 1,
};

/** Sits below the form sheet, at the same width, so it reads as the result of that form. */
const SubmittedStyles = {
  mt: 2,
  bgcolor: "background.paper",
  borderRadius: 1,
};

const SubmittedDataStyles = {
  m: 0,
  mt: 1,
  p: 1,
  maxHeight: 220,
  overflow: "auto",
  bgcolor: "grey.900",
  color: "grey.50",
  borderRadius: 1,
  fontSize: "0.75rem",
  fontFamily: "monospace",
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
  fields,
  reactions,
  showSubmitButton,
  submitButtonText,
  title = "Live Preview",
  canvas,
}: FormPreviewProps) {
  const [formData, setFormData] = useState<any>({});
  // The payload of the last successful submit, shown until the next edit or failed submit.
  const [submitted, setSubmitted] = useState<FormData | null>(null);

  /*
   * Two questions that look alike but must not share an answer.
   *
   * `fieldSet` answers "which fields exist". It is sorted, because dragging a field around only
   * rewrites the order of `properties` — treating that as a different form would throw away
   * everything the user has typed. `schema` is a fresh object on every builder render, so depending
   * on it directly would have the same effect for any unrelated re-render.
   */
  const fieldSet = fieldSignature(schema);

  /*
   * `renderKey` answers "has what RJSF draws changed". RJSF memoises deeply, so a reordered but
   * otherwise identical schema is judged unchanged and the canvas keeps showing the old order —
   * a drag would look like it did nothing. Remounting on an order change is what makes the reorder
   * visible; the entered values survive it, because the form data lives in this component's state
   * and is handed to the mounted form as a prop.
   */
  const renderKey = JSON.stringify(Object.keys(schema.properties ?? {}));

  useEffect(() => {
    if (fieldsCount === 0) {
      setFormData({});
    }
  }, [fieldsCount]);

  useEffect(() => {
    setFormData({});
    setSubmitted(null);
  }, [fieldSet]);

  // RJSF resolves an object's heading as `uiOptions.title ?? schema.title ?? title ?? name`, and
  // `Form` passes the id prefix ("root") as the root object's `name`, so an untitled root renders
  // a meaningless "root" heading. `ui:title` is the highest priority term, so blanking it removes
  // the heading using RJSF's own option — no schema change, no CSS, no DOM lookup.
  //
  // Only the uiSchema handed to <Form> is affected; the one we export, copy and show in the JSON
  // workspace is untouched, and it applies to the root only, so field labels are unaffected.
  const formUiSchema = { ...uiSchema, "ui:title": "" };

  /*
   * Conditional logic runs in Preview only. The Edit canvas keeps every field rendered so a hidden
   * target stays selectable and editable — a field that vanishes from the canvas while editing is
   * a field you cannot turn back on.
   *
   * Both derived objects are handed to <Form> alone. The exported, copied and displayed schemas are
   * the originals, so no reaction metadata ever leaves the builder.
   */
  const logicStates =
    canvas === undefined && reactions.length > 0 ? resolveFormLogic(fields, reactions, formData) : null;

  const runtimeSchema = buildRuntimeSchema(schema, fields, logicStates);

  const runtimeUiSchema = { ...formUiSchema };

  /*
   * RJSF renders its own submit button whenever the form is given no children, so this option has
   * to be set for every workspace — not just Preview. Leaving it unset in the canvas let RJSF fall
   * back to its own default button there: an unconfigured "SUBMIT" the form settings did not
   * control and could not switch off.
   *
   * Only Preview ever shows one, and only when the form asks for it.
   */
  runtimeUiSchema["ui:submitButtonOptions"] = {
    submitText: submitButtonText,
    norender: canvas !== undefined || !showSubmitButton,
    // MUI uppercases button labels by default; every other button in the app opts out.
    props: { sx: { textTransform: "none" } },
  };

  if (logicStates) {
    for (const field of fields) {
      const state = logicStates.get(field.id);
      if (!state) continue;

      // Hidden is handled in the schema (the property is dropped), so only disabled is written here.
      if (state.visible && state.enabled !== !field.disabled) {
        // Only written when a rule actually overrode the field's own disabled flag.
        runtimeUiSchema[field.name] = {
          ...(runtimeUiSchema[field.name] ?? {}),
          "ui:disabled": !state.enabled,
        };
      }
    }
  }

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
              key={renderKey}
              schema={runtimeSchema}
              uiSchema={runtimeUiSchema}
              formData={formData}
              formContext={{ formData, canvas }}
              idPrefix={CANVAS_ID_PREFIX}
              idSeparator={CANVAS_ID_SEPARATOR}
              templates={canvas ? { FieldTemplate: CanvasFieldTemplate } : undefined}
              onChange={({ formData: newFormData }) => {
                setFormData(newFormData);
                setSubmitted(null);
              }}
              validator={validator}
              fields={customFields}
              // Without this the browser's own validation intercepts the submit — required inputs
              // carry the HTML `required` attribute, so a failing submit never reaches RJSF and the
              // user gets a native tooltip instead of the form's error list.
              noHtml5Validate
              // RJSF renders its own submit button only when the form is given no children, so the
              // <div /> placeholder that used to sit here is what suppressed it. The payload is
              // filtered rather than the form data, so the user's hidden answers survive on screen.
              onSubmit={({ formData: submittedData }) => {
                setSubmitted(buildSubmissionData(fields, logicStates, submittedData));
              }}
              onError={() => setSubmitted(null)}
            />
            </SortableContext>
          </Paper>

          {submitted !== null && (
            <Alert severity="success" variant="outlined" sx={SubmittedStyles}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Submitted
              </Typography>
              <Typography variant="caption" color="text.secondary">
                This is the data a submit would carry. Nothing was sent — there is no backend yet.
              </Typography>
              <Box component="pre" sx={SubmittedDataStyles}>
                {JSON.stringify(submitted, null, 2)}
              </Box>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
