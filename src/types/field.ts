export type FieldDataType = "string" | "number" | "boolean";

export type FieldWidget = "text" | "textarea" | "select" | "radio" | "checkbox" | "password";

export type FieldFormat = "email" | "date";

export interface Field {
  id: string;
  dataType: FieldDataType;
  widget: FieldWidget;
  format?: FieldFormat;
  name: string;
  title: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: string | number | boolean;
  minimum?: number;
  maximum?: number;

  // UI Schema properties
  description?: string;
  help?: string;
  rows?: number;
  inline?: boolean;
  disabled?: boolean;

  // Layout properties
  width?: number;
  layoutField?: string;
}
