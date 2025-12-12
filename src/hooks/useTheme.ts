import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { accentColors, type ThemeColors, type ThemeName, themeColors } from "@/constants/tokens";
import { useAccentPreference, useThemePreference } from "@/store/preferences";

export const useTheme = () => {
	const { value: preference } = useThemePreference();
	const { value: accentPreference } = useAccentPreference();
	const systemColorScheme = useColorScheme();
	const systemTheme: ThemeName = systemColorScheme === "dark" ? "dark" : "light";

	const theme = preference === "system" ? systemTheme : preference;

	const colors: ThemeColors = useMemo(() => {
		const base = themeColors[theme];
		const accent = accentColors[accentPreference] ?? base.primary;

		return { ...base, primary: accent };
	}, [accentPreference, theme]);

	return { theme, colors };
};
