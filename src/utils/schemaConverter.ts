import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import type { Field } from "../types/field";

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

    switch (f.type) {
      case "string":
        prop = { type: "string", title: f.title };
        if (f.placeholder) prop.default = f.placeholder;
        if (f.defaultValue && typeof f.defaultValue === "string") prop.default = f.defaultValue;
        if (f.description) prop.description = f.description;
        break;
      case "textarea":
        prop = { type: "string", title: f.title };
        if (f.placeholder) prop.default = f.placeholder;
        if (f.defaultValue && typeof f.defaultValue === "string") prop.default = f.defaultValue;
        if (f.description) prop.description = f.description;
        uiConfig["ui:widget"] = f.widget || "textarea";
        if (f.rows) uiConfig["ui:options"] = { rows: f.rows };
        break;
      case "number":
        prop = { type: "number", title: f.title };
        if (typeof f.minimum === "number") prop.minimum = f.minimum;
        if (typeof f.maximum === "number") prop.maximum = f.maximum;
        if (typeof f.defaultValue === "number") prop.default = f.defaultValue;
        if (f.description) prop.description = f.description;
        break;
      case "boolean":
        prop = { type: "boolean", title: f.title };
        if (typeof f.defaultValue === "boolean") prop.default = f.defaultValue;
        if (f.description) prop.description = f.description;
        if (f.widget === "radio") {
          uiConfig["ui:widget"] = "radio";
        } else if (f.inline) {
          uiConfig["ui:options"] = { inline: true };
        }
        break;
      case "select":
        prop = { type: "string", title: f.title, enum: f.options || [] };
        if (f.defaultValue && typeof f.defaultValue === "string") prop.default = f.defaultValue;
        if (f.description) prop.description = f.description;
        if (f.widget === "radio") {
          uiConfig["ui:widget"] = "radio";
          if (f.inline) uiConfig["ui:options"] = { inline: true };
        }
        break;
      default:
        prop = { type: "string", title: f.title };
    }

    // Common UI properties
    if (f.placeholder && !prop.default) {
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
