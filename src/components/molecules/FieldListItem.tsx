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

const ListItemStyles = (isSelected: boolean, isMobile: boolean) => ({
  borderRadius: 2,
  mb: 0.5,
  minHeight: isMobile ? 56 : 'auto',
  bgcolor: isSelected ? alpha("#1976d2", 0.08) : "transparent",
  border: isSelected ? "1px solid" : "1px solid transparent",
  borderColor: isSelected ? alpha("#1976d2", 0.3) : "transparent",
  cursor: "pointer",
  transition: "all 0.2s ease",
  "&:hover": {
    bgcolor: alpha("#1976d2", 0.04),
    borderColor: alpha("#1976d2", 0.2),
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
      sx={{
        ...ListItemStyles(isSelected, isMobile),
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
            width: 20,
            minWidth: 20,
            height: 28,
            p: 0,
            mr: 0.5,
            color: "text.disabled",
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
            "&:hover": { color: "primary.main" },
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: "1rem" }} />
        </IconButton>
      </Tooltip>

      <ListItemText
        primary={
          <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
            {field.title}
          </Typography>
        }
        secondary={<FieldChip type={fieldTypeLabel(field)} />}
      />
    </ListItem>
  );
}
