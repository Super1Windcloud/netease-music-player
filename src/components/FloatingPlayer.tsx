import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View, type ViewProps } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { PlayPauseButton, SkipToNextButton } from "@/components/PlayerControls";
import { unknownTrackImageUri } from "@/constants/images";
import { withOpacity } from "@/helpers/colors";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { usePlayerBackground } from "@/hooks/usePlayerBackground";
import { useTheme } from "@/hooks/useTheme";
import { useActiveTrack, useIsPlaying } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";
import { MovingText } from "./MovingText";

export const FloatingPlayer = ({ style }: ViewProps) => {
	const router = useRouter();
	const { theme } = useTheme();
	const { defaultStyles, utilsStyles } = useThemeStyles();
	const { playing } = useIsPlaying();
	const artworkRotation = useSharedValue(0);

	useEffect(() => {
		if (playing) {
			artworkRotation.value = withRepeat(
				withTiming(360, { duration: 12000, easing: Easing.linear }),
				-1,
				false,
			);
		} else {
			cancelAnimation(artworkRotation);
			artworkRotation.value = artworkRotation.value % 360;
		}

		return () => {
			cancelAnimation(artworkRotation);
		};
	}, [artworkRotation, playing]);

	const artworkSpinStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${artworkRotation.value}deg` }],
	}));

	const activeTrack = useActiveTrack();
	const lastActiveTrack = useLastActiveTrack();

	const displayedTrack = activeTrack ?? lastActiveTrack;
	const { imageColors } = usePlayerBackground(displayedTrack?.artwork ?? unknownTrackImageUri);

	const handlePress = () => {
		router.navigate("/player");
	};

	const containerBase = imageColors?.background ?? (theme === "dark" ? "#16161c" : "#f5f5f7");
	const accent = imageColors?.primary ?? (theme === "dark" ? "#4f6cff" : "#0a84ff");

	const containerGradient = useMemo<readonly [string, string]>(
		() => [withOpacity(containerBase, 0.9), withOpacity(accent, theme === "dark" ? 0.82 : 0.86)],
		[accent, containerBase, theme],
	);

	const themedStyles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					...utilsStyles.glassCard,
					overflow: "hidden",
					flexDirection: "row",
					alignItems: "center",
					paddingVertical: 8,
					paddingHorizontal: 12,
					borderRadius: 22,
					borderWidth: StyleSheet.hairlineWidth * 0.5,
					borderColor: withOpacity(accent, theme === "dark" ? 0.3 : 0.25),
					backgroundColor: withOpacity(containerBase, theme === "dark" ? 0.82 : 0.9),
				},
				gradientOverlay: {
					...StyleSheet.absoluteFillObject,
					opacity: 0.9,
				},
				artworkWrapper: {
					width: 42,
					height: 42,
					borderRadius: 21,
					overflow: "hidden",
					alignItems: "center",
					justifyContent: "center",
				},
				trackArtworkImage: {
					width: 42,
					height: 42,
					borderRadius: 21,
				},
				trackTitleContainer: {
					flex: 1,
					overflow: "hidden",
					marginLeft: 10,
					paddingLeft: 4,
				},
				trackTitle: {
					...defaultStyles.text,
					fontSize: 16,
					fontWeight: "700",
					marginLeft: 4,
				},
				trackSubtitle: {
					...defaultStyles.text,
					fontSize: 13,
					color: theme === "dark" ? "rgba(255,255,255,0.75)" : "rgba(60,60,67,0.65)",
					paddingLeft: 4,
					marginTop: 2,
				},
				trackControlsContainer: {
					flexDirection: "row",
					alignItems: "center",
					columnGap: 16,
					marginRight: 6,
					paddingLeft: 10,
				},
				transparentButton: {
					backgroundColor: "transparent",
					borderColor: "transparent",
					borderWidth: 0,
					shadowOpacity: 0,
				},
				blurLayer: {
					...StyleSheet.absoluteFillObject,
				},
			}),
		[accent, containerBase, defaultStyles.text, theme, utilsStyles.glassCard],
	);

	if (!displayedTrack) return null;

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.6}
			style={[themedStyles.container, style]}
		>
			<LinearGradient
				pointerEvents="none"
				colors={containerGradient}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={themedStyles.gradientOverlay}
			/>
			<BlurView
				tint={theme === "dark" ? "dark" : "light"}
				intensity={60}
				style={themedStyles.blurLayer}
				pointerEvents="none"
			/>

			<Animated.View style={[themedStyles.artworkWrapper, artworkSpinStyle]}>
				<Image
					source={{
						uri: displayedTrack.artwork ?? unknownTrackImageUri,
					}}
					contentFit="cover"
					style={themedStyles.trackArtworkImage}
				/>
			</Animated.View>

			<View style={themedStyles.trackTitleContainer}>
				<MovingText
					style={themedStyles.trackTitle}
					text={displayedTrack.title ?? ""}
					animationThreshold={25}
					direction="ltr"
				/>
				<Text numberOfLines={1} style={themedStyles.trackSubtitle}>
					{displayedTrack.artist ?? ""}
				</Text>
			</View>

			<View style={themedStyles.trackControlsContainer}>
				<PlayPauseButton iconSize={24} style={themedStyles.transparentButton} />
				<SkipToNextButton iconSize={22} style={themedStyles.transparentButton} />
			</View>
		</TouchableOpacity>
	);
};
