import type { Track } from '@/lib/expo-track-player';

export type Album = {
	name: string;
	artworkPreview?: string;
	tracks: Track[];
};
