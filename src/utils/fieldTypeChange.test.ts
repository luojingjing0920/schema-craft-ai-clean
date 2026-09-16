import { describe, expect, it } from "vitest";
import type { Field } from "../types/field";
import {
    SEEDED_OPTIONS,
    deriveFieldTypeChangePatch,
    fieldTypeLabel,
    usesEnumOptions,
} from "./fieldTypeChange";

/** Builds a field with the properties that must survive every type change. */
function baseField(overrides: Partial<Field>): Field {
    return {
        id: "id-1",
        dataType: "string",
        widget: "text",
        name: "myField",
        title: "My title",
        description: "My description",
        help: "My help",
        required: true,
        disabled: true,
        width: 50,
        ...overrides,
    };
}

describe("deriveFieldTypeChangePatch", () => {
    it("clears everything the target configuration cannot keep (select -> number)", () => {
        const field = baseField({
            dataType: "string",
            widget: "select",
            format: "email",
            options: ["A", "B"],
            placeholder: "pick one",
            defaultValue: "A",
            inline: true,
            rows: 4,
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "number", widget: "text" });

        expect(patch.dataType).toBe("number");
        expect(patch.widget).toBe("text");
        expect(patch.defaultValue).toBeUndefined();
        expect(patch.placeholder).toBeUndefined();
        expect(patch.format).toBeUndefined();
        expect(patch.rows).toBeUndefined();
        expect(patch.inline).toBeUndefined();
        expect(patch.options).toBeUndefined();
    });

    it("keeps field identity untouched when switching type", () => {
        const field = baseField({ dataType: "string", widget: "select" });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "number", widget: "text" });
        const next = { ...field, ...patch };

        expect(next.id).toBe("id-1");
        expect(next.name).toBe("myField");
        expect(next.title).toBe("My title");
        expect(next.description).toBe("My description");
        expect(next.help).toBe("My help");
        expect(next.required).toBe(true);
        expect(next.disabled).toBe(true);
        expect(next.width).toBe(50);

        expect(patch).not.toHaveProperty("id");
        expect(patch).not.toHaveProperty("title");
        expect(patch).not.toHaveProperty("name");
        expect(patch).not.toHaveProperty("width");
    });

    it("clears rows but keeps placeholder and a compatible default (textarea -> text)", () => {
        const field = baseField({
            dataType: "string",
            widget: "textarea",
            placeholder: "say something",
            defaultValue: "Hello",
            rows: 4,
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text" });

        expect(patch.rows).toBeUndefined();
        // Same data type, so the placeholder and the string default are still valid.
        expect(patch).not.toHaveProperty("placeholder");
        expect(patch).not.toHaveProperty("defaultValue");
    });

    it("drops number bounds when leaving the number data type", () => {
        const field = baseField({
            dataType: "number",
            widget: "text",
            minimum: 1,
            maximum: 10,
            defaultValue: 5,
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text" });

        expect(patch.minimum).toBeUndefined();
        expect(patch.maximum).toBeUndefined();
        expect(patch.defaultValue).toBeUndefined();
    });

    it("clears a boolean default and inline config when switching to string", () => {
        const field = baseField({
            dataType: "boolean",
            widget: "checkbox",
            defaultValue: false,
            inline: true,
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text" });

        expect(patch.dataType).toBe("string");
        expect(patch.widget).toBe("text");
        expect(patch.defaultValue).toBeUndefined();
        expect(patch.inline).toBeUndefined();
        expect(patch.options).toBeUndefined();
    });

    it("seeds options when a string becomes enum-backed without any", () => {
        const field = baseField({ dataType: "string", widget: "text" });

        expect(
            deriveFieldTypeChangePatch(field, { dataType: "string", widget: "select" }).options,
        ).toEqual(SEEDED_OPTIONS);
        expect(
            deriveFieldTypeChangePatch(field, { dataType: "string", widget: "radio" }).options,
        ).toEqual(SEEDED_OPTIONS);
    });

    it("keeps existing options when moving between enum-backed widgets", () => {
        const field = baseField({
            dataType: "string",
            widget: "select",
            options: ["A", "B"],
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "radio" });

        expect(patch).not.toHaveProperty("options");
        expect(patch.widget).toBe("radio");
    });

    it("does not seed string options for a boolean radio", () => {
        const field = baseField({ dataType: "boolean", widget: "checkbox" });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "boolean", widget: "radio" });

        expect(patch.options).toBeUndefined();
        expect(patch.widget).toBe("radio");
    });

    it("drops inline when the target widget is not radio", () => {
        const field = baseField({
            dataType: "string",
            widget: "radio",
            options: ["A"],
            inline: true,
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "select" });

        expect(patch.inline).toBeUndefined();
        expect(patch).not.toHaveProperty("options");
    });

    it("clears the email format when switching to plain text", () => {
        const field = baseField({ dataType: "string", widget: "text", format: "email" });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text" });

        expect(patch.format).toBeUndefined();
        expect(patch.widget).toBe("text");
    });

    it("applies the target format when switching to Email or Date", () => {
        const field = baseField({ dataType: "string", widget: "text" });

        expect(
            deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text", format: "email" }).format,
        ).toBe("email");
        expect(
            deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text", format: "date" }).format,
        ).toBe("date");
    });

    it("clears the format when moving from Date back to a number", () => {
        const field = baseField({ dataType: "string", widget: "text", format: "date" });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "number", widget: "text" });

        expect(patch.format).toBeUndefined();
        expect(patch.placeholder).toBeUndefined();
    });

    it("switches the password widget off without touching the format", () => {
        const field = baseField({ dataType: "string", widget: "password", placeholder: "" });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "text" });

        expect(patch.widget).toBe("text");
        expect(patch.format).toBeUndefined();
        expect(patch).not.toHaveProperty("placeholder");
    });

    it("keeps options and drops the radio widget when switching Radio to Select", () => {
        const field = baseField({
            dataType: "string",
            widget: "radio",
            options: ["A", "B"],
            inline: true,
        });

        const patch = deriveFieldTypeChangePatch(field, { dataType: "string", widget: "select" });

        expect(patch.widget).toBe("select");
        expect(patch.inline).toBeUndefined();
        expect(patch).not.toHaveProperty("options");
    });
});

describe("usesEnumOptions", () => {
    it("is true only for enum-backed string widgets", () => {
        expect(usesEnumOptions("string", "select")).toBe(true);
        expect(usesEnumOptions("string", "radio")).toBe(true);
        expect(usesEnumOptions("string", "text")).toBe(false);
        expect(usesEnumOptions("string", "textarea")).toBe(false);
        expect(usesEnumOptions("string", "password")).toBe(false);
        expect(usesEnumOptions("boolean", "radio")).toBe(false);
        expect(usesEnumOptions("number", "text")).toBe(false);
    });
});

describe("fieldTypeLabel", () => {
    it("keeps the five original field kinds distinguishable", () => {
        expect(fieldTypeLabel({ dataType: "string", widget: "text" })).toBe("string");
        expect(fieldTypeLabel({ dataType: "string", widget: "textarea" })).toBe("textarea");
        expect(fieldTypeLabel({ dataType: "string", widget: "select" })).toBe("select");
        expect(fieldTypeLabel({ dataType: "number", widget: "text" })).toBe("number");
        expect(fieldTypeLabel({ dataType: "boolean", widget: "checkbox" })).toBe("boolean");
    });

    it("labels the new field kinds by format or widget", () => {
        expect(fieldTypeLabel({ dataType: "string", widget: "text", format: "email" })).toBe("email");
        expect(fieldTypeLabel({ dataType: "string", widget: "text", format: "date" })).toBe("date");
        expect(fieldTypeLabel({ dataType: "string", widget: "password" })).toBe("password");
        expect(fieldTypeLabel({ dataType: "string", widget: "radio" })).toBe("radio");
    });

    it("reports radios without collapsing them into their data type", () => {
        // A boolean radio is still a boolean field.
        expect(fieldTypeLabel({ dataType: "boolean", widget: "radio" })).toBe("boolean");
    });
});
