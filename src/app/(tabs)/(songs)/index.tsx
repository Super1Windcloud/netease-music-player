import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { TracksList } from "@/components/TracksList";
import { screenPadding } from "@/constants/tokens";
import { trackTitleFilter } from "@/helpers/filter";
import { generateTracksListId } from "@/helpers/miscellaneous";
import { useStrings } from "@/hooks/useStrings";
import { useTheme } from "@/hooks/useTheme";
import type { Track as PlayerTrack } from "@/lib/expo-track-player";
import { useEnsureLibraryLoaded, useLibraryStatus, useTracks } from "@/store/library";
import { useThemeStyles } from "@/styles";
import MusicAPI, { type Track as ApiTrack } from "../../../../scripts/music";

const mapApiTrackToPlayerTrack = async (track: ApiTrack): Promise<PlayerTrack> => {
	const fallbackUrl = MusicAPI.getTrackUrl(track);
	let streamUrl = fallbackUrl;

	try {
		streamUrl = await MusicAPI.getStreamUrl(String(track.id));
	} catch (error) {
		console.warn("Falling back to default stream URL", error);
	}

	return {
		id: track.id,
		url: streamUrl || fallbackUrl,
		title: track.title,
		artist: track.artist,
		album: track.albumTitle,
		artwork: MusicAPI.getOptimalImage(track.images),
	};
};

const SongsScreen = () => {
	const { colors, theme } = useTheme();
	const { defaultStyles } = useThemeStyles();
	const { t } = useStrings();
	const [search, setSearch] = useState("");
	const [searchResults, setSearchResults] = useState<PlayerTrack[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);

	useEnsureLibraryLoaded();
	const { status, error } = useLibraryStatus();
	const tracks = useTracks();

	const filteredTracks = useMemo(() => {
		if (!search) return tracks;

		return tracks.filter(trackTitleFilter(search));
	}, [search, tracks]);

	const backgroundGradient = useMemo(
		() =>
			theme === "dark"
				? (["#0b1120", "#0a1020", colors.background] as const)
				: (["#f9fbff", "#eef4ff", colors.background] as const),
		[colors.background, theme],
	);

	const trimmedSearch = search.trim();
	const isSearching = trimmedSearch.length > 0;

	useEffect(() => {
		if (!isSearching) {
			setSearchResults([]);
			setSearchLoading(false);
			setSearchError(null);
			return;
		}

		let cancelled = false;
		const timeout = setTimeout(() => {
			setSearchLoading(true);
			setSearchError(null);

			(async () => {
				try {
					const response = await MusicAPI.search({ q: trimmedSearch, type: "track" });
					const hydrated = await Promise.all(
						response.tracks.slice(0, 25).map((track) => mapApiTrackToPlayerTrack(track)),
					);

					if (!cancelled) {
						setSearchResults(hydrated);
					}
				} catch (fetchError) {
					if (!cancelled) {
						setSearchError(fetchError instanceof Error ? fetchError.message : t.musicfeed_error);
					}
				} finally {
					if (!cancelled) {
						setSearchLoading(false);
					}
				}
			})();
		}, 250);

		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	}, [isSearching, trimmedSearch, t]);

	if (!isSearching && (status === "loading" || status === "idle")) {
		return (
			<View style={{ flex: 1 }}>
				<LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFillObject} />
				<View
					style={[
						defaultStyles.container,
						{ justifyContent: "center", backgroundColor: "transparent" },
					]}
				>
					<ActivityIndicator color={colors.primary} />
					<Text style={{ ...defaultStyles.text, marginTop: 12, color: colors.textMuted }}>
						{t.songs_loading}
					</Text>
				</View>
			</View>
		);
	}

	return (
		<View style={{ flex: 1 }}>
			<LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFillObject} />
			<SafeAreaView edges={["top"]} style={{ flex: 1 }}>
				<View
					style={[
						defaultStyles.container,
						{
							backgroundColor: "transparent",
							paddingHorizontal: screenPadding.horizontal,
							paddingTop: 12,
							paddingBottom: 32,
						},
					]}
				>
					<GlowingSearchBar
						value={search}
						onChangeText={setSearch}
						placeholder={t.songs_search_placeholder}
						style={{ marginBottom: 12 }}
					/>
					<ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1 }}>
						{isSearching && searchLoading && (
							<View style={{ alignItems: "center", marginVertical: 10 }}>
								<ActivityIndicator color={colors.primary} />
								<Text
									style={{
										...defaultStyles.text,
										color: colors.textMuted,
										marginTop: 6,
										fontSize: 13,
									}}
								>
									{t.musicfeed_loading}
								</Text>
							</View>
						)}

						{isSearching && searchError && (
							<Text
								style={{
									...defaultStyles.text,
									color: colors.textMuted,
									marginBottom: 12,
								}}
							>
								{searchError}
							</Text>
						)}

						{!isSearching && error && (
							<Text style={{ ...defaultStyles.text, color: colors.textMuted, marginBottom: 12 }}>
								{error}
							</Text>
						)}
						<TracksList
							id={
								isSearching
									? generateTracksListId("songs_search", trimmedSearch)
									: generateTracksListId("songs", search)
							}
							tracks={isSearching ? searchResults : filteredTracks}
							scrollEnabled={false}
						/>
					</ScrollView>
				</View>
			</SafeAreaView>
		</View>
	);
};

export default SongsScreen;
