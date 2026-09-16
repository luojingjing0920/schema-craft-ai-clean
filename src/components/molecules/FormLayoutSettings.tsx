import { MenuItem, Select, Stack, Typography } from "@mui/material";
import type { FormLayoutConfig } from "../../types/formDefinition";

interface FormLayoutSettingsProps {
  layout: FormLayoutConfig;
  onUpdateLayout: (patch: Partial<FormLayoutConfig>) => void;
}

const COLUMN_OPTIONS: FormLayoutConfig["columns"][] = [1, 2, 3, 4];

export default function FormLayoutSettings({ layout, onUpdateLayout }: FormLayoutSettingsProps) {
  return (
    <Stack spacing={2.5} paddingTop={1}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="body2" sx={{ minWidth: "60px", fontWeight: 500 }}>
          Columns:
        </Typography>
        <Select
          value={layout.columns}
          onChange={(e) => onUpdateLayout({ columns: Number(e.target.value) as FormLayoutConfig["columns"] })}
          size="small"
          fullWidth
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
    </Stack>
  );
}
