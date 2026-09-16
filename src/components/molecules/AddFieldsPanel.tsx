import { Stack, useMediaQuery, useTheme, Grid } from "@mui/material";
import FieldTypeButton from "../atoms/FieldTypeButton";
import { FIELD_PRESETS } from "../../utils/fieldPresets";
import type { FieldPreset } from "../../utils/fieldPresets";

interface AddFieldsPanelProps {
  onAddField: (preset: FieldPreset) => void;
}

export default function AddFieldsPanel({ onAddField }: AddFieldsPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {isMobile ? (
        <Grid container spacing={1}>
          {FIELD_PRESETS.map((preset) => (
            <Grid key={preset.key} size={6}>
              <FieldTypeButton icon={preset.icon} label={preset.paletteLabel} onClick={() => onAddField(preset)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack spacing={1.5}>
          {FIELD_PRESETS.map((preset) => (
            <FieldTypeButton
              key={preset.key}
              icon={preset.icon}
              label={preset.paletteLabel}
              onClick={() => onAddField(preset)}
            />
          ))}
        </Stack>
      )}
    </>
  );
}
