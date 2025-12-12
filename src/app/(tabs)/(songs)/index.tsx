import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { TracksList } from "@/components/TracksList";
import { screenPadding } from "@/constants/tokens";
import { trackTitleFilter } from "@/helpers/filter";
import { generateTracksListId } from "@/helpers/miscellaneous";
import { useStrings } from "@/hooks/useStrings";
import { useTheme } from "@/hooks/useTheme";
import { useEnsureLibraryLoaded, useLibraryStatus, useTracks } from "@/store/library";
import { useThemeStyles } from "@/styles";

const SongsScreen = () => {
	const { colors, theme } = useTheme();
	const { defaultStyles } = useThemeStyles();
	const { t } = useStrings();
	const [search, setSearch] = useState("");

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

	if (status === "loading" || status === "idle") {
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
						{error && (
							<Text style={{ ...defaultStyles.text, color: colors.textMuted, marginBottom: 12 }}>
								{error}
							</Text>
						)}
						<TracksList
							id={generateTracksListId("songs", search)}
							tracks={filteredTracks}
							scrollEnabled={false}
						/>
					</ScrollView>
				</View>
			</SafeAreaView>
		</View>
	);
};

export default SongsScreen;
