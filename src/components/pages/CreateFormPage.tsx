import { useState, type JSX } from "react";
import { Box, Button, Card, CardActionArea, CardContent, Container, Grid, Stack, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import NoteAddOutlinedIcon from "@mui/icons-material/NoteAddOutlined";
import { Link } from "react-router";
import AppShell from "../organisms/AppShell";
import FormListCard from "../molecules/FormListCard";
import { formStorage } from "../../utils/formStorage";

/** Both cards stretch to the tallest one in the row. */
const CardStyles = {
  height: "100%",
  borderRadius: 1,
};

const CardActionStyles = {
  height: "100%",
};

const IconStyles = {
  fontSize: 28,
  color: "primary.main",
};

const LinkButtonStyles = {
  mt: 1,
  px: 0,
  textTransform: "none",
  fontWeight: 600,
};

/**
 * Two ways in, laid out as cards rather than a centred button stack. `CardActionArea component={Link}`
 * keeps the whole card clickable with real anchor semantics and a focus ring.
 */
export default function CreateFormPage(): JSX.Element {
  // Read once on mount; returning to /create remounts the page, so this stays current.
  const [recent] = useState(() => formStorage.listForms().slice(0, 3));

  return (
    <AppShell>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Create a form
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Start from scratch or generate a draft with AI.
        </Typography>

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={CardStyles}>
              <CardActionArea component={Link} to="/builder" sx={CardActionStyles}>
                <CardContent>
                  <Stack spacing={1}>
                    <NoteAddOutlinedIcon sx={IconStyles} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Blank Form
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start with an empty canvas and add the fields you need.
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Card variant="outlined" sx={CardStyles}>
              <CardActionArea component={Link} to="/create/ai" sx={CardActionStyles}>
                <CardContent>
                  <Stack spacing={1}>
                    <AutoAwesomeIcon sx={IconStyles} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Generate with AI
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Describe the form you want and review the generated draft.
                    </Typography>
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>

        <Typography
          variant="overline"
          sx={{ display: "block", mt: 4, fontWeight: 700, color: "text.secondary" }}
        >
          Recent Forms
        </Typography>

        {recent.length === 0 ? (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              No forms yet. Created forms are kept in this browser.
            </Typography>
            <Button component={Link} to="/forms" endIcon={<ArrowForwardIcon />} sx={LinkButtonStyles}>
              View all forms
            </Button>
          </Box>
        ) : (
          <>
            {/* Same card as the Forms page, minus the destructive action. */}
            <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
              {recent.map((form) => (
                <Grid key={form.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormListCard form={form} />
                </Grid>
              ))}
            </Grid>
            <Button component={Link} to="/forms" endIcon={<ArrowForwardIcon />} sx={LinkButtonStyles}>
              View all forms
            </Button>
          </>
        )}
      </Container>
    </AppShell>
  );
}
