import { useEffect, useState } from 'react';
import { type Track, useActiveTrack } from '@/lib/expo-track-player';

export const useLastActiveTrack = () => {
	const activeTrack = useActiveTrack();
	const [lastActiveTrack, setLastActiveTrack] = useState<Track>();

	useEffect(() => {
		if (!activeTrack) return;

		setLastActiveTrack(activeTrack);
	}, [activeTrack]);

	return lastActiveTrack;
};
