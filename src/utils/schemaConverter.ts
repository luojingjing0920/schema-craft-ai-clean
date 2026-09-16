import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { Field } from "../types/field";
import { usesEnumOptions } from "./fieldTypeChange";

// Internal types for the LayoutGridField ui:layoutGrid structure
interface GridColSpec {
  "ui:col": {
    className: string;
    children: string[];
  };
}

interface GridRowSpec {
  "ui:row": {
    className: string;
    children: GridColSpec[];
  };
}

export function buildSchemas(fields: Field[]): { schema: RJSFSchema; uiSchema: UiSchema } {
  const schema: RJSFSchema = { type: "object", properties: {}, required: [] as string[] };
  const uiSchema: UiSchema = {};

  const hasCustomWidth = fields.some(f => f.width && f.width < 100);

  fields.forEach((f) => {
    let prop: RJSFSchema = {};
    const uiConfig: UiSchema = {};

    // 1. Data type -> JSON Schema type
    switch (f.dataType) {
      case "string":
        prop = { type: "string", title: f.title };
        break;
      case "number":
        prop = { type: "number", title: f.title };
        break;
      case "boolean":
        prop = { type: "boolean", title: f.title };
        break;
      default:
        prop = { type: "string", title: f.title };
    }

    // 2. Options -> enum. Assigned before `default` so the emitted key order stays
    // identical to the previous per-pseudo-type implementation. An emptied options
    // array must still emit `enum: []`, otherwise RJSF stops treating it as a select.
    if (f.dataType === "string") {
      if (f.options !== undefined) {
        prop.enum = f.options;
      } else if (usesEnumOptions(f.dataType, f.widget)) {
        prop.enum = [];
      }
    }

    // 3. Number bounds
    if (f.dataType === "number") {
      if (typeof f.minimum === "number") prop.minimum = f.minimum;
      if (typeof f.maximum === "number") prop.maximum = f.maximum;
    }

    // 4. Default value, narrowed to the data type it was authored for
    if (f.dataType === "string" && f.defaultValue && typeof f.defaultValue === "string") {
      prop.default = f.defaultValue;
    } else if (f.dataType === "number" && typeof f.defaultValue === "number") {
      prop.default = f.defaultValue;
    } else if (f.dataType === "boolean" && typeof f.defaultValue === "boolean") {
      prop.default = f.defaultValue;
    }

    // 5. Description
    if (f.description) prop.description = f.description;

    // 6. Format -> schema.format (RJSF picks the matching widget up on its own)
    if (f.format) prop.format = f.format;

    // 7. Widget -> uiSchema. Only widgets that differ from RJSF's inferred default are
    // emitted explicitly, which keeps text / select / checkbox output unchanged.
    if (f.widget === "textarea") {
      uiConfig["ui:widget"] = "textarea";
      if (f.rows) uiConfig["ui:options"] = { rows: f.rows };
    } else if (f.widget === "radio") {
      uiConfig["ui:widget"] = "radio";
      // boolean radios build their own true/false options and take no inline option.
      if (f.inline && f.dataType === "string") uiConfig["ui:options"] = { inline: true };
    } else if (f.widget === "password") {
      // Password is a widget, not a JSON Schema format, so it has to be stated explicitly.
      uiConfig["ui:widget"] = "password";
    } else if (f.dataType === "boolean" && f.inline) {
      uiConfig["ui:options"] = { inline: true };
    }

    // Common UI properties
    if (f.placeholder) {
      uiConfig["ui:placeholder"] = f.placeholder;
    }
    if (f.help) {
      uiConfig["ui:help"] = f.help;
    }
    if (f.disabled) {
      uiConfig["ui:disabled"] = true;
    }

    schema.properties![f.name] = prop;
    if (Object.keys(uiConfig).length > 0) {
      uiSchema[f.name] = uiConfig;
    }
    if (f.required) schema.required!.push(f.name);
  });

  // If any field has custom width, create LayoutGridField structure
  if (hasCustomWidth) {
    const rootUiSchema: UiSchema = {
      "ui:field": "LayoutGridField",
      "ui:layoutGrid": {
        "ui:row": []
      }
    };

    let currentRow: GridRowSpec = {
      "ui:row": {
        "className": "row",
        "children": []
      }
    };
    let currentRowWidth = 0;

    fields.forEach((f) => {
      const fieldWidth = f.width || 100;
      const gridCols = Math.round((fieldWidth / 100) * 12); // Convert percentage to 12-column grid

      // If this field would exceed 12 columns or field is 100% width, start a new row
      if ((currentRowWidth + gridCols > 12 && currentRow["ui:row"].children.length > 0) ||
          (fieldWidth === 100 && currentRow["ui:row"].children.length > 0)) {
        rootUiSchema["ui:layoutGrid"]["ui:row"].push(currentRow);
        currentRow = {
          "ui:row": {
            "className": "row",
            "children": []
          }
        };
        currentRowWidth = 0;
      }

      // Add field to current row
      currentRow["ui:row"].children.push({
        "ui:col": {
          "className": `col-xs-${gridCols}`,
          "children": [f.name]
        }
      });

      // If field is 100% width, close the row immediately
      if (fieldWidth === 100) {
        rootUiSchema["ui:layoutGrid"]["ui:row"].push(currentRow);
        currentRow = {
          "ui:row": {
            "className": "row",
            "children": []
          }
        };
        currentRowWidth = 0;
      } else {
        currentRowWidth += gridCols;
      }
    });

    // Add the last row if it has children
    if (currentRow["ui:row"].children.length > 0) {
      rootUiSchema["ui:layoutGrid"]["ui:row"].push(currentRow);
    }

    Object.keys(uiSchema).forEach(key => {
      rootUiSchema[key] = uiSchema[key];
    });

    if (schema.required!.length === 0) delete schema.required;
    return { schema, uiSchema: rootUiSchema };
  }

  if (schema.required!.length === 0) delete schema.required;
  return { schema, uiSchema };
}
