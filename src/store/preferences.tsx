import { useMemo } from "react";
import { create } from "zustand";

type ThemePreference = "system" | "light" | "dark";
type LanguagePreference = "system" | "en" | "zh";

type PreferencesState = {
	theme: ThemePreference;
	language: LanguagePreference;
	setTheme: (theme: ThemePreference) => void;
	setLanguage: (language: LanguagePreference) => void;
};

export const usePreferencesStore = create<PreferencesState>()((set) => ({
	theme: "system",
	language: "system",
	setTheme: (theme) => set({ theme }),
	setLanguage: (language) => set({ language }),
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
