export type ThemeName = "light" | "dark";

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
		primary: "#0a84ff",
		background: "#f6f7fb",
		text: "#0b1b32",
		textMuted: "#556577",
		icon: "#0b1b32",
		maximumTrackTintColor: "rgba(10, 132, 255, 0.18)",
		minimumTrackTintColor: "rgba(10, 132, 255, 0.9)",
		card: "rgba(255, 255, 255, 0.72)",
		border: "rgba(11, 27, 50, 0.08)",
	},
	dark: {
		primary: "#5ac8fa",
		background: "#050910",
		text: "#e9eef5",
		textMuted: "#8b9ab0",
		icon: "#e9eef5",
		maximumTrackTintColor: "rgba(255, 255, 255, 0.25)",
		minimumTrackTintColor: "rgba(90, 200, 250, 0.9)",
		card: "rgba(255, 255, 255, 0.06)",
		border: "rgba(255, 255, 255, 0.07)",
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
