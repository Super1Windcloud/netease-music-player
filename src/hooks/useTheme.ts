import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { type ThemeColors, type ThemeName, themeColors } from '@/constants/tokens';
import { useThemePreference } from '@/store/preferences';

export const useTheme = () => {
	const { value: preference } = useThemePreference();
	const systemColorScheme = useColorScheme();
	const systemTheme: ThemeName = systemColorScheme === 'dark' ? 'dark' : 'light';

	const theme = preference === 'system' ? systemTheme : preference;

	const colors: ThemeColors = useMemo(() => themeColors[theme], [theme]);

	return { theme, colors };
};
