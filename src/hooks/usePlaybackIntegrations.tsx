import { useEffect } from 'react'
import { useActiveTrack, useIsPlaying } from '@/lib/expo-track-player'
import { NotificationService } from '@/lib/notification'
import { WakelockService } from '@/lib/wake-lock'

export const usePlaybackIntegrations = () => {
	const activeTrack = useActiveTrack()
	const { playing } = useIsPlaying()

	useEffect(() => {
		NotificationService.initialize().catch((error) => {
			console.error('Failed to initialize notifications', error)
		})

		return () => {
			void NotificationService.hideMediaNotification()
			void WakelockService.deactivate()
		}
	}, [])

	useEffect(() => {
		const syncSideEffects = async () => {
			if (playing) {
				await WakelockService.activate()
			} else {
				await WakelockService.deactivate()
			}

			if (activeTrack) {
				await NotificationService.showOrUpdateMediaNotification(
					{
						id: activeTrack.id ?? `track-${activeTrack.title ?? 'unknown'}`,
						title: activeTrack.title ?? 'Unknown track',
						artist: activeTrack.artist ?? 'Unknown artist',
					},
					playing,
				)
			} else if (!playing) {
				await NotificationService.hideMediaNotification()
			}
		}

		syncSideEffects().catch((error) => {
			console.error('Failed to sync playback integrations', error)
		})
	}, [activeTrack, playing])
}
