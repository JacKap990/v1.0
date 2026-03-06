"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { updateUserSettings } from "@/app/actions/settings";

type Theme = "light" | "dark" | "system";
type ColorTheme = "indigo" | "rose" | "emerald" | "amber" | "slate" | "violet";
type Density = "comfortable" | "compact";

interface ThemeContextType {
    theme: Theme;
    colorTheme: ColorTheme;
    density: Density;
    setTheme: (theme: Theme) => void;
    setColorTheme: (color: ColorTheme) => void;
    setDensity: (density: Density) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
    children,
    initialTheme,
    initialColor,
    initialDensity,
}: {
    children: React.ReactNode;
    initialTheme: Theme;
    initialColor: ColorTheme;
    initialDensity: Density;
}) {
    const [theme, setThemeState] = useState<Theme>(initialTheme);
    const [colorTheme, setColorThemeState] = useState<ColorTheme>(initialColor);
    const [density, setDensityState] = useState<Density>(initialDensity);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        // Handle Appearance (Dark/Light)
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            root.classList.toggle("dark", systemTheme === "dark");
        } else {
            root.classList.toggle("dark", theme === "dark");
        }

        // Handle Color Palette
        root.setAttribute("data-theme", colorTheme);

        // Handle Density
        root.setAttribute("data-density", density);

    }, [theme, colorTheme, density]);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        await updateUserSettings({ themePref: newTheme });
    };

    const setColorTheme = async (newColor: ColorTheme) => {
        setColorThemeState(newColor);
        await updateUserSettings({ colorTheme: newColor });
    };

    const setDensity = async (newDensity: Density) => {
        setDensityState(newDensity);
        await updateUserSettings({ displayDensity: newDensity });
    };

    return (
        <ThemeContext.Provider value={{ theme, colorTheme, density, setTheme, setColorTheme, setDensity }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
}
