import { useState, type JSX, type SetStateAction } from "react";
import { Box, Grid, Tabs, Tab, useMediaQuery, useTheme } from "@mui/material";
import Header from "../organisms/Header";
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
import { findFieldIndexByName } from "../../utils/canvasSelection";

type BuilderMode = "edit" | "preview" | "json";

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
  const [selected, setSelected] = useState<number | null>(null);
  // activeTab selects JSON Schema vs UI Schema; shared by the Edit sidebar and the JSON workspace.
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
    setSelected(fields.length);
  }

  // The canvas reports a field by name; `selected` stays the index it has always been.
  // Duplicate names resolve to the first match, which is a known limitation.
  function selectFieldByName(name: string) {
    const index = findFieldIndexByName(fields, name);
    setSelected(index === -1 ? null : index);
  }

  function updateFieldAt(index: number, patch: Partial<Field>) {
    setFields((s) => s.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeFieldAt(index: number) {
    setFields((s) => s.filter((_, i) => i !== index));
    setSelected((p) => (p === null ? null : p === index ? null : p > index ? p - 1 : p));
  }

  function moveFieldUpAt(index: number) {
    if (index <= 0) return;
    setFields((prev) => {
      const next = [...prev];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
    setSelected((s) => {
      if (s === null) return null;
      if (s === index) return index - 1;
      if (s === index - 1) return index;
      return s;
    });
  }

  function moveFieldDownAt(index: number) {
    setFields((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
    setSelected((s) => {
      if (s === null) return null;
      if (s === index) return index + 1;
      if (s === index + 1) return index;
      return s;
    });
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

  const handleClearAll = () => {
    setFields([]);
    setSelected(null);
  };

  const { schema, uiSchema } = buildSchemas(layoutFields);

  // Preview workspace: full-width form. FormPreview already fills its container, so no prop changes.
  const renderPreviewWorkspace = () => (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <FormPreview fieldsCount={fields.length} schema={schema} uiSchema={uiSchema} onClearAll={handleClearAll} />
    </Box>
  );

  // JSON workspace: reuses activeTab and the existing Copy/Save handlers. The markup mirrors the
  // FieldEditor sidebar on purpose — extracting a shared component is deliberately out of scope.
  const renderJsonWorkspace = () => (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ minHeight: 48 }}>
          <Tab label="📋 JSON Schema" />
          <Tab label="🎨 UI Schema" />
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, m: 2, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
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
              selectedIndex={selected}
              onAddField={addField}
              onSelectField={setSelected}
              onMoveFieldUp={moveFieldUpAt}
              onMoveFieldDown={moveFieldDownAt}
              onRemoveField={removeFieldAt}
            />
          </Box>
        );
      default:
        return (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <FieldEditor
              selectedField={selected !== null ? fields[selected] : null}
              inheritedWidth={inheritedWidth}
              onUpdateField={(patch) => selected !== null && updateFieldAt(selected, patch)}
              onShowFormSettings={() => setSelected(null)}
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

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#fafafa" }}>
      <Header
        title="SchemaCraft AI"
        subtitle="Visual JSON Schema Form Builder"
        iconPath="/json.svg"
      />

      {/* Workspace mode switch */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}>
        <Tabs value={mode} onChange={(_, newValue: BuilderMode) => setMode(newValue)} sx={{ minHeight: 48 }}>
          <Tab label="✏️ Edit" value="edit" />
          <Tab label="👁 Preview" value="preview" />
          <Tab label="📋 JSON" value="json" />
        </Tabs>
      </Box>

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
        /* Desktop Edit Layout — the original three-column workspace */
        <Grid container spacing={3} sx={{ flex: 1, minHeight: 0, overflow: "hidden", p: 3, pt: 2 }}>
          <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
            <FieldsList
              fields={fields}
              selectedIndex={selected}
              onAddField={addField}
              onSelectField={setSelected}
              onMoveFieldUp={moveFieldUpAt}
              onMoveFieldDown={moveFieldDownAt}
              onRemoveField={removeFieldAt}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
            <FormPreview
              fieldsCount={fields.length}
              schema={schema}
              uiSchema={uiSchema}
              onClearAll={handleClearAll}
              title="Form Canvas"
              selection={{
                selectedName: selected !== null ? fields[selected]?.name ?? null : null,
                fieldNames: fields.map((field) => field.name),
                onSelectField: selectFieldByName,
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
            <FieldEditor
              selectedField={selected !== null ? fields[selected] : null}
              inheritedWidth={inheritedWidth}
              onUpdateField={(patch) => selected !== null && updateFieldAt(selected, patch)}
              onShowFormSettings={() => setSelected(null)}
              formSettings={
                <FormLayoutSettings layout={formDefinition.layout} onUpdateLayout={updateLayout} />
              }
            />
          </Grid>
        </Grid>
      ) : (
        /* Desktop Preview / JSON Layout — single full-width workspace panel */
        <Box sx={{ flex: 1, p: 3, pt: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {mode === "preview" ? renderPreviewWorkspace() : renderJsonWorkspace()}
        </Box>
      )}
    </Box>
  );
}
