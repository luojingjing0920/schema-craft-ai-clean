import type { FormDefinition, FormLayoutConfig, StoredFormDefinition } from "../types/formDefinition";
import { isFieldReaction } from "./fieldReactions";
import { uid } from "./utils";

const defaultLayoutConfig: FormLayoutConfig = {
  labelPosition: "top",
  columns: 1,
  spacing: "normal",
  showSubmitButton: true,
  submitButtonText: "Submit",
};

/** A blank name would render as an empty row, so the default label stands in for it. */
export function formDisplayName(form: Pick<FormDefinition, "name">): string {
  return form.name.trim() === "" ? "Untitled Form" : form.name;
}

/**
 * Completes a record read from storage into a FormDefinition.
 *
 * Records saved before conditional logic existed have no `reactions` key at all, and a hand-edited
 * store could hold something that is not an array, or an array with unusable rules. Missing becomes
 * empty and bad rules are dropped; a form is never rejected for its logic alone.
 */
export function normalizeFormDefinition(stored: StoredFormDefinition): FormDefinition {
  const { reactions, ...rest } = stored;
  return {
    ...rest,
    reactions: Array.isArray(reactions) ? reactions.filter(isFieldReaction) : [],
  };
}

export function createFormDefinition(): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "Untitled Form",
    description: "",
    fields: [],
    layout: { ...defaultLayoutConfig },
    reactions: [],
    createdAt: now,
    updatedAt: now,
  };
}
