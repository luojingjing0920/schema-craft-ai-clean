import { Box, IconButton, alpha } from "@mui/material";
import { Templates } from "@rjsf/mui";
import type { FieldTemplateProps } from "@rjsf/utils";
import {
  CANVAS_ID_PREFIX,
  resolveCanvasFieldName,
  type CanvasSelectionContext,
} from "../../utils/canvasSelection";

/**
 * The stock MUI field template, taken from the theme's public exports rather than copied.
 * Everything below the canvas wrapper is delegated to it, so description / errors / help /
 * hidden / required / disabled / additional-properties behaviour all stay exactly as before.
 *
 * RJSF types every template slot as optional, but `generateTemplates()` always provides
 * FieldTemplate, which is why the non-null assertion is safe here.
 */
const MuiFieldTemplate = Templates.FieldTemplate!;

/**
 * The rail is the whole left strip of the field row: full height, 26px wide, always clickable.
 *
 * It is never dimmed with `opacity`, and never hidden with `visibility` / `display` /
 * `pointer-events`, so an unselected field can always be seen and clicked. Its presence comes
 * from a faint track plus a visible grip glyph rather than from being faded out.
 */
const RAIL_WIDTH = 26;

const RailStyles = (isSelected: boolean) => ({
  flex: "0 0 auto",
  alignSelf: "stretch",
  width: RAIL_WIDTH,
  minWidth: RAIL_WIDTH,
  height: "auto",
  p: 0,
  borderRadius: 1,
  cursor: "pointer",
  fontSize: "0.85rem",
  lineHeight: 1,
  letterSpacing: "-0.15em",
  color: isSelected ? "primary.main" : "text.disabled",
  bgcolor: isSelected ? alpha("#1976d2", 0.14) : alpha("#000000", 0.04),
  "&:hover": {
    color: "primary.main",
    bgcolor: alpha("#1976d2", 0.12),
  },
});

const RowStyles = (isSelected: boolean) => ({
  display: "flex",
  // stretch, not flex-start: the rail has to span the whole field, not just its top.
  alignItems: "stretch",
  gap: 0.5,
  // Always reserved, only coloured when selected, so selecting never shifts the layout.
  borderLeft: "2px solid",
  borderColor: isSelected ? "primary.main" : "transparent",
  pl: 0.75,
});

export default function CanvasFieldTemplate(props: FieldTemplateProps) {
  const { id, label, formContext } = props;
  const selection = (formContext as { selection?: CanvasSelectionContext } | undefined)?.selection;
  const name = selection ? resolveCanvasFieldName(id, CANVAS_ID_PREFIX, selection.fieldNames) : null;

  // Not a top-level builder field (the root object, or something nested): render untouched.
  if (!selection || name === null) {
    return <MuiFieldTemplate {...props} />;
  }

  const isSelected = selection.selectedName === name;

  return (
    <Box sx={RowStyles(isSelected)}>
      {/* A sibling of the field, not a wrapper, so interacting with the real control never selects. */}
      <IconButton
        type="button"
        size="small"
        aria-label={`Select field "${label || name}"`}
        aria-pressed={isSelected}
        onClick={() => selection.onSelectField(name)}
        sx={RailStyles(isSelected)}
      >
        ⋮⋮
      </IconButton>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <MuiFieldTemplate {...props} />
      </Box>
    </Box>
  );
}
