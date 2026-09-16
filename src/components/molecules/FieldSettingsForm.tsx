import { Stack, TextField, Select, MenuItem, FormControlLabel, Checkbox, Typography } from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { useState, useEffect } from "react";
import type { Field, FieldWidget } from "../../types/field";
import { deriveFieldTypeChangePatch, usesEnumOptions } from "../../utils/fieldTypeChange";
import { FIELD_PRESETS, findPreset, presetOf } from "../../utils/fieldPresets";
import { FIELD_PRESET_ICONS } from "../../utils/fieldPalette";
import { validateFieldName } from "../../utils/fieldOperations";
import SettingsSection from "../atoms/SettingsSection";

interface FieldSettingsFormProps {
  field: Field;
  /** Width this field falls back to while it carries no override of its own. */
  inheritedWidth: number;
  /** Names already taken by the other fields, so duplicates can be rejected. */
  otherFieldNames: string[];
  onUpdate: (patch: Partial<Field>) => void;
}

/** Shared label column, so the inline rows line up with each other. */
const RowLabelStyles = {
  minWidth: 60,
  fontWeight: 500,
  color: "text.secondary",
};

export default function FieldSettingsForm({
  field,
  inheritedWidth,
  otherFieldNames,
  onUpdate,
}: FieldSettingsFormProps) {
  const [optionsText, setOptionsText] = useState("");
  // Draft so an invalid name never reaches the model. Resets when another field is edited.
  const [nameText, setNameText] = useState(field.name);

  // Update local state when field changes
  useEffect(() => {
    setOptionsText((field.options || []).join(", "));
  }, [field.options]);

  useEffect(() => {
    setNameText(field.name);
  }, [field.id, field.name]);

  const nameError = validateFieldName(nameText, otherFieldNames);

  const handleNameChange = (value: string) => {
    setNameText(value);
    // Only a usable name is written through; otherwise the model keeps its last valid value.
    if (!validateFieldName(value, otherFieldNames)) onUpdate({ name: value });
  };

  // The selector is preset driven: the user picks a field kind, not the underlying model axes.
  const preset = presetOf(field);
  const isEnumString = usesEnumOptions(field.dataType, field.widget);
  const isBoolean = field.dataType === "boolean";

  const handleTypeChange = (e: SelectChangeEvent) => {
    const next = findPreset(e.target.value);
    if (!next) return;
    onUpdate(deriveFieldTypeChangePatch(field, next));
  };

  const handleWidgetChange = (widget: FieldWidget) => {
    onUpdate(deriveFieldTypeChangePatch(field, { dataType: field.dataType, widget }));
  };

  return (
    <Stack spacing={3}>
      <SettingsSection title="Basic">
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
          value={nameText}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => {
            if (nameError) setNameText(field.name);
          }}
          error={!!nameError}
          helperText={nameError}
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

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={RowLabelStyles}>
            Type
          </Typography>
          <Select value={preset.key} onChange={handleTypeChange} size="small" sx={{ flex: 1 }}>
            {FIELD_PRESETS.map((option) => {
              const OptionIcon = FIELD_PRESET_ICONS[option.key];
              return (
                <MenuItem key={option.key} value={option.key}>
                  <OptionIcon sx={{ fontSize: 16, mr: 1, color: "text.secondary" }} />
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </Stack>
      </SettingsSection>

      <SettingsSection title="Validation">
        <FormControlLabel
          control={<Checkbox checked={!!field?.required} onChange={(e) => onUpdate({ required: e.target.checked })} />}
          label="Required"
        />

        {/* Widget selector — only booleans still need one; Select <-> Radio is a field kind now. */}
        {isBoolean && (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={RowLabelStyles}>
              Widget
            </Typography>
            <Select
              value={field.widget === "radio" ? "radio" : "checkbox"}
              onChange={(e) => handleWidgetChange(e.target.value as FieldWidget)}
              size="small"
              sx={{ flex: 1 }}
            >
              <MenuItem value="checkbox">Default</MenuItem>
              <MenuItem value="radio">Radio</MenuItem>
            </Select>
          </Stack>
        )}

        {/* Additional UI options */}
        <Stack spacing={0.5}>
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
          <Stack spacing={1.5}>
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
          <Stack spacing={1.5}>
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
      </SettingsSection>

      <SettingsSection title="Layout">
        <TextField
          label="Width Override (%)"
          type="number"
          value={field.width ?? ""}
          onChange={(e) => onUpdate({ width: e.target.value === "" ? undefined : Number(e.target.value) })}
          size="small"
          inputProps={{ min: 1, max: 100 }}
          placeholder={String(inheritedWidth)}
          helperText={
            field.width === undefined
              ? `Auto: ${inheritedWidth}% from the current column layout.`
              : "Explicit override. Clear the value to inherit the form column layout."
          }
          fullWidth
        />
      </SettingsSection>
    </Stack>
  );
}
