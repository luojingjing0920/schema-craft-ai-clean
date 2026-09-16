import { Link, NavLink } from "react-router";
import { AppBar, Box, Button, Stack, Toolbar, useMediaQuery, useTheme } from "@mui/material";

/**
 * Same AppBar + dense Toolbar height as BuilderTopbar, so the builder and the rest of the app
 * read as one product. The two headers stay separate components: this one is navigation only,
 * the builder's carries workspace mode and save.
 */
const HEADER_HEIGHT = 56;

const AppBarStyles = {
  bgcolor: "background.paper",
  color: "text.primary",
  borderBottom: 1,
  borderColor: "divider",
};

const ToolbarStyles = {
  minHeight: HEADER_HEIGHT,
  gap: 2,
  px: 2,
};

const BrandStyles = {
  display: "flex",
  alignItems: "center",
  gap: 1,
  color: "inherit",
  textDecoration: "none",
};

const WordmarkStyles = {
  fontWeight: 700,
  letterSpacing: "-0.01em",
};

/**
 * NavLink appends its own `active` class to the element, so the router owns the active rule and
 * there is no pathname comparison to keep in sync by hand.
 */
const NavStyles = {
  px: 1.25,
  minWidth: 0,
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.8125rem",
  borderRadius: 1,
  color: "text.secondary",
  "&:hover": { color: "text.primary", bgcolor: "action.hover" },
  "&.active": { color: "primary.main", bgcolor: "action.selected" },
};

export default function AppHeader() {
  const theme = useTheme();
  // Small screens drop the wordmark; the logo and both nav entries always stay.
  const isCompact = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <AppBar position="static" elevation={0} sx={AppBarStyles}>
      <Toolbar variant="dense" disableGutters sx={ToolbarStyles}>
        <Box component={Link} to="/create" aria-label="SchemaCraft AI" sx={BrandStyles}>
          <Box component="img" src="/json.svg" alt="" sx={{ width: 22, height: 22, display: "block" }} />
          {!isCompact && <Box component="span" sx={WordmarkStyles}>SchemaCraft AI</Box>}
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={0.5} alignItems="center">
          {/* No `end`: /create/ai belongs to Create, so it keeps the entry highlighted. */}
          <Button component={NavLink} to="/create" sx={NavStyles}>
            Create
          </Button>
          <Button component={NavLink} to="/forms" sx={NavStyles}>
            Forms
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
