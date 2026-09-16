import { Button, useMediaQuery, useTheme } from "@mui/material";
import type SvgIcon from "@mui/material/SvgIcon";

interface FieldTypeButtonProps {
  /** MUI icon component, resolved from the preset key by fieldPalette. */
  icon: typeof SvgIcon;
  label: string;
  onClick: () => void;
}

const FieldTypeButtonStyles = {
  justifyContent: "flex-start",
  gap: 1,
  borderRadius: 1,
  px: 1,
  py: 0.5,
  minHeight: 32,
  fontSize: "0.8125rem",
  fontWeight: 500,
  textTransform: "none",
  color: "text.primary",
  borderColor: "divider",
  "&:hover": {
    borderColor: "primary.main",
    bgcolor: "action.hover",
  },
};

/** Touch targets stay finger-sized below sm; the desktop palette is deliberately denser. */
const MobileStyles = {
  ...FieldTypeButtonStyles,
  minHeight: 44,
  fontSize: "0.875rem",
  py: 1,
};

export default function FieldTypeButton({ icon: Icon, label, onClick }: FieldTypeButtonProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Button
      variant="outlined"
      onClick={onClick}
      sx={isMobile ? MobileStyles : FieldTypeButtonStyles}
      fullWidth
    >
      <Icon sx={{ fontSize: 18 }} />
      {label}
    </Button>
  );
}
