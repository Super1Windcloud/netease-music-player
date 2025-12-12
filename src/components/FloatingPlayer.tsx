import { BlurView } from 'expo-blur'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View, type ViewProps } from 'react-native'
import { PlayPauseButton, SkipToNextButton } from '@/components/PlayerControls'
import { unknownTrackImageUri } from '@/constants/images'
import { useLastActiveTrack } from '@/hooks/useLastActiveTrack'
import { useTheme } from '@/hooks/useTheme'
import { useActiveTrack } from '@/lib/expo-track-player'
import { useThemeStyles } from '@/styles'
import { MovingText } from './MovingText'

export const FloatingPlayer = ({ style }: ViewProps) => {
	const router = useRouter()
	const { theme } = useTheme()
	const { defaultStyles, utilsStyles } = useThemeStyles()

	const themedStyles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					...utilsStyles.glassCard,
					overflow: 'hidden',
					flexDirection: 'row',
					alignItems: 'center',
					padding: 10,
					borderRadius: 50,
					borderWidth: StyleSheet.hairlineWidth * 0.5,
					borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgba(255, 255, 255, 0.4)',
					backgroundColor:
						theme === 'dark' ? 'rgba(26, 26, 28, 0.06)' : 'rgba(255, 255, 255, 0.86)',
				},
				trackArtworkImage: {
					width: 44,
					height: 44,
					borderRadius: 22,
				},
				trackTitleContainer: {
					flex: 1,
					overflow: 'hidden',
					marginLeft: 12,
				},
				trackTitle: {
					...defaultStyles.text,
					fontSize: 16,
					fontWeight: '700',
					paddingLeft: 4,
				},
				trackControlsContainer: {
					flexDirection: 'row',
					alignItems: 'center',
					columnGap: 16,
					marginRight: 10,
					paddingLeft: 12,
				},
				transparentButton: {
					backgroundColor: 'transparent',
					borderColor: 'transparent',
					borderWidth: 0,
					shadowOpacity: 0,
				},
				blurLayer: {
					...StyleSheet.absoluteFillObject,
				},
			}),
		[defaultStyles.text, theme, utilsStyles.glassCard],
	)

	const activeTrack = useActiveTrack()
	const lastActiveTrack = useLastActiveTrack()

	const displayedTrack = activeTrack ?? lastActiveTrack

	const handlePress = () => {
		router.navigate('/player')
	}

	if (!displayedTrack) return null

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.6}
			style={[themedStyles.container, style]}
		>
			<BlurView
				tint={theme === 'dark' ? 'dark' : 'light'}
				intensity={60}
				style={themedStyles.blurLayer}
				pointerEvents="none"
			/>

			<Image
				source={{
					uri: displayedTrack.artwork ?? unknownTrackImageUri,
				}}
				contentFit="cover"
				style={themedStyles.trackArtworkImage}
			/>

			<View style={themedStyles.trackTitleContainer}>
				<MovingText
					style={themedStyles.trackTitle}
					text={displayedTrack.title ?? ''}
					animationThreshold={25}
				/>
			</View>

			<View style={themedStyles.trackControlsContainer}>
				<PlayPauseButton iconSize={24} style={themedStyles.transparentButton} />
				<SkipToNextButton iconSize={22} style={themedStyles.transparentButton} />
			</View>
		</TouchableOpacity>
	)
}
