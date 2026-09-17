import type { FormDefinition, FormLayoutConfig } from "../types/formDefinition";
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

export function createFormDefinition(): FormDefinition {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: "Untitled Form",
    description: "",
    fields: [],
    layout: { ...defaultLayoutConfig },
    createdAt: now,
    updatedAt: now,
  };
}
