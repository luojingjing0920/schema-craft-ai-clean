import type { FormDefinition, FormLayoutConfig } from "../types/formDefinition";
import { uid } from "./utils";

const defaultLayoutConfig: FormLayoutConfig = {
  labelPosition: "top",
  columns: 1,
  spacing: "normal",
  showSubmitButton: true,
  submitButtonText: "Submit",
};

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
