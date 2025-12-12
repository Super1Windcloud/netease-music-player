import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { generateTracksListId } from "@/helpers/miscellaneous";
import { useStrings } from "@/hooks/useStrings";
import { useTheme } from "@/hooks/useTheme";
import TrackPlayer, { type Track as PlayerTrack } from "@/lib/expo-track-player";
import { useQueue } from "@/store/queue";
import { useThemeStyles } from "@/styles";
import MusicAPI, { type Track as ApiTrack } from "../../../scripts/music";
import Ball from '@/components/utils/Ball'

type SectionKey = "recommend" | "favorites" | "recently";

type SectionState = {
	tracks: ApiTrack[];
	loading: boolean;
	error?: string;
};

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

const HomeScreen = () => {
	const scrollRef = useRef<ScrollView>(null);
	const sectionOffsets = useRef<Record<SectionKey, number>>({
		recommend: 0,
		favorites: 0,
		recently: 0,
	});
	const queueOffsets = useRef<Record<SectionKey, number>>({
		recommend: 0,
		favorites: 0,
		recently: 0,
	});

	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const { t } = useStrings();
	const { theme } = useTheme();
	const { activeQueueId, setActiveQueueId } = useQueue();

	const sectionConfigs = useMemo(
		() => ({
			recommend: {
				title: t.musicfeed_recommend_title,
				subtitle: t.musicfeed_recommend_subtitle,
				gradient: ["#99b8ff", "#cde5ff"] as const,
				icon: "sparkles-sharp" as const,
				fetchTracks: () => MusicAPI.getMadeForYou(),
				pill: t.home_section_recommend,
			},
			favorites: {
				title: t.musicfeed_favorites_title,
				subtitle: t.musicfeed_favorites_subtitle,
				gradient: ["#ffc8d8", "#f3d6ff"] as const,
				icon: "heart" as const,
				fetchTracks: () => MusicAPI.getPopularTracks(),
				pill: t.home_section_favorites,
			},
			recently: {
				title: t.musicfeed_recently_title,
				subtitle: t.musicfeed_recently_subtitle,
				gradient: ["#b8f0e5", "#d2e7ff"] as const,
				icon: "time" as const,
				fetchTracks: () => MusicAPI.getRecentlyPlayed(),
				pill: t.home_section_recent,
			},
		}),
		[t],
	);

	const [sections, setSections] = useState<Record<SectionKey, SectionState>>({
		recommend: { tracks: [], loading: true },
		favorites: { tracks: [], loading: true },
		recently: { tracks: [], loading: true },
	});
	const [playableTracks, setPlayableTracks] = useState<Record<SectionKey, PlayerTrack[]>>({
		recommend: [],
		favorites: [],
		recently: [],
	});
	const [refreshing, setRefreshing] = useState(false);

	const themedStyles = useMemo(
		() => styles(colors, defaultStyles, utilsStyles, theme),
		[colors, defaultStyles, theme, utilsStyles],
	);

	const backgroundGradient = useMemo(
		() =>
			theme === "dark"
				? (["#0a1020", "#0a1224", colors.background] as const)
				: (["#f9fbff", "#eef4ff", colors.background] as const),
		[colors.background, theme],
	);

	const hydratePlayableTracks = useCallback(async (key: SectionKey, tracks: ApiTrack[]) => {
		if (!tracks.length) {
			setPlayableTracks((prev) => ({ ...prev, [key]: [] }));
			return;
		}

		const hydrated = await Promise.all(tracks.map((track) => mapApiTrackToPlayerTrack(track)));
		setPlayableTracks((prev) => ({ ...prev, [key]: hydrated }));
	}, []);

	const loadSection = useCallback(
		async (key: SectionKey) => {
			setSections((prev) => ({
				...prev,
				[key]: {
					...prev[key],
					loading: true,
					error: undefined,
				},
			}));

			try {
				const tracks = await sectionConfigs[key].fetchTracks();
				setSections((prev) => ({
					...prev,
					[key]: {
						tracks,
						loading: false,
						error: undefined,
					},
				}));

				void hydratePlayableTracks(key, tracks);
			} catch (error) {
				const message = error instanceof Error ? error.message : t.musicfeed_error;
				setSections((prev) => ({
					...prev,
					[key]: {
						tracks: [],
						loading: false,
						error: message,
					},
				}));
			}
		},
		[hydratePlayableTracks, sectionConfigs, t],
	);

	const refreshAll = useCallback(async () => {
		setRefreshing(true);
		await Promise.all((Object.keys(sectionConfigs) as SectionKey[]).map((key) => loadSection(key)));
		setRefreshing(false);
	}, [loadSection, sectionConfigs]);

	useEffect(() => {
		refreshAll().then();
	}, [refreshAll]);

	const handlePlay = async (key: SectionKey, trackId: number) => {
		const tracks = playableTracks[key];
		if (!tracks.length) return;

		const trackIndex = tracks.findIndex((track) => track.id === trackId);
		if (trackIndex === -1) return;

		const queueId = generateTracksListId(key);
		const isChangingQueue = queueId !== activeQueueId;

		if (isChangingQueue) {
			const beforeTracks = tracks.slice(0, trackIndex);
			const afterTracks = tracks.slice(trackIndex + 1);

			await TrackPlayer.reset();

			await TrackPlayer.add(tracks[trackIndex]);
			await TrackPlayer.add(afterTracks);
			await TrackPlayer.add(beforeTracks);

			await TrackPlayer.play();

			queueOffsets.current[key] = trackIndex;
			setActiveQueueId(queueId);
		} else {
			const offset = queueOffsets.current[key] ?? 0;
			const nextTrackIndex =
				trackIndex - offset < 0 ? tracks.length + trackIndex - offset : trackIndex - offset;

			await TrackPlayer.skip(nextTrackIndex);
			await TrackPlayer.play();
		}
	};

	const scrollToSection = (key: SectionKey) => {
		const offset = sectionOffsets.current[key];
		if (offset == null) return;

		scrollRef.current?.scrollTo({ y: Math.max(offset - 30, 0), animated: true });
	};

	const renderTrackCard = (key: SectionKey, track: ApiTrack) => {
		const config = sectionConfigs[key];
		const badge = MusicAPI.getQualityBadge(track);

		return (
			<TouchableOpacity
				key={`${key}-${track.id}`}
				onPress={() => handlePlay(key, track.id)}
				activeOpacity={0.9}
				style={themedStyles.trackCard}
			>
				<View style={themedStyles.trackArtworkWrapper}>
					<Image
						source={{ uri: MusicAPI.getOptimalImage(track.images) }}
						style={themedStyles.trackArtwork}
						contentFit="cover"
					/>
					<LinearGradient colors={config.gradient} style={themedStyles.trackOverlay} />
					<View style={themedStyles.playBadge}>
						<Ionicons name="play" size={14} color={colors.background} />
					</View>
					{badge && (
						<View style={[themedStyles.qualityBadge, { backgroundColor: colors.card }]}>
							<Text style={themedStyles.qualityBadgeText}>{badge}</Text>
						</View>
					)}
				</View>

				<Text numberOfLines={1} style={themedStyles.trackTitle}>
					{track.title}
				</Text>
				<Text numberOfLines={1} style={themedStyles.trackArtist}>
					{track.artist}
				</Text>
				<Text numberOfLines={1} style={themedStyles.trackMeta}>
					{track.albumTitle} • {MusicAPI.formatDuration(Math.round(track.duration))}
				</Text>
			</TouchableOpacity>
		);
	};

	const renderSection = (key: SectionKey) => {
		const config = sectionConfigs[key];
		const section = sections[key];

		return (
			<View
				key={key}
				style={themedStyles.section}
				onLayout={(event) => {
					sectionOffsets.current[key] = event.nativeEvent.layout.y;
				}}
			>
				<View style={themedStyles.sectionHeader}>
					<View style={themedStyles.sectionTitleRow}>
						<LinearGradient colors={config.gradient} style={themedStyles.sectionBadge}>
							<Ionicons name={config.icon} size={16} color="#fff" />
						</LinearGradient>
						<View>
							<Text style={themedStyles.sectionTitle}>{config.title}</Text>
							<Text style={themedStyles.sectionSubtitle}>{config.subtitle}</Text>
						</View>
					</View>
					<TouchableOpacity
						onPress={() => loadSection(key)}
						disabled={section.loading}
						style={themedStyles.sectionAction}
						activeOpacity={0.8}
					>
						<Ionicons name="refresh" size={16} color={colors.text} />
						{/*<Text style={themedStyles.sectionActionText}>{t.home_refresh}</Text>*/}
					</TouchableOpacity>
				</View>

				{section.error && (
					<Text style={[themedStyles.noticeText, { color: colors.primary }]}>{section.error}</Text>
				)}

				{section.loading && !section.tracks.length ? (
					<View style={themedStyles.loadingRow}>
						<ActivityIndicator color={colors.primary} />
						<Text style={themedStyles.loadingText}>{t.musicfeed_loading}</Text>
					</View>
				) : null}

				{!section.loading && section.tracks.length === 0 && !section.error ? (
					<Text style={utilsStyles.emptyContentText}>{t.home_empty}</Text>
				) : (
					<View style={themedStyles.tracksGrid}>
						{section.tracks.slice(0, 8).map((track) => renderTrackCard(key, track))}
					</View>
				)}
			</View>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1 }} edges={["top"]}>
			<LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFillObject} />

			<ScrollView
				ref={scrollRef}
				contentInsetAdjustmentBehavior="automatic"
				style={[defaultStyles.container, { backgroundColor: "transparent" }]}
				contentContainerStyle={{ padding: 18, paddingBottom: 120, paddingTop: 12 }}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={refreshAll}
						tintColor={colors.primary}
						colors={[colors.primary]}
					/>
				}
			>
				<View style={[utilsStyles.glassCard, themedStyles.heroCard, { marginBottom: 16 }]}>
					<LinearGradient
						colors={["#0a84ff", "#7eb5ff"] as const}
						style={themedStyles.heroGradient}
					>
						<BlurView tint="dark" intensity={65} style={themedStyles.heroBlur} />
						<View style={themedStyles.heroHeader}>
							<View style={themedStyles.heroBadge}>
								<Ionicons name="musical-notes" size={16} color="#fff" />
								<Text style={themedStyles.heroBadgeText}>{t.tabs_recommend}</Text>
							</View>
							<Ionicons name="flash" size={18} color="rgba(255,255,255,0.8)" />
						</View>
						<Text style={themedStyles.heroTitle}>{t.home_title}</Text>
						<Text style={themedStyles.heroSubtitle}>{t.home_subtitle}</Text>
						<View style={themedStyles.heroFooter}>
							<View style={themedStyles.heroDot} />
							<Text style={themedStyles.heroFooterText}>
								{t.musicfeed_loading.replace("...", "")}
							</Text>
						</View>
					</LinearGradient>
				</View>

				<View style={themedStyles.quickActionsRow}>
					<TouchableOpacity
						onPress={() => scrollToSection("recommend")}
						activeOpacity={0.85}
						style={themedStyles.quickAction}
					>
						<LinearGradient
							colors={sectionConfigs.recommend.gradient}
							style={themedStyles.quickIcon}
						>
							<Ionicons name="sparkles-sharp" size={22} color="#fff" />
						</LinearGradient>
						<Text style={themedStyles.quickActionText}>{t.home_action_recommend}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => scrollToSection("favorites")}
						activeOpacity={0.85}
						style={themedStyles.quickAction}
					>
						<LinearGradient
							colors={sectionConfigs.favorites.gradient}
							style={themedStyles.quickIcon}
						>
							<Ionicons name="heart" size={20} color="#fff" />
						</LinearGradient>
						<Text style={themedStyles.quickActionText}>{t.home_action_favorites}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => scrollToSection("recently")}
						activeOpacity={0.85}
						style={themedStyles.quickAction}
					>
						<LinearGradient
							colors={sectionConfigs.recently.gradient}
							style={themedStyles.quickIcon}
						>
							<Ionicons name="time" size={20} color="#fff" />
						</LinearGradient>
						<Text style={themedStyles.quickActionText}>{t.home_action_recent}</Text>
					</TouchableOpacity>
				</View>

				{(Object.keys(sectionConfigs) as SectionKey[]).map((key) => renderSection(key))}
			</ScrollView>
		</SafeAreaView>
	);
};

const styles = (
	colors: ReturnType<typeof useThemeStyles>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"],
	theme: ReturnType<typeof useTheme>["theme"],
) =>
	StyleSheet.create({
		heroCard: {
			borderRadius: 22,
			padding: 1.5,
			overflow: "visible",
			backgroundColor: theme === "dark" ? "rgba(20,20,24,0.8)" : "rgba(255,255,255,0.92)",
		},
		heroGradient: {
			padding: 20,
			borderRadius: 20,
			overflow: "hidden",
			position: "relative",
		},
		heroBlur: {
			...StyleSheet.absoluteFillObject,
		},
		heroHeader: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		heroBadge: {
			...utilsStyles.pill,
			backgroundColor: "rgba(255,255,255,0.18)",
			borderColor: "rgba(255,255,255,0.2)",
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
		},
		heroBadgeText: {
			...defaultStyles.text,
			color: "#fff",
			fontSize: 12,
			fontWeight: "700",
		},
		heroTitle: {
			...defaultStyles.text,
			color: "#fff",
			fontSize: 24,
			fontWeight: "700",
			marginTop: 14,
		},
		heroSubtitle: {
			...defaultStyles.text,
			color: "rgba(255,255,255,0.8)",
			marginTop: 8,
			fontSize: 14,
			lineHeight: 22,
		},
		heroFooter: {
			marginTop: 16,
			flexDirection: "row",
			alignItems: "center",
			gap: 10,
		},
		heroDot: {
			width: 8,
			height: 8,
			borderRadius: 4,
			backgroundColor: "#fff",
		},
		heroFooterText: {
			...defaultStyles.text,
			color: "#fff",
			fontSize: 13,
			fontWeight: "600",
		},
		quickActionsRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			marginBottom: 14,
		},
		quickAction: {
			flex: 1,
			alignItems: "center",
			paddingVertical: 8,
		},
		quickIcon: {
			width: 52,
			height: 52,
			borderRadius: 26,
			alignItems: "center",
			justifyContent: "center",
			shadowColor: "#000",
			shadowOpacity: 0.12,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 4 },
		},
		quickActionText: {
			...defaultStyles.text,
			marginTop: 8,
			fontSize: 13,
			fontWeight: "600",
			textAlign: "center",
		},
		section: {
			marginTop: 14,
		},
		sectionHeader: {
			flexDirection: "row",
			alignItems: "center",
			justifyContent: "space-between",
		},
		sectionTitleRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 10,
		},
		sectionBadge: {
			width: 34,
			height: 34,
			borderRadius: 10,
			alignItems: "center",
			justifyContent: "center",
		},
		sectionTitle: {
			...defaultStyles.text,
			fontSize: 17,
			fontWeight: "800",
		},
		sectionSubtitle: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 13,
			marginTop: 2,
		},
		sectionAction: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			paddingVertical: 8,
			paddingHorizontal: 12,
			borderRadius: 999,
			backgroundColor: colors.card,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
		},
		sectionActionText: {
			...defaultStyles.text,
			fontSize: 12,
			fontWeight: "600",
		},
		tracksGrid: {
			flexDirection: "row",
			flexWrap: "wrap",
			justifyContent: "space-between",
			marginTop: 10,
		},
		trackCard: {
			width: "48%",
			marginBottom: 14,
			padding: 12,
			borderRadius: 16,
			overflow: "hidden",
			backgroundColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.65)",
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
			shadowColor: "#000",
			shadowOpacity: 0.05,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 8 },
		},
		trackArtworkWrapper: {
			position: "relative",
			borderRadius: 12,
			overflow: "hidden",
			marginBottom: 10,
		},
		trackArtwork: {
			width: "100%",
			height: 120,
			borderRadius: 12,
		},
		trackOverlay: {
			...StyleSheet.absoluteFillObject,
			opacity: 0.28,
		},
		playBadge: {
			position: "absolute",
			right: 8,
			bottom: 8,
			width: 26,
			height: 26,
			borderRadius: 13,
			backgroundColor: colors.primary,
			alignItems: "center",
			justifyContent: "center",
			shadowColor: colors.primary,
			shadowOpacity: 0.3,
			shadowRadius: 8,
			shadowOffset: { width: 0, height: 4 },
		},
		qualityBadge: {
			position: "absolute",
			left: 8,
			top: 8,
			paddingHorizontal: 8,
			paddingVertical: 4,
			borderRadius: 10,
		},
		qualityBadgeText: {
			...defaultStyles.text,
			fontSize: 11,
			fontWeight: "800",
		},
		trackTitle: {
			...defaultStyles.text,
			fontSize: 14,
			fontWeight: "700",
		},
		trackArtist: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 12,
			marginTop: 2,
		},
		trackMeta: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 11,
			marginTop: 4,
		},
		loadingRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
			marginTop: 12,
		},
		loadingText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 12,
		},
		noticeText: {
			...defaultStyles.text,
			marginTop: 10,
		},
	});

export default HomeScreen;
