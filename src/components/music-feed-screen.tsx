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
import { generateTracksListId } from "@/helpers/miscellaneous";
import { useStrings } from "@/hooks/useStrings";
import { useTheme } from "@/hooks/useTheme";
import TrackPlayer, { type Track as PlayerTrack } from "@/lib/expo-track-player";
import { useQueue } from "@/store/queue";
import { useThemeStyles } from "@/styles";
import MusicAPI, { type Track as ApiTrack } from "../../scripts/music";

export type MusicFeedConfig = {
	variant: "recommend" | "favorites" | "recently";
	headline: string;
	subtitle: string;
	gradient: readonly [string, string];
	icon: keyof typeof Ionicons.glyphMap;
	pillLabel: string;
	fetchTracks: () => Promise<ApiTrack[]>;
};

type FeedState = {
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

export const MusicFeedScreen = ({ config }: { config: MusicFeedConfig }) => {
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const { t } = useStrings();
	const { theme } = useTheme();
	const queueOffset = useRef(0);
	const { activeQueueId, setActiveQueueId } = useQueue();
	const queueId = useMemo(() => generateTracksListId(config.variant), [config.variant]);

	const [state, setState] = useState<FeedState>({
		tracks: [],
		loading: true,
		error: undefined,
	});
	const [playableTracks, setPlayableTracks] = useState<PlayerTrack[]>([]);
	const blurTint = theme === "dark" ? "dark" : "light";
	const themedStyles = useMemo(
		() => styles(colors, defaultStyles, theme),
		[colors, defaultStyles, theme],
	);
	const heroStatus = state.loading ? t.musicfeed_loading : config.pillLabel;
	const backgroundGradient = useMemo(() => {
		const [start, end] = config.gradient;
		const withAlpha = (hex: string, alpha: string) =>
			hex.startsWith("#") && hex.length === 7 ? `${hex}${alpha}` : hex;

		return [withAlpha(start, "2b"), withAlpha(end, "14"), colors.background] as const;
	}, [colors.background, config.gradient]);

	const hydratePlayableTracks = useCallback(async (tracks: ApiTrack[]) => {
		if (!tracks.length) {
			setPlayableTracks([]);
			return;
		}

		const hydrated = await Promise.all(tracks.map((track) => mapApiTrackToPlayerTrack(track)));
		setPlayableTracks(hydrated);
	}, []);

	const loadTracks = useCallback(async () => {
		setState((prev) => ({
			...prev,
			loading: true,
			error: undefined,
		}));

		try {
			const tracks = await config.fetchTracks();
			setState({
				tracks,
				loading: false,
				error: undefined,
			});

			void hydratePlayableTracks(tracks);
		} catch (error) {
			const message = error instanceof Error ? error.message : t.musicfeed_error;
			setState({
				tracks: [],
				loading: false,
				error: message,
			});
		}
	}, [config.fetchTracks, hydratePlayableTracks, t]);

	useEffect(() => {
		loadTracks().then();
	}, [loadTracks]);

	const handlePlay = async (trackId: number) => {
		if (!playableTracks.length) return;

		const trackIndex = playableTracks.findIndex((track) => track.id === trackId);
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
	};

	const renderTrackCard = (track: ApiTrack) => {
		const badge = MusicAPI.getQualityBadge(track);

		return (
			<TouchableOpacity
				key={track.id}
				onPress={() => handlePlay(track.id)}
				activeOpacity={0.9}
				style={themedStyles.card}
			>
				<BlurView tint={blurTint} intensity={35} style={themedStyles.cardBlur} />
				<View style={themedStyles.cardContent}>
					<View style={themedStyles.coverContainer}>
						<Image
							source={{ uri: MusicAPI.getOptimalImage(track.images) }}
							style={themedStyles.cover}
							contentFit="cover"
						/>
						<View style={themedStyles.playBadge}>
							<Ionicons name="play" size={16} color={colors.background} />
						</View>
					</View>

					<View style={{ flex: 1 }}>
						<View style={themedStyles.titleRow}>
							<Text numberOfLines={1} style={themedStyles.trackTitle}>
								{track.title}
							</Text>
							{badge && (
								<View style={[themedStyles.badge, { backgroundColor: colors.primary }]}>
									<Text style={themedStyles.badgeText}>{badge}</Text>
								</View>
							)}
						</View>
						<Text numberOfLines={1} style={themedStyles.trackArtist}>
							{track.artist}
						</Text>
						<View style={themedStyles.metaRow}>
							<Text numberOfLines={1} style={themedStyles.metaText}>
								{track.albumTitle}
							</Text>
							<Text style={themedStyles.metaDot}>•</Text>
							<Text style={themedStyles.metaText}>
								{MusicAPI.formatDuration(Math.round(track.duration))}
							</Text>
						</View>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={{ flex: 1 }}>
			<LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFillObject} />
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={[defaultStyles.container, { backgroundColor: "transparent" }]}
				contentContainerStyle={{ padding: 18, paddingBottom: 120 }}
				refreshControl={
					<RefreshControl
						refreshing={state.loading}
						onRefresh={loadTracks}
						tintColor={colors.primary}
						colors={[colors.primary]}
					/>
				}
			>
				<View style={themedStyles.heroCard}>
					<BlurView tint={blurTint} intensity={40} style={StyleSheet.absoluteFill} />
					<LinearGradient colors={config.gradient} style={themedStyles.heroGradient}>
						<View style={themedStyles.pill}>
							<Ionicons name={config.icon} size={16} color="#fff" />
							<Text style={themedStyles.pillText}>{config.pillLabel}</Text>
						</View>
						<Text style={themedStyles.heroTitle}>{config.headline}</Text>
						<Text style={themedStyles.heroSubtitle}>{config.subtitle}</Text>
						<View style={themedStyles.heroFooter}>
							<View style={themedStyles.heroDot} />
							<Text style={themedStyles.heroFooterText}>
								{state.tracks.length || 0} tracks • {heroStatus}
							</Text>
						</View>
					</LinearGradient>
				</View>

				{state.error && (
					<TouchableOpacity
						onPress={loadTracks}
						activeOpacity={0.8}
						style={[themedStyles.notice, { borderColor: colors.border }]}
					>
						<Text style={themedStyles.noticeText}>{state.error || t.musicfeed_error}</Text>
						<Text style={[themedStyles.noticeText, { color: colors.primary }]}>
							{t.musicfeed_retry}
						</Text>
					</TouchableOpacity>
				)}

				{state.loading && !state.tracks.length ? (
					<View style={[utilsStyles.centeredRow, { marginTop: 24 }]}>
						<ActivityIndicator color={colors.primary} />
						<Text style={{ ...defaultStyles.text, marginLeft: 10, color: colors.textMuted }}>
							{t.musicfeed_loading}
						</Text>
					</View>
				) : null}

				{!state.loading && state.tracks.length === 0 && !state.error ? (
					<Text style={utilsStyles.emptyContentText}>{t.musicfeed_empty}</Text>
				) : (
					<View style={{ marginTop: 12 }}>{state.tracks.map(renderTrackCard)}</View>
				)}
			</ScrollView>
		</View>
	);
};

const styles = (
	colors: ReturnType<typeof useThemeStyles>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
	theme: ReturnType<typeof useTheme>["theme"],
) =>
	StyleSheet.create({
		heroCard: {
			borderRadius: 18,
			overflow: "hidden",
			marginTop: 8,
			marginBottom: 14,
			shadowColor: "#000",
			shadowOpacity: 0.2,
			shadowRadius: 12,
			shadowOffset: { width: 0, height: 8 },
			elevation: 6,
			backgroundColor: theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.4)",
		},
		heroGradient: {
			padding: 18,
			borderRadius: 18,
			overflow: "hidden",
		},
		pill: {
			alignSelf: "flex-start",
			backgroundColor: "rgba(255,255,255,0.18)",
			paddingHorizontal: 10,
			paddingVertical: 6,
			borderRadius: 20,
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
		},
		pillText: {
			...defaultStyles.text,
			color: "#fff",
			fontWeight: "700",
			fontSize: 12,
		},
		heroTitle: {
			...defaultStyles.text,
			color: "#fff",
			fontSize: 22,
			fontWeight: "800",
			marginTop: 12,
		},
		heroSubtitle: {
			...defaultStyles.text,
			color: "rgba(255,255,255,0.82)",
			fontSize: 15,
			lineHeight: 22,
			marginTop: 6,
		},
		heroFooter: {
			marginTop: 14,
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
		},
		heroDot: {
			width: 8,
			height: 8,
			backgroundColor: "#fff",
			borderRadius: 4,
		},
		heroFooterText: {
			...defaultStyles.text,
			color: "rgba(255,255,255,0.9)",
			fontWeight: "600",
			fontSize: 13,
		},
		card: {
			borderRadius: 16,
			overflow: "hidden",
			marginBottom: 12,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
			backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)",
		},
		cardBlur: {
			...StyleSheet.absoluteFillObject,
		},
		cardContent: {
			padding: 12,
			flexDirection: "row",
			alignItems: "center",
			gap: 12,
		},
		coverContainer: {
			position: "relative",
		},
		cover: {
			width: 64,
			height: 64,
			borderRadius: 12,
		},
		playBadge: {
			position: "absolute",
			right: -6,
			bottom: -6,
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
		titleRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 8,
		},
		trackTitle: {
			...defaultStyles.text,
			fontSize: 16,
			fontWeight: "700",
			flex: 1,
		},
		trackArtist: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 13,
			marginTop: 2,
		},
		metaRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 6,
			marginTop: 6,
		},
		metaText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 12,
		},
		metaDot: {
			...defaultStyles.text,
			color: colors.textMuted,
		},
		badge: {
			paddingHorizontal: 8,
			paddingVertical: 4,
			borderRadius: 999,
		},
		badgeText: {
			...defaultStyles.text,
			fontSize: 11,
			fontWeight: "700",
			color: colors.background,
		},
		notice: {
			padding: 12,
			borderRadius: 12,
			borderWidth: StyleSheet.hairlineWidth,
			marginBottom: 10,
			backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.8)",
		},
		noticeText: {
			...defaultStyles.text,
			fontSize: 13,
		},
	});

export default MusicFeedScreen;
