import * as Notifications from 'expo-notifications'
import type { Track as MusicTrack } from '@/types/music'

const MEDIA_NOTIFICATION_ID = 'media-notification'

type NotificationTrack =
	| Pick<MusicTrack, 'id' | 'title' | 'artist'>
	| {
			id: string | number
			title?: string | null
			artist?: string | null
	  }

Notifications.setNotificationHandler({
	handleNotification: async (notification) => {
		if (notification.request.content.data?.type === 'media') {
			return {
				shouldShowAlert: false,
				shouldPlaySound: false,
				shouldSetBadge: false,
				shouldShowBanner: true,
				shouldShowList: true,
			}
		}
		return {
			shouldShowAlert: false,
			shouldPlaySound: false,
			shouldSetBadge: false,
			shouldShowBanner: false,
			shouldShowList: false,
		}
	},
})

const normalizeTrack = (track: NotificationTrack) => {
	return {
		id: track.id,
		title: track.title ?? 'Unknown track',
		artist: track.artist ?? 'Unknown artist',
	}
}

const showOrUpdateMediaNotification = async (track: NotificationTrack, isPlaying: boolean) => {
	try {
		const normalizedTrack = normalizeTrack(track)
		await Notifications.dismissNotificationAsync(MEDIA_NOTIFICATION_ID).catch(() => {})
		await Notifications.scheduleNotificationAsync({
			identifier: MEDIA_NOTIFICATION_ID,
			content: {
				title: normalizedTrack.title,
				body: isPlaying
					? `Playing • ${normalizedTrack.artist}`
					: `Paused • ${normalizedTrack.artist}`,
				data: {
					type: 'media',
					trackId: normalizedTrack.id,
					isPlaying,
				},
				categoryIdentifier: 'media-controls',
				sticky: true,
				priority: Notifications.AndroidNotificationPriority.HIGH,
			},
			trigger: null,
		})
	} catch (error) {
		console.error('Failed to show/update media notification:', error)
	}
}

const hideMediaNotification = async () => {
	try {
		await Notifications.dismissNotificationAsync(MEDIA_NOTIFICATION_ID)
	} catch (error) {
		console.error('Failed to hide media notification:', error)
	}
}

const setupNotificationCategories = async () => {
	try {
		await Notifications.setNotificationCategoryAsync('media-controls', [
			{
				identifier: 'previous',
				buttonTitle: 'Prev',
				options: { opensAppToForeground: false },
			},
			{
				identifier: 'play_pause',
				buttonTitle: 'Play/Pause',
				options: { opensAppToForeground: false },
			},
			{
				identifier: 'next',
				buttonTitle: 'Next',
				options: { opensAppToForeground: false },
			},
			{
				identifier: 'close',
				buttonTitle: 'Close',
				options: { opensAppToForeground: false, isDestructive: true },
			},
		])
	} catch (error) {
		console.error('Failed to set up notification categories:', error)
	}
}

const requestPermissions = async () => {
	try {
		const { status } = await Notifications.requestPermissionsAsync()
		if (status !== 'granted') {
			console.warn('Notification permissions not granted')
			return false
		}
		return true
	} catch (error) {
		console.error('Failed to request notification permissions:', error)
		return false
	}
}

const createNotificationChannel = async () => {
	try {
		await Notifications.setNotificationChannelAsync('media-controls', {
			name: 'Media Controls',
			description: 'Music playback controls',
			importance: Notifications.AndroidImportance.HIGH,
			sound: null,
			vibrationPattern: [0, 150, 150],
			lightColor: '#1DB954',
			lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
			showBadge: false,
			enableLights: true,
			enableVibrate: true,
		})
	} catch (error) {
		console.error('Failed to create notification channel:', error)
	}
}

const initialize = async () => {
	try {
		const hasPermission = await requestPermissions()
		if (!hasPermission) return false

		await setupNotificationCategories()
		await createNotificationChannel()

		return true
	} catch (error) {
		console.error('Failed to initialize notification service:', error)
		return false
	}
}

export const NotificationService = {
	initialize,
	showOrUpdateMediaNotification,
	hideMediaNotification,
	setupNotificationCategories,
	requestPermissions,
	createNotificationChannel,
}
