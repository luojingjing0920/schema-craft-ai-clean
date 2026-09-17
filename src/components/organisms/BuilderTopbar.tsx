import { Link } from "react-router";
import { AppBar, Box, Breadcrumbs, Button, Chip, Stack, Toolbar, Tooltip, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery, useTheme } from "@mui/material";
import DataObjectOutlinedIcon from "@mui/icons-material/DataObjectOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

export type BuilderMode = "edit" | "preview" | "json";

/** What the status chip reports. The builder derives it; the topbar only renders it. */
export type BuilderSaveStatus = "draft" | "unsaved" | "saved" | "failed";

interface BuilderTopbarProps {
  formName: string;
  mode: BuilderMode;
  onModeChange: (mode: BuilderMode) => void;
  /** ISO timestamp of the last edit, surfaced in the status tooltip. */
  updatedAt: string;
  status: BuilderSaveStatus;
  onSave: () => void;
}

/** AppBar + dense Toolbar come to 56px, inside the 56–64px band a workspace topbar wants. */
const TOPBAR_HEIGHT = 56;

const AppBarStyles = {
  bgcolor: "background.paper",
  color: "text.primary",
  borderBottom: 1,
  borderColor: "divider",
};

const ToolbarStyles = {
  minHeight: TOPBAR_HEIGHT,
  gap: 2,
  px: 2,
};

const BrandStyles = {
  fontWeight: 700,
  letterSpacing: "-0.01em",
};

const CrumbLinkStyles = {
  color: "text.secondary",
  textDecoration: "none",
  "&:hover": { color: "text.primary", textDecoration: "underline" },
};

const StatusChipStyles = {
  height: 22,
  fontSize: "0.6875rem",
  fontWeight: 600,
};

/** On small screens the chip carries no text, so the colour plus the tooltip is the whole signal. */
const StatusDotStyles = {
  height: 22,
  width: 22,
  "& .MuiChip-icon": { m: 0, fontSize: 10 },
};

const STATUS_LABELS: Record<BuilderSaveStatus, string> = {
  draft: "Draft",
  unsaved: "Unsaved changes",
  saved: "Saved",
  failed: "Save failed",
};

const STATUS_COLORS: Record<BuilderSaveStatus, "default" | "warning" | "success" | "error"> = {
  draft: "default",
  unsaved: "warning",
  saved: "success",
  failed: "error",
};

const STATUS_TOOLTIPS: Record<BuilderSaveStatus, string> = {
  draft: "Not saved yet — this form only exists in this tab.",
  unsaved: "Changes since the last save.",
  saved: "Saved in this browser's local storage.",
  failed: "Could not save to this browser's storage. Your changes are still here.",
};

const ModeGroupStyles = {
  "& .MuiToggleButton-root": {
    px: 1,
    py: 0.25,
    gap: 0.75,
    textTransform: "none",
    fontSize: "0.75rem",
    fontWeight: 600,
    lineHeight: 1.75,
    color: "text.secondary",
    borderColor: "divider",
    "&.Mui-selected": { color: "primary.main", bgcolor: "action.selected" },
  },
};

const SaveStyles = {
  gap: 0.75,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.75rem",
  boxShadow: "none",
};

const formattedUpdatedAt = (updatedAt: string) => new Date(updatedAt).toLocaleString();

export default function BuilderTopbar({
  formName,
  mode,
  onModeChange,
  updatedAt,
  status,
  onSave,
}: BuilderTopbarProps) {
  const theme = useTheme();
  // Small screens drop the trailing labels and the parent crumbs, keeping the form name and icons.
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static" elevation={0} sx={AppBarStyles}>
      <Toolbar variant="dense" disableGutters sx={ToolbarStyles}>
        {/* Identity: brand, then where this form sits in the app. */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, overflow: "hidden" }}>
          <Box component="img" src="/json.svg" alt="" sx={{ width: 22, height: 22, display: "block" }} />
          <Breadcrumbs
            separator={<NavigateNextIcon sx={{ fontSize: 16 }} />}
            sx={{
              minWidth: 0,
              overflow: "hidden",
              "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap", minWidth: 0 },
              "& .MuiBreadcrumbs-li": { minWidth: 0 },
            }}
          >
            {!isCompact && (
              <Typography variant="body2" sx={BrandStyles}>
                SchemaCraft AI
              </Typography>
            )}
            {!isCompact && (
              <Typography component={Link} to="/forms" variant="body2" sx={CrumbLinkStyles}>
                Forms
              </Typography>
            )}
            <Typography variant="body2" color="text.primary" noWrap sx={{ fontWeight: 600 }}>
              {formName}
            </Typography>
          </Breadcrumbs>
        </Stack>

        <Box sx={{ flex: 1 }} />

        {/* Status and actions. Labels collapse to icons on small screens — desktop is the target. */}
        <Tooltip title={`${STATUS_TOOLTIPS[status]} Last change ${formattedUpdatedAt(updatedAt)}.`}>
          <Chip
            label={isCompact ? undefined : STATUS_LABELS[status]}
            icon={isCompact ? <FiberManualRecordIcon /> : undefined}
            size="small"
            variant="outlined"
            color={STATUS_COLORS[status]}
            sx={isCompact ? StatusDotStyles : StatusChipStyles}
          />
        </Tooltip>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          onChange={(_event, next: BuilderMode | null) => {
            if (next !== null) onModeChange(next);
          }}
          aria-label="Workspace mode"
          sx={ModeGroupStyles}
        >
          <ToggleButton value="edit" aria-label="Edit">
            <EditOutlinedIcon sx={{ fontSize: 16 }} />
            {!isCompact && <Box component="span">Edit</Box>}
          </ToggleButton>
          <ToggleButton value="preview" aria-label="Preview">
            <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
            {!isCompact && <Box component="span">Preview</Box>}
          </ToggleButton>
          <ToggleButton value="json" aria-label="Schema">
            <DataObjectOutlinedIcon sx={{ fontSize: 16 }} />
            {!isCompact && <Box component="span">Schema</Box>}
          </ToggleButton>
        </ToggleButtonGroup>

        <Button size="small" variant="contained" disableElevation onClick={onSave} sx={SaveStyles}>
          <SaveOutlinedIcon sx={{ fontSize: 16 }} />
          {!isCompact && <Box component="span">Save</Box>}
        </Button>
      </Toolbar>
    </AppBar>
  );
}
