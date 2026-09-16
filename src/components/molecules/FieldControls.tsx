import { IconButton, Stack, Tooltip, alpha } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface FieldControlsProps {
  /** Stable field identity; `index` is only the current position used for the disabled state. */
  id: string;
  index: number;
  totalFields: number;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
}

const IconButtonStyles = {
  width: 26,
  height: 26,
  "&:disabled": { opacity: 0.3 },
};

const IconButtonRemoveStyles = {
  width: 26,
  height: 26,
  color: "error.main",
  "&:hover": { bgcolor: alpha("#d32f2f", 0.1) },
};

export default function FieldControls({ id, index, totalFields, onMoveUp, onMoveDown, onRemove }: FieldControlsProps) {
  const handleMoveUp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveUp(id);
  };

  const handleMoveDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveDown(id);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove(id);
  };

  return (
    <Stack direction="row" spacing={0.25}>
      <Tooltip title={index === 0 ? "Can't move up" : "Move up"}>
        <IconButton
          size="small"
          aria-label="Move field up"
          onClick={handleMoveUp}
          disabled={index === 0}
          sx={IconButtonStyles}
        >
          <ArrowUpwardIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title={index === totalFields - 1 ? "Can't move down" : "Move down"}>
        <IconButton
          size="small"
          aria-label="Move field down"
          onClick={handleMoveDown}
          disabled={index === totalFields - 1}
          sx={IconButtonStyles}
        >
          <ArrowDownwardIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Remove field">
        <IconButton size="small" aria-label="Remove field" onClick={handleRemove} sx={IconButtonRemoveStyles}>
          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}
