import { useState, type JSX, type SetStateAction } from "react";
import { Box, Tab, Tabs, useMediaQuery, useTheme } from "@mui/material";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import BuilderTopbar, { type BuilderMode } from "../organisms/BuilderTopbar";
import FieldsList from "../organisms/FieldsList";
import FormPreview from "../organisms/FormPreview";
import FieldEditor from "../organisms/FieldEditor";
import SchemaOutput from "../molecules/SchemaOutput";
import type { Field } from "../../types/field";
import type { FieldPreset } from "../../utils/fieldPresets";
import FormLayoutSettings from "../molecules/FormLayoutSettings";
import type { FormDefinition, FormLayoutConfig } from "../../types/formDefinition";
import { defaultField } from "../../utils/utils";
import { createFormDefinition } from "../../utils/formDefinition";
import { buildSchemas } from "../../utils/schemaConverter";
import { INHERITED_WIDTH, resolveFieldWidths } from "../../utils/formLayout";
import {
  duplicateField,
  moveFieldById,
  moveFieldToIndex,
  otherFieldNames,
  removeFieldById,
  updateFieldById,
} from "../../utils/fieldOperations";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { fromDndId, type CanvasContext } from "../../utils/canvasSelection";

/** Desktop three-pane workspace: fixed rails, canvas takes what is left. */
const LeftRailStyles = {
  width: 272,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  borderRight: 1,
  borderColor: "divider",
};

const CanvasColumnStyles = {
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  bgcolor: "background.paper",
};

const RightRailStyles = {
  width: 320,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  borderLeft: 1,
  borderColor: "divider",
};

/** Preview and JSON read better as a centred sheet than as a full-bleed panel. */
const WorkspaceSurfaceStyles = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  bgcolor: "grey.50",
  p: 2,
};

const WorkspaceSheetStyles = {
  width: "100%",
  mx: "auto",
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  bgcolor: "background.paper",
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
};

const SchemaTabsStyles = {
  minHeight: 40,
  "& .MuiTab-root": {
    minHeight: 40,
    py: 0.5,
    textTransform: "none",
    fontSize: "0.8125rem",
    fontWeight: 600,
  },
};

export default function BuilderPage(): JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  const [formDefinition, setFormDefinition] = useState<FormDefinition>(createFormDefinition);

  // formDefinition is the single source of truth; fields is only a derived alias, not a second state.
  const fields = formDefinition.fields;

  // Form-level columns become per-field widths before any schema is built, so every consumer
  // (preview, JSON workspace, copy, save) sees the same effective layout.
  const layoutFields = resolveFieldWidths(fields, formDefinition.layout.columns);

  // Surfaced in the field settings as a hint; it is never written back onto any field.
  const inheritedWidth = INHERITED_WIDTH[formDefinition.layout.columns];

  // Workspace mode is the only source of truth for what the builder shows, on desktop and mobile alike.
  const [mode, setMode] = useState<BuilderMode>("edit");
  // Field.id is the builder's stable identity. Selection is never an array position.
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const selectedField = fields.find((field) => field.id === selectedFieldId) ?? null;
  // activeTab selects JSON Schema vs UI Schema inside the JSON workspace, and which file Save writes.
  const [activeTab, setActiveTab] = useState<number>(0);
  // mobileTab only picks a panel inside the mobile Edit workspace (0 = Fields, 1 = Settings).
  const [mobileTab, setMobileTab] = useState<number>(0);

  // Adapter preserving the React SetStateAction<Field[]> call shape so the field handlers
  // below keep working unchanged. Writes land in formDefinition.fields and refresh updatedAt.
  function setFields(action: SetStateAction<Field[]>) {
    const updatedAt = new Date().toISOString();
    setFormDefinition((prev) => ({
      ...prev,
      fields: typeof action === "function" ? action(prev.fields) : action,
      updatedAt,
    }));
  }

  // Same write path as setFields: one state, patched and stamped with a fresh updatedAt.
  function updateLayout(patch: Partial<FormLayoutConfig>) {
    const updatedAt = new Date().toISOString();
    setFormDefinition((prev) => ({
      ...prev,
      layout: { ...prev.layout, ...patch },
      updatedAt,
    }));
  }

  function addField(preset: FieldPreset) {
    const newField = defaultField(preset);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }

  function duplicateFieldById(id: string) {
    const result = duplicateField(fields, id);
    if (!result) return;
    setFields(result.fields);
    setSelectedFieldId(result.newField.id);
  }

  // A rail click selects, a rail drag reorders: the 5px threshold keeps them apart.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setFields((prev) => moveFieldToIndex(prev, fromDndId(String(active.id)), fromDndId(String(over.id))));
  }

  function updateField(id: string, patch: Partial<Field>) {
    setFields((prev) => updateFieldById(prev, id, patch));
  }

  function removeField(id: string) {
    setFields((prev) => removeFieldById(prev, id));
    setSelectedFieldId((current) => (current === id ? null : current));
  }

  // Reordering needs no selection fix-up: identity travels with the field, not the slot.
  function moveFieldUp(id: string) {
    setFields((prev) => moveFieldById(prev, id, -1));
  }

  function moveFieldDown(id: string) {
    setFields((prev) => moveFieldById(prev, id, 1));
  }

  const handleCopySchema = (isJsonSchema: boolean) => {
    const content = isJsonSchema
      ? JSON.stringify(buildSchemas(layoutFields).schema, null, 2)
      : JSON.stringify(buildSchemas(layoutFields).uiSchema, null, 2);
    navigator.clipboard?.writeText(content);
  };

  const handleSaveSchema = (isJsonSchema: boolean) => {
    const content = isJsonSchema
      ? JSON.stringify(buildSchemas(layoutFields).schema, null, 2)
      : JSON.stringify(buildSchemas(layoutFields).uiSchema, null, 2);
    const filename = isJsonSchema ? "schema.json" : "uiSchema.json";
    const blob = new Blob([content], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const { schema, uiSchema } = buildSchemas(layoutFields);

  // Preview workspace: full-width form. FormPreview already fills its container, so no prop changes.
  const renderPreviewWorkspace = () => (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FormPreview fieldsCount={fields.length} schema={schema} uiSchema={uiSchema} />
    </Box>
  );

  // JSON workspace: reuses activeTab and the existing Copy/Save handlers. The markup mirrors the
  // FieldEditor sidebar on purpose — extracting a shared component is deliberately out of scope.
  const renderJsonWorkspace = () => (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={SchemaTabsStyles}
        >
          <Tab icon={<DataObjectOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="JSON Schema" />
          <Tab icon={<PaletteOutlinedIcon sx={{ fontSize: 16 }} />} iconPosition="start" label="UI Schema" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, p: 2, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <SchemaOutput
          content={activeTab === 0 ? JSON.stringify(schema, null, 2) : JSON.stringify(uiSchema, null, 2)}
          onCopy={() => handleCopySchema(activeTab === 0)}
          onSave={() => handleSaveSchema(activeTab === 0)}
        />
      </Box>
    </Box>
  );

  // Mobile Edit workspace: three columns cannot fit, so one panel at a time is shown instead.
  const renderMobileEditPanel = () => {
    switch (mobileTab) {
      case 0:
        return (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <FieldsList
              fields={fields}
              selectedFieldId={selectedFieldId}
              onAddField={addField}
              onSelectField={setSelectedFieldId}
              onMoveFieldUp={moveFieldUp}
              onMoveFieldDown={moveFieldDown}
              onRemoveField={removeField}
              showOutline
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <FieldEditor
              selectedField={selectedField}
              inheritedWidth={inheritedWidth}
              otherFieldNames={otherFieldNames(fields, selectedFieldId)}
              onUpdateField={(patch) => selectedFieldId !== null && updateField(selectedFieldId, patch)}
              onShowFormSettings={() => setSelectedFieldId(null)}
              formSettings={
                <FormLayoutSettings layout={formDefinition.layout} onUpdateLayout={updateLayout} />
              }
            />
          </Box>
        );
    }
  };

  // Mobile workspace: mode decides the view. The Fields/Settings switch only exists inside Edit.
  const renderMobileWorkspace = () => {
    switch (mode) {
      case "preview":
        return renderPreviewWorkspace();
      case "json":
        return renderJsonWorkspace();
      default:
        return renderMobileEditPanel();
    }
  };

  // The canvas exists in the desktop Edit workspace only: Preview stays purely presentational.
  // Mobile has no canvas, so its Fields tab keeps the outline instead — same handlers, no drag.
  const canvas: CanvasContext | undefined =
    mode === "edit" && !isMobile
      ? {
          selectedFieldId,
          fields: fields.map((field) => ({ id: field.id, name: field.name })),
          onSelectField: setSelectedFieldId,
          onDuplicate: duplicateFieldById,
          onDelete: removeField,
        }
      : undefined;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "background.default" }}>
      <BuilderTopbar
        formName={formDefinition.name}
        mode={mode}
        onModeChange={setMode}
        updatedAt={formDefinition.updatedAt}
        onSave={() => handleSaveSchema(activeTab === 0)}
      />

      {/* Mobile Layout */}
      {isMobile ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {mode === "edit" && (
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
              <Tabs
                value={mobileTab}
                onChange={(_, value) => setMobileTab(value)}
                variant="fullWidth"
                sx={{ minHeight: 48 }}
              >
                <Tab label="Fields" />
                <Tab label="Settings" />
              </Tabs>
            </Box>
          )}
          <Box sx={{ flex: 1, p: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {renderMobileWorkspace()}
          </Box>
        </Box>
      ) : mode === "edit" ? (
        /* Desktop Edit workspace: library + outline, canvas, inspector, separated by dividers. */
        <Box sx={{ flex: 1, display: "flex", minHeight: 0, overflow: "hidden" }}>
          <Box sx={LeftRailStyles}>
            <FieldsList
              fields={fields}
              selectedFieldId={selectedFieldId}
              onAddField={addField}
              onSelectField={setSelectedFieldId}
              onMoveFieldUp={moveFieldUp}
              onMoveFieldDown={moveFieldDown}
              onRemoveField={removeField}
            />
          </Box>

          <Box sx={CanvasColumnStyles}>
            <FormPreview
              fieldsCount={fields.length}
              schema={schema}
              uiSchema={uiSchema}
              title="Form Canvas"
              canvas={canvas}
            />
          </Box>

          <Box sx={RightRailStyles}>
            <FieldEditor
              selectedField={selectedField}
              inheritedWidth={inheritedWidth}
              otherFieldNames={otherFieldNames(fields, selectedFieldId)}
              onUpdateField={(patch) => selectedFieldId !== null && updateField(selectedFieldId, patch)}
              onShowFormSettings={() => setSelectedFieldId(null)}
              formSettings={
                <FormLayoutSettings layout={formDefinition.layout} onUpdateLayout={updateLayout} />
              }
            />
          </Box>
        </Box>
      ) : (
        /* Desktop Preview / JSON workspace — a centred sheet on the workspace surface. */
        <Box sx={WorkspaceSurfaceStyles}>
          <Box sx={{ ...WorkspaceSheetStyles, maxWidth: mode === "preview" ? 960 : 1200 }}>
            {mode === "preview" ? renderPreviewWorkspace() : renderJsonWorkspace()}
          </Box>
        </Box>
      )}
    </Box>
    </DndContext>
  );
}
