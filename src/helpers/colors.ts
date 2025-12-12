export const withOpacity = (color: string, alpha: number): string => {
	if (Number.isNaN(alpha) || alpha < 0 || alpha > 1) {
		return color;
	}

	const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
	if (rgbMatch) {
		const [, r, g, b] = rgbMatch;
		return `rgba(${Number(r)}, ${Number(g)}, ${Number(b)}, ${alpha})`;
	}

	const hex = color.replace("#", "");
	if (hex.length === 3 || hex.length === 4) {
		const [r, g, b] = hex.slice(0, 3).split("").map((value) => parseInt(value.repeat(2), 16));
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	if (hex.length === 6 || hex.length === 8) {
		const r = parseInt(hex.slice(0, 2), 16);
		const g = parseInt(hex.slice(2, 4), 16);
		const b = parseInt(hex.slice(4, 6), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	return color;
};
