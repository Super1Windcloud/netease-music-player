import { useMemo } from "react";
import { create } from "zustand";
import type { AccentColorName } from "@/constants/tokens";

type ThemePreference = "system" | "light" | "dark";
type LanguagePreference = "system" | "en" | "zh";

type PreferencesState = {
	theme: ThemePreference;
	language: LanguagePreference;
	accentColor: AccentColorName;
	setTheme: (theme: ThemePreference) => void;
	setLanguage: (language: LanguagePreference) => void;
	setAccentColor: (accentColor: AccentColorName) => void;
};

export const usePreferencesStore = create<PreferencesState>()((set) => ({
	theme: "system",
	language: "system",
	accentColor: "appleMusic",
	setTheme: (theme) => set({ theme }),
	setLanguage: (language) => set({ language }),
	setAccentColor: (accentColor) => set({ accentColor }),
}));

export const useThemePreference = () => {
	const value = usePreferencesStore((state) => state.theme);
	const setTheme = usePreferencesStore((state) => state.setTheme);
	return useMemo(() => ({ value, setTheme }), [value, setTheme]);
};

export const useLanguagePreference = () => {
	const value = usePreferencesStore((state) => state.language);
	const setLanguage = usePreferencesStore((state) => state.setLanguage);
	return useMemo(() => ({ value, setLanguage }), [value, setLanguage]);
};

export const useAccentPreference = () => {
	const value = usePreferencesStore((state) => state.accentColor);
	const setAccentColor = usePreferencesStore((state) => state.setAccentColor);
	return useMemo(() => ({ value, setAccentColor }), [setAccentColor, value]);
};
