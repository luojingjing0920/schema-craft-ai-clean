import type { Field, FieldDataType, FieldWidget } from "../types/field";
import { fieldTypeLabel, usesEnumOptions } from "./fieldTypeChange";

export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export function defaultField(dataType: FieldDataType, widget: FieldWidget): Field {
  const id = uid();
  const label = fieldTypeLabel({ dataType, widget });
  // Only free-text widgets start with an empty placeholder; a select or a radio has none.
  const acceptsPlaceholder = dataType === "string" && (widget === "text" || widget === "textarea");
  return {
    id,
    dataType,
    widget,
    name: `${label}_${id}`,
    title:
      label === "textarea"
        ? "Text area"
        : label === "select"
        ? "Select field"
        : `${label.charAt(0).toUpperCase() + label.slice(1)} field`,
    required: false,
    options: usesEnumOptions(dataType, widget) ? ["Option 1", "Option 2"] : undefined,
    placeholder: acceptsPlaceholder ? "" : undefined,
    defaultValue: dataType === "boolean" ? false : undefined,
    minimum: undefined,
    maximum: undefined,
  };
}
