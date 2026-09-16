import { Box, Chip, Divider, List } from "@mui/material";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import AddFieldsPanel from "../molecules/AddFieldsPanel";
import FieldListItem from "../molecules/FieldListItem";
import PanelHeader from "../atoms/PanelHeader";
import type { Field } from "../../types/field";
import type { FieldPreset } from "../../utils/fieldPresets";

interface FieldsListProps {
  fields: Field[];
  selectedFieldId: string | null;
  onAddField: (preset: FieldPreset) => void;
  onSelectField: (id: string) => void;
  onMoveFieldUp: (id: string) => void;
  onMoveFieldDown: (id: string) => void;
  onRemoveField: (id: string) => void;
  /**
   * Desktop Edit shows the library alone: the canvas already selects, reorders and deletes, so a
   * second copy of the same field list is noise. The mobile Fields tab has no canvas at all, so
   * without the outline there would be no way to reach or reorder a field already added.
   */
  showOutline?: boolean;
}

/** Panel chrome comes from the workspace layout, so this fills its column with no frame of its own. */
const PanelStyles = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  bgcolor: "background.paper",
};

/** Library only: it owns the whole rail and scrolls the full height. */
const PaletteStyles = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  px: 1.5,
  py: 1.5,
};

/** With the outline below it, the library is capped and scrolls on its own so both stay reachable. */
const PaletteWithOutlineStyles = {
  ...PaletteStyles,
  flex: "0 1 auto",
  maxHeight: "58%",
};

const ListStyles = {
  flex: "1 1 auto",
  minHeight: 0,
  overflowY: "auto",
  px: 0.75,
  py: 0.75,
};

const CountChipStyles = {
  height: 20,
  fontSize: "0.6875rem",
  fontWeight: 600,
};

export default function FieldsList({
  fields,
  selectedFieldId,
  onAddField,
  onSelectField,
  onMoveFieldUp,
  onMoveFieldDown,
  onRemoveField,
  showOutline = false,
}: FieldsListProps) {
  return (
    <Box sx={PanelStyles}>
      <PanelHeader title="Component Library" />
      <Box sx={showOutline ? PaletteWithOutlineStyles : PaletteStyles}>
        <AddFieldsPanel onAddField={onAddField} />
      </Box>

      {showOutline && (
        <>
          <Divider />

          <PanelHeader
            title="Form Fields"
            action={<Chip label={fields.length} size="small" variant="outlined" sx={CountChipStyles} />}
          />

          <List dense disablePadding sx={ListStyles}>
            {/* Same array, same order as the canvas: `fields` stays the only ordering source. */}
            <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
              {fields.map((field, index) => (
                <FieldListItem
                  key={field.id}
                  field={field}
                  index={index}
                  totalFields={fields.length}
                  isSelected={selectedFieldId === field.id}
                  onSelect={onSelectField}
                  onMoveUp={onMoveFieldUp}
                  onMoveDown={onMoveFieldDown}
                  onRemove={onRemoveField}
                />
              ))}
            </SortableContext>
          </List>
        </>
      )}
    </Box>
  );
}
