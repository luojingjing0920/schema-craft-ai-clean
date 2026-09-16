import type { Field, FieldDataType, FieldFormat, FieldWidget } from "../types/field";

/** The (dataType, widget, format) triple that defines what a field is. */
export interface FieldTypeConfig {
  dataType: FieldDataType;
  widget: FieldWidget;
  format?: FieldFormat;
}

/**
 * Explicit, stable keys. They have to be explicit because Email and Date share
 * `string` + `text` and differ only by format, so a derived key could not tell them apart.
 */
export type FieldPresetKey =
  | "text"
  | "number"
  | "boolean"
  | "select"
  | "textarea"
  | "email"
  | "password"
  | "date"
  | "radio";

export interface FieldPreset extends FieldTypeConfig {
  key: FieldPresetKey;
  /** Settings selector label, rendered together with `icon`. */
  label: string;
  icon: string;
  /** Palette button label, rendered together with `icon`. */
  paletteLabel: string;
}

/** The one source of truth for the field kinds the builder can create. */
export const FIELD_PRESETS: FieldPreset[] = [
  { key: "text", label: "Text", icon: "📝", paletteLabel: "Text Input", dataType: "string", widget: "text" },
  { key: "number", label: "Number", icon: "🔢", paletteLabel: "Number Input", dataType: "number", widget: "text" },
  { key: "boolean", label: "Boolean", icon: "☑️", paletteLabel: "Checkbox", dataType: "boolean", widget: "checkbox" },
  { key: "select", label: "Select", icon: "📋", paletteLabel: "Select Dropdown", dataType: "string", widget: "select" },
  { key: "textarea", label: "Textarea", icon: "📄", paletteLabel: "Text Area", dataType: "string", widget: "textarea" },
  { key: "email", label: "Email", icon: "📧", paletteLabel: "Email", dataType: "string", widget: "text", format: "email" },
  { key: "password", label: "Password", icon: "🔒", paletteLabel: "Password", dataType: "string", widget: "password" },
  { key: "date", label: "Date", icon: "📅", paletteLabel: "Date", dataType: "string", widget: "text", format: "date" },
  { key: "radio", label: "Radio", icon: "🔘", paletteLabel: "Radio Buttons", dataType: "string", widget: "radio" },
];

/** Used when a field matches no preset exactly, e.g. a boolean rendered as radios. */
const FALLBACK_KEY: Record<FieldDataType, FieldPresetKey> = {
  string: "text",
  number: "number",
  boolean: "boolean",
};

function matches(config: FieldTypeConfig, preset: FieldPreset): boolean {
  return (
    preset.dataType === config.dataType &&
    preset.widget === config.widget &&
    preset.format === config.format
  );
}

/**
 * Identifies which preset a field belongs to.
 *
 * Matching is exact on all three axes, which is what keeps Email and Date from collapsing
 * into Text. A field with no exact match (a boolean rendered as radios) falls back to its
 * data type's preset rather than being mistaken for another kind.
 */
export function presetOf(field: Pick<Field, "dataType" | "widget" | "format">): FieldPreset {
  const match = FIELD_PRESETS.find((preset) => matches(field, preset));
  if (match) return match;
  return FIELD_PRESETS.find((preset) => preset.key === FALLBACK_KEY[field.dataType])!;
}

export function findPreset(key: string): FieldPreset | undefined {
  return FIELD_PRESETS.find((preset) => preset.key === key);
}
