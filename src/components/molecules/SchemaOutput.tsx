import { Stack, Button } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DownloadIcon from "@mui/icons-material/Download";
import SchemaCodeBlock from "../atoms/SchemaCodeBlock";

interface SchemaOutputProps {
  content: string;
  onCopy: () => void;
  onSave: () => void;
}

const ButtonStyles = {
  borderRadius: 1,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.75rem",
};

const FooterStyles = {
  p: 1.5,
  pt: 1,
  borderTop: 1,
  borderColor: "divider",
};

export default function SchemaOutput({ content, onCopy, onSave }: SchemaOutputProps) {
  return (
    <>
      <SchemaCodeBlock content={content} />
      <Stack direction="row" spacing={1} sx={FooterStyles}>
        <Button
          variant="contained"
          size="small"
          disableElevation
          startIcon={<ContentCopyIcon />}
          onClick={onCopy}
          sx={ButtonStyles}
        >
          Copy
        </Button>
        <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={onSave} sx={ButtonStyles}>
          Save
        </Button>
      </Stack>
    </>
  );
}
