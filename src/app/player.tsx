import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MovingText } from "@/components/MovingText";
import { PlayerControls } from "@/components/PlayerControls";
import { PlayerProgressBar } from "@/components/PlayerProgressbar";
import { PlayerRepeatToggle } from "@/components/PlayerRepeatToggle";
import { PlayerVolumeBar } from "@/components/PlayerVolumeBar";
import { unknownTrackImageUri } from "@/constants/images";
import { fontSize, screenPadding } from "@/constants/tokens";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { usePlayerBackground } from "@/hooks/usePlayerBackground";
import { useTheme } from "@/hooks/useTheme";
import { useActiveTrack } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";

const PlayerScreen = () => {
	const activeTrack = useActiveTrack();
	const lastActiveTrack = useLastActiveTrack();
	const displayedTrack = activeTrack ?? lastActiveTrack;
	const { imageColors } = usePlayerBackground(displayedTrack?.artwork ?? unknownTrackImageUri);
	const { theme } = useTheme();
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const trackTitle = displayedTrack?.title?.trim() || "Unknown Title";
	const artistName = displayedTrack?.artist?.trim() || "Unknown Artist";
	const themedStyles = useMemo(
		() => styles(defaultStyles, utilsStyles, theme),
		[defaultStyles, theme, utilsStyles],
	);
	const gradientColors = useMemo<readonly [string, string]>(
		() => [imageColors?.background ?? colors.background, imageColors?.primary ?? colors.primary],
		[colors.background, colors.primary, imageColors?.background, imageColors?.primary],
	);

	const { top, bottom } = useSafeAreaInsets();

	if (!displayedTrack) {
		return (
			<View style={[defaultStyles.container, { justifyContent: "center" }]}>
				<ActivityIndicator color={colors.icon} />
			</View>
		);
	}

	return (
		<LinearGradient style={{ flex: 1 }} colors={gradientColors}>
			<LinearGradient
				colors={
					theme === "dark"
						? ["rgba(5, 9, 16, 0.65)", "rgba(5, 9, 16, 0.15)"]
						: ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.2)"]
				}
				style={StyleSheet.absoluteFillObject}
			/>

			<View style={themedStyles.overlayContainer}>
				<DismissPlayerSymbol />

				<View style={{ flex: 1, marginTop: top + 36, marginBottom: bottom + 10, gap: 20 }}>
					<View style={themedStyles.artworkImageContainer}>
						<Image
							source={{
								uri: displayedTrack.artwork ?? unknownTrackImageUri,
							}}
							priority={"high"}
							contentFit="cover"
							style={themedStyles.artworkImage}
						/>
					</View>

					<View style={themedStyles.infoBlock}>
						<View style={themedStyles.trackTitleContainer}>
							<MovingText
								text={trackTitle}
								animationThreshold={28}
								style={themedStyles.trackTitleText}
							/>
						</View>
						<Text numberOfLines={1} style={[themedStyles.trackArtistText]}>
							{artistName}
						</Text>
					</View>

					<BlurView
						tint={theme === "dark" ? "dark" : "light"}
						intensity={75}
						style={themedStyles.panel}
					>
						<PlayerProgressBar />

						<PlayerControls style={{ marginTop: 10 }} />

						<PlayerVolumeBar style={{ marginTop: 15 }} />

						<View style={[utilsStyles.centeredRow, { marginTop: 10 }]}>
							<PlayerRepeatToggle size={30} style={{ marginBottom: 4 }} />
						</View>
					</BlurView>
				</View>
			</View>
		</LinearGradient>
	);
};

const DismissPlayerSymbol = () => {
	const { top } = useSafeAreaInsets();
	const { colors } = useThemeStyles();

	return (
		<View
			style={{
				position: "absolute",
				top: top + 8,
				left: 0,
				right: 0,
				flexDirection: "row",
				justifyContent: "center",
			}}
		>
			<View
				accessible={false}
				style={{
					width: 50,
					height: 6,
					borderRadius: 10,
					backgroundColor: colors.text,
					opacity: 0.2,
				}}
			/>
		</View>
	);
};

const styles = (
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"],
	theme: ReturnType<typeof useTheme>["theme"],
) =>
	StyleSheet.create({
		overlayContainer: {
			...defaultStyles.container,
			paddingHorizontal: screenPadding.horizontal,
		},
		artworkImageContainer: {
			shadowOffset: {
				width: 0,
				height: 12,
			},
			shadowOpacity: 0.32,
			shadowRadius: 18,
			flexDirection: "row",
			justifyContent: "center",
			height: "50%",
		},
		artworkImage: {
			width: "100%",
			height: "100%",
			resizeMode: "cover",
			borderRadius: 24,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: theme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)",
		},
		infoBlock: {
			gap: 4,
			alignItems: "center",
			justifyContent: "flex-start",
			flexDirection: "column",
			width: "100%",
			paddingHorizontal: 6,
			paddingVertical: 4,
			zIndex: 2,
		},
		trackTitleContainer: {
			alignSelf: "stretch",
			overflow: "hidden",
			width: "100%",
		},
		trackTitleText: {
			...defaultStyles.text,
			fontSize: 22,
			fontWeight: "700",
			textAlign: "center",
			lineHeight: 26,
		},
		trackArtistText: {
			...defaultStyles.text,
			fontSize: fontSize.base,
			opacity: 0.7,
			textAlign: "center",
			maxWidth: "90%",
		},
		panel: {
			...utilsStyles.glassCard,
			padding: 10,
			borderRadius: 22,
			backgroundColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)",
			rowGap: 10,
		},
	});

export default PlayerScreen;
