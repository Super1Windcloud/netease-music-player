import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
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
	const themedStyles = useMemo(
		() => styles(defaultStyles, utilsStyles, theme, backgroundColor, accentColor),
		[accentColor, backgroundColor, defaultStyles, theme, utilsStyles],
	)
	const gradientColors = useMemo<readonly [string, string]>(
		() => [backgroundColor, accentColor],
		[accentColor, backgroundColor],
	)

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
					colors={
						theme === 'dark'
							? ['rgba(5, 9, 16, 0.65)', 'rgba(5, 9, 16, 0.15)']
							: ['rgba(255,255,255,0.65)', 'rgba(255,255,255,0.2)']
					}
					style={StyleSheet.absoluteFillObject}
				/>

				<View style={themedStyles.overlayContainer}>
					<DismissPlayerSymbol accentColor={accentColor} />

					<View style={{ flex: 1, marginTop: top + 36, marginBottom: bottom + 10, gap: 20 }}>
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
							<Image
								source={{
									uri: displayedTrack.artwork ?? unknownTrackImageUri,
								}}
								priority={'high'}
								contentFit="cover"
								style={themedStyles.artworkImage}
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
								<PlayerProgressBar />

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
		overlayContainer: {
			...defaultStyles.container,
			backgroundColor,
			paddingHorizontal: screenPadding.horizontal,
		},
		artworkImageContainer: {
			shadowOffset: {
				width: 0,
				height: 12,
			},
			shadowOpacity: 0.32,
			shadowRadius: 18,
			flexDirection: 'row',
			justifyContent: 'center',
			height: '50%',
		},
		artworkImage: {
			width: '100%',
			height: '100%',
			resizeMode: 'cover',
			borderRadius: 24,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: theme === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.6)',
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
