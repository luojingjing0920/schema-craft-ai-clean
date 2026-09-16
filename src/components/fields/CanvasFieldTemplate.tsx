import { Box, IconButton, Tooltip, alpha, useTheme } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Templates } from "@rjsf/mui";
import type { FieldTemplateProps } from "@rjsf/utils";
import {
  CANVAS_ID_PREFIX,
  resolveCanvasField,
  toCanvasDndId,
  type CanvasContext,
  type CanvasFieldRef,
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
 * The rail is the whole left strip of the field row: full height, 26px wide, always visible and
 * clickable. It is never dimmed with `opacity`, and never hidden with `visibility` / `display` /
 * `pointer-events`. Clicking selects; dragging it reorders.
 *
 * Every rail carries a tint, a border and a grey grip, so an unselected field still advertises its
 * handle — only the emphasis changes on select. A rail that is invisible until hovered makes the
 * older fields look unreachable once a form grows past a screenful.
 */
const RAIL_WIDTH = 26;

const RailStyles = (isSelected: boolean, primaryColor: string) => ({
  flex: "0 0 auto",
  alignSelf: "stretch",
  width: RAIL_WIDTH,
  minWidth: RAIL_WIDTH,
  height: "auto",
  p: 0,
  borderRadius: 1,
  cursor: "grab",
  color: isSelected ? "primary.main" : "text.secondary",
  bgcolor: isSelected ? alpha(primaryColor, 0.14) : "grey.100",
  border: "1px solid",
  borderColor: isSelected ? "primary.main" : "divider",
  "&:active": { cursor: "grabbing" },
  "&:hover": {
    color: "primary.main",
    bgcolor: alpha(primaryColor, 0.1),
    borderColor: alpha(primaryColor, 0.5),
  },
});

const ActionStyles = {
  minWidth: 22,
  width: 22,
  height: 22,
  p: 0,
  color: "text.disabled",
  "&:hover": { color: "text.primary", bgcolor: alpha("#000000", 0.06) },
};

const DeleteStyles = {
  ...ActionStyles,
  "&:hover": { color: "error.main", bgcolor: alpha("#d32f2f", 0.08) },
};

/** Holds the sortable hooks, so the outer template can bail out before any hook is reached. */
function SortableCanvasField({
  fieldRef,
  canvas,
  children,
}: {
  fieldRef: CanvasFieldRef;
  canvas: CanvasContext;
  children: React.ReactNode;
}) {
  const dndId = toCanvasDndId(fieldRef.id);
  const theme = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: dndId,
  });
  const isSelected = canvas.selectedFieldId === fieldRef.id;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        display: "flex",
        alignItems: "stretch",
        gap: 0.5,
        // Always reserved, only coloured when selected, so selecting never shifts the layout.
        borderLeft: "2px solid",
        borderColor: isSelected ? "primary.main" : "transparent",
        pl: 0.75,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1 : "auto",
        position: "relative",
      }}
    >
      {/* A sibling of the field, so interacting with the real control never selects. */}
      <Tooltip title="Select or drag to reorder" placement="right">
        <IconButton
          {...attributes}
          {...listeners}
          type="button"
          size="small"
          aria-label={`Select or reorder field "${fieldRef.name}"`}
          aria-pressed={isSelected}
          onClick={() => canvas.onSelectField(fieldRef.id)}
          sx={RailStyles(isSelected, theme.palette.primary.main)}
        >
          <DragIndicatorIcon sx={{ fontSize: "1rem" }} />
        </IconButton>
      </Tooltip>

      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25, pt: 0.5 }}>
        <Tooltip title="Duplicate field" placement="left">
          <IconButton
            type="button"
            size="small"
            aria-label={`Duplicate field "${fieldRef.name}"`}
            onClick={() => canvas.onDuplicate(fieldRef.id)}
            sx={ActionStyles}
          >
            <ContentCopyIcon sx={{ fontSize: "0.9rem" }} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete field" placement="left">
          <IconButton
            type="button"
            size="small"
            aria-label={`Delete field "${fieldRef.name}"`}
            onClick={() => canvas.onDelete(fieldRef.id)}
            sx={DeleteStyles}
          >
            <DeleteOutlineIcon sx={{ fontSize: "0.9rem" }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

export default function CanvasFieldTemplate(props: FieldTemplateProps) {
  const { id, formContext } = props;
  const canvas = (formContext as { canvas?: CanvasContext } | undefined)?.canvas;
  const fieldRef = canvas ? resolveCanvasField(id, CANVAS_ID_PREFIX, canvas.fields) : null;

  // Not a top-level builder field (the root object, or something nested): render untouched.
  if (!canvas || fieldRef === null) {
    return <MuiFieldTemplate {...props} />;
  }

  return (
    <SortableCanvasField fieldRef={fieldRef} canvas={canvas}>
      <MuiFieldTemplate {...props} />
    </SortableCanvasField>
  );
}
