export type ThemeName = 'light' | 'dark';

export type ThemeColors = {
	primary: string;
	background: string;
	text: string;
	textMuted: string;
	icon: string;
	maximumTrackTintColor: string;
	minimumTrackTintColor: string;
	card: string;
	border: string;
};

export const themeColors: Record<ThemeName, ThemeColors> = {
	light: {
		primary: '#fc3c44',
		background: '#f8fafc',
		text: '#0f172a',
		textMuted: '#475569',
		icon: '#0f172a',
		maximumTrackTintColor: 'rgba(15, 23, 42, 0.2)',
		minimumTrackTintColor: '#fc3c44',
		card: '#ffffff',
		border: 'rgba(15, 23, 42, 0.1)',
	},
	dark: {
		primary: '#fc3c44',
		background: '#000',
		text: '#fff',
		textMuted: '#9ca3af',
		icon: '#fff',
		maximumTrackTintColor: 'rgba(255,255,255,0.4)',
		minimumTrackTintColor: 'rgba(255,255,255,0.6)',
		card: 'rgba(47, 47, 47, 0.5)',
		border: 'rgba(255,255,255,0.08)',
	},
};

export const fontSize = {
	xs: 12,
	sm: 16,
	base: 20,
	lg: 24,
};

export const screenPadding = {
	horizontal: 24,
};
