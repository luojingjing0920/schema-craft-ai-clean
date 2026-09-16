import type { Field } from "./field";

export interface FormLayoutConfig {
  labelPosition: "top" | "left";
  columns: 1 | 2 | 3 | 4;
  spacing: "compact" | "normal" | "comfortable";
  showSubmitButton: boolean;
  submitButtonText: string;
}

export interface FormDefinition {
  id: string;
  name: string;
  description?: string;
  fields: Field[];
  layout: FormLayoutConfig;
  createdAt: string;
  updatedAt: string;
}
