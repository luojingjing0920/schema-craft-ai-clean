import { describe, expect, it } from "vitest";
import { defaultField } from "./utils";
import { findPreset } from "./fieldPresets";

function preset(key: string) {
    const found = findPreset(key);
    if (!found) throw new Error(`unknown preset: ${key}`);
    return found;
}

describe("defaultField", () => {
    it("creates a text input with a placeholder and no options", () => {
        const field = defaultField(preset("text"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("text");
        expect(field.format).toBeUndefined();
        expect(field.placeholder).toBe("");
        expect(field.options).toBeUndefined();
    });

    it("creates a number input without string-only configuration", () => {
        const field = defaultField(preset("number"));

        expect(field.dataType).toBe("number");
        expect(field.widget).toBe("text");
        expect(field.placeholder).toBeUndefined();
        expect(field.format).toBeUndefined();
        expect(field.options).toBeUndefined();
    });

    it("creates a checkbox boolean that defaults to false", () => {
        const field = defaultField(preset("boolean"));

        expect(field.dataType).toBe("boolean");
        expect(field.widget).toBe("checkbox");
        expect(field.defaultValue).toBe(false);
    });

    it("creates a select with seeded options and no placeholder", () => {
        const field = defaultField(preset("select"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("select");
        expect(field.options).toEqual(["Option 1", "Option 2"]);
        expect(field.placeholder).toBeUndefined();
    });

    it("creates a textarea with a placeholder", () => {
        const field = defaultField(preset("textarea"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("textarea");
        expect(field.placeholder).toBe("");
    });

    it("creates an email field carrying the email format", () => {
        const field = defaultField(preset("email"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("text");
        expect(field.format).toBe("email");
        expect(field.placeholder).toBe("");
        expect(field.options).toBeUndefined();
    });

    it("creates a password field with the password widget and no format", () => {
        const field = defaultField(preset("password"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("password");
        expect(field.format).toBeUndefined();
        expect(field.placeholder).toBe("");
        expect(field.options).toBeUndefined();
    });

    it("creates a date field carrying the date format", () => {
        const field = defaultField(preset("date"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("text");
        expect(field.format).toBe("date");
        expect(field.placeholder).toBe("");
        expect(field.options).toBeUndefined();
    });

    it("creates a radio group with seeded options and no placeholder", () => {
        const field = defaultField(preset("radio"));

        expect(field.dataType).toBe("string");
        expect(field.widget).toBe("radio");
        expect(field.format).toBeUndefined();
        expect(field.options).toEqual(["Option 1", "Option 2"]);
        expect(field.placeholder).toBeUndefined();
    });
});
