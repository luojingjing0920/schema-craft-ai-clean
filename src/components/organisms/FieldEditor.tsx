import { Card, CardContent, Typography, Box, Button, Stack } from "@mui/material";
import { useState, useEffect, useRef, type ReactNode } from "react";
import FieldSettingsForm from "../molecules/FieldSettingsForm";
import type { Field } from "../../types/field";

interface FieldEditorProps {
  selectedField: Field | null;
  /** Width a field without an override inherits from the form column layout. */
  inheritedWidth: number;
  onUpdateField: (patch: Partial<Field>) => void;
  onShowFormSettings: () => void;
  /** Rendered in place of the field settings while no field is selected. */
  formSettings: ReactNode;
}

const CardStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  border: "1px solid",
  borderColor: "divider",
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  borderRadius: 3,
};

const FieldSettingsFormStyles = {
  display: "flex",
  flexDirection: "column",
  gap: 2,
  overflow: "auto",
  px: 3,
  pb: 2,
  flex: 1,
  minHeight: 0,
};

const FormSettingsButtonStyles = {
  textTransform: "none",
  fontSize: "0.75rem",
  minWidth: 0,
  px: 1,
  whiteSpace: "nowrap",
};

const ArrowStyles = {
  position: "absolute",
  bottom: 0,
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 32,
  height: 20,
  backgroundColor: "background.paper",
  borderRadius: "12px 12px 0 0",
  boxShadow: "0 -2px 8px rgba(0,0,0,0.15)",
  border: "1px solid",
  borderColor: "divider",
  borderBottom: "none",
  zIndex: 10,
  animation: "bounce 2s infinite",
  "@keyframes bounce": {
    "0%, 20%, 50%, 80%, 100%": {
      transform: "translateX(-50%) translateY(0)",
    },
    "40%": {
      transform: "translateX(-50%) translateY(-3px)",
    },
    "60%": {
      transform: "translateX(-50%) translateY(-2px)",
    },
  },
};

export default function FieldEditor({
  selectedField,
  inheritedWidth,
  onUpdateField,
  onShowFormSettings,
  formSettings,
}: FieldEditorProps) {
  const [hasMoreContent, setHasMoreContent] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkScrollable = () => {
      if (scrollContainerRef.current) {
        const element = scrollContainerRef.current;
        const isScrollable = element.scrollHeight > element.clientHeight;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;

        // Show arrow if there's scrollable content and user is not at the very bottom
        const isNotAtBottom = scrollTop < scrollHeight - clientHeight - 10;
        setHasMoreContent(isScrollable && isNotAtBottom);
      }
    };

    checkScrollable();

    const timeoutId1 = setTimeout(checkScrollable, 100);
    const timeoutId2 = setTimeout(checkScrollable, 300);

    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", checkScrollable);
      window.addEventListener("resize", checkScrollable);
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        scrollContainer.removeEventListener("scroll", checkScrollable);
        window.removeEventListener("resize", checkScrollable);
      };
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [selectedField]);

  return (
    <Card sx={CardStyles}>
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minHeight: 0,
          position: "relative",
        }}
      >
        <CardContent sx={{ p: 3, pb: 2 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              {selectedField === null ? "🧱 Form Settings" : "⚙️ Field Settings"}
            </Typography>
            {selectedField !== null && (
              <Button size="small" onClick={onShowFormSettings} sx={FormSettingsButtonStyles}>
                Form Settings
              </Button>
            )}
          </Stack>
        </CardContent>

        <Box sx={FieldSettingsFormStyles} ref={scrollContainerRef}>
          {selectedField === null ? (
            formSettings
          ) : (
            <FieldSettingsForm
              field={selectedField}
              inheritedWidth={inheritedWidth}
              onUpdate={onUpdateField}
            />
          )}
        </Box>

        {hasMoreContent && (
          <Box sx={ArrowStyles}>
            <Typography variant="caption" sx={{ fontSize: "14px", lineHeight: 1 }}>
              ⬇️
            </Typography>
          </Box>
        )}
      </Box>
    </Card>
  );
}
