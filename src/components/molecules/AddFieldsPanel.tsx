import { Box, Stack, Typography, useMediaQuery, useTheme, Grid } from "@mui/material";
import FieldTypeButton from "../atoms/FieldTypeButton";
import { findPreset, type FieldPreset } from "../../utils/fieldPresets";
import { FIELD_PALETTE_GROUPS, FIELD_PRESET_ICONS } from "../../utils/fieldPalette";

interface AddFieldsPanelProps {
  onAddField: (preset: FieldPreset) => void;
}

const GroupLabelStyles = {
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  color: "text.secondary",
  textTransform: "uppercase",
};

export default function AddFieldsPanel({ onAddField }: AddFieldsPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Stack spacing={2}>
      {/* Groups come from fieldPalette (presentation); the presets themselves come from FIELD_PRESETS. */}
      {FIELD_PALETTE_GROUPS.map((group) => {
        const presets = group.keys
          .map((key) => findPreset(key))
          .filter((preset): preset is FieldPreset => preset !== undefined);

        return (
          <Box key={group.label}>
            <Typography sx={GroupLabelStyles}>{group.label}</Typography>
            {isMobile ? (
              <Grid container spacing={1} sx={{ mt: 1 }}>
                {presets.map((preset) => (
                  <Grid key={preset.key} size={6}>
                    <FieldTypeButton
                      icon={FIELD_PRESET_ICONS[preset.key]}
                      label={preset.paletteLabel}
                      onClick={() => onAddField(preset)}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Stack spacing={0.75} sx={{ mt: 1 }}>
                {presets.map((preset) => (
                  <FieldTypeButton
                    key={preset.key}
                    icon={FIELD_PRESET_ICONS[preset.key]}
                    label={preset.paletteLabel}
                    onClick={() => onAddField(preset)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
