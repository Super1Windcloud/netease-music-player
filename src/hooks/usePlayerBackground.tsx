import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";

type PlayerImageColors = {
	background: string;
	primary: string;
};

export const usePlayerBackground = (_imageUrl: string) => {
	const [imageColors, setImageColors] = useState<PlayerImageColors | null>(null);
	const { colors } = useTheme();

	useEffect(() => {
		// Expo Go fallback: use theme colors without native image analysis
		setImageColors({
			background: colors.background,
			primary: colors.primary,
		});
	}, [colors.background, colors.primary]);

	return { imageColors };
};
