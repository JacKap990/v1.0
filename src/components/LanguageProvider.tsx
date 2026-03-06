"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations } from "@/lib/translations";
import { getUserSettings } from "@/app/actions/settings";

type LanguageContextType = {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage = "he" }: { children: React.ReactNode; initialLanguage?: string }) {
    const [language, setLanguage] = useState(initialLanguage);

    useEffect(() => {
        if (initialLanguage) setLanguage(initialLanguage);
    }, [initialLanguage]);

    const t = (key: string) => {
        return translations[language]?.[key] || translations["he"]?.[key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
