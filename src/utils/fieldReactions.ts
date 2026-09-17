import type { Field } from "../types/field";
import type {
  EffectiveFieldState,
  FieldReaction,
  ReactionCondition,
  ReactionEffect,
  ReactionEffectClass,
  ReactionOperator,
} from "../types/fieldReaction";
import { CLASS_EFFECTS, EFFECT_CLASS, VALUELESS_OPERATORS } from "../types/fieldReaction";
import { usesEnumOptions } from "./fieldTypeChange";

/** formData as RJSF hands it to us: keyed by field name, holding the three value axes. */
export type FormData = Record<string, unknown>;

/** Rules are declared against field ids; the reducer never sees a raw formData lookup. */
type FieldLookup = (fieldId: string) => Field | undefined;

// ---------------------------------------------------------------------------
// guards
// ---------------------------------------------------------------------------

const OPERATORS: ReactionOperator[] = [
  "equals",
  "notEquals",
  "greaterThan",
  "lessThan",
  "isEmpty",
  "isNotEmpty",
];

const EFFECTS: ReactionEffect[] = ["show", "hide", "enable", "disable", "required", "optional"];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

/** A stored rule is only usable if every one of its parts is. Anything else is dropped on read. */
export function isFieldReaction(value: unknown): value is FieldReaction {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const rule = value as Record<string, unknown>;
  if (!isNonEmptyString(rule.id)) return false;
  if (!isNonEmptyString(rule.sourceFieldId)) return false;
  if (!isNonEmptyString(rule.targetFieldId)) return false;
  if (!EFFECTS.includes(rule.effect as ReactionEffect)) return false;

  const condition = rule.condition;
  if (typeof condition !== "object" || condition === null) return false;
  const { operator, value: compareValue } = condition as Record<string, unknown>;
  if (!OPERATORS.includes(operator as ReactionOperator)) return false;

  if (compareValue === undefined) return true;
  return (
    typeof compareValue === "string" ||
    typeof compareValue === "number" ||
    typeof compareValue === "boolean"
  );
}

export function isEffectOfClass(effect: ReactionEffect, effectClass: ReactionEffectClass): boolean {
  return EFFECT_CLASS[effect] === effectClass;
}

// ---------------------------------------------------------------------------
// operator / value shape, derived from the source field
// ---------------------------------------------------------------------------

/**
 * Which operators make sense for a source field.
 *
 * String comparison is deliberately limited to equality: lexical `greaterThan` on text has no
 * meaning a form author would expect. Booleans get no emptiness test, since a checkbox is
 * true-or-false rather than filled-or-empty.
 */
export function operatorsForField(field: Pick<Field, "dataType">): ReactionOperator[] {
  switch (field.dataType) {
    case "number":
      return ["equals", "notEquals", "greaterThan", "lessThan", "isEmpty", "isNotEmpty"];
    case "boolean":
      return ["equals", "notEquals"];
    default:
      return ["equals", "notEquals", "isEmpty", "isNotEmpty"];
  }
}

export function isOperatorAllowedForField(
  operator: ReactionOperator,
  field: Pick<Field, "dataType">
): boolean {
  return operatorsForField(field).includes(operator);
}

/** What the condition value editor should render, decided by the source field. */
export type ConditionValueKind = "number" | "boolean" | "enum" | "date" | "email" | "text" | "none";

export function valueKindForField(
  field: Pick<Field, "dataType" | "widget" | "format">,
  operator: ReactionOperator
): ConditionValueKind {
  if (VALUELESS_OPERATORS.includes(operator)) return "none";
  if (field.dataType === "number") return "number";
  if (field.dataType === "boolean") return "boolean";
  if (usesEnumOptions(field.dataType, field.widget)) return "enum";
  if (field.format === "date") return "date";
  if (field.format === "email") return "email";
  return "text";
}

export function defaultOperatorForField(field: Pick<Field, "dataType">): ReactionOperator {
  return operatorsForField(field)[0];
}

/** A fresh, always-legal condition for a field: first allowed operator, no stale value. */
export function defaultConditionForField(
  field: Pick<Field, "dataType" | "widget" | "format">
): ReactionCondition {
  return { operator: defaultOperatorForField(field) };
}

/** Re-seeds the condition after the source field changes, dropping rules from the old source. */
export function conditionForSource(field: Pick<Field, "dataType" | "widget" | "format">): ReactionCondition {
  return defaultConditionForField(field);
}

// ---------------------------------------------------------------------------
// condition evaluation
// ---------------------------------------------------------------------------

/** `undefined`, `null` and `""` are empty. `0` and `false` are values, not absences. */
function isEmptyValue(value: unknown): boolean {
  return value === undefined || value === null || value === "";
}

function matches(condition: ReactionCondition, sourceValue: unknown): boolean {
  const { operator, value } = condition;

  switch (operator) {
    case "isEmpty":
      return isEmptyValue(sourceValue);
    case "isNotEmpty":
      return !isEmptyValue(sourceValue);
    case "equals":
      // Strict: a number never equals its string form, so "18" does not match the number 18.
      return value !== undefined && sourceValue === value;
    case "notEquals":
      return value !== undefined && sourceValue !== value;
    case "greaterThan":
      return (
        typeof value === "number" && typeof sourceValue === "number" && sourceValue > value
      );
    case "lessThan":
      return typeof value === "number" && typeof sourceValue === "number" && sourceValue < value;
    default:
      return false;
  }
}

/**
 * Whether a rule's condition holds for the current form data.
 *
 * Every unusable rule evaluates to `null` rather than `false`: a missing source field or a
 * malformed condition is not "the condition is untrue", it is "this rule cannot be judged", and
 * the caller must fall back to the field's base state instead of flipping it.
 */
export function evaluateCondition(
  condition: ReactionCondition,
  sourceValue: unknown
): boolean | null {
  if (!OPERATORS.includes(condition.operator)) return null;
  return matches(condition, sourceValue);
}

// ---------------------------------------------------------------------------
// effective state
// ---------------------------------------------------------------------------

/** The state a field has with no reactions at all. */
export function baseFieldState(field: Field): EffectiveFieldState {
  return {
    visible: true,
    enabled: !field.disabled,
    required: !!field.required,
  };
}

function flip(effect: ReactionEffect, matched: boolean): boolean {
  switch (effect) {
    case "show":
      return matched;
    case "hide":
      return !matched;
    case "enable":
      return matched;
    case "disable":
      return !matched;
    case "required":
      return matched;
    case "optional":
      return !matched;
    default:
      return matched;
  }
}

/**
 * Folds every rule aimed at one field into its effective state.
 *
 * At most one rule per effect class is expected — the inspector enforces that — but a store edited
 * by hand could still hold two, so later rules win rather than the outcome depending on nothing.
 */
export function resolveFieldLogic(
  field: Field,
  reactions: FieldReaction[],
  lookupField: FieldLookup,
  formData: FormData
): EffectiveFieldState {
  const state = baseFieldState(field);

  for (const rule of reactions) {
    if (rule.targetFieldId !== field.id) continue;

    const effectClass = EFFECT_CLASS[rule.effect];
    if (!effectClass) continue;

    const source = lookupField(rule.sourceFieldId);
    // A rule whose source is gone cannot be judged, so the field keeps its base state.
    if (!source) continue;

    const matched = evaluateCondition(rule.condition, formData[source.name]);
    if (matched === null) continue;

    const value = flip(rule.effect, matched);
    if (effectClass === "visibility") state.visible = value;
    else if (effectClass === "enabled") state.enabled = value;
    else state.required = value;
  }

  // A hidden field must never block submission through a required check nobody can see.
  if (!state.visible) state.required = false;

  return state;
}

/**
 * Effective state for every field, keyed by field id.
 *
 * This is the one place where a field id becomes a formData read (`id -> field.name -> formData`),
 * so no caller has to know that the two identity spaces differ.
 */
export function resolveFormLogic(
  fields: Field[],
  reactions: FieldReaction[],
  formData: FormData
): Map<string, EffectiveFieldState> {
  const byId = new Map(fields.map((field) => [field.id, field]));
  const lookup: FieldLookup = (fieldId) => byId.get(fieldId);

  return new Map(
    fields.map((field) => [field.id, resolveFieldLogic(field, reactions, lookup, formData)])
  );
}

// ---------------------------------------------------------------------------
// maintenance
// ---------------------------------------------------------------------------

/** Drops every rule that mentions `fieldId` on either side, so no rule is left dangling. */
export function removeReactionsForField(
  reactions: FieldReaction[],
  fieldId: string
): FieldReaction[] {
  return reactions.filter(
    (rule) => rule.sourceFieldId !== fieldId && rule.targetFieldId !== fieldId
  );
}

/** Rules that act on `fieldId`, i.e. the ones the inspector shows for that field. */
export function reactionsTargeting(
  reactions: FieldReaction[],
  fieldId: string
): FieldReaction[] {
  return reactions.filter((rule) => rule.targetFieldId === fieldId);
}

/** The rule already occupying `effectClass` for this target, if any. */
export function ruleOfClass(
  reactions: FieldReaction[],
  targetFieldId: string,
  effectClass: ReactionEffectClass
): FieldReaction | undefined {
  return reactions.find(
    (rule) => rule.targetFieldId === targetFieldId && EFFECT_CLASS[rule.effect] === effectClass
  );
}

/** Effect classes this target has no rule for yet, in inspector order. */
export function availableEffectClasses(
  reactions: FieldReaction[],
  targetFieldId: string
): ReactionEffectClass[] {
  return (Object.keys(CLASS_EFFECTS) as ReactionEffectClass[]).filter(
    (effectClass) => !ruleOfClass(reactions, targetFieldId, effectClass)
  );
}

/** Fields that may act as a source for `targetFieldId`: everything but the target itself. */
export function sourceCandidates(fields: Field[], targetFieldId: string): Field[] {
  return fields.filter((field) => field.id !== targetFieldId);
}

/** Target ids that carry at least one rule, for the canvas indicator. */
export function reactionTargetIds(reactions: FieldReaction[]): Set<string> {
  return new Set(reactions.map((rule) => rule.targetFieldId));
}

/** Identity for a new rule. Random like field ids, and only ever compared, never sorted. */
export function newReactionId(): string {
  return Math.random().toString(36).slice(2, 9);
}
