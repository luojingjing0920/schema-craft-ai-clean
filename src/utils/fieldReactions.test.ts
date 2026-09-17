import { describe, it, expect } from "vitest";
import {
  availableEffectClasses,
  baseFieldState,
  evaluateCondition,
  isFieldReaction,
  operatorsForField,
  removeReactionsForField,
  resolveFieldLogic,
  resolveFormLogic,
  ruleOfClass,
  sourceCandidates,
  valueKindForField,
} from "./fieldReactions";
import type { Field } from "../types/field";
import type { FieldReaction, ReactionEffect, ReactionOperator } from "../types/fieldReaction";

// ---------------------------------------------------------------------------
// fixtures
// ---------------------------------------------------------------------------

function field(overrides: Partial<Field> = {}): Field {
  return {
    id: "f1",
    dataType: "string",
    widget: "text",
    name: "field_one",
    title: "Field one",
    ...overrides,
  };
}

const AGE = field({ id: "age", dataType: "number", name: "age", title: "Age" });
const LICENCE = field({ id: "licence", name: "licence", title: "Driving licence" });
const COUNTRY = field({
  id: "country",
  dataType: "string",
  widget: "select",
  name: "country",
  title: "Country",
  options: ["China", "USA"],
});

function rule(overrides: Partial<FieldReaction> = {}): FieldReaction {
  return {
    id: "r1",
    sourceFieldId: "age",
    targetFieldId: "licence",
    condition: { operator: "greaterThan", value: 18 },
    effect: "show",
    ...overrides,
  };
}

const lookupOf = (fields: Field[]) => (id: string) => fields.find((f) => f.id === id);

function stateFor(
  target: Field,
  rules: FieldReaction[],
  fields: Field[],
  formData: Record<string, unknown>
) {
  return resolveFieldLogic(target, rules, lookupOf(fields), formData);
}

// ---------------------------------------------------------------------------

describe("evaluateCondition", () => {
  it("compares equality strictly, without coercing across types", () => {
    expect(evaluateCondition({ operator: "equals", value: 18 }, 18)).toBe(true);
    expect(evaluateCondition({ operator: "equals", value: 18 }, "18")).toBe(false);
    expect(evaluateCondition({ operator: "equals", value: "China" }, "China")).toBe(true);
    expect(evaluateCondition({ operator: "equals", value: true }, true)).toBe(true);
    expect(evaluateCondition({ operator: "equals", value: true }, false)).toBe(false);
  });

  it("inverts equality for notEquals", () => {
    expect(evaluateCondition({ operator: "notEquals", value: 18 }, 16)).toBe(true);
    expect(evaluateCondition({ operator: "notEquals", value: 18 }, 18)).toBe(false);
    expect(evaluateCondition({ operator: "notEquals", value: "China" }, undefined)).toBe(true);
  });

  it("treats undefined, null and empty string as empty, and 0 and false as values", () => {
    expect(evaluateCondition({ operator: "isEmpty" }, undefined)).toBe(true);
    expect(evaluateCondition({ operator: "isEmpty" }, null)).toBe(true);
    expect(evaluateCondition({ operator: "isEmpty" }, "")).toBe(true);
    expect(evaluateCondition({ operator: "isEmpty" }, 0)).toBe(false);
    expect(evaluateCondition({ operator: "isEmpty" }, false)).toBe(false);
    expect(evaluateCondition({ operator: "isEmpty" }, "x")).toBe(false);
  });

  it("inverts emptiness for isNotEmpty", () => {
    expect(evaluateCondition({ operator: "isNotEmpty" }, undefined)).toBe(false);
    expect(evaluateCondition({ operator: "isNotEmpty" }, "")).toBe(false);
    expect(evaluateCondition({ operator: "isNotEmpty" }, 0)).toBe(true);
    expect(evaluateCondition({ operator: "isNotEmpty" }, false)).toBe(true);
  });

  it("orders numbers only", () => {
    expect(evaluateCondition({ operator: "greaterThan", value: 18 }, 21)).toBe(true);
    expect(evaluateCondition({ operator: "greaterThan", value: 18 }, 18)).toBe(false);
    expect(evaluateCondition({ operator: "lessThan", value: 18 }, 16)).toBe(true);
    expect(evaluateCondition({ operator: "lessThan", value: 18 }, 18)).toBe(false);
  });

  it("does not match an ordering operator that has no value", () => {
    expect(evaluateCondition({ operator: "greaterThan" }, 21)).toBe(false);
    expect(evaluateCondition({ operator: "lessThan" }, 1)).toBe(false);
  });

  it("does not match equals or notEquals when the value is missing", () => {
    // A rule without a value cannot be judged; it must not silently behave like `=== undefined`.
    expect(evaluateCondition({ operator: "equals" }, undefined)).toBe(false);
    expect(evaluateCondition({ operator: "notEquals" }, undefined)).toBe(false);
  });

  it("does not order a string against a number, or the reverse", () => {
    expect(evaluateCondition({ operator: "greaterThan", value: 5 }, "10")).toBe(false);
    expect(evaluateCondition({ operator: "lessThan", value: "5" as unknown as number }, 10)).toBe(false);
  });

  it("returns null for an unknown operator", () => {
    expect(evaluateCondition({ operator: "wat" as ReactionOperator }, 1)).toBeNull();
  });
});

describe("operatorsForField", () => {
  it("gives numbers the full set", () => {
    expect(operatorsForField({ dataType: "number" })).toEqual([
      "equals",
      "notEquals",
      "greaterThan",
      "lessThan",
      "isEmpty",
      "isNotEmpty",
    ]);
  });

  it("gives strings equality and emptiness but no ordering", () => {
    expect(operatorsForField({ dataType: "string" })).toEqual([
      "equals",
      "notEquals",
      "isEmpty",
      "isNotEmpty",
    ]);
  });

  it("gives booleans equality only", () => {
    expect(operatorsForField({ dataType: "boolean" })).toEqual(["equals", "notEquals"]);
  });
});

describe("valueKindForField", () => {
  it("picks the editor from the source field", () => {
    expect(valueKindForField(AGE, "equals")).toBe("number");
    expect(valueKindForField(field({ dataType: "boolean" }), "equals")).toBe("boolean");
    expect(valueKindForField(COUNTRY, "equals")).toBe("enum");
    expect(valueKindForField(field({ format: "date" }), "equals")).toBe("date");
    expect(valueKindForField(field({ format: "email" }), "equals")).toBe("email");
    expect(valueKindForField(field({ widget: "textarea" }), "equals")).toBe("text");
  });

  it("asks for no editor on the emptiness operators", () => {
    expect(valueKindForField(AGE, "isEmpty")).toBe("none");
    expect(valueKindForField(COUNTRY, "isNotEmpty")).toBe("none");
  });
});

describe("resolveFieldLogic", () => {
  const fields = [AGE, LICENCE];

  it("falls back to the base state when no rule targets the field", () => {
    expect(stateFor(LICENCE, [], fields, {})).toEqual({ visible: true, enabled: true, required: false });
  });

  it("carries the static required and disabled flags as the base state", () => {
    const target = field({ id: "licence", required: true, disabled: true });
    expect(baseFieldState(target)).toEqual({ visible: true, enabled: false, required: true });
  });

  const matched = { age: 21 };
  const unmatched = { age: 16 };

  it.each<[ReactionEffect, boolean, boolean]>([
    ["show", true, true],
    ["show", false, false],
    ["hide", true, false],
    ["hide", false, true],
  ])("visibility %s with matched=%s -> visible=%s", (effect, isMatched, expected) => {
    const state = stateFor(LICENCE, [rule({ effect })], fields, isMatched ? matched : unmatched);
    expect(state.visible).toBe(expected);
  });

  it.each<[ReactionEffect, boolean, boolean]>([
    ["enable", true, true],
    ["enable", false, false],
    ["disable", true, false],
    ["disable", false, true],
  ])("enabled %s with matched=%s -> enabled=%s", (effect, isMatched, expected) => {
    const state = stateFor(LICENCE, [rule({ effect })], fields, isMatched ? matched : unmatched);
    expect(state.enabled).toBe(expected);
  });

  it.each<[ReactionEffect, boolean, boolean]>([
    ["required", true, true],
    ["required", false, false],
    ["optional", true, false],
    ["optional", false, true],
  ])("required %s with matched=%s -> required=%s", (effect, isMatched, expected) => {
    const state = stateFor(LICENCE, [rule({ effect })], fields, isMatched ? matched : unmatched);
    expect(state.required).toBe(expected);
  });

  it("lets an optional rule override the field's own required flag", () => {
    const target = field({ id: "licence", required: true });
    const state = stateFor(target, [rule({ effect: "optional" })], [AGE, target], matched);
    expect(state.required).toBe(false);
  });

  it("lets a required rule promote a field that is not required on its own", () => {
    const state = stateFor(LICENCE, [rule({ effect: "required" })], fields, matched);
    expect(state.required).toBe(true);
  });

  it("lets an enable rule override the field's own disabled flag", () => {
    const target = field({ id: "licence", disabled: true });
    const state = stateFor(target, [rule({ effect: "enable" })], [AGE, target], matched);
    expect(state.enabled).toBe(true);
  });

  it("forces required to false whenever the field is hidden", () => {
    const rules = [
      rule({ id: "r1", effect: "hide", condition: { operator: "lessThan", value: 18 } }),
      rule({ id: "r2", effect: "required" }),
    ];
    const state = stateFor(LICENCE, rules, fields, { age: 16 });
    expect(state.visible).toBe(false);
    expect(state.required).toBe(false);
  });

  it("keeps the base state when the source field no longer exists", () => {
    const target = field({ id: "licence", required: true });
    // Source id that is not among `fields`.
    const orphan = rule({ sourceFieldId: "deleted", effect: "hide" });
    expect(stateFor(target, [orphan], [target], {})).toEqual({
      visible: true,
      enabled: true,
      required: true,
    });
  });

  it("ignores a rule whose condition cannot be judged", () => {
    const broken = rule({ effect: "hide", condition: { operator: "greaterThan" } });
    // Missing value: not "false", so the field must not flip to hidden.
    expect(stateFor(LICENCE, [broken], fields, { age: 21 }).visible).toBe(true);
  });

  it("ignores a rule with an unknown effect instead of crashing", () => {
    const broken = rule({ effect: "explode" as ReactionEffect });
    expect(stateFor(LICENCE, [broken], fields, matched).visible).toBe(true);
  });

  it("lets a later rule of the same class win", () => {
    const rules = [
      rule({ id: "r1", effect: "hide", condition: { operator: "isEmpty" } }),
      rule({ id: "r2", effect: "show", condition: { operator: "isEmpty" } }),
    ];
    expect(stateFor(LICENCE, rules, fields, {}).visible).toBe(true);
  });
});

describe("resolveFormLogic", () => {
  it("maps a field id to its value through the field name", () => {
    const country = field({ id: "country", name: "country_name", widget: "select" });
    const province = field({ id: "province", name: "province" });
    const rules = [
      rule({
        sourceFieldId: "country",
        targetFieldId: "province",
        condition: { operator: "equals", value: "China" },
        effect: "enable",
      }),
    ];

    // formData is keyed by name, the rule by id: the util is the only place that bridges them.
    const states = resolveFormLogic([country, province], rules, { country_name: "China" });
    expect(states.get("province")!.enabled).toBe(true);
    expect(states.get("country")!.enabled).toBe(true);

    const other = resolveFormLogic([country, province], rules, { country_name: "USA" });
    expect(other.get("province")!.enabled).toBe(false);
  });

  it("returns a state for every field", () => {
    const states = resolveFormLogic([AGE, LICENCE, COUNTRY], [], {});
    expect([...states.keys()].sort()).toEqual(["age", "country", "licence"]);
  });
});

describe("rule bookkeeping", () => {
  it("removes rules that point at a deleted field from either side", () => {
    const rules = [
      rule({ id: "as-source", sourceFieldId: "age", targetFieldId: "licence" }),
      rule({ id: "as-target", sourceFieldId: "country", targetFieldId: "age" }),
      rule({ id: "unrelated", sourceFieldId: "country", targetFieldId: "licence" }),
    ];

    expect(removeReactionsForField(rules, "age").map((r) => r.id)).toEqual(["unrelated"]);
  });

  it("reports which effect class a target already occupies", () => {
    const rules = [rule({ effect: "hide" }), rule({ effect: "required" })];
    expect(ruleOfClass(rules, "licence", "visibility")?.effect).toBe("hide");
    expect(ruleOfClass(rules, "licence", "enabled")).toBeUndefined();
    expect(availableEffectClasses(rules, "licence")).toEqual(["enabled"]);
  });

  it("offers every field except the target as a source", () => {
    expect(sourceCandidates([AGE, LICENCE, COUNTRY], "licence").map((f) => f.id)).toEqual([
      "age",
      "country",
    ]);
  });
});

describe("isFieldReaction", () => {
  it("accepts a well-formed rule", () => {
    expect(isFieldReaction(rule())).toBe(true);
    expect(isFieldReaction(rule({ condition: { operator: "isEmpty" } }))).toBe(true);
  });

  it("rejects rules missing identity or carrying an unknown operator or effect", () => {
    expect(isFieldReaction(null)).toBe(false);
    expect(isFieldReaction([])).toBe(false);
    expect(isFieldReaction(rule({ id: "" }))).toBe(false);
    expect(isFieldReaction(rule({ sourceFieldId: "" }))).toBe(false);
    expect(isFieldReaction(rule({ effect: "explode" as ReactionEffect }))).toBe(false);
    expect(isFieldReaction(rule({ condition: { operator: "wat" as ReactionOperator } }))).toBe(false);
    expect(isFieldReaction({ ...rule(), condition: undefined })).toBe(false);
  });

  it("rejects a value that is not one of the three form value types", () => {
    expect(isFieldReaction(rule({ condition: { operator: "equals", value: { a: 1 } as never } }))).toBe(
      false
    );
  });
});
