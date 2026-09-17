import type { Field } from "./field";
import type { FieldReaction } from "./fieldReaction";

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
  /** Conditional logic, always present. Records written before it existed are normalized on read. */
  reactions: FieldReaction[];
  createdAt: string;
  updatedAt: string;
}

/**
 * The shape actually found in storage. `reactions` was added after the first forms were saved, so
 * it is optional here — and only here. Everything the app consumes is a FormDefinition.
 */
export type StoredFormDefinition = Omit<FormDefinition, "reactions"> & {
  reactions?: unknown;
};
