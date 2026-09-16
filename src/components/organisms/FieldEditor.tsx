import { Typography, Box, Button, Stack } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import type { ReactNode } from "react";
import FieldSettingsForm from "../molecules/FieldSettingsForm";
import PanelHeader from "../atoms/PanelHeader";
import type { Field } from "../../types/field";

interface FieldEditorProps {
  selectedField: Field | null;
  /** Width a field without an override inherits from the form column layout. */
  inheritedWidth: number;
  /** Names already taken by the other fields, so the settings form can reject duplicates. */
  otherFieldNames: string[];
  onUpdateField: (patch: Partial<Field>) => void;
  onShowFormSettings: () => void;
  /** Rendered in place of the field settings while no field is selected. */
  formSettings: ReactNode;
}

const PanelStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  bgcolor: "background.paper",
};

const BodyStyles = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  px: 1.5,
  py: 1.5,
};

const ContextStyles = {
  display: "flex",
  alignItems: "center",
  gap: 0.75,
  mb: 1.5,
  color: "text.secondary",
};

const FormSettingsButtonStyles = {
  textTransform: "none",
  fontSize: "0.7rem",
  fontWeight: 600,
  minWidth: 0,
  px: 0.75,
  py: 0,
  whiteSpace: "nowrap",
};

export default function FieldEditor({
  selectedField,
  inheritedWidth,
  otherFieldNames,
  onUpdateField,
  onShowFormSettings,
  formSettings,
}: FieldEditorProps) {
  return (
    <Box sx={PanelStyles}>
      <PanelHeader
        title="Properties"
        action={
          selectedField !== null ? (
            <Button size="small" onClick={onShowFormSettings} sx={FormSettingsButtonStyles}>
              Form Settings
            </Button>
          ) : undefined
        }
      />

      <Box sx={BodyStyles}>
        {/* Which settings are on screen: the field's, or the form's when nothing is selected. */}
        <Stack sx={ContextStyles} direction="row">
          <TuneIcon sx={{ fontSize: 14 }} />
          <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: "0.02em" }}>
            {selectedField === null ? "Form Settings" : "Field Settings"}
          </Typography>
        </Stack>

        {selectedField === null ? (
          formSettings
        ) : (
          <FieldSettingsForm
            field={selectedField}
            inheritedWidth={inheritedWidth}
            otherFieldNames={otherFieldNames}
            onUpdate={onUpdateField}
          />
        )}
      </Box>
    </Box>
  );
}
