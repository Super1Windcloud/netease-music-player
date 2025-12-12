import {
	type AudioPlayer,
	type AudioStatus,
	createAudioPlayer,
	setAudioModeAsync,
} from "expo-audio";
import { useEffect, useSyncExternalStore } from "react";

export type Track = {
	id?: string | number;
	url: string;
	title?: string;
	artist?: string;
	album?: string;
	artwork?: string;
	rating?: number;
};

export enum RepeatMode {
	Off = "off",
	Track = "track",
	Queue = "queue",
}

export enum State {
	None = "none",
	Ready = "ready",
	Playing = "playing",
	Paused = "paused",
	Stopped = "stopped",
}

export enum Event {
	PlaybackState = "playback-state",
	PlaybackError = "playback-error",
	PlaybackActiveTrackChanged = "playback-track-changed",
	RemotePlay = "remote-play",
	RemotePause = "remote-pause",
	RemoteStop = "remote-stop",
	RemoteNext = "remote-next",
	RemotePrevious = "remote-previous",
}

export enum Capability {
	Play = "play",
	Pause = "pause",
	SkipToNext = "skip-to-next",
	SkipToPrevious = "skip-to-previous",
	Stop = "stop",
}

export enum RatingType {
	Heart = "heart",
}

type PlaybackStateEvent = { type: Event.PlaybackState; state: State };
type PlaybackErrorEvent = { type: Event.PlaybackError; error: unknown };
type ActiveTrackChangedEvent = { type: Event.PlaybackActiveTrackChanged; index: number | null };
type PlayerEvent = PlaybackStateEvent | PlaybackErrorEvent | ActiveTrackChangedEvent;

type PlayerState = {
	queue: Track[];
	currentIndex: number | null;
	isPlaying: boolean;
	position: number;
	duration: number;
	volume: number;
	repeatMode: RepeatMode;
};

let state: PlayerState = {
	queue: [],
	currentIndex: null,
	isPlaying: false,
	position: 0,
	duration: 0,
	volume: 0.3,
	repeatMode: RepeatMode.Queue,
};

let player: AudioPlayer | null = null;
let statusSubscription: { remove: () => void } | null = null;

const stateListeners = new Set<() => void>();
const eventListeners: Partial<Record<Event, Set<(event: PlayerEvent) => void>>> = {};

const notifyStateListeners = () => {
	stateListeners.forEach((listener) => {
		listener();
	});
};

const subscribeState = (listener: () => void) => {
	stateListeners.add(listener);
	return () => stateListeners.delete(listener);
};

const getStateSnapshot = () => state;

const setState = (partial: Partial<PlayerState>) => {
	state = { ...state, ...partial };
	notifyStateListeners();
};

const getEventListeners = (event: Event) => {
	if (!eventListeners[event]) {
		eventListeners[event] = new Set();
	}
	return eventListeners[event] as Set<(event: PlayerEvent) => void>;
};

const emitEvent = (event: PlayerEvent) => {
	getEventListeners(event.type).forEach((listener) => {
		listener(event);
	});
};

const ensureAudioMode = async () => {
	await setAudioModeAsync({
		playsInSilentMode: true,
		shouldPlayInBackground: true,
		interruptionMode: "mixWithOthers",
		interruptionModeAndroid: "duckOthers",
		allowsRecording: false,
	});
};

const updateFromStatus = (status: AudioStatus) => {
	const duration = status.duration ?? state.duration;
	const position = status.currentTime ?? 0;

	setState({
		duration,
		position,
		isPlaying: status.playing,
	});

	emitEvent({
		type: Event.PlaybackState,
		state: status.playing ? State.Playing : State.Paused,
	});
};

const handleTrackEnd = async () => {
	const { repeatMode, queue, currentIndex } = state;

	if (currentIndex == null) return;

	if (repeatMode === RepeatMode.Track) {
		await player?.seekTo(0);
		player?.play();
		return;
	}

	const nextIndex = currentIndex + 1;
	const hasNext = nextIndex < queue.length;

	if (hasNext) {
		await skipToIndex(nextIndex, true);
		return;
	}

	if (repeatMode === RepeatMode.Queue && queue.length > 0) {
		await skipToIndex(0, true);
		return;
	}

	setState({ isPlaying: false, position: state.duration });
};

const onStatusUpdate = (status: AudioStatus) => {
	if (!status.isLoaded) return;

	updateFromStatus(status);

	if (status.didJustFinish) {
		handleTrackEnd();
	}
};

const attachStatusListener = () => {
	statusSubscription?.remove();
	if (!player) return;

	statusSubscription = player.addListener("playbackStatusUpdate", onStatusUpdate);
};

const disposePlayer = () => {
	statusSubscription?.remove();
	statusSubscription = null;

	player?.remove();
	player = null;
};

const loadTrack = async (index: number) => {
	const { queue, volume, repeatMode } = state;
	const track = queue[index];

	if (!track) return;

	if (!player) {
		player = createAudioPlayer({ uri: track.url }, { keepAudioSessionActive: true });
	} else {
		player.replace({ uri: track.url });
	}

	player.volume = volume;
	player.loop = repeatMode === RepeatMode.Track;
	attachStatusListener();

	setState({
		currentIndex: index,
		duration: player.duration ?? 0,
		position: player.currentTime ?? 0,
	});

	emitEvent({ type: Event.PlaybackActiveTrackChanged, index });
};

const skipToIndex = async (index: number, autoPlay?: boolean) => {
	const { queue, isPlaying } = state;

	if (index < 0 || index >= queue.length) return;

	const shouldPlay = autoPlay ?? isPlaying;

	await loadTrack(index);

	if (shouldPlay) {
		await play();
	} else {
		setState({ isPlaying: false, position: 0 });
	}
};

export const setupPlayer = async (_options?: { maxCacheSize?: number }) => {
	await ensureAudioMode();
};

export const updateOptions = async (_options: {
	ratingType?: RatingType;
	capabilities?: Capability[];
}) => {
	return Promise.resolve();
};

export const registerPlaybackService = (_factory: () => Promise<void> | void) => undefined;

export const addEventListener = (event: Event, listener: (event: PlayerEvent) => void) => {
	const listeners = getEventListeners(event);
	listeners.add(listener);

	return {
		remove: () => listeners.delete(listener),
	};
};

export const useTrackPlayerEvents = (events: Event[], callback: (event: PlayerEvent) => void) => {
	useEffect(() => {
		const removers = events.map((event) => addEventListener(event, callback));

		return () => {
			removers.forEach((remover) => {
				remover.remove();
			});
		};
	}, [events, callback]);
};

export const setQueue = async (tracks: Track[]) => {
	setState({
		queue: tracks,
		currentIndex: tracks.length ? 0 : null,
		position: 0,
		duration: 0,
		isPlaying: false,
	});

	if (!tracks.length) {
		disposePlayer();
		return;
	}

	await loadTrack(0);
};

export const reset = async () => {
	disposePlayer();

	setState({
		queue: [],
		currentIndex: null,
		isPlaying: false,
		position: 0,
		duration: 0,
	});
};

export const add = async (tracks: Track | Track[]) => {
	const tracksToAdd = Array.isArray(tracks) ? tracks : [tracks];
	const nextQueue = [...state.queue, ...tracksToAdd];

	setState({ queue: nextQueue });

	if (state.currentIndex == null && nextQueue.length > 0) {
		await loadTrack(0);
	}
};

export const getQueue = async () => state.queue;

export const remove = async (index: number) => {
	const { queue, currentIndex } = state;

	if (index < 0 || index >= queue.length) return;

	const nextQueue = queue.filter((_, idx) => idx !== index);
	let nextIndex: number | null = currentIndex;

	if (currentIndex != null) {
		if (index === currentIndex) {
			nextIndex = nextQueue.length ? Math.min(index, nextQueue.length - 1) : null;
		} else if (index < currentIndex) {
			nextIndex = currentIndex - 1;
		}
	}

	setState({ queue: nextQueue, currentIndex: nextIndex });

	if (index === currentIndex) {
		if (nextIndex != null) {
			await loadTrack(nextIndex);
		} else {
			disposePlayer();
		}
	}
};

export const play = async () => {
	if (!state.queue.length) return;

	await ensureAudioMode();

	if (state.currentIndex == null) {
		await loadTrack(0);
	}

	player?.play();

	setState({ isPlaying: true });
	emitEvent({ type: Event.PlaybackState, state: State.Playing });
};

export const pause = async () => {
	player?.pause();

	setState({ isPlaying: false });
	emitEvent({ type: Event.PlaybackState, state: State.Paused });
};

export const stop = async () => {
	player?.pause();
	await player?.seekTo(0);

	setState({ isPlaying: false, position: 0 });
	emitEvent({ type: Event.PlaybackState, state: State.Stopped });
};

export const skip = async (index: number) => skipToIndex(index);

export const skipToNext = async () => {
	if (!state.queue.length || state.currentIndex == null) return;
	const nextIndex = (state.currentIndex + 1) % state.queue.length;
	await skipToIndex(nextIndex);
};

export const skipToPrevious = async () => {
	if (!state.queue.length || state.currentIndex == null) return;
	const nextIndex = state.currentIndex - 1 < 0 ? state.queue.length - 1 : state.currentIndex - 1;
	await skipToIndex(nextIndex);
};

export const seekTo = async (seconds: number) => {
	if (!player) return;

	await player.seekTo(seconds);
	setState({ position: seconds });
};

export const setVolume = async (volume: number) => {
	if (volume < 0 || volume > 1) return;

	setState({ volume });

	if (player) {
		player.volume = volume;
	}
};

export const getVolume = async () => state.volume;

export const setRepeatMode = async (repeatMode: RepeatMode) => {
	setState({ repeatMode });

	if (player) {
		player.loop = repeatMode === RepeatMode.Track;
	}
};

export const getRepeatMode = async () => state.repeatMode;

export const updateMetadataForTrack = async (index: number, metadata: Partial<Track>) => {
	const { queue } = state;

	if (index < 0 || index >= queue.length) return;

	const nextQueue = queue.map((track, idx) => (idx === index ? { ...track, ...metadata } : track));

	setState({ queue: nextQueue });
};

export const getActiveTrack = async () => {
	const { currentIndex, queue } = state;
	if (currentIndex == null) return null;
	return queue[currentIndex];
};

export const getActiveTrackIndex = async () => state.currentIndex;

const usePlayerStore = <T>(selector: (state: PlayerState) => T) => {
	const snapshot = useSyncExternalStore(subscribeState, getStateSnapshot, getStateSnapshot);
	return selector(snapshot);
};

export const useActiveTrack = () =>
	usePlayerStore((playerState) => {
		const { currentIndex, queue } = playerState;
		if (currentIndex == null) return null;
		return queue[currentIndex] ?? null;
	});

export const useIsPlaying = () =>
	usePlayerStore((playerState) => ({
		playing: playerState.isPlaying,
	}));

export const useProgress = (_updateInterval = 1000) =>
	usePlayerStore((playerState) => ({
		position: playerState.position,
		duration: playerState.duration,
		buffered: playerState.duration,
	}));

const TrackPlayer = {
	setupPlayer,
	updateOptions,
	registerPlaybackService,
	addEventListener,
	useTrackPlayerEvents,
	setQueue,
	reset,
	add,
	getQueue,
	remove,
	play,
	pause,
	stop,
	skip,
	skipToNext,
	skipToPrevious,
	seekTo,
	setVolume,
	getVolume,
	setRepeatMode,
	getRepeatMode,
	updateMetadataForTrack,
	getActiveTrack,
	getActiveTrackIndex,
};

export default TrackPlayer;
