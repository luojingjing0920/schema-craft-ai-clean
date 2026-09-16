import { describe, expect, it } from "vitest";
import type { Field } from "../types/field";
import { moveFieldById, otherFieldNames, removeFieldById, updateFieldById, validateFieldName } from "./fieldOperations";

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
