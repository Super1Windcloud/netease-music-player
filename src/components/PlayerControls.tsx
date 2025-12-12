import { FontAwesome6 } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View, type ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import TrackPlayer, { useIsPlaying } from "@/lib/expo-track-player";

type PlayerControlsProps = {
	style?: ViewStyle;
};

type PlayerButtonProps = {
	style?: ViewStyle;
	iconSize?: number;
};

export const PlayerControls = ({ style }: PlayerControlsProps) => {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.row}>
				<SkipToPreviousButton />

				<PlayPauseButton />

				<SkipToNextButton />
			</View>
		</View>
	);
};

export const PlayPauseButton = ({ style, iconSize = 48 }: PlayerButtonProps) => {
	const { playing } = useIsPlaying();
	const { colors } = useTheme();

	return (
		<View style={[{ height: iconSize }, style]}>
			<TouchableOpacity
				activeOpacity={0.85}
				onPress={playing ? TrackPlayer.pause : TrackPlayer.play}
				style={{
					width: iconSize + 16,
					height: iconSize + 16,
					borderRadius: (iconSize + 16) / 2,
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: colors.card,
					borderColor: colors.border,
					borderWidth: StyleSheet.hairlineWidth,
					shadowColor: colors.text,
					shadowOpacity: 0.08,
					shadowRadius: 10,
					shadowOffset: { width: 0, height: 6 },
				}}
			>
				<FontAwesome6 name={playing ? "pause" : "play"} size={iconSize} color={colors.text} />
			</TouchableOpacity>
		</View>
	);
};

export const SkipToNextButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const { colors } = useTheme();
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() => TrackPlayer.skipToNext()}
			style={{
				padding: 10,
				borderRadius: 12,
				backgroundColor: colors.card,
				borderWidth: StyleSheet.hairlineWidth,
				borderColor: colors.border,
			}}
		>
			<FontAwesome6 name="forward" size={iconSize} color={colors.text} />
		</TouchableOpacity>
	);
};

export const SkipToPreviousButton = ({ iconSize = 30 }: PlayerButtonProps) => {
	const { colors } = useTheme();
	return (
		<TouchableOpacity
			activeOpacity={0.8}
			onPress={() => TrackPlayer.skipToPrevious()}
			style={{
				padding: 10,
				borderRadius: 12,
				backgroundColor: colors.card,
				borderWidth: StyleSheet.hairlineWidth,
				borderColor: colors.border,
			}}
		>
			<FontAwesome6 name={"backward"} size={iconSize} color={colors.text} />
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	container: {
		width: "100%",
	},
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		columnGap: 24,
	},
});
