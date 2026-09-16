/** Runtime-only contract handed to the form through `formContext`; never touches schema or uiSchema. */
export interface CanvasSelectionContext {
  selectedName: string | null;
  fieldNames: string[];
  onSelectField: (name: string) => void;
}

/** Passed to <Form> so the id format is deterministic rather than relying on RJSF's default. */
export const CANVAS_ID_PREFIX = "root";
export const CANVAS_ID_SEPARATOR = "_";

/**
 * Resolves which builder field a RJSF field template belongs to, or null when it is not a
 * top-level field we manage (the root object, or anything nested).
 *
 * Two id shapes reach the template:
 *  - the grid path hands SchemaField a bare id (`fieldPath`), so the id already *is* the field name
 *  - the default path builds `${idPrefix}${separator}${name}`
 *
 * Both candidates are matched against the real field names, so "is not the root" is never
 * enough on its own to conclude that a template belongs to a field.
 */
export function resolveCanvasFieldName(id: string, idPrefix: string, fieldNames: string[]): string | null {
  if (fieldNames.includes(id)) return id;

  const prefix = `${idPrefix}${CANVAS_ID_SEPARATOR}`;
  if (id.startsWith(prefix)) {
    const candidate = id.slice(prefix.length);
    if (fieldNames.includes(candidate)) return candidate;
  }

  return null;
}
