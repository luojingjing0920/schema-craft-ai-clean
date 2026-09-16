import type { Field } from "../types/field";
import type { FormLayoutConfig } from "../types/formDefinition";

/**
 * Width, as a percentage of the row, inherited by fields that carry no explicit override.
 * columns = 1 keeps the historical default: every field spans the full row.
 */
export const INHERITED_WIDTH: Record<FormLayoutConfig["columns"], number> = {
  1: 100,
  2: 50,
  3: 33,
  4: 25,
};

/**
 * Turns the form-level column count into per-field widths.
 *
 * Only fields with `width === undefined` inherit. An explicit width always wins — including
 * 100, which is how a field opts out of the columns and claims a row of its own.
 *
 * Returns a new array and never mutates the fields it is given.
 */
export function resolveFieldWidths(fields: Field[], columns: FormLayoutConfig["columns"]): Field[] {
  const inherited = INHERITED_WIDTH[columns];
  return fields.map((field) => (field.width === undefined ? { ...field, width: inherited } : field));
}
