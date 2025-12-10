import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import { StyleSheet, Text, View, type ViewProps } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { useStrings } from '@/hooks/useStrings'
import TrackPlayer, { type Track } from '@/lib/expo-track-player'
import { useThemeStyles } from '@/styles'

type QueueControlsProps = {
	tracks: Track[]
} & ViewProps

export const QueueControls = ({ tracks, style, ...viewProps }: QueueControlsProps) => {
	const { t } = useStrings()
	const { colors, defaultStyles } = useThemeStyles()
	const themedStyles = useMemo(() => styles(colors, defaultStyles), [colors, defaultStyles])

	const handlePlay = async () => {
		await TrackPlayer.setQueue(tracks)
		await TrackPlayer.play()
	}

	const handleShufflePlay = async () => {
		const shuffledTracks = [...tracks].sort(() => Math.random() - 0.5)

		await TrackPlayer.setQueue(shuffledTracks)
		await TrackPlayer.play()
	}

	return (
		<View style={[{ flexDirection: 'row', columnGap: 16 }, style]} {...viewProps}>
			{/* Play button */}
			<View style={{ flex: 1 }}>
				<TouchableOpacity onPress={handlePlay} activeOpacity={0.8} style={themedStyles.button}>
					<Ionicons name="play" size={22} color={colors.primary} />

					<Text style={themedStyles.buttonText}>{t.queue_play}</Text>
				</TouchableOpacity>
			</View>

			{/* Shuffle button */}
			<View style={{ flex: 1 }}>
				<TouchableOpacity
					onPress={handleShufflePlay}
					activeOpacity={0.8}
					style={themedStyles.button}
				>
					<Ionicons name={'shuffle-sharp'} size={24} color={colors.primary} />

					<Text style={themedStyles.buttonText}>{t.queue_shuffle}</Text>
				</TouchableOpacity>
			</View>
		</View>
	)
}

const styles = (
	colors: ReturnType<typeof useThemeStyles>['colors'],
	defaultStyles: ReturnType<typeof useThemeStyles>['defaultStyles'],
) =>
	StyleSheet.create({
		button: {
			padding: 12,
			backgroundColor: colors.card,
			borderRadius: 8,
			flexDirection: 'row',
			justifyContent: 'center',
			alignItems: 'center',
			columnGap: 8,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		buttonText: {
			...defaultStyles.text,
			color: colors.primary,
			fontWeight: '600',
			fontSize: 18,
			textAlign: 'center',
		},
	})
