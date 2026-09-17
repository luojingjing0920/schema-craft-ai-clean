import type { RJSFSchema } from "@rjsf/utils";
import type { Field } from "../types/field";
import type { EffectiveFieldState } from "../types/fieldReaction";
import type { FormData } from "./fieldReactions";

/**
 * Everything the Preview derives at render time from the form plus its current values.
 *
 * These are the only places where conditional logic touches what RJSF renders and what a submit
 * would carry. Both leave the exported schema and uiSchema untouched — the builder's artifacts stay
 * standard JSON Schema, and the runtime copies live no longer than one render.
 */

/** `logicStates` is `null` when the form has no rules, which means "behave exactly as before". */
export type LogicStates = Map<string, EffectiveFieldState> | null;

/**
 * Identifies *which* fields a form has, for deciding when what the user typed must be thrown away.
 *
 * Sorted on purpose: the signature stands for the field set, not for the order they are rendered
 * in. Reordering fields only rewrites the insertion order of `properties`, and dragging a field
 * around should not wipe the values already entered in the preview.
 */
export function fieldSignature(schema: RJSFSchema): string {
  return JSON.stringify(Object.keys(schema.properties ?? {}).sort());
}

function namesWhere(
  fields: Field[],
  logicStates: LogicStates,
  predicate: (state: EffectiveFieldState) => boolean
): string[] {
  if (!logicStates) return [];
  return fields.filter((field) => {
    const state = logicStates.get(field.id);
    return state !== undefined && predicate(state);
  }).map((field) => field.name);
}

/**
 * Rewrites the `required` array for the current values.
 *
 * The builder's own converter drops the key entirely when nothing is required, so the runtime copy
 * has to do the same rather than leave an empty array behind.
 */
export function withEffectiveRequired(schema: RJSFSchema, names: string[]): RJSFSchema {
  const next: RJSFSchema = { ...schema };
  if (names.length > 0) next.required = names;
  else delete next.required;
  return next;
}

/**
 * The schema RJSF renders and validates against.
 *
 * A hidden field loses its property outright. Keeping the property and blanking `required` was not
 * enough: every other constraint (minimum, enum, format, …) would still apply, so a field the user
 * cannot see could still refuse the submit with an error they cannot find. Removing the property
 * drops every constraint at once, with no list of keywords to keep in sync.
 *
 * The value itself stays in `formData`, so revealing the field again brings the user's input back.
 * Extra keys are not rejected: the generated schema never sets `additionalProperties`.
 */
export function buildRuntimeSchema(
  schema: RJSFSchema,
  fields: Field[],
  logicStates: LogicStates
): RJSFSchema {
  if (!logicStates) return schema;

  const hidden = new Set(namesWhere(fields, logicStates, (state) => !state.visible));
  const properties = { ...(schema.properties ?? {}) };
  for (const name of hidden) delete properties[name];

  return withEffectiveRequired(
    { ...schema, properties },
    namesWhere(fields, logicStates, (state) => state.required)
  );
}

/**
 * What a submit would carry.
 *
 * Hidden fields are dropped: a rule says the field does not apply under the current values, so
 * sending a stale answer alongside the choice that invalidated it would be wrong. Disabled fields
 * are kept — disabling locks a value, it does not question it.
 *
 * Returns a new object; `formData` is never mutated, and `0` / `false` survive because values are
 * copied rather than truthiness-tested.
 */
export function buildSubmissionData(
  fields: Field[],
  logicStates: LogicStates,
  formData: FormData
): FormData {
  const hidden = new Set(namesWhere(fields, logicStates, (state) => !state.visible));
  const next: FormData = {};
  for (const [name, value] of Object.entries(formData)) {
    if (!hidden.has(name)) next[name] = value;
  }
  return next;
}
