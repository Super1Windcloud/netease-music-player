import * as MediaLibrary from 'expo-media-library'
import { useEffect, useMemo } from 'react'
import { create } from 'zustand'
import library from '@/assets/data/library.json'
import { unknownTrackImageUri } from '@/constants/images'
import { Album } from '@/helpers/types'
import { Track } from '@/lib/expo-track-player'

interface LibraryState {
	tracks: Track[]
	status: 'idle' | 'loading' | 'ready' | 'error'
	error?: string
	loadFromDevice: () => Promise<void>
}

const fallbackTracks: Track[] = library.map((track, index) => {
	const { playlist: _playlist, ...trackFields } = track as Record<string, any>

	return {
		...trackFields,
		id: trackFields.id ?? trackFields.url ?? index,
		artist: trackFields.artist ?? 'Unknown artist',
		album: trackFields.album ?? 'Unknown album',
		rating: trackFields.rating ?? 0,
	}
})

const removeFileExtension = (name?: string) => {
	if (!name) return 'Unknown title'
	const withoutExtension = name.replace(/\.[^/.]+$/, '')
	return withoutExtension.length ? withoutExtension : name
}

const buildAlbumMap = async () => {
	const albums = await MediaLibrary.getAlbumsAsync({ includeSmartAlbums: true })
	return new Map(albums.map((album) => [album.id, album.title]))
}

const buildTracksFromAssets = async (): Promise<Track[]> => {
	const albumTitleMap = await buildAlbumMap()

	const tracks: Track[] = []
	let after: string | undefined

	do {
		const page = await MediaLibrary.getAssetsAsync({
			mediaType: MediaLibrary.MediaType.audio,
			first: 200,
			after,
		})

		page.assets.forEach((asset) => {
			const assetWithMetadata = asset as MediaLibrary.Asset & {
				artist?: string
				albumTitle?: string
			}

			const albumTitle =
				albumTitleMap.get(asset.albumId ?? '') ?? assetWithMetadata.albumTitle ?? 'Unknown album'

			tracks.push({
				id: asset.id,
				url: asset.uri,
				title: removeFileExtension(asset.filename),
				artist: assetWithMetadata.artist ?? 'Unknown artist',
				album: albumTitle,
				rating: 0,
			})
		})

		after = page.hasNextPage ? (page.endCursor ?? undefined) : undefined
	} while (after)

	return tracks
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
	tracks: fallbackTracks,
	status: 'idle',
	error: undefined,
	loadFromDevice: async () => {
		const { status } = get()
		if (status === 'loading' || status === 'ready') return

		set({ status: 'loading', error: undefined })

		try {
			const permission = await MediaLibrary.requestPermissionsAsync()

			if (!permission.granted) {
				set({
					status: 'error',
					error: 'Media library permission denied. Showing bundled demo tracks.',
					tracks: fallbackTracks,
				})
				return
			}

			const tracks = await buildTracksFromAssets()

			set({
				tracks: tracks.length ? tracks : fallbackTracks,
				status: 'ready',
			})
		} catch (error) {
			console.error(error)
			set({
				status: 'error',
				error: 'Failed to load local songs. Showing bundled demo tracks.',
				tracks: fallbackTracks,
			})
		}
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
		loadFromDevice()
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
