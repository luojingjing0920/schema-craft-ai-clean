import type { Field } from "../types/field";

/** Replaces the field carrying `id`. Every other field is returned untouched. */
export function updateFieldById(fields: Field[], id: string, patch: Partial<Field>): Field[] {
  return fields.map((field) => (field.id === id ? { ...field, ...patch } : field));
}

/** Drops the field carrying `id`. An unknown id leaves the list unchanged. */
export function removeFieldById(fields: Field[], id: string): Field[] {
  return fields.filter((field) => field.id !== id);
}

/**
 * Swaps a field with its neighbour. Returns the SAME array when the move cannot happen,
 * so callers can skip the state update entirely.
 *
 * Selection needs no fixing afterwards: identity travels with the field, not with the slot.
 */
export function moveFieldById(fields: Field[], id: string, direction: -1 | 1): Field[] {
  const index = fields.findIndex((field) => field.id === id);
  const target = index + direction;
  if (index === -1 || target < 0 || target >= fields.length) return fields;

  const next = [...fields];
  next[index] = fields[target];
  next[target] = fields[index];
  return next;
}

/** Names of every field except `excludeId`, for uniqueness checks that must ignore a field itself. */
export function otherFieldNames(fields: Pick<Field, "id" | "name">[], excludeId: string | null): string[] {
  return fields.filter((field) => field.id !== excludeId).map((field) => field.name.trim());
}

/** Error message for a proposed field name, or undefined when it is usable. */
export function validateFieldName(name: string, otherFieldNames: string[]): string | undefined {
  const trimmed = name.trim();
  if (trimmed === "") return "Field name is required.";
  if (otherFieldNames.includes(trimmed)) return "Field name must be unique.";
  return undefined;
}
