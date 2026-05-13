import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#96D8EA", 
      contrastText: "#003B56", // Dark text for contrast (from OSHRM branding)
    },
    secondary: {
      main: "#00547C", // Deeper blue used in gradients/background
      contrastText: "#ffffff",
    },
    background: {
      default: "#f4fafd",
      paper: "#ffffff",
    },
  },
  typography: {
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 700,
    },
    h3: {
      fontSize: "1.75rem",
    },
    h4: {
      fontSize: "1.5rem",
    },
    h5: {
      fontSize: "1.3rem",
    },
    h6: {
      fontSize: "1.25rem",
    },
    body1: {
      fontSize: "1.1rem",
    },
    body2: {
      fontSize: "0.9rem",
    },
    subtitle1: {
      fontSize: "0.8rem",
      fontWeight: 600,
    },
    subtitle2: {
      fontSize: "0.7rem",
      fontWeight: 500,
    },
    button: {
      textTransform: "none", 
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8, 
  },
});

export default theme;
