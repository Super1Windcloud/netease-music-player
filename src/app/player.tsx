import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, type LayoutChangeEvent, StyleSheet, Text, View } from "react-native";
import Animated, {
	createAnimatedComponent,
	Easing,
	FadeIn,
	FadeOut,
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
	ZoomIn,
	ZoomOut,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
	Defs,
	Path,
	RadialGradient,
	Rect,
	Stop,
	LinearGradient as SvgLinearGradient,
} from "react-native-svg";
import smokeGif from "@/assets/smoke.gif";
import { MovingText } from "@/components/MovingText";
import { PlayerControls } from "@/components/PlayerControls";
import { PlayerProgressBar } from "@/components/PlayerProgressbar";
import { PlayerRepeatToggle } from "@/components/PlayerRepeatToggle";
import { PlayerVolumeBar } from "@/components/PlayerVolumeBar";
import { unknownTrackImageUri } from "@/constants/images";
import { fontSize, screenPadding } from "@/constants/tokens";
import { withOpacity } from "@/helpers/colors";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { usePlayerBackground } from "@/hooks/usePlayerBackground";
import { useTheme } from "@/hooks/useTheme";
import { useActiveTrack } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";

const AnimatedLinearGradient = createAnimatedComponent(SvgLinearGradient);
const AnimatedRadialGradient = createAnimatedComponent(RadialGradient);
const AnimatedPath = createAnimatedComponent(Path);

type SmokeBackgroundProps = {
	backgroundColor: string;
};

const SmokeBackground = ({ backgroundColor }: SmokeBackgroundProps) => (
	<View style={StyleSheet.absoluteFill} pointerEvents="none">
		<Image
			source={smokeGif}
			style={[StyleSheet.absoluteFillObject, { opacity: 0.38 }]}
			contentFit="cover"
			transition={240}
		/>
		<View
			style={[
				StyleSheet.absoluteFillObject,
				{
					backgroundColor: withOpacity(backgroundColor, 0.12),
				},
			]}
		/>
		<LinearGradient
			pointerEvents="none"
			colors={[
				withOpacity(backgroundColor, 0.12),
				withOpacity(backgroundColor, 0.06),
				withOpacity("#ffffff", 0),
			]}
			start={{ x: 0.5, y: 1 }}
			end={{ x: 0.5, y: 0 }}
			locations={[0, 0.6, 1]}
			style={StyleSheet.absoluteFillObject}
		/>
	</View>
);

type FlashlightOverlayProps = {
	accentColor: string;
	progressRatio: number;
	containerLayout: { width: number; height: number; x: number; y: number };
	progressLayout: { width: number; height: number; x: number; y: number };
};

const FlashlightOverlay = ({
	accentColor,
	progressRatio,
	containerLayout,
	progressLayout,
}: FlashlightOverlayProps) => {
	const { width, height, x: containerX, y: containerY } = containerLayout;
	const hasLayout = width > 0 && height > 0 && progressLayout.width > 0;
	const lightX = useSharedValue(0);
	const lightY = useSharedValue(0);
	const baseAngle = useSharedValue(-90); // aim upward
	const swingAngle = useSharedValue(0);
	const beamId = useMemo(() => `flashlight-beam-${Math.random().toString(16).slice(2)}`, []);
	const glowId = useMemo(() => `flashlight-glow-${Math.random().toString(16).slice(2)}`, []);
	const beamLength = Math.max(width, height) * 2 || 1;
	const halfConeRadians = useSharedValue((60 / 2) * (Math.PI / 180));

	useEffect(() => {
		if (!hasLayout) {
			return;
		}
		const originX = progressLayout.x - containerX;
		const originY = progressLayout.y - containerY;
		const clampedX = Math.min(width, Math.max(0, originX + progressRatio * progressLayout.width));
		const clampedY = Math.min(height, Math.max(0, originY + progressLayout.height / 2)) - 15;

		lightX.value = withTiming(clampedX, { duration: 180, easing: Easing.inOut(Easing.quad) });
		// anchor at the PositionDot level so the cone shines upward
		lightY.value = withTiming(clampedY, { duration: 220, easing: Easing.inOut(Easing.quad) });
	}, [
		containerX,
		containerY,
		hasLayout,
		height,
		lightX,
		lightY,
		progressLayout,
		progressRatio,
		width,
	]);

	useEffect(() => {
		if (!hasLayout) {
			return;
		}

		swingAngle.value = withRepeat(
			withSequence(
				withTiming(10, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
				withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
			),
			-1,
			true,
		);

		const randomHorizontalOffset = () => -90 + (Math.random() * 60 - 30);
		const timer = setInterval(() => {
			baseAngle.value = withTiming(randomHorizontalOffset(), {
				duration: 1100,
				easing: Easing.inOut(Easing.quad),
			});
		}, 5200);

		return () => {
			clearInterval(timer);
		};
	}, [baseAngle, hasLayout, swingAngle]);

	useEffect(() => {
		if (!hasLayout) {
			return;
		}

		const coneOptions = [60, 90, 120];
		const pickCone = () =>
			(coneOptions[Math.floor(Math.random() * coneOptions.length)] / 2) * (Math.PI / 180);

		halfConeRadians.value = withTiming(pickCone(), {
			duration: 800,
			easing: Easing.inOut(Easing.quad),
		});

		const timer = setInterval(() => {
			halfConeRadians.value = withTiming(pickCone(), {
				duration: 900,
				easing: Easing.inOut(Easing.quad),
			});
		}, 4800);

		return () => clearInterval(timer);
	}, [halfConeRadians, hasLayout]);

	const beamAngle = useDerivedValue(
		() => ((baseAngle.value + swingAngle.value) * Math.PI) / 180,
		[baseAngle, swingAngle],
	);

	const beamProps = useAnimatedProps(() => {
		const angle = beamAngle.value;
		return {
			x1: lightX.value,
			y1: lightY.value,
			x2: lightX.value + Math.cos(angle) * beamLength,
			y2: lightY.value + Math.sin(angle) * beamLength,
		};
	});

	const beamPathProps = useAnimatedProps(() => {
		const center = beamAngle.value;
		const halfCone = halfConeRadians.value;
		const left = center - halfCone;
		const right = center + halfCone;
		const originX = lightX.value;
		const originY = lightY.value;
		const leftX = originX + Math.cos(left) * beamLength;
		const leftY = originY + Math.sin(left) * beamLength;
		const rightX = originX + Math.cos(right) * beamLength;
		const rightY = originY + Math.sin(right) * beamLength;

		return {
			d: `M ${originX} ${originY} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`,
		};
	});

	const glowProps = useAnimatedProps(() => ({
		cx: lightX.value,
		cy: lightY.value,
	}));

	return (
		<View style={[StyleSheet.absoluteFill, { opacity: hasLayout ? 1 : 0 }]} pointerEvents="none">
			<Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
				<Defs>
					<AnimatedLinearGradient
						id={beamId}
						gradientUnits="userSpaceOnUse"
						animatedProps={beamProps}
					>
						<Stop offset="0%" stopColor="#ffffff" stopOpacity={0.12} />
						<Stop offset="22%" stopColor={accentColor} stopOpacity={0.6} />
						<Stop offset="50%" stopColor={accentColor} stopOpacity={0.95} />
						<Stop offset="74%" stopColor={accentColor} stopOpacity={0.5} />
						<Stop offset="100%" stopColor={accentColor} stopOpacity={0.08} />
					</AnimatedLinearGradient>

					<AnimatedRadialGradient
						id={glowId}
						r={Math.max(width, height) * 0.55}
						gradientUnits="userSpaceOnUse"
						animatedProps={glowProps}
					>
						<Stop offset="0%" stopColor={accentColor} stopOpacity={0.5} />
						<Stop offset="35%" stopColor={accentColor} stopOpacity={0.32} />
						<Stop offset="70%" stopColor={accentColor} stopOpacity={0.14} />
						<Stop offset="100%" stopColor={accentColor} stopOpacity={0} />
					</AnimatedRadialGradient>
				</Defs>

				<AnimatedPath animatedProps={beamPathProps} fill={`url(#${beamId})`} opacity={0.95} />
				<Rect width="100%" height="100%" fill={`url(#${glowId})`} />
			</Svg>
		</View>
	);
};

const PlayerScreen = () => {
	const activeTrack = useActiveTrack();
	const lastActiveTrack = useLastActiveTrack();
	const displayedTrack = activeTrack ?? lastActiveTrack;
	const { imageColors } = usePlayerBackground(displayedTrack?.artwork ?? unknownTrackImageUri);
	const { theme } = useTheme();
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const backgroundColor = imageColors?.background ?? colors.background;
	const accentColor = imageColors?.primary ?? colors.primary;
	const trackTitle = displayedTrack?.title?.trim() || "Unknown Title";
	const artistName = displayedTrack?.artist?.trim() || "Unknown Artist";
	const artworkUri = displayedTrack?.artwork ?? unknownTrackImageUri;
	const hasArtwork = Boolean(displayedTrack?.artwork);
	const themedStyles = useMemo(
		() => styles(defaultStyles, utilsStyles, theme, backgroundColor, accentColor, hasArtwork),
		[accentColor, backgroundColor, defaultStyles, hasArtwork, theme, utilsStyles],
	);
	const containerRef = useRef<View>(null);
	const progressRef = useRef<View>(null);
	const [progressRatio, setProgressRatio] = useState(0);
	const [containerLayout, setContainerLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
	const [progressLayout, setProgressLayout] = useState({ width: 0, height: 0, x: 0, y: 0 });
	const gradientColors = useMemo<readonly [string, string]>(
		() => [withOpacity(backgroundColor, 0.35), withOpacity(backgroundColor, 0.98)],
		[backgroundColor],
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
		<Animated.View
			style={{ flex: 1, backgroundColor }}
			entering={FadeIn.duration(320)
				.easing(Easing.bezier(0.18, 0.65, 0.16, 1))
				.withInitialValues({
					opacity: 0.35,
					transform: [{ translateY: 42 }, { scale: 0.92 }],
				})
				.springify()
				.damping(15)
				.mass(0.9)
				.stiffness(140)}
			exiting={FadeOut.duration(260)
				.easing(Easing.bezier(0.35, 0, 0.75, 0.82))
				.withInitialValues({
					opacity: 1,
					transform: [{ translateY: 0 }, { scale: 1.02 }],
				})
				.springify()
				.damping(18)
				.mass(0.85)}
		>
			<LinearGradient style={{ flex: 1 }} colors={gradientColors}>
				<LinearGradient
					colors={[
						withOpacity("#ffffff", theme === "dark" ? 0.12 : 0.3),
						withOpacity(accentColor, 0.08),
						withOpacity("#000000", theme === "dark" ? 0.48 : 0.26),
					]}
					locations={[0, 0.55, 1]}
					style={[StyleSheet.absoluteFillObject, { pointerEvents: "none" }]}
				/>

				<View
					style={themedStyles.overlayContainer}
					onLayout={(event: LayoutChangeEvent) => {
						const { width: cWidth, height: cHeight } = event.nativeEvent.layout;
						containerRef.current?.measure((_, __, ___, ____, pageX, pageY) => {
							setContainerLayout({ width: cWidth, height: cHeight, x: pageX, y: pageY });
						});
					}}
					ref={containerRef}
				>
					<View style={themedStyles.smokeContainer} pointerEvents="none">
						<SmokeBackground backgroundColor={backgroundColor} />
					</View>

					<DismissPlayerSymbol accentColor={accentColor} />

					<View
						style={{
							flex: 1,
							marginTop: top + 36,
							marginBottom: bottom + 10,
							gap: 20,
							zIndex: 1,
						}}
					>
						<Animated.View
							entering={ZoomIn.duration(520)
								.easing(Easing.bezier(0.16, 0.54, 0.12, 1))
								.springify()
								.damping(14)
								.mass(0.85)}
							exiting={ZoomOut.duration(280)
								.easing(Easing.bezier(0.4, 0, 0.8, 0.7))
								.springify()
								.damping(18)}
							style={themedStyles.artworkImageContainer}
							onLayout={() => {
								// no-op
							}}
						>
							{hasArtwork ? (
								<>
									<Image
										source={{ uri: artworkUri }}
										style={[themedStyles.artworkLayer, themedStyles.artworkFusedLayer]}
										contentFit="cover"
										transition={240}
										blurRadius={18}
									/>
									<Image
										source={{ uri: artworkUri }}
										style={[themedStyles.artworkLayer, themedStyles.artworkDetailLayer]}
										contentFit="cover"
										transition={240}
									/>
									<View style={themedStyles.artworkColorWash} pointerEvents="none" />
									<View style={themedStyles.artworkSmokeOverlay} pointerEvents="none">
										<Image
											source={smokeGif}
											style={StyleSheet.absoluteFillObject}
											contentFit="cover"
											transition={0}
										/>
									</View>

									<LinearGradient
										colors={[
											withOpacity(backgroundColor, theme === "dark" ? 0.22 : 0.28),
											withOpacity(backgroundColor, theme === "dark" ? 0.46 : 0.52),
										]}
										locations={[0, 1]}
										style={themedStyles.artworkDimmer}
										pointerEvents="none"
									/>
								</>
							) : null}
						</Animated.View>

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
						{/* Controller Panel */}
						<View style={themedStyles.panelWrapper}>
							<View style={themedStyles.panelBlur} pointerEvents="none" />

							<View style={themedStyles.panelContent}>
								<View
									onLayout={(event: LayoutChangeEvent) => {
										const { width: pWidth, height: pHeight } = event.nativeEvent.layout;
										progressRef.current?.measure((_, __, ___, ____, pageX, pageY) => {
											setProgressLayout({ width: pWidth, height: pHeight, x: pageX, y: pageY });
										});
									}}
									ref={progressRef}
								>
									<PlayerProgressBar onPositionChange={setProgressRatio} />
								</View>

								<PlayerControls style={{ marginTop: 10 }} />

								<PlayerVolumeBar style={{ marginTop: 15 }} />

								<View style={[utilsStyles.centeredRow, { marginTop: 10 }]}>
									<PlayerRepeatToggle size={30} style={{ marginBottom: 4 }} />
								</View>
							</View>
						</View>
					</View>

					<FlashlightOverlay
						accentColor={accentColor}
						progressRatio={progressRatio}
						containerLayout={containerLayout}
						progressLayout={progressLayout}
					/>
				</View>
			</LinearGradient>
		</Animated.View>
	);
};

type DismissPlayerSymbolProps = {
	accentColor: string;
};

const DismissPlayerSymbol = ({ accentColor }: DismissPlayerSymbolProps) => {
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
					backgroundColor: withOpacity(accentColor, 0.9),
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: withOpacity(colors.background, 0.3),
					opacity: 0.9,
				}}
			/>
		</View>
	);
};

const styles = (
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"],
	theme: ReturnType<typeof useTheme>["theme"],
	backgroundColor: string,
	accentColor: string,
	hasArtwork: boolean,
) =>
	StyleSheet.create({
		smokeContainer: {
			...StyleSheet.absoluteFillObject,
			overflow: "hidden",
			zIndex: 0,
		},
		overlayContainer: {
			...defaultStyles.container,
			backgroundColor: backgroundColor,
			paddingHorizontal: screenPadding.horizontal,
			position: "relative",
		},
		artworkImageContainer: {
			position: "relative",
			shadowOffset: {
				width: 0,
				height: 12,
			},
			shadowOpacity: 0,
			shadowRadius: 0,
			flexDirection: "row",
			justifyContent: "center",
			height: "50%",
			overflow: "hidden",
			borderRadius: 24,
			backgroundColor: hasArtwork ? backgroundColor : "transparent",
			borderWidth: 0,
			borderColor: hasArtwork ? backgroundColor : "transparent",
		},
		artworkLayer: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			backgroundColor: backgroundColor,
		},
		artworkFusedLayer: {
			zIndex: 1,
			opacity: 0.25,
		},
		artworkDetailLayer: {
			zIndex: 2,
			opacity: 0.45,
		},
		artworkColorWash: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			backgroundColor: withOpacity(backgroundColor, 0.38),
			zIndex: 3,
		},
		artworkDimmer: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			zIndex: 5,
		},
		artworkSmokeOverlay: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			opacity: 0.32,
			zIndex: 4,
		},
		infoBlock: {
			gap: 4,
			alignItems: "center",
			justifyContent: "flex-start",
			flexDirection: "column",
			width: "100%",
			paddingHorizontal: 6,
			paddingVertical: 10,
			borderRadius: 18,
			zIndex: 2,
			backgroundColor: "transparent",
			borderWidth: 0,
			borderColor: withOpacity(accentColor, theme === "dark" ? 0.35 : 0.28),
		},
		trackTitleContainer: {
			alignSelf: "stretch",
			overflow: "hidden",
			width: "100%",
			paddingHorizontal: 8,
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
		panelWrapper: {
			...utilsStyles.glassCard,
			padding: 10,
			width: "100%",
			borderRadius: 22,
			backgroundColor: "transparent",
			borderWidth: 0,
			borderColor: withOpacity(accentColor, theme === "dark" ? 0.32 : 0.26),
		},
		panelBlur: {
			...StyleSheet.absoluteFillObject,
		},
		panelContent: {
			rowGap: 10,
		},
	});

export default PlayerScreen;
