"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import enTranslations from "@/locales/en.json"
import esTranslations from "@/locales/es.json"
import sqTranslations from "@/locales/sq.json"

type Language = "en" | "es" | "sq"

type Translations = typeof enTranslations

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: Translations
}

const translations: Record<Language, Translations> = {
  en: enTranslations,
  es: esTranslations,
  sq: sqTranslations,
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  // Load language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem("roofer-app-language") as Language
    if (savedLang && (savedLang === "en" || savedLang === "es" || savedLang === "sq")) {
      setLanguageState(savedLang)
    }
  }, [])

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("roofer-app-language", lang)
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    t: translations[language],
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

