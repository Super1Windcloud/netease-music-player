import { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text, View, type ViewProps } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { fontSize } from "@/constants/tokens";
import { formatSecondsToMinutes } from "@/helpers/miscellaneous";
import TrackPlayer, { useProgress } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";

export const PlayerProgressBar = ({ style }: ViewProps) => {
	const { duration, position } = useProgress(250);
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const themedStyles = useMemo(() => styles(colors, defaultStyles), [colors, defaultStyles]);

	const progress = useSharedValue(0);
	const min = useSharedValue(0);
	const max = useSharedValue(1);
	const isSliding = useRef(false);

	const trackElapsedTime = formatSecondsToMinutes(position);
	const trackRemainingTime = formatSecondsToMinutes(duration - position);

	useEffect(() => {
		if (isSliding.current) return;

		progress.value = duration > 0 ? position / duration : 0;
	}, [duration, position, progress]);

	return (
		<View style={style}>
			<Slider
				progress={progress}
				minimumValue={min}
				maximumValue={max}
				containerStyle={utilsStyles.slider}
				thumbWidth={0}
				renderBubble={() => null}
				theme={{
					minimumTrackTintColor: colors.minimumTrackTintColor,
					maximumTrackTintColor: colors.maximumTrackTintColor,
				}}
				onSlidingStart={() => {
					isSliding.current = true;
				}}
				onValueChange={async (value) => {
					await TrackPlayer.seekTo(value * duration);
				}}
				onSlidingComplete={async (value) => {
					if (!isSliding.current) return;

					isSliding.current = false;
					await TrackPlayer.seekTo(value * duration);
				}}
			/>

			<View style={themedStyles.timeRow}>
				<Text style={themedStyles.timeText}>{trackElapsedTime}</Text>

				<Text style={themedStyles.timeText}>
					{"-"} {trackRemainingTime}
				</Text>
			</View>
		</View>
	);
};

const styles = (
	colors: ReturnType<typeof useThemeStyles>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
) =>
	StyleSheet.create({
		timeRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "baseline",
			marginTop: 20,
		},
		timeText: {
			...defaultStyles.text,
			color: colors.text,
			opacity: 0.75,
			fontSize: fontSize.xs,
			letterSpacing: 0.7,
			fontWeight: "500",
		},
	});
