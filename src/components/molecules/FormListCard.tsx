import { Card, CardActionArea, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { Link } from "react-router";
import { formDisplayName } from "../../utils/formDefinition";
import type { FormDefinition } from "../../types/formDefinition";

interface FormListCardProps {
  form: FormDefinition;
  /** Omitted on the Create page, which lists recent forms without destructive actions. */
  onDelete?: (form: FormDefinition) => void;
}

const CardStyles = {
  borderRadius: 1,
};

const ActionAreaStyles = {
  flex: 1,
  minWidth: 0,
  p: 1.5,
};

/** One card for both the Forms list and the Create page's recent forms. */
export default function FormListCard({ form, onDelete }: FormListCardProps) {
  const updated = new Date(form.updatedAt).toLocaleString();
  const fieldCount = `${form.fields.length} field${form.fields.length === 1 ? "" : "s"}`;

  return (
    <Card variant="outlined" sx={CardStyles}>
      <Stack direction="row" alignItems="center" sx={{ pr: 0.5 }}>
        {/* The action area and the delete button are siblings: nesting a button inside the link
            would put two interactive elements in one another. */}
        <CardActionArea component={Link} to={`/builder/${form.id}`} sx={ActionAreaStyles}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
              {formDisplayName(form)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fieldCount} · Updated {updated}
            </Typography>
          </Stack>
        </CardActionArea>

        {onDelete && (
          <Tooltip title="Delete form">
            <IconButton
              size="small"
              aria-label={`Delete form "${formDisplayName(form)}"`}
              onClick={() => onDelete(form)}
            >
              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Card>
  );
}
