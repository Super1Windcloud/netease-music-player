import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { unknownTrackImageUri } from "@/constants/images";
import { screenPadding } from "@/constants/tokens";
import { formatSecondsToMinutes, generateTracksListId } from "@/helpers/miscellaneous";
import { useStrings } from "@/hooks/useStrings";
import { useTheme } from "@/hooks/useTheme";
import { type SongSearchResult, searchSongs } from "@/lib/appleSearch";
import TrackPlayer, { type Track } from "@/lib/expo-track-player";
import { useQueue } from "@/store/queue";
import { useThemeStyles } from "@/styles";

type ExploreState = {
	songs: SongSearchResult[];
	isLoading: boolean;
	error?: string;
};

const initialState: ExploreState = {
	songs: [],
	isLoading: false,
	error: undefined,
};

const formatPrice = (price?: number, currency?: string) => {
	if (price === undefined || price === null) return undefined;
	return `${currency ?? "$"}${price.toFixed(2)}`;
};

const mapSongToTrack = (song: SongSearchResult): Track | null => {
	if (!song.previewUrl) return null;

	return {
		id: song.id,
		url: song.previewUrl,
		title: song.name,
		artist: song.artistName,
		album: song.albumName,
		artwork: song.artworkUrl,
	};
};

const ExploreScreen = () => {
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const { t } = useStrings();
	const { theme } = useTheme();
	const themedStyles = useMemo(
		() => styles(colors, defaultStyles, utilsStyles),
		[colors, defaultStyles, utilsStyles],
	);

	const backgroundGradient = useMemo(
		() =>
			theme === "dark"
				? (["#0b1120", "#0a1020", colors.background] as const)
				: (["#f9fbff", "#eef4ff", colors.background] as const),
		[colors.background, theme],
	);

	const [search, setSearch] = useState("");

	const { activeQueueId, setActiveQueueId } = useQueue();
	const [state, setState] = useState<ExploreState>(initialState);
	const queueOffset = useRef(0);

	useEffect(() => {
		const keyword = search.trim();
		if (!keyword) {
			setState(initialState);
			return;
		}

		const abortController = new AbortController();

		setState((prev) => ({
			...prev,
			isLoading: true,
			error: undefined,
		}));

		const fetchResults = async () => {
			try {
				const songs = await searchSongs(keyword, abortController.signal);

				setState({
					songs: songs.filter((song) => Boolean(song.previewUrl)),
					isLoading: false,
					error: undefined,
				});
			} catch (error) {
				if (abortController.signal.aborted) return;

				const message = error instanceof Error ? error.message : "Something went wrong";
				setState((prev) => ({
					...prev,
					isLoading: false,
					error: message,
				}));
			}
		};

		fetchResults().then();

		return () => abortController.abort();
	}, [search]);

	const queueId = useMemo(() => generateTracksListId("explore", search.trim()), [search]);

	const playableTracks = useMemo(
		() => state.songs.map(mapSongToTrack).filter(Boolean) as Track[],
		[state.songs],
	);

	const handlePlaySong = useCallback(
		async (songId: number) => {
			const trackIndex = playableTracks.findIndex((track) => track.id === songId);

			if (trackIndex === -1) return;

			const isChangingQueue = queueId !== activeQueueId;

			if (isChangingQueue) {
				const beforeTracks = playableTracks.slice(0, trackIndex);
				const afterTracks = playableTracks.slice(trackIndex + 1);

				await TrackPlayer.reset();

				await TrackPlayer.add(playableTracks[trackIndex]);
				await TrackPlayer.add(afterTracks);
				await TrackPlayer.add(beforeTracks);

				await TrackPlayer.play();

				queueOffset.current = trackIndex;
				setActiveQueueId(queueId);
			} else {
				const nextTrackIndex =
					trackIndex - queueOffset.current < 0
						? playableTracks.length + trackIndex - queueOffset.current
						: trackIndex - queueOffset.current;

				await TrackPlayer.skip(nextTrackIndex);
				await TrackPlayer.play();
			}
		},
		[activeQueueId, playableTracks, queueId, setActiveQueueId],
	);

	const hasAnyResult = playableTracks.length > 0;

	const Section = ({ title, children }: { title: string; children: ReactNode }) => (
		<View style={themedStyles.section}>
			<Text style={themedStyles.sectionTitle}>{title}</Text>
			{children}
		</View>
	);

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
							paddingTop: 10,
							paddingBottom: 120,
						},
					]}
				>
					<GlowingSearchBar
						value={search}
						onChangeText={setSearch}
						placeholder={t.explore_search_placeholder}
						style={{ marginBottom: 14 }}
					/>
					<ScrollView contentInsetAdjustmentBehavior="automatic" style={{ flex: 1 }}>
						{!search.trim() && (
							<View style={themedStyles.placeholderContainer}>
								<Text style={themedStyles.placeholderTitle}>{t.explore_placeholder_title}</Text>
								<Text style={themedStyles.placeholderText}>{t.explore_placeholder_body}</Text>
							</View>
						)}

						{state.error && (
							<Text style={{ ...defaultStyles.text, color: colors.textMuted, marginBottom: 12 }}>
								{state.error}
							</Text>
						)}

						{state.isLoading && (
							<View style={[utilsStyles.centeredRow, { marginVertical: 12 }]}>
								<ActivityIndicator color={colors.primary} />
								<Text style={{ ...defaultStyles.text, marginLeft: 8, color: colors.textMuted }}>
									{t.explore_searching}
								</Text>
							</View>
						)}

						{hasAnyResult ? (
							<Section title={t.explore_songs_section}>
								{state.songs.map((song) => (
									<TouchableOpacity
										key={song.id}
										style={themedStyles.card}
										activeOpacity={0.85}
										onPress={() => handlePlaySong(song.id)}
									>
										<Image
											source={{
												uri: song.artworkUrl ?? unknownTrackImageUri,
											}}
											contentFit="cover"
											style={themedStyles.artwork}
										/>

										<View style={{ flex: 1 }}>
											<Text numberOfLines={1} style={themedStyles.primaryText}>
												{song.name}
											</Text>
											<Text numberOfLines={1} style={themedStyles.secondaryText}>
												{song.artistName}
											</Text>
											<Text numberOfLines={1} style={themedStyles.secondaryText}>
												{song.albumName ?? t.explore_unknown_album}
											</Text>

											<View style={themedStyles.metaRow}>
												{song.durationMs && (
													<View style={themedStyles.metaItem}>
														<Ionicons
															name="time-outline"
															color={colors.textMuted}
															size={14}
															style={{ marginRight: 4 }}
														/>
														<Text style={themedStyles.metaText}>
															{formatSecondsToMinutes(song.durationMs / 1000)}
														</Text>
													</View>
												)}
												{formatPrice(song.price, song.currency) && (
													<View style={themedStyles.metaItem}>
														<Ionicons
															name="pricetag-outline"
															color={colors.textMuted}
															size={14}
															style={{ marginRight: 4 }}
														/>
														<Text style={themedStyles.metaText}>
															{formatPrice(song.price, song.currency)}
														</Text>
													</View>
												)}
											</View>
										</View>

										{song.previewUrl && (
											<Ionicons name="play-circle" size={26} color={colors.primary} />
										)}
									</TouchableOpacity>
								))}

								{!state.isLoading && state.songs.length === 0 && (
									<Text style={utilsStyles.emptyContentText}>{t.explore_no_songs}</Text>
								)}
							</Section>
						) : (
							!state.isLoading &&
							search.trim() && <Text style={utilsStyles.emptyContentText}>{t.explore_no_results}</Text>
						)}
					</ScrollView>
				</View>
			</SafeAreaView>
		</View>
	);
};

const styles = (
	colors: ReturnType<typeof useThemeStyles>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"],
) =>
	StyleSheet.create({
		card: {
			...utilsStyles.glassCard,
			flexDirection: "row",
			columnGap: 12,
			alignItems: "center",
			paddingVertical: 12,
			paddingHorizontal: 12,
			borderRadius: 16,
			marginBottom: 12,
		},
		artwork: {
			borderRadius: 14,
			width: 68,
			height: 68,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		primaryText: {
			...defaultStyles.text,
			fontSize: 17,
			fontWeight: "700",
		},
		secondaryText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 14,
			marginTop: 2,
		},
		metaRow: {
			flexDirection: "row",
			gap: 12,
			marginTop: 6,
		},
		metaItem: {
			flexDirection: "row",
			alignItems: "center",
		},
		metaText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 13,
		},
		section: {
			marginTop: 18,
		},
		sectionTitle: {
			...defaultStyles.text,
			fontWeight: "700",
			fontSize: 18,
			marginBottom: 8,
		},
		placeholderContainer: {
			marginTop: 12,
			marginBottom: 8,
			rowGap: 6,
			padding: 14,
			borderRadius: 18,
			backgroundColor: colors.card,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		placeholderTitle: {
			...defaultStyles.text,
			fontSize: 20,
			fontWeight: "700",
		},
		placeholderText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 15,
			lineHeight: 22,
		},
	});

export default ExploreScreen;
