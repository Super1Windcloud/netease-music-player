import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import library from '@/assets/data/library.json'
import { unknownTrackImageUri } from '@/constants/images'
import type { Album } from '@/helpers/types'
import type { Track } from '@/lib/expo-track-player'

interface LibraryState {
	tracks: Track[]
	status: 'idle' | 'loading' | 'ready' | 'error'
	error?: string
	loadFromDevice: () => Promise<void>
}

const fallbackTracks: Track[] = library.reduce<Track[]>((acc, track, index) => {
	const { playlist: _playlist, ...trackFields } = track as Partial<Track> & { playlist?: unknown }

	if (!trackFields.url) return acc

	acc.push({
		...trackFields,
		url: trackFields.url,
		id: trackFields.id ?? trackFields.url ?? index,
		artist: trackFields.artist ?? 'Unknown artist',
		album: trackFields.album ?? 'Unknown album',
		rating: trackFields.rating ?? 0,
	})

	return acc
}, [])

export const useLibraryStore = create<LibraryState>()((set) => ({
	tracks: fallbackTracks,
	status: 'ready',
	error: undefined,
	loadFromDevice: async () => {
		set({
			status: 'ready',
			error: undefined,
			tracks: fallbackTracks,
		})
	},
}))

export const useTracks = () => useLibraryStore((state) => state.tracks)

export const useLibraryStatus = () => {
	const status = useLibraryStore((state) => state.status)
	const error = useLibraryStore((state) => state.error)

	return { status, error }
}

export const useEnsureLibraryLoaded = () => {
	const loadFromDevice = useLibraryStore((state) => state.loadFromDevice)

	useEffect(() => {
		loadFromDevice().then()
	}, [loadFromDevice])
}

export const useAlbums = () => {
	const tracks = useLibraryStore((state) => state.tracks)

	return useMemo(() => {
		return tracks.reduce((acc, track) => {
			const albumName = track.album ?? 'Unknown album'
			const existingAlbum = acc.find((album) => album.name === albumName)

			if (existingAlbum) {
				existingAlbum.tracks.push(track)
			} else {
				acc.push({
					name: albumName,
					tracks: [track],
					artworkPreview: track.artwork ?? unknownTrackImageUri,
				})
			}

			return acc
		}, [] as Album[])
	}, [tracks])
}
