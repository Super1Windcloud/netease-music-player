import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'

let isActive = false
const WAKELOCK_TAG = 'netease-music-player'

const activate = async () => {
	try {
		if (!isActive) {
			await activateKeepAwakeAsync(WAKELOCK_TAG)
			isActive = true
		}
	} catch (error) {
		console.error('Failed to activate wakelock:', error)
	}
}

const deactivate = async () => {
	try {
		if (isActive) {
			await deactivateKeepAwake(WAKELOCK_TAG)
			isActive = false
		}
	} catch (error) {
		console.error('Failed to deactivate wakelock:', error)
	}
}

const isWakelockActive = (): boolean => {
	return isActive
}

const toggle = async () => {
	if (isActive) {
		await deactivate()
	} else {
		await activate()
	}
}

export const WakelockService = {
	activate,
	deactivate,
	isWakelockActive,
	toggle,
}
