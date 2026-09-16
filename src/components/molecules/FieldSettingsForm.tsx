import { Stack, TextField, Select, MenuItem, FormControlLabel, Checkbox, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import type { Field, FieldWidget } from "../../types/field";
import { deriveFieldTypeChangePatch, usesEnumOptions } from "../../utils/fieldTypeChange";
import { FIELD_PRESETS, findPreset, presetOf } from "../../utils/fieldPresets";

interface FieldSettingsFormProps {
  field: Field;
  onUpdate: (patch: Partial<Field>) => void;
}

export default function FieldSettingsForm({ field, onUpdate }: FieldSettingsFormProps) {
  const [optionsText, setOptionsText] = useState("");

  // Update local state when field changes
  useEffect(() => {
    setOptionsText((field.options || []).join(", "));
  }, [field.options]);

  // The selector is preset driven: the user picks a field kind, not the underlying model axes.
  const preset = presetOf(field);
  const isEnumString = usesEnumOptions(field.dataType, field.widget);
  const isBoolean = field.dataType === "boolean";

  const handleTypeChange = (e: any) => {
    const next = findPreset(e.target.value);
    if (!next) return;
    onUpdate(deriveFieldTypeChangePatch(field, next));
  };

  const handleWidgetChange = (widget: FieldWidget) => {
    onUpdate(deriveFieldTypeChangePatch(field, { dataType: field.dataType, widget }));
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
        <Select value={preset.key} onChange={handleTypeChange} size="small" sx={{ width: '100%' }}>
          {FIELD_PRESETS.map((option) => (
            <MenuItem key={option.key} value={option.key}>
              {option.icon} {option.label}
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

      {/* Widget selector — only booleans still need one; Select <-> Radio is a field kind now. */}
      {isBoolean && (
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2" sx={{ minWidth: "60px", fontWeight: 500 }}>
            Widget:
          </Typography>
          <Select
            value={field.widget === "radio" ? "radio" : "checkbox"}
            onChange={(e) => handleWidgetChange(e.target.value as FieldWidget)}
            size="small"
            fullWidth
          >
            <MenuItem value="checkbox">Default</MenuItem>
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
