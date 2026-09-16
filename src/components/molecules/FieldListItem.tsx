import { IconButton, ListItem, ListItemText, Tooltip, Typography, alpha, useMediaQuery, useTheme } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FieldChip from "../atoms/FieldChip";
import FieldControls from "./FieldControls";
import type { Field } from "../../types/field";
import { fieldTypeLabel } from "../../utils/fieldTypeChange";

interface FieldListItemProps {
  field: Field;
  index: number;
  totalFields: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
}

const ListItemStyles = (isSelected: boolean, isMobile: boolean, primaryColor: string) => ({
  borderRadius: 1,
  mb: 0.25,
  minHeight: isMobile ? 48 : 34,
  py: 0.25,
  px: 0.5,
  bgcolor: isSelected ? alpha(primaryColor, 0.08) : "transparent",
  border: "1px solid",
  borderColor: isSelected ? alpha(primaryColor, 0.4) : "transparent",
  cursor: "pointer",
  transition: "background-color 0.15s ease, border-color 0.15s ease",
  "&:hover": {
    bgcolor: isSelected ? alpha(primaryColor, 0.08) : "action.hover",
    borderColor: isSelected ? alpha(primaryColor, 0.4) : "divider",
  },
});

export default function FieldListItem({
  field,
  index,
  totalFields,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: FieldListItemProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Same id space as the canvas's sortable items, so a drag can start in either list.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  return (
    <ListItem
      ref={setNodeRef}
      dense
      sx={{
        ...ListItemStyles(isSelected, isMobile, theme.palette.primary.main),
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 1 : "auto",
      }}
      secondaryAction={
        <FieldControls
          id={field.id}
          index={index}
          totalFields={totalFields}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
        />
      }
      onClick={() => onSelect(field.id)}
    >
      <Tooltip title="Drag to reorder" placement="right">
        <IconButton
          {...attributes}
          {...listeners}
          type="button"
          size="small"
          aria-label={`Reorder field "${field.name}"`}
          sx={{
            width: 18,
            minWidth: 18,
            height: 24,
            p: 0,
            mr: 0.5,
            color: "text.disabled",
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
            "&:hover": { color: "primary.main" },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: "0.9rem" }} />
        </IconButton>
      </Tooltip>

      <ListItemText
        primary={
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: "text.primary" }}>
            {field.title}
          </Typography>
        }
        secondary={<FieldChip type={fieldTypeLabel(field)} />}
      />
    </ListItem>
  );
}
