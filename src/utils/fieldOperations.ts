import type { Field } from "../types/field";
import { uid } from "./utils";

/** Moves the field carrying `id` to the position currently held by `targetId`. */
export function moveFieldToIndex(fields: Field[], id: string, targetId: string): Field[] {
  const from = fields.findIndex((field) => field.id === id);
  const to = fields.findIndex((field) => field.id === targetId);
  if (from === -1 || to === -1 || from === to) return fields;

  const next = [...fields];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** A free `_copy` style name: `email`, `email_copy`, `email_copy_2`, ... */
export function nextCopyName(name: string, takenNames: string[]): string {
  const base = `${name}_copy`;
  if (!takenNames.includes(base)) return base;

  let suffix = 2;
  while (takenNames.includes(`${base}_${suffix}`)) suffix += 1;
  return `${base}_${suffix}`;
}

export interface DuplicateResult {
  fields: Field[];
  /** The copy, so the caller can select it. */
  newField: Field;
}

/**
 * Inserts a copy of the field carrying `id` directly after it.
 *
 * The copy gets a fresh id and a unique name. `options` is the only nested value a field
 * holds, and it is cloned so the copy never shares a mutable array with the original.
 */
export function duplicateField(fields: Field[], id: string): DuplicateResult | null {
  const index = fields.findIndex((field) => field.id === id);
  if (index === -1) return null;

  const source = fields[index];
  const newField: Field = {
    ...source,
    id: uid(),
    name: nextCopyName(source.name, fields.map((field) => field.name)),
    title: `${source.title} Copy`,
    options: source.options ? [...source.options] : undefined,
  };

  return {
    fields: [...fields.slice(0, index + 1), newField, ...fields.slice(index + 1)],
    newField,
  };
}

/** Replaces the field carrying `id`. Every other field is returned untouched. */

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
