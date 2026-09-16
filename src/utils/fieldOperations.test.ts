import { describe, expect, it } from "vitest";
import type { Field } from "../types/field";
import {
    duplicateField,
    moveFieldById,
    moveFieldToIndex,
    nextCopyName,
    otherFieldNames,
    removeFieldById,
    updateFieldById,
    validateFieldName,
} from "./fieldOperations";

function field(id: string, name: string, title = name): Field {
    return { id, dataType: "string", widget: "text", name, title };
}

const three = [field("id-a", "alpha"), field("id-b", "beta"), field("id-c", "gamma")];

describe("updateFieldById", () => {
    it("updates only the targeted field", () => {
        const next = updateFieldById(three, "id-b", { title: "Changed" });

        expect(next.map((f) => f.title)).toEqual(["alpha", "Changed", "gamma"]);
        expect(next.map((f) => f.id)).toEqual(["id-a", "id-b", "id-c"]);
    });

    it("returns the list unchanged for an unknown id", () => {
        const next = updateFieldById(three, "nope", { title: "X" });

        expect(next).toEqual(three);
    });
});

describe("removeFieldById", () => {
    it("removes only the targeted field and keeps the rest in order", () => {
        const next = removeFieldById(three, "id-b");

        expect(next.map((f) => f.id)).toEqual(["id-a", "id-c"]);
    });

    it("returns the list unchanged for an unknown id", () => {
        expect(removeFieldById(three, "nope")).toEqual(three);
    });
});

describe("moveFieldById", () => {
    it("swaps a field with its neighbour and leaves every id untouched", () => {
        const moved = moveFieldById(three, "id-b", -1);

        expect(moved.map((f) => f.id)).toEqual(["id-b", "id-a", "id-c"]);
        // Identity is preserved, which is what keeps a selection valid after a move.
        expect(moved.map((f) => f.id)).toEqual(expect.arrayContaining(["id-a", "id-b", "id-c"]));
    });

    it("moves down as well", () => {
        expect(moveFieldById(three, "id-a", 1).map((f) => f.id)).toEqual(["id-b", "id-a", "id-c"]);
    });

    it("returns the same array when the move would fall off either end", () => {
        expect(moveFieldById(three, "id-a", -1)).toBe(three);
        expect(moveFieldById(three, "id-c", 1)).toBe(three);
    });

    it("returns the same array for an unknown id", () => {
        expect(moveFieldById(three, "nope", 1)).toBe(three);
    });

    it("keeps a field addressable by id across repeated reorders", () => {
        let list = three;

        for (const direction of [1, -1, 1] as const) {
            list = moveFieldById(list, "id-b", direction);

            const patched = updateFieldById(list, "id-b", { title: "hit" });
            expect(patched.filter((f) => f.title === "hit")).toHaveLength(1);
            expect(patched.find((f) => f.title === "hit")?.id).toBe("id-b");
        }

        expect(list.map((f) => f.id).sort()).toEqual(["id-a", "id-b", "id-c"]);
        expect(new Set(list.map((f) => f.id)).size).toBe(list.length);
    });
});

describe("otherFieldNames", () => {
    it("excludes the field being edited", () => {
        expect(otherFieldNames(three, "id-b")).toEqual(["alpha", "gamma"]);
    });

    it("returns every name when nothing is excluded", () => {
        expect(otherFieldNames(three, null)).toEqual(["alpha", "beta", "gamma"]);
    });
});

describe("validateFieldName", () => {
    it("rejects blank names", () => {
        expect(validateFieldName("", ["alpha"])).toBe("Field name is required.");
        expect(validateFieldName("   ", ["alpha"])).toBe("Field name is required.");
    });

    it("rejects a name another field already uses", () => {
        expect(validateFieldName("alpha", ["alpha", "gamma"])).toBe("Field name must be unique.");
        expect(validateFieldName("  alpha  ", ["alpha"])).toBe("Field name must be unique.");
    });

    it("accepts a field keeping its own name", () => {
        // `otherFieldNames` never contains the edited field, so an unchanged name stays valid.
        expect(validateFieldName("beta", otherFieldNames(three, "id-b"))).toBeUndefined();
    });

    it("accepts an unused name", () => {
        expect(validateFieldName("delta", ["alpha", "gamma"])).toBeUndefined();
    });
});

describe("moveFieldToIndex", () => {
    it("moves a field to the slot held by another", () => {
        expect(moveFieldToIndex(three, "id-c", "id-a").map((f) => f.id)).toEqual([
            "id-c",
            "id-a",
            "id-b",
        ]);
        expect(moveFieldToIndex(three, "id-a", "id-c").map((f) => f.id)).toEqual([
            "id-b",
            "id-c",
            "id-a",
        ]);
    });

    it("returns the same array when the move is a no-op or an id is unknown", () => {
        expect(moveFieldToIndex(three, "id-b", "id-b")).toBe(three);
        expect(moveFieldToIndex(three, "nope", "id-a")).toBe(three);
        expect(moveFieldToIndex(three, "id-a", "nope")).toBe(three);
    });

    it("keeps every id intact", () => {
        const moved = moveFieldToIndex(three, "id-a", "id-c");

        expect(new Set(moved.map((f) => f.id)).size).toBe(3);
    });
});

describe("nextCopyName", () => {
    it("appends _copy to a free name", () => {
        expect(nextCopyName("email", ["email", "age"])).toBe("email_copy");
    });

    it("counts up while the copy names are taken", () => {
        expect(nextCopyName("email", ["email", "email_copy"])).toBe("email_copy_2");
        expect(nextCopyName("email", ["email", "email_copy", "email_copy_2"])).toBe("email_copy_3");
    });

    it("does not look past the copy family it started", () => {
        // A differently-named field never blocks the next copy.
        expect(nextCopyName("email", ["email", "other"])).toBe("email_copy");
    });
});

describe("duplicateField", () => {
    const select = { ...field("id-s", "email", "Email"), options: ["a", "b"] };

    it("inserts the copy directly after the original", () => {
        const list = [field("id-a", "alpha"), select, field("id-b", "beta")];
        const result = duplicateField(list, "id-s");

        expect(result?.fields.map((f) => f.name)).toEqual(["alpha", "email", "email_copy", "beta"]);
    });

    it("gives the copy a new id and a Copy title", () => {
        const result = duplicateField([select], "id-s");

        expect(result?.newField.id).not.toBe("id-s");
        expect(result?.newField.title).toBe("Email Copy");
        expect(result?.newField.name).toBe("email_copy");
    });

    it("does not share the mutable options array with the original", () => {
        const result = duplicateField([select], "id-s");

        expect(result?.newField.options).toEqual(["a", "b"]);
        expect(result?.newField.options).not.toBe(select.options);

        result?.newField.options?.push("c");
        expect(select.options).toEqual(["a", "b"]);
    });

    it("copies the rest of the configuration", () => {
        const result = duplicateField([select], "id-s");

        expect(result?.newField.dataType).toBe(select.dataType);
        expect(result?.newField.widget).toBe(select.widget);
        expect(result?.newField.format).toBe(select.format);
    });

    it("returns null for an unknown id", () => {
        expect(duplicateField(three, "nope")).toBeNull();
    });

    it("keeps counting up when the same field is duplicated twice", () => {
        const first = duplicateField([select], "id-s");
        const second = duplicateField(first!.fields, "id-s");

        expect(second?.newField.name).toBe("email_copy_2");
    });
});
