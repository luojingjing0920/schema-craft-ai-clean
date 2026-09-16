import { describe, expect, it } from "vitest";
import type { Field } from "../types/field";
import { buildSchemas } from "./schemaConverter";

describe("buildSchemas", () => {
    it("maps placeholder to ui:placeholder instead of schema default", () => {
        const fields: Field[] = [
            {
                id: "1",
                type: "string",
                name: "username",
                title: "Username",
                placeholder: "Enter username",
            },
        ];

        const { schema, uiSchema } = buildSchemas(fields);

        expect(schema.properties?.username).not.toHaveProperty("default");
        expect(uiSchema.username?.["ui:placeholder"]).toBe("Enter username");
    });

    it("keeps placeholder and default value when both are provided", () => {
        const fields: Field[] = [
            {
                id: "1",
                type: "string",
                name: "username",
                title: "Username",
                placeholder: "Enter username",
                defaultValue: "Tom",
            },
        ];

        const { schema, uiSchema } = buildSchemas(fields);

        expect(schema.properties?.username).toMatchObject({
            default: "Tom",
        });
        expect(uiSchema.username?.["ui:placeholder"]).toBe("Enter username");
    });

    it("builds textarea schema with default, placeholder and rows", () => {
        const fields: Field[] = [
            {
                id: "1",
                type: "textarea",
                name: "description",
                title: "Description",
                placeholder: "Enter description",
                defaultValue: "Hello",
                rows: 4,
            },
        ];

        const { schema, uiSchema } = buildSchemas(fields);

        expect(schema.properties?.description).toMatchObject({
            type: "string",
            default: "Hello",
        });

        expect(uiSchema.description?.["ui:widget"]).toBe("textarea");
        expect(uiSchema.description?.["ui:placeholder"]).toBe(
            "Enter description",
        );
        expect(uiSchema.description?.["ui:options"]).toEqual({
            rows: 4,
        });
    });

    it("builds number schema with min, max and default value", () => {
        const fields: Field[] = [
            {
                id: "1",
                type: "number",
                name: "age",
                title: "Age",
                minimum: 18,
                maximum: 100,
                defaultValue: 20,
            },
        ];

        const { schema } = buildSchemas(fields);

        expect(schema.properties?.age).toMatchObject({
            type: "number",
            title: "Age",
            minimum: 18,
            maximum: 100,
            default: 20,
        });
    });

    it("builds select schema with enum, default value and radio widget", () => {
        const fields: Field[] = [
            {
                id: "1",
                type: "select",
                name: "gender",
                title: "Gender",
                options: ["Male", "Female"],
                defaultValue: "Male",
                widget: "radio",
                inline: true,
            },
        ];

        const { schema, uiSchema } = buildSchemas(fields);

        expect(schema.properties?.gender).toMatchObject({
            type: "string",
            enum: ["Male", "Female"],
            default: "Male",
        });

        expect(uiSchema.gender?.["ui:widget"]).toBe("radio");
        expect(uiSchema.gender?.["ui:options"]).toEqual({
            inline: true,
        });
    });

    it("only outputs required when required fields exist", () => {
        const requiredFields: Field[] = [
            {
                id: "1",
                type: "string",
                name: "username",
                title: "Username",
                required: true,
            },
            {
                id: "2",
                type: "string",
                name: "nickname",
                title: "Nickname",
            },
        ];

        const requiredResult = buildSchemas(requiredFields);

        expect(requiredResult.schema.required).toEqual(["username"]);

        const optionalFields: Field[] = [
            {
                id: "1",
                type: "string",
                name: "nickname",
                title: "Nickname",
            },
        ];

        const optionalResult = buildSchemas(optionalFields);

        expect(optionalResult.schema.required).toBeUndefined();
    });

    it("creates layout grid configuration for custom field widths", () => {
        const fields: Field[] = [
            {
                id: "1",
                type: "string",
                name: "firstName",
                title: "First Name",
                width: 50,
            },
            {
                id: "2",
                type: "string",
                name: "lastName",
                title: "Last Name",
                width: 50,
            },
        ];

        const { uiSchema } = buildSchemas(fields);

        expect(uiSchema["ui:field"]).toBe("LayoutGridField");

        expect(uiSchema["ui:layoutGrid"]).toEqual({
            "ui:row": [
                {
                    "ui:row": {
                        className: "row",
                        children: [
                            {
                                "ui:col": {
                                    className: "col-xs-6",
                                    children: ["firstName"],
                                },
                            },
                            {
                                "ui:col": {
                                    className: "col-xs-6",
                                    children: ["lastName"],
                                },
                            },
                        ],
                    },
                },
            ],
        });
    });
});