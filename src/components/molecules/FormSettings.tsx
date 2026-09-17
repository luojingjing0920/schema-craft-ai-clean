import { Checkbox, FormControlLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import SettingsSection from "../atoms/SettingsSection";
import type { FormDefinition, FormLayoutConfig } from "../../types/formDefinition";

interface FormSettingsProps {
  form: FormDefinition;
  /** Patches the form record itself; the builder stamps updatedAt and marks the draft dirty. */
  onUpdate: (patch: Partial<FormDefinition>) => void;
}

const COLUMN_OPTIONS: FormLayoutConfig["columns"][] = [1, 2, 3, 4];

const RowLabelStyles = {
  minWidth: 60,
  fontWeight: 500,
  color: "text.secondary",
};

/**
 * The form's own settings, shown in the inspector while no field is selected: the metadata that
 * identifies a saved form, plus the column layout its fields inherit.
 */
export default function FormSettings({ form, onUpdate }: FormSettingsProps) {
  const updateLayout = (patch: Partial<FormLayoutConfig>) =>
    onUpdate({ layout: { ...form.layout, ...patch } });

  return (
    <Stack spacing={3}>
      <SettingsSection title="Basic">
        <TextField
          label="Form Name"
          value={form.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          size="small"
          fullWidth
        />
        <TextField
          label="Description"
          value={form.description ?? ""}
          onChange={(e) => onUpdate({ description: e.target.value })}
          size="small"
          multiline
          rows={2}
          placeholder="What is this form for? (optional)"
          fullWidth
        />
      </SettingsSection>

      <SettingsSection title="Layout">
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="body2" sx={RowLabelStyles}>
            Columns
          </Typography>
          <Select
            value={form.layout.columns}
            onChange={(e) => updateLayout({ columns: Number(e.target.value) as FormLayoutConfig["columns"] })}
            size="small"
            sx={{ flex: 1 }}
          >
            {COLUMN_OPTIONS.map((columns) => (
              <MenuItem key={columns} value={columns}>
                {columns} column{columns === 1 ? "" : "s"}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Typography variant="caption" color="text.secondary">
          Applies to fields without a width override. Fields with an explicit width keep it.
        </Typography>
      </SettingsSection>

      <SettingsSection title="Submission">
        <FormControlLabel
          control={
            <Checkbox
              checked={form.layout.showSubmitButton}
              onChange={(e) => updateLayout({ showSubmitButton: e.target.checked })}
            />
          }
          label="Show submit button"
        />

        <TextField
          label="Submit button text"
          value={form.layout.submitButtonText}
          onChange={(e) => updateLayout({ submitButtonText: e.target.value })}
          size="small"
          fullWidth
          // Kept editable-looking would be a lie: nothing renders it while the button is hidden.
          disabled={!form.layout.showSubmitButton}
          helperText={
            form.layout.showSubmitButton
              ? "Shown in Preview, and only in Preview."
              : "The button is hidden. This text is kept for when it is shown again."
          }
        />
      </SettingsSection>
    </Stack>
  );
}
