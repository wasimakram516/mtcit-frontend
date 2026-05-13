"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
} from "@mui/material";
import LoginIcon from "@mui/icons-material/Login";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { login } from "@/services/authService";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function LoginPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const translations = {
    en: {
      adminLogin: "Admin Login",
      email: "Email",
      password: "Password",
      login: "Login",
      loggingIn: "Logging in...",
    },
    ar: {
      adminLogin: "تسجيل دخول المسؤول",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      login: "تسجيل الدخول",
      loggingIn: "جارٍ تسجيل الدخول...",
    },
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push("/cms");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to bottom, #004e7c, #9ddced)",
        height: "100vh",
        width: "100vw",
        position: "relative",
      }}
    >
      <LanguageSelector />

      <IconButton
        sx={{ position: "absolute", top: 20, left: 20, color: "white" }}
        onClick={() => router.push("/")}
      >
        <ArrowBackIcon />
      </IconButton>

      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 360,
          backdropFilter: "blur(10px)",
          background: "rgba(255, 255, 255, 0.2)",
          borderRadius: 4,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="600"
          color="white"
          align="center"
          gutterBottom
        >
          {translations[language].adminLogin}
        </Typography>

        <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
          <TextField
            label={translations[language].email}
            type="email"
            fullWidth
            margin="normal"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label={translations[language].password}
            type={showPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {error && (
            <Typography
              color="error"
              variant="body2"
              align="center"
              sx={{ mt: 1 }}
            >
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            disabled={loading}
            sx={{
              mt:2,
              py:1.5,
              backgroundColor: "secondary.main",
              color: "#fff",
              "&:hover": {
                backgroundColor: "secondary.dark",
              },
            }}
          >
            {loading
              ? translations[language].loggingIn
              : translations[language].login}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
