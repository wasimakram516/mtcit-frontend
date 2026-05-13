import { Box, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useLanguage } from "@/app/context/LanguageContext"; 
import useWebSocketController from "@/hooks/useWebSocketController";

const LanguageSelector = () => {
  const { language, toggleLanguage } = useLanguage();
  const { sendLanguageChange } = useWebSocketController();

  const handleClick = () => {
    const newLang = language === "en" ? "ar" : "en";
    toggleLanguage();   
    sendLanguageChange(newLang); 
  };

  return (
    <Box sx={{ position: "absolute", top:10, right:20, width: "80px", height: "40px" }}>
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
            backgroundColor: "#6CA8D9", // Lighter blue
            color: "white",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "none",
            px: 2,
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
            backgroundColor: "#0077B6",
            color: "white",
            borderRadius: "16px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "none",
            px: 2,
          }}
        >
          {language === "en" ? "English" : "العربية"}
        </Button>
      </motion.div>
    </Box>
  );
};

export default LanguageSelector;
