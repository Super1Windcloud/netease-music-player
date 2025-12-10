import type { Track } from '@/lib/expo-track-player'

export const trackTitleFilter = (title: string) => (track: Track) =>
	track.title?.toLowerCase().includes(title.toLowerCase())

export const albumNameFilter = (name: string) => (album: { name: string }) =>
	album.name.toLowerCase().includes(name.toLowerCase())
