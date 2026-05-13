"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { motion } from "framer-motion";
import useWebSocketController from "@/hooks/useWebSocketController";
import { Aurora } from "ambient-cbg";
import LanguageSelector from "@/app/components/LanguageSelector";
import { useLanguage } from "../context/LanguageContext";

export default function Controller() {
  const router = useRouter();
  const { sendCategorySelection, categoryOptions, sendCarbonMode, connected } =
    useWebSocketController();
  const { language } = useLanguage();

  const [openCategory, setOpenCategory] = useState(null);
  const [selected, setSelected] = useState({ category: "", subcategory: "" });

  useEffect(() => {
    if (connected) {
      sendCarbonMode(false, 0);
    }
  }, [connected]);
  

  // Auto-clear selection after 90 seconds
  useEffect(() => {
    if (!selected.category && !selected.subcategory) return;
    const timer = setTimeout(() => {
      setSelected({ category: "", subcategory: "" });
      setOpenCategory(null);
      sendCategorySelection("", "", language);
    }, 90000);
    return () => clearTimeout(timer);
  }, [selected, sendCategorySelection, language]);

  // 💥 When language changes, re-trigger backend with current selection
  useEffect(() => {
    if (selected.category || selected.subcategory) {
      sendCategorySelection(selected.category, selected.subcategory, language);
    }
  }, [language]);

  const bubbleBase = {
    backgroundImage: "linear-gradient(to top, #a3bded 0%, #6991c7 100%)",
    boxShadow: `rgba(45, 35, 66, 0.4) 0px 2px 4px,
                rgba(45, 35, 66, 0.3) 0px 7px 13px -3px,
                rgba(58, 65, 111, 0.5) 0px -3px 0px inset`,
    color: "#fff",
    width: "15rem",
    height: "15rem",
    borderRadius: "50%",
    display: "flex",
    fontFamily: '"JetBrains Mono", monospace',
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: "1.75rem",
    padding: "0.5rem",
    cursor: "pointer",
    userSelect: "none",
    position: "relative",
    textTransform: "none",
    flexShrink: 0,
    transition: "box-shadow 0.2s, transform 0.2s",
    "&:hover": {
      boxShadow: `rgba(45, 35, 66, 0.4) 0px 4px 8px,
                  rgba(45, 35, 66, 0.3) 0px 7px 13px -3px,
                  #3c4fe0 0px -3px 0px inset`,
      transform: "translateY(-2px)",
    },
  };

  const translations = {
    en: {
      instruction: "Tap a category to explore its contents",
    },
    ar: {
      instruction: "اضغط على الفئة لاستكشاف محتوياتها",
    },
  };

  const handleCategoryClick = (category, subcategories) => {
    if (openCategory === category) {
      setOpenCategory(null);
      setSelected({ category: "", subcategory: "" });
      sendCategorySelection("", "", language);
    } else if (subcategories.length === 0) {
      if (selected.category === category && selected.subcategory === "") {
        setSelected({ category: "", subcategory: "" });
        sendCategorySelection("", "", language);
      } else {
        setSelected({ category, subcategory: "" });
        sendCategorySelection(category, "", language);
      }
      setOpenCategory(null);
    } else {
      setOpenCategory(category);
      setSelected({ category: "", subcategory: "" });
    }
  };

  const handleSubBubbleClick = (category, subcategory) => {
    if (
      selected.category === category &&
      selected.subcategory === subcategory
    ) {
      setSelected({ category: "", subcategory: "" });
      sendCategorySelection("", "", language);
      setOpenCategory(null);
    } else {
      setSelected({ category, subcategory });
      sendCategorySelection(category, subcategory, language);
    }
  };

  const categoriesArray = Object.entries(categoryOptions);

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        gap: "4rem",
        position: "relative",
        overflow: "hidden",
        px: "3rem",
        textAlign: "center",
      }}
    >
      <LanguageSelector />
      <Box sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <Aurora />
      </Box>

      <IconButton
        sx={{
          position: "absolute",
          top: 20,
          left: 20,
          color: "#fff",
          zIndex: 99,
        }}
        onClick={() => router.push("/")}
      >
        <ArrowBackIcon />
      </IconButton>

      {categoriesArray.map(([category, subcategories], index) => {
        const isActiveMain =
          selected.category === category && !selected.subcategory;

        return (
          <motion.div
            key={category}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            animate={isActiveMain ? { scale: 1.1, rotate: [0, 2, -2, 0] } : {}}
            transition={{ duration: 0.5 }}
            style={{
              ...bubbleBase,
              backgroundImage: isActiveMain
                ? "linear-gradient(to top, #64b5f6 0%, #1e88e5 100%)"
                : bubbleBase.backgroundImage,
              boxShadow: isActiveMain
                ? "0 0 20px rgba(33, 150, 243, 0.8)"
                : bubbleBase.boxShadow,
            }}
            onClick={() => handleCategoryClick(category, subcategories)}
          >
            {category}

            {openCategory === category && subcategories.length > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: "120%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  flexDirection: "row",
                  gap: { sm: 2, md: "3rem" },
                  zIndex: 10,
                }}
              >
                {subcategories.map((subcat) => {
                  const isActiveSub =
                    selected.category === category &&
                    selected.subcategory === subcat;

                  return (
                    <motion.div
                      key={subcat}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      animate={
                        isActiveSub ? { scale: 1.1, rotate: [0, 3, -3, 0] } : {}
                      }
                      transition={{ duration: 0.5 }}
                      style={{
                        ...bubbleBase,
                        width: "8rem",
                        height: "8rem",
                        fontSize: "1.25rem",
                        backgroundImage: isActiveSub
                          ? "linear-gradient(to top, #64b5f6 0%, #1e88e5 100%)"
                          : "linear-gradient(120deg, #4facfe 0%, #00f2fe 100%)",
                        boxShadow: isActiveSub
                          ? "0 0 15px rgba(0, 255, 255, 0.8)"
                          : "0 0 12px rgba(102, 166, 255, 0.6)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubBubbleClick(category, subcat);
                      }}
                    >
                      {subcat}
                    </motion.div>
                  );
                })}
              </Box>
            )}
          </motion.div>
        );
      })}

      <Typography
        variant="h5"
        sx={{
          position: "absolute",
          bottom: 30,
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
          width: "100%",
        }}
      >
        {translations[language].instruction}
      </Typography>

      {/* Carbon Footprint Toggle Button */}
      <motion.div
        onClick={() => {
          sendCarbonMode(true, 100); 
          router.push("/controller/carbon-footprint")
        }}
        initial={false}
        animate={{
          scale: 1,
          background: "linear-gradient(to top, #00c851, #1de9b6)", // ✅ green gradient
  boxShadow: "0 4px 10px rgba(0, 200, 130, 0.4)", // ✅ optional green glow
        }}
        transition={{ duration: 0.3 }}
        style={{
          position: "absolute",
          bottom: 30,
          right: 70,
          width: "8rem",
          height: "8rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: "bold",
          fontSize: "1rem",
          color: "#fff",
          cursor: "pointer",
          userSelect: "none",
          zIndex: 99,
        }}
      >
        Carbon Footprint
      </motion.div>
    </Box>
  );
}
