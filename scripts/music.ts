import axios, { type AxiosResponse } from "axios";
export interface Track {
	id: number;
	title: string;
	artist: string;
	artistId: number;
	albumTitle: string;
	albumCover: string;
	albumId: string;
	releaseDate: string;
	genre: string;
	duration: number;
	audioQuality: {
		maximumBitDepth: number;
		maximumSamplingRate: number;
		isHiRes: boolean;
	};
	version: string | null;
	label: string;
	labelId: number;
	upc: string;
	mediaCount: number;
	parental_warning: boolean;
	streamable: boolean;
	purchasable: boolean;
	previewable: boolean;
	genreId: number;
	genreSlug: string;
	genreColor: string;
	releaseDateStream: string;
	releaseDateDownload: string;
	maximumChannelCount: number;
	images: {
		small: string;
		thumbnail: string;
		large: string;
		back: string | null;
	};
	isrc: string;
}

export interface SearchResponse {
	tracks: Track[];
	pagination: {
		offset: number;
		total: number;
		hasMore: boolean;
	};
}

export interface SearchParams {
	q: string;
	offset?: number;
	type?: "track" | "album" | "artist";
}
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://dabmusic.xyz/api";

const apiClient = axios.create({
	baseURL: "https://dab.yeet.su/api",
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:146.0) Gecko/20100101 Firefox/146.0",
		Accept: "*/*",
		Referer: "https://dab.yeet.su/",
		"X-KL-kfa-Ajax-Request": "Ajax_Request",
		"Accept-Language": "zh-CN,zh;q=0.8",
		"Accept-Encoding": "gzip, deflate, br",
		// 🔴 核心
		Cookie:
			"visitor_id=e46e9c01-f873-44cc-8604-18a36558ece5; cf_clearance=https://dab.yeet.su/api/search?q=sef%20&offset=0&type=track; session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDU0ODUsImlhdCI6MTc2NTUyMTMxMCwiZXhwIjoxNzY2MTI2MTEwfQ.f4SXNE6Upf9cZHPviljv_IchhWRz2l0IYVaFn9Ax9Rs",
	},
});

const searchCache = new Map<string, Promise<SearchResponse>>();
const streamCache = new Map<string, Promise<string>>();

const performSearch = async (searchParams: URLSearchParams): Promise<SearchResponse> => {
	try {
		const response: AxiosResponse<SearchResponse> = await apiClient.get(`/search?${searchParams}`);
		return response.data;
	} catch (error) {
		console.error("Search API error:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				`API request failed with status ${error.response?.status || "unknown"}: ${error.message}`,
			);
		}
		throw new Error("Search request failed");
	}
};

const search = async (params: SearchParams): Promise<SearchResponse> => {
	const { q, offset = 0, type = "track" } = params;

	const searchParams = new URLSearchParams({
		q,
		offset: offset.toString(),
		type,
	});

	const cacheKey = `search_${searchParams.toString()}`;

	if (searchCache.has(cacheKey)) {
		return searchCache.get(cacheKey) as Promise<SearchResponse>;
	}

	const requestPromise = performSearch(searchParams);

	searchCache.set(cacheKey, requestPromise);

	requestPromise.finally(() => {
		searchCache.delete(cacheKey);
	});

	return requestPromise;
};

const formatDuration = (seconds: number): string => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const getOptimalImage = (images: { small: string; thumbnail: string; large: string }): string => {
	return images.large || images.small || images.thumbnail;
};

const searchTracks = async (
	query: string,
	offset: number = 0,
	limit: number = 20,
): Promise<SearchResponse> => {
	try {
		const searchParams = new URLSearchParams({
			q: query,
			offset: offset.toString(),
			type: "track",
			limit: limit.toString(),
		});

		const response: AxiosResponse<SearchResponse> = await apiClient.get(`/search?${searchParams}`);
		return response.data;
	} catch (error) {
		console.error("Search error:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				`HTTP error! status: ${error.response?.status || "unknown"}: ${error.message}`,
			);
		}
		throw error;
	}
};

const performStreamRequest = async (trackId: string): Promise<string> => {
	try {
		const response: AxiosResponse<{ url: string }> = await apiClient.get(
			`/stream?trackId=${trackId}`,
			{
				timeout: 15000,
			},
		);

		if (!response.data.url) {
			throw new Error("No stream URL received");
		}

		return response.data.url;
	} catch (error) {
		console.error("Stream URL error:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				`Stream request failed with status ${error.response?.status || "unknown"}: ${error.message}`,
			);
		}
		throw error;
	}
};

const getStreamUrl = async (trackId: string): Promise<string> => {
	const fallbackUrl = getTrackUrl({ id: Number(trackId) } as Track);
	const cacheKey = `stream_${trackId}`;

	if (streamCache.has(cacheKey)) {
		return streamCache.get(cacheKey) as Promise<string>;
	}

	const requestPromise = (async () => {
		try {
			return await performStreamRequest(trackId);
		} catch (error) {
			console.warn("Stream request failed, using fallback", error);
			return fallbackUrl;
		}
	})();

	streamCache.set(cacheKey, requestPromise);

	requestPromise.finally(() => {
		streamCache.delete(cacheKey);
	});

	return requestPromise;
};

const getPopularTracks = async (): Promise<Track[]> => {
	try {
		const response = await search({ q: "popular", type: "track" });
		return response.tracks.slice(0, 10);
	} catch (error) {
		console.error("Error fetching popular tracks:", error);
		return [];
	}
};

const getRecentlyPlayed = async (): Promise<Track[]> => {
	try {
		const response = await search({ q: "latest", type: "track" });
		return response.tracks.slice(0, 10);
	} catch (error) {
		console.error("Error fetching recent tracks:", error);
		return [];
	}
};

const getMadeForYou = async (): Promise<Track[]> => {
	try {
		const response = await search({ q: "recommended", type: "track" });
		return response.tracks.slice(0, 10);
	} catch (error) {
		console.error("Error fetching made for you tracks:", error);
		return [];
	}
};

const getTrackUrl = (track: Track): string => {
	return `${API_BASE_URL}/stream/${track.id}`;
};

const isHighQuality = (track: Track): boolean => {
	return track.audioQuality.isHiRes || track.audioQuality.maximumBitDepth >= 24;
};

const getQualityBadge = (track: Track): string | null => {
	if (track.audioQuality.isHiRes) return "Hi-Res";
	if (track.audioQuality.maximumBitDepth >= 24) return "HD";
	return null;
};

const clearCache = (): void => {
	searchCache.clear();
	streamCache.clear();
};

const clearSearchCache = (): void => {
	searchCache.clear();
};

const clearStreamCache = (): void => {
	streamCache.clear();
};

export const MusicAPI = {
	search,
	searchTracks,
	getStreamUrl,
	getPopularTracks,
	getRecentlyPlayed,
	getMadeForYou,
	getTrackUrl,
	formatDuration,
	getOptimalImage,
	isHighQuality,
	getQualityBadge,
	clearCache,
	clearSearchCache,
	clearStreamCache,
};

export default MusicAPI;
