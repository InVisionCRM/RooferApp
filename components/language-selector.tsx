"use client"

import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Languages } from "lucide-react"

const languageNames = {
  en: "English",
  es: "Español",
  sq: "Shqip",
}

const languageFlags = {
  en: "🇺🇸",
  es: "🇪🇸",
  sq: "🇦🇱",
}

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">{languageFlags[language]} {languageNames[language]}</span>
          <span className="sm:hidden">{languageFlags[language]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setLanguage("en")}
          className={language === "en" ? "bg-accent" : ""}
        >
          {languageFlags.en} English
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("es")}
          className={language === "es" ? "bg-accent" : ""}
        >
          {languageFlags.es} Español
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage("sq")}
          className={language === "sq" ? "bg-accent" : ""}
        >
          {languageFlags.sq} Shqip
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

