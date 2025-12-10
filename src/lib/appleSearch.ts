const APPLE_SEARCH_ENDPOINT = 'https://itunes.apple.com/search'

type AppleSearchResponse<T> = {
	resultCount: number
	results: T[]
}

type AppleSongResult = {
	trackId: number
	trackName: string
	artistName: string
	collectionName?: string
	collectionId?: number
	trackTimeMillis?: number
	trackPrice?: number
	currency?: string
	previewUrl?: string
	artworkUrl100?: string
	trackViewUrl?: string
	collectionViewUrl?: string
}

type AppleAlbumResult = {
	collectionId: number
	collectionName: string
	artistName: string
	releaseDate?: string
	artworkUrl100?: string
	trackCount?: number
	collectionPrice?: number
	currency?: string
	collectionViewUrl?: string
}

export type SongSearchResult = {
	id: number
	name: string
	artistName: string
	albumName?: string
	albumId?: number
	durationMs?: number
	price?: number
	currency?: string
	previewUrl?: string
	artworkUrl?: string
	viewUrl?: string
}

export type AlbumSearchResult = {
	id: number
	name: string
	artistName: string
	releaseDate?: string
	artworkUrl?: string
	trackCount?: number
	price?: number
	currency?: string
	viewUrl?: string
}

const upscaleArtwork = (url?: string, size = 200) => {
	if (!url) return undefined

	return url.replace(/\/(\d+)x(\d+)bb\.jpg/, `/${size}x${size}bb.jpg`)
}

const fetchAppleSearch = async <T>(
	params: Record<string, string | number>,
	signal?: AbortSignal,
) => {
	const searchParams = new URLSearchParams({
		media: 'music',
		...Object.fromEntries(Object.entries(params).map(([key, value]) => [key, String(value)])),
	})

	const response = await fetch(`${APPLE_SEARCH_ENDPOINT}?${searchParams.toString()}`, {
		signal,
	})

	if (!response.ok) {
		throw new Error('Unable to reach Apple Search API')
	}

	const data = (await response.json()) as AppleSearchResponse<T>
	return data.results
}

export const searchSongs = async (term: string, signal?: AbortSignal) => {
	const results = await fetchAppleSearch<AppleSongResult>(
		{
			term,
			entity: 'musicTrack',
			limit: 15,
		},
		signal,
	)

	return results.map<SongSearchResult>((track) => ({
		id: track.trackId,
		name: track.trackName,
		artistName: track.artistName,
		albumName: track.collectionName,
		albumId: track.collectionId,
		durationMs: track.trackTimeMillis,
		price: track.trackPrice,
		currency: track.currency,
		previewUrl: track.previewUrl,
		artworkUrl: upscaleArtwork(track.artworkUrl100, 400),
		viewUrl: track.trackViewUrl ?? track.collectionViewUrl,
	}))
}

export const searchAlbums = async (term: string, signal?: AbortSignal) => {
	const results = await fetchAppleSearch<AppleAlbumResult>(
		{
			term,
			entity: 'album',
			limit: 12,
		},
		signal,
	)

	return results.map<AlbumSearchResult>((album) => ({
		id: album.collectionId,
		name: album.collectionName,
		artistName: album.artistName,
		releaseDate: album.releaseDate,
		artworkUrl: upscaleArtwork(album.artworkUrl100, 400),
		trackCount: album.trackCount,
		price: album.collectionPrice,
		currency: album.currency,
		viewUrl: album.collectionViewUrl,
	}))
}
