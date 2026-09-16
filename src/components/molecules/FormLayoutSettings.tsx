import { MenuItem, Select, Stack, Typography } from "@mui/material";
import SettingsSection from "../atoms/SettingsSection";
import type { FormLayoutConfig } from "../../types/formDefinition";

interface FormLayoutSettingsProps {
  layout: FormLayoutConfig;
  onUpdateLayout: (patch: Partial<FormLayoutConfig>) => void;
}

const COLUMN_OPTIONS: FormLayoutConfig["columns"][] = [1, 2, 3, 4];

export default function FormLayoutSettings({ layout, onUpdateLayout }: FormLayoutSettingsProps) {
  return (
    <SettingsSection title="Layout">
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: 60, fontWeight: 500, color: "text.secondary" }}>
          Columns
        </Typography>
        <Select
          value={layout.columns}
          onChange={(e) => onUpdateLayout({ columns: Number(e.target.value) as FormLayoutConfig["columns"] })}
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
  );
}
