import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import TrackPlayer, { type Track, useActiveTrack } from "@/lib/expo-track-player";

const LAST_ACTIVE_TRACK_STORAGE_KEY = "last-active-track";

export const useLastActiveTrack = () => {
	const activeTrack = useActiveTrack();
	const [lastActiveTrack, setLastActiveTrack] = useState<Track | null>(null);

	useEffect(() => {
		let isMounted = true;
		const restoreLastTrack = async () => {
			try {
				const rawValue = await AsyncStorage.getItem(LAST_ACTIVE_TRACK_STORAGE_KEY);
				if (!rawValue) return;

				const parsedTrack = JSON.parse(rawValue) as Track | null;
				if (!parsedTrack?.url) return;
				if (!isMounted) return;

				setLastActiveTrack(parsedTrack);

				const [active, queue] = await Promise.all([
					TrackPlayer.getActiveTrack(),
					TrackPlayer.getQueue(),
				]);

				if (active || queue.length > 0) return;

				await TrackPlayer.setQueue([parsedTrack]);
			} catch (error) {
				console.warn("Failed to restore last active track", error);
			}
		};

		restoreLastTrack().then();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (!activeTrack) return;

		setLastActiveTrack(activeTrack);
		AsyncStorage.setItem(LAST_ACTIVE_TRACK_STORAGE_KEY, JSON.stringify(activeTrack)).catch(() => {
			console.warn("Failed to persist last active track");
		});
	}, [activeTrack]);

	return lastActiveTrack;
};
