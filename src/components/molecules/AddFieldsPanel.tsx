import { Stack, useMediaQuery, useTheme, Grid } from "@mui/material";
import FieldTypeButton from "../atoms/FieldTypeButton";
import type { FieldDataType, FieldWidget } from "../../types/field";

interface AddFieldsPanelProps {
  onAddField: (dataType: FieldDataType, widget: FieldWidget) => void;
}

const FieldTypes: { dataType: FieldDataType; widget: FieldWidget; icon: string; label: string }[] = [
  { dataType: "string", widget: "text", icon: "📝", label: "Text Input" },
  { dataType: "number", widget: "text", icon: "🔢", label: "Number Input" },
  { dataType: "boolean", widget: "checkbox", icon: "☑️", label: "Checkbox" },
  { dataType: "string", widget: "select", icon: "📋", label: "Select Dropdown" },
  { dataType: "string", widget: "textarea", icon: "📄", label: "Text Area" },
];

export default function AddFieldsPanel({ onAddField }: AddFieldsPanelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <>
      {isMobile ? (
        <Grid container spacing={1}>
          {FieldTypes.map(({ dataType, widget, icon, label }) => (
            <Grid key={`${dataType}:${widget}`} size={6}>
              <FieldTypeButton icon={icon} label={label} onClick={() => onAddField(dataType, widget)} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Stack spacing={1.5}>
          {FieldTypes.map(({ dataType, widget, icon, label }) => (
            <FieldTypeButton
              key={`${dataType}:${widget}`}
              icon={icon}
              label={label}
              onClick={() => onAddField(dataType, widget)}
            />
          ))}
        </Stack>
      )}
    </>
  );
}
