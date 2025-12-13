import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo } from 'react'
import {
	ActivityIndicator,
	type StyleProp,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from 'react-native'
import Animated, { Easing, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, {
	Defs,
	FeColorMatrix,
	FeGaussianBlur,
	Filter,
	Image as SvgImage,
} from 'react-native-svg'
import smokeGif from '@/assets/smoke.gif'
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

const GRAYSCALE_MATRIX =
	'0.2126 0.7152 0.0722 0 0 ' +
	'0.2126 0.7152 0.0722 0 0 ' +
	'0.2126 0.7152 0.0722 0 0 ' +
	'0 0 0 1 0'

type SmokeBackgroundProps = {
	backgroundColor: string
}

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
				withOpacity('#ffffff', 0),
			]}
			start={{ x: 0.5, y: 1 }}
			end={{ x: 0.5, y: 0 }}
			locations={[0, 0.6, 1]}
			style={StyleSheet.absoluteFillObject}
		/>
	</View>
)

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
		() => [withOpacity(backgroundColor, 0.35), withOpacity(backgroundColor, 0.98)],
		[backgroundColor],
	)
	const artworkFilterBase = useMemo(() => {
		const lengthMarker = (artworkUri?.length ?? 0).toString(16)
		return `artwork-filter-${lengthMarker}-${Math.random().toString(16).slice(2)}`
	}, [artworkUri])

	const { top, bottom } = useSafeAreaInsets()

	if (!displayedTrack) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center' }]}>
				<ActivityIndicator color={colors.icon} />
			</View>
		)
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
						withOpacity('#ffffff', theme === 'dark' ? 0.12 : 0.3),
						withOpacity(accentColor, 0.08),
						withOpacity('#000000', theme === 'dark' ? 0.48 : 0.26),
					]}
					locations={[0, 0.55, 1]}
					style={[StyleSheet.absoluteFillObject, { pointerEvents: 'none' }]}
				/>

				<View style={themedStyles.overlayContainer}>
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
						>
							<GrayscaleArtworkLayer
								uri={artworkUri}
								filterId={`${artworkFilterBase}-backdrop`}
								opacity={0.4}
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
						{/* Controller Panel */}
						<View style={themedStyles.panelWrapper}>
							<View style={themedStyles.panelBlur} pointerEvents="none" />

							<View style={themedStyles.panelContent}>
								<View>
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
			zIndex: 0,
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
			backgroundColor: withOpacity(backgroundColor, 0.18),
		},
		artworkColorOverlay: {
			...StyleSheet.absoluteFillObject,
			borderRadius: 24,
			backgroundColor: backgroundColor,
			opacity: theme === 'dark' ? 0.18 : 0.22,
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
			backgroundColor: 'transparent',
			borderWidth: 0,
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
			width: '100%',
			borderRadius: 22,
			backgroundColor: 'transparent',
			borderWidth: 0,
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
