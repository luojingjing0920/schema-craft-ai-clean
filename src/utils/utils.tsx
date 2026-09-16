import type { Field } from "../types/field";
import { fieldTypeLabel, usesEnumOptions } from "./fieldTypeChange";
import type { FieldPreset } from "./fieldPresets";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function defaultField(preset: FieldPreset): Field {
  const id = uid();
  const label = fieldTypeLabel(preset);
  // Only free-text kinds start with an empty placeholder; select and radio have none.
  const acceptsPlaceholder =
    preset.dataType === "string" && preset.widget !== "select" && preset.widget !== "radio";
  return {
    id,
    dataType: preset.dataType,
    widget: preset.widget,
    format: preset.format,
    name: `${label}_${id}`,
    title:
      label === "textarea"
        ? "Text area"
        : label === "select"
        ? "Select field"
        : `${label.charAt(0).toUpperCase() + label.slice(1)} field`,
    required: false,
    options: usesEnumOptions(preset.dataType, preset.widget) ? ["Option 1", "Option 2"] : undefined,
    placeholder: acceptsPlaceholder ? "" : undefined,
    defaultValue: preset.dataType === "boolean" ? false : undefined,
    minimum: undefined,
    maximum: undefined,
  };
}
