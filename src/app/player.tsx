import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
	ActivityIndicator,
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from 'react-native'
import Animated, {
	cancelAnimation,
	Easing,
	FadeIn,
	FadeOut,
	interpolate,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
	ZoomIn,
	ZoomOut,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
	Defs,
	Ellipse,
	FeColorMatrix,
	FeGaussianBlur,
	Filter,
	RadialGradient,
	Stop,
	Image as SvgImage,
} from 'react-native-svg'
import { MovingText } from '@/components/MovingText'
import { PlayerControls } from '@/components/PlayerControls'
import { PlayerProgressBar } from '@/components/PlayerProgressbar'
import { PlayerRepeatToggle } from '@/components/PlayerRepeatToggle'
import { PlayerVolumeBar } from '@/components/PlayerVolumeBar'
import { unknownTrackImageUri } from '@/constants/images'
import { fontSize, screenPadding } from '@/constants/tokens'
import { withOpacity } from '@/helpers/colors'
import { useLastActiveTrack } from '@/hooks/useLastActiveTrack'
import { usePlayerBackground } from '@/hooks/usePlayerBackground'
import { useTheme } from '@/hooks/useTheme'
import { useActiveTrack } from '@/lib/expo-track-player'
import { useThemeStyles } from '@/styles'

const SMOKE_SIZES = {
	large: { width: 520, height: 620 },
	medium: { width: 520, height: 520 },
	small: { width: 420, height: 460 },
} as const

type SmokeLayerProps = {
	gradientId: string
	width: number
	height: number
	blur: number
	opacity: number
	gradientStops: { inner: string; mid: string; outer: string }
	animatedStyle: StyleProp<ViewStyle>
}

const SmokeLayer = ({
	gradientId,
	width,
	height,
	blur,
	opacity,
	gradientStops,
	animatedStyle,
}: SmokeLayerProps) => (
	<Animated.View
		style={[
			{
				width,
				height,
			},
			animatedStyle,
		]}
		pointerEvents="none"
	>
		<Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} pointerEvents="none">
			<Defs>
				<RadialGradient id={`${gradientId}-gradient`} cx="50%" cy="50%" r="50%">
					<Stop offset="0%" stopColor={gradientStops.inner} />
					<Stop offset="65%" stopColor={gradientStops.mid} />
					<Stop offset="100%" stopColor={gradientStops.outer} />
				</RadialGradient>
				<Filter id={`${gradientId}-blur`} x="-20%" y="-20%" width="140%" height="140%">
					<FeGaussianBlur stdDeviation={blur} />
				</Filter>
			</Defs>

			<Ellipse
				cx={width / 2}
				cy={height / 2}
				rx={width / 2}
				ry={height / 2}
				fill={`url(#${gradientId}-gradient)`}
				opacity={opacity}
				filter={`url(#${gradientId}-blur)`}
			/>
		</Svg>
	</Animated.View>
)

const GRAYSCALE_MATRIX =
	'0.2126 0.7152 0.0722 0 0 ' +
	'0.2126 0.7152 0.0722 0 0 ' +
	'0.2126 0.7152 0.0722 0 0 ' +
	'0 0 0 1 0'

type GrayscaleArtworkLayerProps = {
	uri: string
	filterId: string
	blur?: number
	opacity?: number
	style?: StyleProp<ViewStyle>
}

const GrayscaleArtworkLayer = ({
	uri,
	filterId,
	blur = 0,
	opacity = 1,
	style,
}: GrayscaleArtworkLayerProps) => (
	<Svg
		width="100%"
		height="100%"
		viewBox="0 0 100 100"
		preserveAspectRatio="xMidYMid slice"
		style={[StyleSheet.absoluteFillObject, style, { opacity }]}
		pointerEvents="none"
	>
		<Defs>
			<Filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
				<FeColorMatrix type="matrix" values={GRAYSCALE_MATRIX} />
				{blur > 0 ? <FeGaussianBlur stdDeviation={blur} /> : null}
			</Filter>
		</Defs>

		<SvgImage
			width="100%"
			height="100%"
			preserveAspectRatio="xMidYMid slice"
			href={{ uri }}
			filter={`url(#${filterId})`}
		/>
	</Svg>
)

const PlayerScreen = () => {
	const activeTrack = useActiveTrack()
	const lastActiveTrack = useLastActiveTrack()
	const displayedTrack = activeTrack ?? lastActiveTrack
	const { imageColors } = usePlayerBackground(displayedTrack?.artwork ?? unknownTrackImageUri)
	const { theme } = useTheme()
	const { colors, defaultStyles, utilsStyles } = useThemeStyles()
	const backgroundColor = imageColors?.background ?? colors.background
	const accentColor = imageColors?.primary ?? colors.primary
	const trackTitle = displayedTrack?.title?.trim() || 'Unknown Title'
	const artistName = displayedTrack?.artist?.trim() || 'Unknown Artist'
	const artworkUri = displayedTrack?.artwork ?? unknownTrackImageUri
	const themedStyles = useMemo(
		() => styles(defaultStyles, utilsStyles, theme, backgroundColor, accentColor),
		[accentColor, backgroundColor, defaultStyles, theme, utilsStyles],
	)
	const gradientColors = useMemo<readonly [string, string]>(
		() => [withOpacity(accentColor, 0.92), withOpacity(backgroundColor, 0.88)],
		[accentColor, backgroundColor],
	)
	const smokeGradientStops = useMemo(
		() => ({
			inner: withOpacity('#ffffff', theme === 'dark' ? 0.62 : 0.48),
			mid: withOpacity(backgroundColor, theme === 'dark' ? 0.35 : 0.3),
			outer: withOpacity(backgroundColor, 0),
		}),
		[backgroundColor, theme],
	)
	const artworkFilterBase = useMemo(() => {
		const lengthMarker = (artworkUri?.length ?? 0).toString(16)
		return `artwork-filter-${lengthMarker}-${Math.random().toString(16).slice(2)}`
	}, [artworkUri])

	const { top, bottom } = useSafeAreaInsets()
	const smokePrimary = useSharedValue(0)
	const smokeSecondary = useSharedValue(0)
	const smokeTertiary = useSharedValue(0)
	const smokePrimaryNoiseX = useSharedValue(0)
	const smokePrimaryNoiseY = useSharedValue(0)
	const smokeSecondaryNoiseX = useSharedValue(0)
	const smokeSecondaryNoiseY = useSharedValue(0)
	const smokeTertiaryNoiseX = useSharedValue(0)
	const smokeTertiaryNoiseY = useSharedValue(0)
	const overlayRef = useRef<View | null>(null)
	const progressBarRef = useRef<View | null>(null)
	const [smokeOriginY, setSmokeOriginY] = useState<number | null>(null)

	useEffect(() => {
		const layerConfigs = [
			{ shared: smokePrimary, duration: 18000, delay: 0 },
			{ shared: smokeSecondary, duration: 21000, delay: 1200 },
			{ shared: smokeTertiary, duration: 16000, delay: 2200 },
		]

		layerConfigs.forEach(({ shared, duration, delay }) => {
			shared.value = withDelay(
				delay,
				withRepeat(
					withTiming(1, {
						duration,
						easing: Easing.inOut(Easing.quad),
					}),
					-1,
					false,
				),
			)
		})

		return () => {
			layerConfigs.forEach(({ shared }) => {
				cancelAnimation(shared)
			})
		}
	}, [smokePrimary, smokeSecondary, smokeTertiary])

	useEffect(() => {
		const startNoiseLoop = (
			xShared: Animated.SharedValue<number>,
			yShared: Animated.SharedValue<number>,
			spread: { x: number; y: number },
			baseDuration: number,
		) => {
			let timeoutId: ReturnType<typeof setTimeout> | null = null

			const animate = () => {
				const duration = baseDuration + Math.random() * baseDuration * 0.6
				const nextX = (Math.random() * 2 - 1) * spread.x
				const nextY = (Math.random() * 2 - 1) * spread.y

				xShared.value = withTiming(nextX, {
					duration,
					easing: Easing.inOut(Easing.cubic),
				})
				yShared.value = withTiming(nextY, {
					duration,
					easing: Easing.inOut(Easing.cubic),
				})

				timeoutId = setTimeout(animate, duration)
			}

			animate()

			return () => {
				if (timeoutId) {
					clearTimeout(timeoutId)
				}
				cancelAnimation(xShared)
				cancelAnimation(yShared)
			}
		}

		const stopPrimaryNoise = startNoiseLoop(
			smokePrimaryNoiseX,
			smokePrimaryNoiseY,
			{ x: 60, y: 38 },
			2600,
		)
		const stopSecondaryNoise = startNoiseLoop(
			smokeSecondaryNoiseX,
			smokeSecondaryNoiseY,
			{ x: 48, y: 30 },
			2800,
		)
		const stopTertiaryNoise = startNoiseLoop(
			smokeTertiaryNoiseX,
			smokeTertiaryNoiseY,
			{ x: 38, y: 26 },
			2200,
		)

		return () => {
			stopPrimaryNoise()
			stopSecondaryNoise()
			stopTertiaryNoise()
		}
	}, [
		smokePrimaryNoiseX,
		smokePrimaryNoiseY,
		smokeSecondaryNoiseX,
		smokeSecondaryNoiseY,
		smokeTertiaryNoiseX,
		smokeTertiaryNoiseY,
	])

	const smokeAnchorY = useMemo(() => smokeOriginY ?? 420, [smokeOriginY])
	const smokePhases = useMemo(
		() => ({
			primary: { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2 },
			secondary: { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2 },
			tertiary: { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2 },
		}),
		[],
	)

	const smokePrimaryStyle = useAnimatedStyle(() => {
		const progress = smokePrimary.value
		const waveY = Math.sin(progress * Math.PI * 2 + smokePhases.primary.y) * 18
		const waveX = Math.cos(progress * Math.PI * 2 + smokePhases.primary.x) * 34
		const translateY = interpolate(progress, [0, 1], [24, -280]) + waveY + smokePrimaryNoiseY.value
		const translateX = interpolate(progress, [0, 1], [-90, 90]) + waveX + smokePrimaryNoiseX.value

		return {
			transform: [
				{ translateY },
				{ translateX },
				{ scale: 1.02 + Math.sin(progress * Math.PI * 2 + 0.6) * 0.05 },
			],
		}
	})

	const smokeSecondaryStyle = useAnimatedStyle(() => {
		const progress = smokeSecondary.value
		const waveY = Math.sin(progress * Math.PI * 2 + smokePhases.secondary.y) * 14
		const waveX = Math.cos(progress * Math.PI * 2 + smokePhases.secondary.x) * 26
		const translateY =
			interpolate(progress, [0, 1], [18, -240]) + waveY + smokeSecondaryNoiseY.value
		const translateX =
			interpolate(progress, [0, 1], [-70, 70]) + waveX + smokeSecondaryNoiseX.value

		return {
			transform: [
				{ translateY },
				{ translateX },
				{ scale: 1.08 + Math.sin(progress * Math.PI * 2 + 1.4) * 0.06 },
			],
		}
	})

	const smokeTertiaryStyle = useAnimatedStyle(() => {
		const progress = smokeTertiary.value
		const waveY = Math.sin(progress * Math.PI * 2 + smokePhases.tertiary.y) * 16
		const waveX = Math.cos(progress * Math.PI * 2 + smokePhases.tertiary.x) * 20
		const translateY =
			interpolate(progress, [0, 1], [16, -220]) + waveY + smokeTertiaryNoiseY.value
		const translateX =
			interpolate(progress, [0, 1], [-55, 55]) + waveX + smokeTertiaryNoiseX.value

		return {
			transform: [
				{ translateY },
				{ translateX },
				{ scale: 0.92 + Math.sin(progress * Math.PI * 2 + 0.2) * 0.05 },
			],
		}
	})

	const updateSmokeOrigin = useCallback(() => {
		if (!progressBarRef.current || !overlayRef.current) {
			return
		}

		progressBarRef.current.measure((_, __, ___, height, ____, pageY) => {
			overlayRef.current?.measure((_x1, _y1, _w1, _h1, _pageX1, overlayPageY) => {
				if (overlayPageY == null || pageY == null || height == null) {
					return
				}

				setSmokeOriginY(pageY - overlayPageY + height / 2)
			})
		})
	}, [])

	const handleProgressLayout = useCallback(() => {
		updateSmokeOrigin()
	}, [updateSmokeOrigin])

	const handleOverlayLayout = useCallback(() => {
		updateSmokeOrigin()
	}, [updateSmokeOrigin])

	const smokeOffsets = useMemo(
		() => ({
			primary: smokeAnchorY - SMOKE_SIZES.large.height + 28,
			secondary: smokeAnchorY - SMOKE_SIZES.medium.height + 22,
			tertiary: smokeAnchorY - SMOKE_SIZES.small.height + 18,
		}),
		[smokeAnchorY],
	)

	if (!displayedTrack) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center' }]}>
				<ActivityIndicator color={colors.icon} />
			</View>
		)
	}

	return (
		<Animated.View
			style={{ flex: 1 }}
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
						withOpacity('#ffffff', theme === 'dark' ? 0.12 : 0.3),
						withOpacity(accentColor, 0.08),
						withOpacity('#000000', theme === 'dark' ? 0.48 : 0.26),
					]}
					locations={[0, 0.55, 1]}
					style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
				/>

				<View ref={overlayRef} style={themedStyles.overlayContainer} onLayout={handleOverlayLayout}>
					<View style={themedStyles.smokeContainer} pointerEvents="none">
						<SmokeLayer
							gradientId="smoke-primary"
							gradientStops={smokeGradientStops}
							width={SMOKE_SIZES.large.width}
							height={SMOKE_SIZES.large.height}
							blur={24}
							opacity={0.58}
							animatedStyle={[
								{ top: smokeOffsets.primary },
								themedStyles.smoke,
								themedStyles.smokeLarge,
								smokePrimaryStyle,
							]}
						/>

						<SmokeLayer
							gradientId="smoke-secondary"
							gradientStops={smokeGradientStops}
							width={SMOKE_SIZES.medium.width}
							height={SMOKE_SIZES.medium.height}
							blur={20}
							opacity={0.44}
							animatedStyle={[
								{ top: smokeOffsets.secondary },
								themedStyles.smoke,
								themedStyles.smokeMedium,
								smokeSecondaryStyle,
							]}
						/>

						<SmokeLayer
							gradientId="smoke-tertiary"
							gradientStops={smokeGradientStops}
							width={SMOKE_SIZES.small.width}
							height={SMOKE_SIZES.small.height}
							blur={18}
							opacity={0.38}
							animatedStyle={[
								{ top: smokeOffsets.tertiary },
								themedStyles.smoke,
								themedStyles.smokeSmall,
								smokeTertiaryStyle,
							]}
						/>
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
						>
							<GrayscaleArtworkLayer
								uri={artworkUri}
								filterId={`${artworkFilterBase}-backdrop`}
								blur={18}
								opacity={0.6}
								style={themedStyles.artworkLayer}
							/>

							<View style={themedStyles.artworkColorOverlay} pointerEvents="none" />

							<GrayscaleArtworkLayer
								uri={artworkUri}
								filterId={`${artworkFilterBase}-detail`}
								opacity={0.6}
								style={themedStyles.artworkLayer}
							/>

							<LinearGradient
								colors={[
									withOpacity(backgroundColor, theme === 'dark' ? 0.22 : 0.28),
									withOpacity(backgroundColor, theme === 'dark' ? 0.46 : 0.52),
								]}
								locations={[0, 1]}
								style={themedStyles.artworkDimmer}
								pointerEvents="none"
							/>
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

						<View style={themedStyles.panelWrapper}>
							<BlurView
								tint={theme === 'dark' ? 'dark' : 'light'}
								intensity={0}
								style={themedStyles.panelBlur}
								pointerEvents="none"
							/>

							<View style={themedStyles.panelContent}>
								<View ref={progressBarRef} onLayout={handleProgressLayout}>
									<PlayerProgressBar />
								</View>

								<PlayerControls style={{ marginTop: 10 }} />

								<PlayerVolumeBar style={{ marginTop: 15 }} />

								<View style={[utilsStyles.centeredRow, { marginTop: 10 }]}>
									<PlayerRepeatToggle size={30} style={{ marginBottom: 4 }} />
								</View>
							</View>
						</View>
					</View>
				</View>
			</LinearGradient>
		</Animated.View>
	)
}

type DismissPlayerSymbolProps = {
	accentColor: string
}

const DismissPlayerSymbol = ({ accentColor }: DismissPlayerSymbolProps) => {
	const { top } = useSafeAreaInsets()
	const { theme } = useTheme()
	const { colors } = useThemeStyles()

	return (
		<View
			style={{
				position: 'absolute',
				top: top + 8,
				left: 0,
				right: 0,
				flexDirection: 'row',
				justifyContent: 'center',
			}}
		>
			<View
				accessible={false}
				style={{
					width: 50,
					height: 6,
					borderRadius: 10,
					backgroundColor: withOpacity(accentColor, 0.7),
					borderWidth: StyleSheet.hairlineWidth,
					borderColor: withOpacity(colors.background, 0.3),
					opacity: theme === 'dark' ? 0.7 : 0.9,
				}}
			/>
		</View>
	)
}

const styles = (
	defaultStyles: ReturnType<typeof useThemeStyles>['defaultStyles'],
	utilsStyles: ReturnType<typeof useThemeStyles>['utilsStyles'],
	theme: ReturnType<typeof useTheme>['theme'],
	backgroundColor: string,
	accentColor: string,
) =>
	StyleSheet.create({
		smokeContainer: {
			...StyleSheet.absoluteFillObject,
			overflow: 'hidden',
			zIndex: 6,
		},
		smoke: {
			position: 'absolute',
			borderRadius: 400,
			zIndex: 5,
			pointerEvents: 'none',
		},
		smokeLarge: {
			width: SMOKE_SIZES.large.width,
			height: SMOKE_SIZES.large.height,
			left: -140,
		},
		smokeMedium: {
			width: SMOKE_SIZES.medium.width,
			height: SMOKE_SIZES.medium.height,
			right: -130,
		},
		smokeSmall: {
			width: SMOKE_SIZES.small.width,
			height: SMOKE_SIZES.small.height,
			left: 90,
		},
		overlayContainer: {
			...defaultStyles.container,
			backgroundColor: withOpacity(backgroundColor, 0.55),
			paddingHorizontal: screenPadding.horizontal,
			position: 'relative',
		},
		artworkImageContainer: {
			position: 'relative',
			shadowOffset: {
				width: 0,
				height: 12,
			},
			shadowOpacity: 0.32,
			shadowRadius: 18,
			flexDirection: 'row',
			justifyContent: 'center',
			height: '50%',
			overflow: 'hidden',
			borderRadius: 24,
			backgroundColor: withOpacity(backgroundColor, theme === 'dark' ? 0.76 : 0.88),
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: withOpacity(accentColor, theme === 'dark' ? 0.32 : 0.28),
		},
		artworkLayer: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			backgroundColor: withOpacity(accentColor, 0.06),
		},
		artworkColorOverlay: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			backgroundColor: backgroundColor,
			opacity: theme === 'dark' ? 0.26 : 0.32,
		},
		artworkDimmer: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
		},
		infoBlock: {
			gap: 4,
			alignItems: 'center',
			justifyContent: 'flex-start',
			flexDirection: 'column',
			width: '100%',
			paddingHorizontal: 6,
			paddingVertical: 10,
			borderRadius: 18,
			zIndex: 2,
			backgroundColor: withOpacity(backgroundColor, theme === 'dark' ? 0.42 : 0.82),
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: withOpacity(accentColor, theme === 'dark' ? 0.35 : 0.28),
		},
		trackTitleContainer: {
			alignSelf: 'stretch',
			overflow: 'hidden',
			width: '100%',
			paddingHorizontal: 8,
		},
		trackTitleText: {
			...defaultStyles.text,
			fontSize: 22,
			fontWeight: '700',
			textAlign: 'center',
			lineHeight: 26,
		},
		trackArtistText: {
			...defaultStyles.text,
			fontSize: fontSize.base,
			opacity: 0.7,
			textAlign: 'center',
			maxWidth: '90%',
		},
		panelWrapper: {
			...utilsStyles.glassCard,
			padding: 10,
			borderRadius: 22,
			overflow: 'hidden',
			backgroundColor: withOpacity(backgroundColor, theme === 'dark' ? 0.38 : 0.78),
			borderColor: withOpacity(accentColor, theme === 'dark' ? 0.32 : 0.26),
		},
		panelBlur: {
			...StyleSheet.absoluteFillObject,
		},
		panelContent: {
			rowGap: 10,
		},
	})

export default PlayerScreen
