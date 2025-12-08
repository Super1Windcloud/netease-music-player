import { useRouter } from 'expo-router'
import { PropsWithChildren } from 'react'
import { ActionSheetIOS, Alert, Platform, Pressable } from 'react-native'
import TrackPlayer, { Track } from '@/lib/expo-track-player'
import { match } from 'ts-pattern'
import { useFavorites } from '@/store/library'
import { useQueue } from '@/store/queue'

type TrackShortcutsMenuProps = PropsWithChildren<{ track: Track }>

export const TrackShortcutsMenu = ({ track, children }: TrackShortcutsMenuProps) => {
	const router = useRouter()

	const isFavorite = track.rating === 1

	const { toggleTrackFavorite } = useFavorites()
	const { activeQueueId } = useQueue()

	const handlePressAction = (id: string) => {
		match(id)
			.with('add-to-favorites', async () => {
				toggleTrackFavorite(track)

				// if the tracks is in the favorite queue, add it
				if (activeQueueId?.startsWith('favorites')) {
					await TrackPlayer.add(track)
				}
			})
			.with('remove-from-favorites', async () => {
				toggleTrackFavorite(track)

				// if the track is in the favorites queue, we need to remove it
				if (activeQueueId?.startsWith('favorites')) {
					const queue = await TrackPlayer.getQueue()

					const trackToRemove = queue.findIndex((queueTrack) => queueTrack.url === track.url)

					await TrackPlayer.remove(trackToRemove)
				}
			})
			.with('add-to-playlist', () => {
				// it opens the addToPlaylist modal
				// @ts-expect-error it should work
				router.push({ pathname: '(modals)/addToPlaylist', params: { trackUrl: track.url } })
			})
			.otherwise(() => console.warn(`Unknown menu action ${id}`))
	}

	const showMenu = () => {
		const options = [
			{
				id: isFavorite ? 'remove-from-favorites' : 'add-to-favorites',
				label: isFavorite ? 'Remove from favorites' : 'Add to favorites',
			},
			{
				id: 'add-to-playlist',
				label: 'Add to playlist',
			},
			{ id: 'cancel', label: 'Cancel' },
		]

		if (Platform.OS === 'ios') {
			ActionSheetIOS.showActionSheetWithOptions(
				{
					options: options.map((option) => option.label),
					cancelButtonIndex: options.length - 1,
				},
				(buttonIndex) => {
					const selected = options[buttonIndex]
					if (selected && selected.id !== 'cancel') {
						handlePressAction(selected.id)
					}
				},
			)
		} else {
			Alert.alert('Track actions', undefined, [
				{
					text: options[0].label,
					onPress: () => handlePressAction(options[0].id),
				},
				{
					text: options[1].label,
					onPress: () => handlePressAction(options[1].id),
				},
				{
					text: options[2].label,
					style: 'cancel',
				},
			])
		}
	}

	return <Pressable onPress={showMenu}>{children}</Pressable>
}
