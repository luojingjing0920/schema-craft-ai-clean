/**
 * What the canvas knows about a top-level field: the schema property name it can recognise a
 * template by, and the stable id it acts on.
 */
export interface CanvasFieldRef {
  id: string;
  name: string;
}

/** Runtime-only contract handed to the form through `formContext`; never touches schema or uiSchema. */
export interface CanvasContext {
  selectedFieldId: string | null;
  /** Ordered identity of every top-level field. */
  fields: CanvasFieldRef[];
  /**
   * Ids of fields carrying at least one reaction. A set of ids rather than names, so the badge
   * survives a rename and never has to be re-derived from the field list.
   */
  logicTargetIds?: Set<string>;
  onSelectField: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Passed to <Form> so the id format is deterministic rather than relying on RJSF's default. */
export const CANVAS_ID_PREFIX = "root";
export const CANVAS_ID_SEPARATOR = "_";

/**
 * dnd-kit ids have to be unique across the whole DndContext, and the canvas and the outline
 * both list the same fields, so canvas items are namespaced.
 */
export const CANVAS_DND_ID_PREFIX = "canvas:";

export function toCanvasDndId(fieldId: string): string {
  return `${CANVAS_DND_ID_PREFIX}${fieldId}`;
}

/** Accepts an id from either list and returns the field id behind it. */
export function fromDndId(dndId: string): string {
  return dndId.startsWith(CANVAS_DND_ID_PREFIX) ? dndId.slice(CANVAS_DND_ID_PREFIX.length) : dndId;
}

/**
 * Resolves which builder field a RJSF field template belongs to, or null when it is not a
 * top-level field we manage (the root object, or anything nested).
 *
 * Two id shapes reach the template:
 *  - the grid path hands SchemaField a bare id (`fieldPath`), so the id already *is* the field name
 *  - the default path builds `${idPrefix}${separator}${name}`
 *
 * Both candidates are matched against the real field names, so "is not the root" is never
 * enough on its own. This is the single boundary where a renderer name becomes a field identity.
 */
export function resolveCanvasField(
  id: string,
  idPrefix: string,
  fields: CanvasFieldRef[]
): CanvasFieldRef | null {
  const named = (candidate: string) => fields.find((field) => field.name === candidate) ?? null;

  const direct = named(id);
  if (direct) return direct;

  const prefix = `${idPrefix}${CANVAS_ID_SEPARATOR}`;
  if (!id.startsWith(prefix)) return null;

  return named(id.slice(prefix.length));
}
