"use client";
import { createContext, useContext, useState } from "react";

// Create Context
const LanguageContext = createContext();

// Language Provider Component
export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  const toggleLanguage = () => {
    const newLang = language === "en" ? "ar" : "en";
    setLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom Hook to use Language Context
export const useLanguage = () => useContext(LanguageContext);
