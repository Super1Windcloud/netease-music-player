import Slider from "@react-native-community/slider";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View, type ViewProps } from "react-native";
import { fontSize } from "@/constants/tokens";
import { formatSecondsToMinutes } from "@/helpers/miscellaneous";
import TrackPlayer, { useProgress } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";

const DOT_SIZE = 10;
const DRAG_SCALE = 2;

export const PlayerProgressBar = ({ style }: ViewProps) => {
	const { duration, position } = useProgress(250);
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const themedStyles = useMemo(() => styles(colors, defaultStyles), [colors, defaultStyles]);
	const accentColor = colors.primary;

	const [scrubValue, setScrubValue] = useState<number | null>(null);
	const [trackWidth, setTrackWidth] = useState(0);
	const [isSliding, setIsSliding] = useState(false);
	const sliderScaleY = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		Animated.spring(sliderScaleY, {
			toValue: isSliding ? DRAG_SCALE : 1,
			useNativeDriver: true,
			friction: 10,
			tension: 80,
		}).start();
	}, [isSliding, sliderScaleY]);

	const trackElapsedTime = formatSecondsToMinutes(position);
	const trackTotalTime = formatSecondsToMinutes(duration);
	const safeDuration = duration > 0 ? duration : 1;
	const progressValue = scrubValue ?? position;
	const progressRatio = Math.min(1, Math.max(0, progressValue / safeDuration));

	return (
		<View style={style}>
			<Animated.View
				style={[themedStyles.sliderContainer, { transform: [{ scaleY: sliderScaleY }] }]}
				onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
			>
				<Slider
					style={[utilsStyles.slider, { width: "100%" }]}
					minimumValue={0}
					maximumValue={safeDuration}
					minimumTrackTintColor={accentColor}
					maximumTrackTintColor={colors.maximumTrackTintColor}
					thumbTintColor="transparent"
					step={0}
					tapToSeek
					value={progressValue}
					onSlidingStart={() => {
						setIsSliding(true);
						setScrubValue(position);
					}}
					onValueChange={(nextValue) => {
						setScrubValue(nextValue);
					}}
					onSlidingComplete={async (nextValue) => {
						setScrubValue(nextValue);
						await TrackPlayer.seekTo(nextValue);
						setScrubValue(null);
						setIsSliding(false);
					}}
				/>

				{trackWidth > 0 && (
					<View
						pointerEvents="none"
						style={[
							themedStyles.positionDot,
							{
								left: Math.min(
									trackWidth - DOT_SIZE,
									Math.max(0, trackWidth * progressRatio - DOT_SIZE / 2),
								),
							},
						]}
					/>
				)}
			</Animated.View>

			<View style={themedStyles.timeRow}>
				<Text style={themedStyles.timeText}>{trackElapsedTime}</Text>

				<Text style={themedStyles.timeText}>{trackTotalTime}</Text>
			</View>
		</View>
	);
};

const styles = (
	colors: ReturnType<typeof useThemeStyles>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
) =>
	StyleSheet.create({
		sliderContainer: {
			position: "relative",
		},
		positionDot: {
			position: "absolute",
			top: (7 - DOT_SIZE) / 2,
			width: DOT_SIZE,
			height: DOT_SIZE,
			borderRadius: DOT_SIZE / 2,
			backgroundColor: colors.primary,
			shadowColor: "#000",
			shadowOpacity: 0.15,
			shadowRadius: 6,
			shadowOffset: { width: 0, height: 2 },
		},
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
