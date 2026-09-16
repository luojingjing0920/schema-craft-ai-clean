import { Stack, TextField, Select, MenuItem, FormControlLabel, Checkbox, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import type { Field, FieldDataType, FieldWidget } from "../../types/field";
import { deriveFieldTypeChangePatch, usesEnumOptions } from "../../utils/fieldTypeChange";

interface FieldSettingsFormProps {
  field: Field;
  onUpdate: (patch: Partial<Field>) => void;
}

// The single field-kind selector stays as-is for the user; each entry maps onto a (dataType, widget) pair.
const TYPE_OPTIONS: { dataType: FieldDataType; widget: FieldWidget; label: string }[] = [
  { dataType: "string", widget: "text", label: "📝 Text" },
  { dataType: "number", widget: "text", label: "🔢 Number" },
  { dataType: "boolean", widget: "checkbox", label: "☑️ Boolean" },
  { dataType: "string", widget: "select", label: "📋 Select" },
  { dataType: "string", widget: "textarea", label: "📄 Textarea" },
];

function typeKey(dataType: FieldDataType, widget: FieldWidget): string {
  return `${dataType}:${widget}`;
}

/** Which selector entry a field belongs to. A radio over a string stays under "Select". */
function presetOf(field: Field): { dataType: FieldDataType; widget: FieldWidget } {
  if (field.dataType === "number") return { dataType: "number", widget: "text" };
  if (field.dataType === "boolean") return { dataType: "boolean", widget: "checkbox" };
  if (field.widget === "textarea") return { dataType: "string", widget: "textarea" };
  if (field.widget === "select" || field.widget === "radio") return { dataType: "string", widget: "select" };
  return { dataType: "string", widget: "text" };
}

export default function FieldSettingsForm({ field, onUpdate }: FieldSettingsFormProps) {
  const [optionsText, setOptionsText] = useState("");

  // Update local state when field changes
  useEffect(() => {
    setOptionsText((field.options || []).join(", "));
  }, [field.options]);

  const preset = presetOf(field);
  const isEnumString = usesEnumOptions(field.dataType, field.widget);
  const defaultWidget: FieldWidget = field.dataType === "boolean" ? "checkbox" : "select";

  const handleTypeChange = (e: any) => {
    const next = TYPE_OPTIONS.find((option) => typeKey(option.dataType, option.widget) === e.target.value);
    if (!next) return;
    onUpdate(deriveFieldTypeChangePatch(field, next.dataType, next.widget));
  };

  const handleWidgetChange = (widget: FieldWidget) => {
    onUpdate(deriveFieldTypeChangePatch(field, field.dataType, widget));
  };

  return (
    <Stack spacing={2.5} paddingTop={1}>
      <TextField
        label="Field Title"
        value={field?.title || ""}
        onChange={(e) => onUpdate({ title: e.target.value })}
        size="small"
        variant="outlined"
        fullWidth
      />
      <TextField
        label="Field Name"
        value={field?.name || ""}
        onChange={(e) => onUpdate({ name: e.target.value })}
        size="small"
        variant="outlined"
        fullWidth
      />

      <TextField
        label="Description"
        value={field?.description || ""}
        onChange={(e) => onUpdate({ description: e.target.value })}
        size="small"
        multiline
        rows={2}
        placeholder="Field description (optional)"
        fullWidth
      />

      <TextField
        label="Help Text"
        value={field?.help || ""}
        onChange={(e) => onUpdate({ help: e.target.value })}
        size="small"
        placeholder="Help text shown below field"
        fullWidth
      />

      <Stack direction="row" spacing={2} alignItems="center">
        <Select
          value={typeKey(preset.dataType, preset.widget)}
          onChange={handleTypeChange}
          size="small"
          sx={{ width: '100%' }}
        >
          {TYPE_OPTIONS.map((option) => (
            <MenuItem key={typeKey(option.dataType, option.widget)} value={typeKey(option.dataType, option.widget)}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <FormControlLabel
        control={<Checkbox checked={!!field?.required} onChange={(e) => onUpdate({ required: e.target.checked })} />}
        label="Required"
      />

      <TextField
        label="Width (%)"
        type="number"
        value={field?.width ?? 100}
        onChange={(e) => {
          const width = Number(e.target.value);
          onUpdate({ width: width === 100 ? undefined : width });
        }}
        size="small"
        inputProps={{ min: 1, max: 100 }}
        helperText="Field width percentage (1-100). Use less than 100% to enable grid layout."
        fullWidth
      />

      {/* Widget selector */}
      {(field.dataType === "boolean" || isEnumString) && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: "60px", fontWeight: 500 }}>
            Widget:
          </Typography>
          <Select
            value={field.widget === "radio" ? "radio" : defaultWidget}
            onChange={(e) => handleWidgetChange(e.target.value as FieldWidget)}
            size="small"
            fullWidth
          >
            <MenuItem value={defaultWidget}>Default</MenuItem>
            <MenuItem value="radio">Radio</MenuItem>
          </Select>
        </Stack>
      )}

      {/* Additional UI options */}
      <Stack spacing={1}>
        {(field.widget === "radio" || field.dataType === "boolean") && (
          <FormControlLabel
            control={<Checkbox checked={!!field?.inline} onChange={(e) => onUpdate({ inline: e.target.checked })} />}
            label="Display inline"
          />
        )}

        <FormControlLabel
          control={<Checkbox checked={!!field?.disabled} onChange={(e) => onUpdate({ disabled: e.target.checked })} />}
          label="Disabled"
        />
      </Stack>

      {/* Type-specific fields */}
      {isEnumString && (
        <TextField
          label="Options (comma separated)"
          value={optionsText}
          onChange={(e) => {
            setOptionsText(e.target.value);
          }}
          onBlur={() => {
            const newOptions = optionsText
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
            onUpdate({
              options: newOptions,
            });
          }}
          size="small"
          multiline
          rows={3}
          fullWidth
        />
      )}

      {field.dataType === "string" && field.widget !== "textarea" && (
        <Stack spacing={2}>
          <TextField
            label="Placeholder"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            size="small"
            fullWidth
          />
          <TextField
            label="Default Value"
            value={(field.defaultValue as string) || ""}
            onChange={(e) => onUpdate({ defaultValue: e.target.value === "" ? undefined : e.target.value })}
            size="small"
            fullWidth
          />
        </Stack>
      )}

      {field.dataType === "string" && field.widget === "textarea" && (
        <Stack spacing={2}>
          <TextField
            label="Placeholder"
            value={field.placeholder || ""}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            size="small"
            fullWidth
          />
          <TextField
            label="Default Value"
            value={(field.defaultValue as string) || ""}
            onChange={(e) => onUpdate({ defaultValue: e.target.value === "" ? undefined : e.target.value })}
            size="small"
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Rows"
            type="number"
            value={field.rows ?? 3}
            onChange={(e) => onUpdate({ rows: Number(e.target.value) || 3 })}
            size="small"
            inputProps={{ min: 1, max: 20 }}
            sx={{ maxWidth: 100 }}
          />
        </Stack>
      )}

      {field.dataType === "number" && (
        <Stack direction="row" spacing={1}>
          <TextField
            label="Min"
            type="number"
            value={field.minimum ?? ""}
            onChange={(e) => onUpdate({ minimum: e.target.value === "" ? undefined : Number(e.target.value) })}
            size="small"
          />
          <TextField
            label="Max"
            type="number"
            value={field.maximum ?? ""}
            onChange={(e) => onUpdate({ maximum: e.target.value === "" ? undefined : Number(e.target.value) })}
            size="small"
          />
          <TextField
            label="Default"
            type="number"
            value={field.defaultValue ?? ""}
            onChange={(e) => onUpdate({ defaultValue: e.target.value === "" ? undefined : Number(e.target.value) })}
            size="small"
          />
        </Stack>
      )}

      {field.dataType === "boolean" && (
        <FormControlLabel
          control={
            <Checkbox checked={!!field.defaultValue} onChange={(e) => onUpdate({ defaultValue: e.target.checked })} />
          }
          label="Default checked"
        />
      )}

      {isEnumString && (
        <TextField
          label="Default option"
          value={(field.defaultValue as string) || ""}
          onChange={(e) => onUpdate({ defaultValue: e.target.value })}
          size="small"
          fullWidth
        />
      )}
    </Stack>
  );
}
