import type { Field, FieldDataType, FieldWidget } from "../types/field";
import type { FieldTypeConfig } from "./fieldPresets";

/** Options seeded when a field becomes enum-backed but has none yet. */
export const SEEDED_OPTIONS = ["Option 1"];

/** Options belong to the enum-backed widgets only: a string rendered as a dropdown or radios. */
export function usesEnumOptions(dataType: FieldDataType, widget: FieldWidget): boolean {
  return dataType === "string" && (widget === "select" || widget === "radio");
}

/**
 * Derives the patch for switching a field over to `next`.
 *
 * Taking the target as one (dataType, widget, format) config keeps the three axes consistent
 * with each other, so a legal single value cannot be combined into an illegal field.
 *
 * Rules are keyed off what the *target* allows, not off individual from -> to transitions.
 * Anything owned by an axis the target does not have is dropped, so no stale configuration
 * survives a switch.
 *
 * Field identity (id, title, name, description, help, required, disabled, width) is never touched.
 */
export function deriveFieldTypeChangePatch(field: Field, next: FieldTypeConfig): Partial<Field> {
  const patch: Partial<Field> = {
    dataType: next.dataType,
    widget: next.widget,
    // format belongs to the target preset as a whole: Email sets it, every other kind clears it.
    format: next.format,
  };

  // defaultValue is only meaningful for the data type it was authored for.
  if (next.dataType !== field.dataType) patch.defaultValue = undefined;

  // Owned by the data type axis.
  if (next.dataType !== "string") patch.placeholder = undefined;
  if (next.dataType !== "number") {
    patch.minimum = undefined;
    patch.maximum = undefined;
  }

  // Owned by the widget axis.
  if (next.widget !== "textarea") patch.rows = undefined;
  if (next.widget !== "radio") patch.inline = undefined;

  // options are the enum source for select/radio over a string.
  if (usesEnumOptions(next.dataType, next.widget)) {
    if (!field.options) patch.options = [...SEEDED_OPTIONS];
  } else {
    patch.options = undefined;
  }

  return patch;
}

/**
 * Display label for a field's (dataType, widget, format) triple.
 *
 * Reproduces the labels the field list showed before dataType and widget were split, so
 * Text / Textarea / Select / Number / Boolean stay distinguishable instead of all reading "string".
 */
export function fieldTypeLabel(field: FieldTypeConfig): string {
  if (field.dataType !== "string") return field.dataType;
  if (field.format === "email") return "email";
  if (field.format === "date") return "date";
  if (field.widget === "password") return "password";
  if (field.widget === "textarea") return "textarea";
  if (field.widget === "select") return "select";
  if (field.widget === "radio") return "radio";
  return "string";
}
