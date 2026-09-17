import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import SettingsSection from "../atoms/SettingsSection";
import type { Field } from "../../types/field";
import type {
  FieldReaction,
  ReactionCondition,
  ReactionEffect,
  ReactionEffectClass,
  ReactionOperator,
} from "../../types/fieldReaction";
import { CLASS_EFFECTS, EFFECT_LABELS, OPERATOR_LABELS, VALUELESS_OPERATORS } from "../../types/fieldReaction";
import {
  availableEffectClasses,
  conditionForSource,
  isOperatorAllowedForField,
  newReactionId,
  reactionsTargeting,
  sourceCandidates,
  valueKindForField,
} from "../../utils/fieldReactions";

interface FieldLogicEditorProps {
  /** The target: the field currently open in the inspector. */
  field: Field;
  /** Every field in the form, used both for source choices and for source lookups. */
  fields: Field[];
  reactions: FieldReaction[];
  onUpdateReactions: (next: FieldReaction[]) => void;
}

const CLASS_MENU_LABELS: Record<ReactionEffectClass, string> = {
  visibility: "Show / hide this field",
  enabled: "Enable / disable this field",
  required: "Require / make this field optional",
};

const RuleBoxStyles = {
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  p: 1,
};

const RowLabelStyles = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "text.secondary",
  minWidth: 38,
};

const ControlStyles = {
  flex: 1,
  minWidth: 0,
};

const WarningStyles = {
  display: "flex",
  alignItems: "center",
  gap: 0.5,
  color: "warning.main",
};

/** Coerces whatever a control produced into one of the three value axes a condition may hold. */
function coerceValue(kind: string, raw: string): string | number | boolean | undefined {
  if (raw === "") return undefined;
  if (kind === "number") {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (kind === "boolean") return raw === "true";
  return raw;
}

/**
 * The LOGIC section of field settings.
 *
 * Rules are authored on their *target*, which is always the field being inspected, so there is no
 * target picker: "Show this field" already says what the rule acts on.
 */
export default function FieldLogicEditor({
  field,
  fields,
  reactions,
  onUpdateReactions,
}: FieldLogicEditorProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const rules = reactionsTargeting(reactions, field.id);
  const available = availableEffectClasses(reactions, field.id);
  const candidates = sourceCandidates(fields, field.id);

  const addRule = (effectClass: ReactionEffectClass) => {
    setMenuAnchor(null);
    const source = candidates[0];
    if (!source) return;

    onUpdateReactions([
      ...reactions,
      {
        id: newReactionId(),
        sourceFieldId: source.id,
        targetFieldId: field.id,
        condition: conditionForSource(source),
        effect: CLASS_EFFECTS[effectClass][0],
      },
    ]);
  };

  const patchRule = (id: string, patch: Partial<FieldReaction>) => {
    onUpdateReactions(reactions.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  };

  const removeRule = (id: string) => {
    onUpdateReactions(reactions.filter((rule) => rule.id !== id));
  };

  return (
    <SettingsSection title="Logic">
      {rules.map((rule) => {
        const source = fields.find((candidate) => candidate.id === rule.sourceFieldId);
        const effectClass = (Object.keys(CLASS_EFFECTS) as ReactionEffectClass[]).find((key) =>
          CLASS_EFFECTS[key].includes(rule.effect)
        )!;

        if (!source) {
          // A rule whose source is gone is ignored at runtime; surfaced here so it can be removed.
          return (
            <Box key={rule.id} sx={RuleBoxStyles}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box sx={WarningStyles}>
                  <WarningAmberIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption">Source field no longer exists</Typography>
                </Box>
                <IconButton
                  size="small"
                  aria-label="Remove rule"
                  onClick={() => removeRule(rule.id)}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Box>
          );
        }

        const kind = valueKindForField(source, rule.condition.operator);

        const handleSourceChange = (sourceFieldId: string) => {
          const nextSource = fields.find((candidate) => candidate.id === sourceFieldId);
          // A condition authored for the old source cannot be reused: reseed operator and value.
          if (!nextSource) return;
          patchRule(rule.id, { sourceFieldId, condition: conditionForSource(nextSource) });
        };

        const handleOperatorChange = (operator: ReactionOperator) => {
          const condition: ReactionCondition = VALUELESS_OPERATORS.includes(operator)
            ? { operator }
            : { operator, value: rule.condition.value };
          patchRule(rule.id, { condition });
        };

        return (
          <Box key={rule.id} sx={RuleBoxStyles}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={RowLabelStyles}>WHEN</Typography>
                <Select
                  value={source.id}
                  onChange={(e) => handleSourceChange(e.target.value)}
                  size="small"
                  sx={ControlStyles}
                  inputProps={{ "aria-label": "Source field" }}
                >
                  {candidates.map((candidate) => (
                    <MenuItem key={candidate.id} value={candidate.id}>
                      {candidate.title}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={RowLabelStyles} />
                <Select
                  value={rule.condition.operator}
                  onChange={(e) => handleOperatorChange(e.target.value as ReactionOperator)}
                  size="small"
                  sx={ControlStyles}
                  inputProps={{ "aria-label": "Operator" }}
                >
                  {operatorsFor(source).map((operator) => (
                    <MenuItem key={operator} value={operator}>
                      {OPERATOR_LABELS[operator]}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              {kind !== "none" && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={RowLabelStyles} />
                  <ConditionValueEditor
                    kind={kind}
                    source={source}
                    value={rule.condition.value}
                    onChange={(raw) =>
                      patchRule(rule.id, {
                        condition: {
                          operator: rule.condition.operator,
                          value: coerceValue(kind, raw),
                        },
                      })
                    }
                  />
                </Stack>
              )}

              <Stack direction="row" spacing={1} alignItems="center">
                <Typography sx={RowLabelStyles}>THEN</Typography>
                <Select
                  value={rule.effect}
                  onChange={(e) => patchRule(rule.id, { effect: e.target.value as ReactionEffect })}
                  size="small"
                  sx={ControlStyles}
                  inputProps={{ "aria-label": "Effect" }}
                >
                  {CLASS_EFFECTS[effectClass].map((effect) => (
                    <MenuItem key={effect} value={effect}>
                      {EFFECT_LABELS[effect]}
                    </MenuItem>
                  ))}
                </Select>
                <Tooltip title="Remove rule">
                  <IconButton size="small" aria-label="Remove rule" onClick={() => removeRule(rule.id)}>
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Box>
        );
      })}

      <Button
        size="small"
        startIcon={<AddIcon />}
        disabled={available.length === 0 || candidates.length === 0}
        onClick={(e) => setMenuAnchor(e.currentTarget)}
        sx={{ alignSelf: "flex-start", textTransform: "none", fontWeight: 600, px: 0.5 }}
      >
        Add rule
      </Button>

      {candidates.length === 0 && (
        <Typography variant="caption" color="text.secondary">
          Add another field first — a rule needs a field to watch.
        </Typography>
      )}

      <Menu anchorEl={menuAnchor} open={menuAnchor !== null} onClose={() => setMenuAnchor(null)}>
        {available.map((effectClass) => (
          <MenuItem key={effectClass} onClick={() => addRule(effectClass)}>
            {CLASS_MENU_LABELS[effectClass]}
          </MenuItem>
        ))}
      </Menu>
    </SettingsSection>
  );
}

/** The editor is chosen by the source field, never by the operator alone. */
function operatorsFor(source: Field): ReactionOperator[] {
  const all: ReactionOperator[] = [
    "equals",
    "notEquals",
    "greaterThan",
    "lessThan",
    "isEmpty",
    "isNotEmpty",
  ];
  return all.filter((operator) => isOperatorAllowedForField(operator, source));
}

function ConditionValueEditor({
  kind,
  source,
  value,
  onChange,
}: {
  kind: string;
  source: Field;
  value: string | number | boolean | undefined;
  onChange: (raw: string) => void;
}) {
  if (kind === "boolean") {
    return (
      <Select
        value={value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        sx={ControlStyles}
        displayEmpty
        inputProps={{ "aria-label": "Condition value" }}
      >
        <MenuItem value="true">true</MenuItem>
        <MenuItem value="false">false</MenuItem>
      </Select>
    );
  }

  if (kind === "enum") {
    return (
      <Select
        value={value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        size="small"
        sx={ControlStyles}
        displayEmpty
        inputProps={{ "aria-label": "Condition value" }}
      >
        {(source.options ?? []).map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <TextField
      value={value === undefined ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      size="small"
      type={kind === "number" ? "number" : kind === "date" ? "date" : kind === "email" ? "email" : "text"}
      sx={ControlStyles}
      inputProps={{ "aria-label": "Condition value" }}
    />
  );
}
