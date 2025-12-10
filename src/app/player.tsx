import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MovingText } from '@/components/MovingText'
import { PlayerControls } from '@/components/PlayerControls'
import { PlayerProgressBar } from '@/components/PlayerProgressbar'
import { PlayerRepeatToggle } from '@/components/PlayerRepeatToggle'
import { PlayerVolumeBar } from '@/components/PlayerVolumeBar'
import { unknownTrackImageUri } from '@/constants/images'
import { fontSize, screenPadding } from '@/constants/tokens'
import { usePlayerBackground } from '@/hooks/usePlayerBackground'
import { useActiveTrack } from '@/lib/expo-track-player'
import { useThemeStyles } from '@/styles'

const PlayerScreen = () => {
	const activeTrack = useActiveTrack()
	const { imageColors } = usePlayerBackground(activeTrack?.artwork ?? unknownTrackImageUri)
	const { colors, defaultStyles, utilsStyles } = useThemeStyles()
	const themedStyles = useMemo(() => styles(colors, defaultStyles), [colors, defaultStyles])

	const { top, bottom } = useSafeAreaInsets()

	if (!activeTrack) {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center' }]}>
				<ActivityIndicator color={colors.icon} />
			</View>
		)
	}

	return (
		<LinearGradient
			style={{ flex: 1 }}
			colors={imageColors ? [imageColors.background, imageColors.primary] : [colors.background]}
		>
			<View style={themedStyles.overlayContainer}>
				<DismissPlayerSymbol />

				<View style={{ flex: 1, marginTop: top + 70, marginBottom: bottom }}>
					<View style={themedStyles.artworkImageContainer}>
						<Image
							source={{
								uri: activeTrack.artwork ?? unknownTrackImageUri,
								priority: 'high',
							}}
							contentFit="cover"
							style={themedStyles.artworkImage}
						/>
					</View>

					<View style={{ flex: 1 }}>
						<View style={{ marginTop: 'auto' }}>
							<View style={{ height: 60 }}>
								<View style={{ alignItems: 'center' }}>
									{/* Track title */}
									<View style={[themedStyles.trackTitleContainer, { width: '100%' }]}>
										<MovingText
											text={activeTrack.title ?? ''}
											animationThreshold={30}
											style={themedStyles.trackTitleText}
										/>
									</View>
								</View>

								{/* Track artist */}
								{activeTrack.artist && (
									<Text numberOfLines={1} style={[themedStyles.trackArtistText, { marginTop: 6 }]}>
										{activeTrack.artist}
									</Text>
								)}
							</View>

							<PlayerProgressBar style={{ marginTop: 32 }} />

							<PlayerControls style={{ marginTop: 40 }} />
						</View>

						<PlayerVolumeBar style={{ marginTop: 'auto', marginBottom: 30 }} />

						<View style={utilsStyles.centeredRow}>
							<PlayerRepeatToggle size={30} style={{ marginBottom: 6 }} />
						</View>
					</View>
				</View>
			</View>
		</LinearGradient>
	)
}

const DismissPlayerSymbol = () => {
	const { top } = useSafeAreaInsets()
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
					height: 8,
					borderRadius: 8,
					backgroundColor: colors.text,
					opacity: 0.7,
				}}
			/>
		</View>
	)
}

const styles = (
	colors: ReturnType<typeof useThemeStyles>['colors'],
	defaultStyles: ReturnType<typeof useThemeStyles>['defaultStyles'],
) =>
	StyleSheet.create({
		overlayContainer: {
			...defaultStyles.container,
			paddingHorizontal: screenPadding.horizontal,
			backgroundColor: 'rgba(0,0,0,0.4)',
		},
		artworkImageContainer: {
			shadowOffset: {
				width: 0,
				height: 8,
			},
			shadowOpacity: 0.44,
			shadowRadius: 11.0,
			flexDirection: 'row',
			justifyContent: 'center',
			height: '45%',
		},
		artworkImage: {
			width: '100%',
			height: '100%',
			resizeMode: 'cover',
			borderRadius: 12,
		},
		trackTitleContainer: {
			flex: 1,
			overflow: 'hidden',
		},
		trackTitleText: {
			...defaultStyles.text,
			fontSize: 22,
			fontWeight: '700',
		},
		trackArtistText: {
			...defaultStyles.text,
			fontSize: fontSize.base,
			opacity: 0.8,
			maxWidth: '90%',
		},
	})

export default PlayerScreen
