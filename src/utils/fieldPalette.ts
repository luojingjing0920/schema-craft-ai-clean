import type SvgIcon from "@mui/material/SvgIcon";
import AlternateEmailIcon from "@mui/icons-material/AlternateEmail";
import ArrowDropDownCircleOutlinedIcon from "@mui/icons-material/ArrowDropDownCircleOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import CheckBoxOutlinedIcon from "@mui/icons-material/CheckBoxOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import NotesIcon from "@mui/icons-material/Notes";
import NumbersIcon from "@mui/icons-material/Numbers";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import type { FieldPresetKey } from "./fieldPresets";

/** A palette section: a display label plus the preset keys it contains. */
export interface FieldPaletteGroup {
  label: string;
  keys: FieldPresetKey[];
}

/**
 * Presentation-only grouping of the component library.
 *
 * Groups hold preset *keys*, never preset values, so FIELD_PRESETS stays the one source of truth
 * for what a field kind is. A preset that is missing here is caught by the palette test.
 */
export const FIELD_PALETTE_GROUPS: FieldPaletteGroup[] = [
  { label: "Basic", keys: ["text", "number", "textarea", "email", "password"] },
  { label: "Choice", keys: ["boolean", "select", "radio"] },
  { label: "Date & Time", keys: ["date"] },
];

/**
 * Icon per preset key. `FieldPreset.icon` holds an emoji for the settings selector; the builder
 * palette uses these MUI icons instead, so the emoji leave the workspace without touching the
 * preset data model.
 */
export const FIELD_PRESET_ICONS: Record<FieldPresetKey, typeof SvgIcon> = {
  text: TextFieldsIcon,
  number: NumbersIcon,
  boolean: CheckBoxOutlinedIcon,
  select: ArrowDropDownCircleOutlinedIcon,
  textarea: NotesIcon,
  email: AlternateEmailIcon,
  password: LockOutlinedIcon,
  date: CalendarMonthOutlinedIcon,
  radio: RadioButtonCheckedIcon,
};
