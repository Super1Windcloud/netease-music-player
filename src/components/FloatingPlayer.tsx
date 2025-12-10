import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, TouchableOpacity, View, type ViewProps } from 'react-native'
import { PlayPauseButton, SkipToNextButton } from '@/components/PlayerControls'
import { unknownTrackImageUri } from '@/constants/images'
import { useLastActiveTrack } from '@/hooks/useLastActiveTrack'
import { useActiveTrack } from '@/lib/expo-track-player'
import { useThemeStyles } from '@/styles'
import { MovingText } from './MovingText'

export const FloatingPlayer = ({ style }: ViewProps) => {
	const router = useRouter()
	const { colors, defaultStyles } = useThemeStyles()

	const themedStyles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					flexDirection: 'row',
					alignItems: 'center',
					backgroundColor: colors.card,
					padding: 8,
					borderRadius: 12,
					paddingVertical: 10,
				},
				trackArtworkImage: {
					width: 40,
					height: 40,
					borderRadius: 8,
				},
				trackTitleContainer: {
					flex: 1,
					overflow: 'hidden',
					marginLeft: 10,
				},
				trackTitle: {
					...defaultStyles.text,
					fontSize: 18,
					fontWeight: '600',
					paddingLeft: 10,
				},
				trackControlsContainer: {
					flexDirection: 'row',
					alignItems: 'center',
					columnGap: 20,
					marginRight: 16,
					paddingLeft: 16,
				},
			}),
		[colors.card, defaultStyles.text],
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
			activeOpacity={0.9}
			style={[themedStyles.container, style]}
		>
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
				<PlayPauseButton iconSize={24} />
				<SkipToNextButton iconSize={22} />
			</View>
		</TouchableOpacity>
	)
}
