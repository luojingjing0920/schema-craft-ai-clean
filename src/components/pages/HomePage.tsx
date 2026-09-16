import { useState, type JSX, type SetStateAction } from "react";
import { Box, Grid, Tabs, Tab, useMediaQuery, useTheme } from "@mui/material";
import Header from "../organisms/Header";
import FieldsList from "../organisms/FieldsList";
import FormPreview from "../organisms/FormPreview";
import FieldEditor from "../organisms/FieldEditor";
import type { Field, FieldType } from "../../types/field";
import type { FormDefinition } from "../../types/formDefinition";
import { defaultField } from "../../utils/utils";
import { createFormDefinition } from "../../utils/formDefinition";
import { buildSchemas } from "../../utils/schemaConverter";

export default function HomePage(): JSX.Element {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [formDefinition, setFormDefinition] = useState<FormDefinition>(createFormDefinition);

  // formDefinition is the single source of truth; fields is only a derived alias, not a second state.
  const fields = formDefinition.fields;

  const [selected, setSelected] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);
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

  function addField(type: FieldType) {
    const newField = defaultField(type);
    setFields((prev) => [...prev, newField]);
    setSelected(fields.length);
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
      ? JSON.stringify(buildSchemas(fields).schema, null, 2)
      : JSON.stringify(buildSchemas(fields).uiSchema, null, 2);
    navigator.clipboard?.writeText(content);
  };

  const handleSaveSchema = (isJsonSchema: boolean) => {
    const content = isJsonSchema
      ? JSON.stringify(buildSchemas(fields).schema, null, 2)
      : JSON.stringify(buildSchemas(fields).uiSchema, null, 2);
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

  const { schema, uiSchema } = buildSchemas(fields);

  // Mobile tab content renderer
  const renderMobileTabContent = () => {
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
      case 1:
        return (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <FormPreview fieldsCount={fields.length} schema={schema} uiSchema={uiSchema} onClearAll={handleClearAll} />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <FieldEditor
              selectedField={selected !== null ? fields[selected] : null}
              activeTab={activeTab}
              jsonSchema={schema}
              uiSchema={uiSchema}
              onUpdateField={(patch) => selected !== null && updateFieldAt(selected, patch)}
              onTabChange={setActiveTab}
              onCopySchema={handleCopySchema}
              onSaveSchema={handleSaveSchema}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", bgcolor: "#fafafa" }}>
      <Header
        title="SchemaCraft AI"
        subtitle="Visual JSON Schema Form Builder"
        iconPath="/json.svg"
      />

      {/* Mobile Layout */}
      {isMobile ? (
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
            <Tabs 
              value={mobileTab} 
              onChange={(_, value) => setMobileTab(value)}
              variant="fullWidth"
              sx={{ minHeight: 48 }}
            >
              <Tab label="Fields" />
              <Tab label="Preview" />
              <Tab label="Schema" />
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, p: 2, minHeight: 0, display: "flex", flexDirection: "column" }}>
            {renderMobileTabContent()}
          </Box>
        </Box>
      ) : (
        /* Desktop Layout */
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
            <FormPreview fieldsCount={fields.length} schema={schema} uiSchema={uiSchema} onClearAll={handleClearAll} />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }} sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
            <FieldEditor
              selectedField={selected !== null ? fields[selected] : null}
              activeTab={activeTab}
              jsonSchema={schema}
              uiSchema={uiSchema}
              onUpdateField={(patch) => selected !== null && updateFieldAt(selected, patch)}
              onTabChange={setActiveTab}
              onCopySchema={handleCopySchema}
              onSaveSchema={handleSaveSchema}
            />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
