import { describe, expect, it } from "vitest";
import { defaultField } from "./utils";

describe("defaultField", () => {
    it("creates a text input with a placeholder and no options", () => {
        const field = defaultField("string", "text");

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("text");
        expect(field.placeholder).toBe("");
        expect(field.options).toBeUndefined();
    });

    it("creates a textarea with a placeholder", () => {
        const field = defaultField("string", "textarea");

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("textarea");
        expect(field.placeholder).toBe("");
    });

    it("creates a select with seeded options and no placeholder", () => {
        const field = defaultField("string", "select");

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("select");
        expect(field.options).toEqual(["Option 1", "Option 2"]);
        expect(field.placeholder).toBeUndefined();
    });

    it("creates a number input without string-only configuration", () => {
        const field = defaultField("number", "text");

        expect(field.dataType).toBe("number");
        expect(field.widget).toBe("text");
        expect(field.placeholder).toBeUndefined();
        expect(field.format).toBeUndefined();
        expect(field.options).toBeUndefined();
    });

    it("creates a checkbox boolean that defaults to false", () => {
        const field = defaultField("boolean", "checkbox");

        expect(field.dataType).toBe("boolean");
        expect(field.widget).toBe("checkbox");
        expect(field.defaultValue).toBe(false);
    });
});
