import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1C932D",
      light: "#43B455",
      dark: "#07280B",
      contrastText: "#F4F7F0",
    },
    secondary: {
      main: "#390042",
      light: "#5A1B64",
      dark: "#220028",
      contrastText: "#F7EEF8",
    },
    success: {
      main: "#1C932D",
      light: "#43B455",
      dark: "#07280B",
      contrastText: "#F4F7F0",
    },
    text: {
      primary: "#07280B",
      secondary: "#29432B",
    },
    background: {
      default: "#EEF5EC",
      paper: "#F8FCF6",
    },
    divider: "rgba(7, 40, 11, 0.14)",
  },
  typography: {
    fontFamily: '"Aloevera", "Georgia", "Times New Roman", serif',
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
    borderRadius: 12,
  },
  custom: {
    gradients: {
      hero: "linear-gradient(135deg, #07280B 0%, #1C932D 52%, #390042 100%)",
      heroSoft:
        "linear-gradient(160deg, rgba(7,40,11,0.96) 0%, rgba(28,147,45,0.92) 55%, rgba(57,0,66,0.94) 100%)",
      card:
        "linear-gradient(145deg, rgba(248,252,246,0.92) 0%, rgba(233,244,231,0.9) 100%)",
      accent: "linear-gradient(135deg, #1C932D 0%, #390042 100%)",
    },
    grandparentCategories: [
      "#07280B",
      "#1C932D",
      "#390042",
      "#43B455",
      "#5A1B64",
    ],
  },
});

export default theme;
