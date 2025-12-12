import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
	type ComponentProps,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
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
	type CuratedMoment = {
		title: string;
		subtitle: string;
		icon: IoniconName;
		gradient: readonly [string, string];
		query: string;
	};
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

	type IoniconName = ComponentProps<typeof Ionicons>["name"];

	const quickFilters = useMemo(
		() => ["chillhop", "sunset acoustic", "k-pop energy", "90s R&B", "piano focus"],
		[],
	);

	const curatedMoments = useMemo<CuratedMoment[]>(
		() => [
			{
				title: "Velvet Evenings",
				subtitle: "Late-night R&B and neon keys",
				icon: "moon" as IoniconName,
				gradient: theme === "dark" ? (["#0c1024", "#102044"] as const) : (["#e9f0ff", "#e8e3ff"] as const),
				query: "late night rnb",
			},
			{
				title: "Bloom & Focus",
				subtitle: "Piano, strings, and calm electronica",
				icon: "leaf" as IoniconName,
				gradient: theme === "dark" ? (["#0b1712", "#0f2e22"] as const) : (["#e7fff4", "#ebf5ff"] as const),
				query: "focus piano strings",
			},
			{
				title: "Pulse Run",
				subtitle: "Bold pop with crisp drums",
				icon: "flash" as IoniconName,
				gradient: theme === "dark" ? (["#1a0f1a", "#251027"] as const) : (["#ffe8f1", "#ffe7da"] as const),
				query: "energetic pop",
			},
		],
		[theme],
	);

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

	const applySearch = useCallback((value: string) => setSearch(value), []);

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
							paddingTop: 6,
							paddingBottom: 120,
						},
					]}
				>
					<GlowingSearchBar
						value={search}
						onChangeText={applySearch}
						placeholder={t.explore_search_placeholder}
						style={{ marginBottom: 14 }}
					/>
					<ScrollView
						contentInsetAdjustmentBehavior="automatic"
						style={{ flex: 1 }}
						contentContainerStyle={{ paddingBottom: 24 }}
						showsVerticalScrollIndicator={false}
					>
						<View style={themedStyles.heroCard}>
							<LinearGradient
								colors={
									theme === "dark"
										? ["rgba(90, 200, 250, 0.14)", "rgba(255, 255, 255, 0.04)"]
										: ["rgba(10, 132, 255, 0.16)", "rgba(255, 255, 255, 0.12)"]
								}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 1 }}
								style={StyleSheet.absoluteFillObject}
							/>
							<View style={themedStyles.heroBadge}>
								<Ionicons name="sparkles-outline" size={14} color={colors.primary} />
								<Text style={themedStyles.heroBadgeText}>{t.explore_placeholder_title}</Text>
							</View>
							<Text style={themedStyles.heroTitle}>{t.explore_placeholder_body}</Text>
							<Text style={themedStyles.heroSubtitle}>{t.explore_searching}</Text>

							<View style={themedStyles.heroActions}>
								<TouchableOpacity
									style={themedStyles.heroAction}
									activeOpacity={0.9}
									onPress={() => applySearch("editorial picks")}
								>
									<Ionicons name="shuffle" size={16} color={colors.text} />
									<Text style={themedStyles.heroActionText}>{t.explore_cta_surprise}</Text>
								</TouchableOpacity>
								<TouchableOpacity
									style={[themedStyles.heroAction, themedStyles.heroActionGhost]}
									activeOpacity={0.9}
									onPress={() => applySearch("calm focus")}
								>
									<Ionicons name="leaf-outline" size={16} color={colors.textMuted} />
									<Text style={themedStyles.heroActionGhostText}>{t.explore_cta_focus}</Text>
								</TouchableOpacity>
							</View>

							<View style={themedStyles.heroOrbs}>
								<View style={[themedStyles.heroOrb, { right: -12, top: -18 }]} />
								<View style={[themedStyles.heroOrb, { left: -16, bottom: -10, opacity: 0.24 }]} />
							</View>
						</View>

						{!search.trim() && (
							<>
								<View style={themedStyles.sectionHeader}>
									<Text style={themedStyles.sectionTitle}>{t.explore_quick_filters}</Text>
									<View style={themedStyles.sectionBadge}>
										<Ionicons name="radio-outline" size={14} color={colors.primary} />
										<Text style={themedStyles.sectionBadgeText}>{t.explore_songs_section}</Text>
									</View>
								</View>
								<ScrollView
									horizontal
									showsHorizontalScrollIndicator={false}
									contentContainerStyle={{ columnGap: 10, paddingVertical: 2 }}
								>
									{quickFilters.map((item) => (
										<TouchableOpacity
											key={item}
											style={themedStyles.quickChip}
											activeOpacity={0.88}
											onPress={() => applySearch(item)}
										>
											<Ionicons name="sparkles" size={14} color={colors.primary} />
											<Text style={themedStyles.quickChipText}>{item}</Text>
										</TouchableOpacity>
									))}
								</ScrollView>

								<Section title={t.explore_curated_title}>
									<Text style={themedStyles.sectionSubtitle}>{t.explore_curated_caption}</Text>
									<View style={themedStyles.spotlightGrid}>
										{curatedMoments.map((moment) => (
											<TouchableOpacity
												key={moment.title}
												activeOpacity={0.92}
												onPress={() => applySearch(moment.query)}
												style={{ flex: 1 }}
											>
												<LinearGradient
													colors={moment.gradient}
													start={{ x: 0, y: 0 }}
													end={{ x: 1, y: 1 }}
													style={themedStyles.spotlightCard}
												>
													<View style={themedStyles.spotlightIconRow}>
														<View style={themedStyles.spotlightIcon}>
															<Ionicons name={moment.icon} size={16} color={colors.text} />
														</View>
														<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
													</View>
													<Text style={themedStyles.spotlightTitle}>{moment.title}</Text>
													<Text style={themedStyles.spotlightSubtitle}>{moment.subtitle}</Text>
												</LinearGradient>
											</TouchableOpacity>
										))}
									</View>
								</Section>
							</>
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
										<View style={themedStyles.cardAccent} />
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
												<View style={themedStyles.metaBadge}>
													<Ionicons name="radio" color={colors.primary} size={12} />
													<Text style={themedStyles.metaBadgeText}>{t.explore_trending}</Text>
												</View>
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
							search.trim() && (
								<Text style={utilsStyles.emptyContentText}>{t.explore_no_results}</Text>
							)
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
			overflow: "hidden",
			borderColor: colors.border,
		},
		cardAccent: {
			position: "absolute",
			left: 0,
			top: 0,
			bottom: 0,
			width: 6,
			backgroundColor: colors.primary,
			opacity: 0.12,
		},
		artwork: {
			borderRadius: 14,
			width: 76,
			height: 76,
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
			gap: 10,
			marginTop: 10,
			alignItems: "center",
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
		sectionSubtitle: {
			...defaultStyles.text,
			color: colors.textMuted,
			marginBottom: 12,
			fontSize: 14,
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
		heroCard: {
			...utilsStyles.glassCard,
			padding: 18,
			borderRadius: 18,
			marginBottom: 16,
			overflow: "hidden",
		},
		heroBadge: {
			flexDirection: "row",
			alignItems: "center",
			alignSelf: "flex-start",
			paddingHorizontal: 10,
			paddingVertical: 6,
			borderRadius: 999,
			backgroundColor: colors.card,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
			marginBottom: 10,
		},
		heroBadgeText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 13,
			marginLeft: 6,
		},
		heroTitle: {
			...defaultStyles.text,
			fontSize: 22,
			fontWeight: "700",
		},
		heroSubtitle: {
			...defaultStyles.text,
			color: colors.textMuted,
			marginTop: 6,
		},
		heroActions: {
			flexDirection: "row",
			columnGap: 10,
			marginTop: 14,
		},
		heroAction: {
			flexDirection: "row",
			alignItems: "center",
			columnGap: 6,
			backgroundColor: colors.card,
			borderRadius: 12,
			paddingHorizontal: 12,
			paddingVertical: 10,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		heroActionText: {
			...defaultStyles.text,
			fontWeight: "700",
		},
		heroActionGhost: {
			backgroundColor: "transparent",
			borderColor: colors.border,
		},
		heroActionGhostText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontWeight: "600",
		},
		heroOrbs: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			pointerEvents: "none",
		},
		heroOrb: {
			position: "absolute",
			width: 180,
			height: 180,
			borderRadius: 999,
			backgroundColor: colors.primary,
			opacity: 0.12,
		},
		sectionHeader: {
			marginTop: 4,
			marginBottom: 10,
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		sectionBadge: {
			flexDirection: "row",
			alignItems: "center",
			backgroundColor: colors.card,
			paddingHorizontal: 12,
			paddingVertical: 6,
			borderRadius: 999,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		sectionBadgeText: {
			...defaultStyles.text,
			color: colors.textMuted,
			marginLeft: 6,
			fontSize: 13,
		},
		quickChip: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 14,
			paddingVertical: 8,
			borderRadius: 999,
			backgroundColor: colors.card,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		quickChipText: {
			...defaultStyles.text,
			fontSize: 14,
			marginLeft: 8,
		},
		spotlightGrid: {
			flexDirection: "row",
			columnGap: 12,
		},
		spotlightCard: {
			...utilsStyles.glassCard,
			padding: 14,
			borderRadius: 16,
			minHeight: 120,
			borderColor: "transparent",
		},
		spotlightIconRow: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		spotlightIcon: {
			width: 32,
			height: 32,
			borderRadius: 999,
			backgroundColor: colors.card,
			alignItems: "center",
			justifyContent: "center",
		},
		spotlightTitle: {
			...defaultStyles.text,
			fontWeight: "700",
			fontSize: 16,
			marginTop: 10,
		},
		spotlightSubtitle: {
			...defaultStyles.text,
			color: colors.textMuted,
			marginTop: 4,
			fontSize: 14,
		},
		metaBadge: {
			flexDirection: "row",
			alignItems: "center",
			paddingHorizontal: 10,
			paddingVertical: 5,
			borderRadius: 999,
			backgroundColor: colors.card,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		metaBadgeText: {
			...defaultStyles.text,
			fontSize: 12,
			color: colors.textMuted,
			marginLeft: 6,
		},
	});

export default ExploreScreen;
