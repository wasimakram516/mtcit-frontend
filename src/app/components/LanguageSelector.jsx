import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/context/LanguageContext"; 
import useWebSocketController from "@/hooks/useWebSocketController";

const LanguageSelector = ({ absolute = true }) => {
  const { language, toggleLanguage } = useLanguage();
  const { sendLanguageChange } = useWebSocketController();

  const handleClick = () => {
    const newLang = language === "en" ? "ar" : "en";
    toggleLanguage();   
    sendLanguageChange(newLang); 
  };

  return (
    <Box sx={{ 
      position: absolute ? "absolute" : "relative", 
      top: absolute ? 16 : 0, 
      right: absolute ? 20 : 0, 
      width: "96px", 
      height: "44px", 
      zIndex: 1000 
    }}>
      {/* Inactive Button (Behind) */}
      <motion.div
        initial={{ opacity: 0.5, y: 10, x: 10 }}
        animate={{ opacity: 0.5, y: 10, x: 10 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          width: "100%",
          zIndex: 1,
          pointerEvents: "none", // Prevent clicks on the inactive button
        }}
      >
        <Button
          variant="contained"
          sx={{
            width: "100%",
            backgroundColor: "rgba(248, 252, 246, 0.55)",
            color: "#07280B",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "none",
            px: 2,
            border: "1px solid rgba(7, 40, 11, 0.12)",
            boxShadow: "none",
          }}
        >
          {language === "en" ? "العربية" : "English"}
        </Button>
      </motion.div>

      {/* Active Button (On Top) */}
      <motion.div
        key={language} // Makes sure animation happens on language switch
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        exit={{ y: -8 }}
        transition={{ duration: 0.2 }}
        style={{
          position: "absolute",
          width: "100%",
          zIndex: 2,
        }}
      >
        <Button
          variant="contained"
          onClick={handleClick} 
          sx={{
            width: "100%",
            background: "linear-gradient(135deg, #1C932D 0%, #390042 100%)",
            color: "#F8FCF6",
            borderRadius: "999px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "none",
            px: 2,
            boxShadow: "0 12px 24px rgba(57, 0, 66, 0.22)",
          }}
        >
          {language === "en" ? "English" : "العربية"}
        </Button>
      </motion.div>
    </Box>
  );
};

export default LanguageSelector;
