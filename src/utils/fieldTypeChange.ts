import type { Field, FieldDataType, FieldWidget } from "../types/field";

/** Options seeded when a field becomes enum-backed but has none yet. */
export const SEEDED_OPTIONS = ["Option 1"];

/** Options belong to the enum-backed widgets only: a string rendered as a dropdown or radios. */
export function usesEnumOptions(dataType: FieldDataType, widget: FieldWidget): boolean {
  return dataType === "string" && (widget === "select" || widget === "radio");
}

/**
 * Derives the patch for switching a field to `nextDataType` + `nextWidget`.
 *
 * Rules are keyed off what the *target* configuration allows, not off individual
 * from -> to transitions. Anything owned by a data type or a widget that the target
 * does not have is dropped, so no stale configuration survives a switch.
 *
 * Field identity (id, title, name, description, help, required, disabled, width) is
 * never touched.
 */
export function deriveFieldTypeChangePatch(
  field: Field,
  nextDataType: FieldDataType,
  nextWidget: FieldWidget
): Partial<Field> {
  const patch: Partial<Field> = { dataType: nextDataType, widget: nextWidget };

  // defaultValue is only meaningful for the data type it was authored for.
  if (nextDataType !== field.dataType) patch.defaultValue = undefined;

  // Owned by the data type axis.
  if (nextDataType !== "string") {
    patch.placeholder = undefined;
    patch.format = undefined;
  }
  if (nextDataType !== "number") {
    patch.minimum = undefined;
    patch.maximum = undefined;
  }

  // Owned by the widget axis.
  if (nextWidget !== "textarea") patch.rows = undefined;
  if (nextWidget !== "radio") patch.inline = undefined;

  // options are the enum source for select/radio over a string.
  if (usesEnumOptions(nextDataType, nextWidget)) {
    if (!field.options) patch.options = [...SEEDED_OPTIONS];
  } else {
    patch.options = undefined;
  }

  return patch;
}

/**
 * Display label for a field's (dataType, widget) pair.
 *
 * Reproduces the labels the field list showed before dataType and widget were split,
 * so Text / Textarea / Select stay distinguishable instead of all reading "string".
 */
export function fieldTypeLabel(field: Pick<Field, "dataType" | "widget">): string {
  if (field.dataType !== "string") return field.dataType;
  if (field.widget === "textarea") return "textarea";
  if (field.widget === "select") return "select";
  if (field.widget === "radio") return "radio";
  return "string";
}
