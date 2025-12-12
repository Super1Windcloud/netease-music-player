import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableHighlight, View } from "react-native";
import { unknownTrackImageUri } from "@/constants/images";
import { fontSize } from "@/constants/tokens";
import { type Track, useActiveTrack, useIsPlaying } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";

export type TracksListItemProps = {
	track: Track;
	onTrackSelect: (track: Track) => void;
};

export const TracksListItem = ({
	track,
	onTrackSelect: handleTrackSelect,
}: TracksListItemProps) => {
	const { playing } = useIsPlaying();
	const { colors, defaultStyles } = useThemeStyles();
	const themedStyles = useMemo(() => styles(colors, defaultStyles), [colors, defaultStyles]);

	const isActiveTrack = useActiveTrack()?.url === track.url;

	return (
		<TouchableHighlight onPress={() => handleTrackSelect(track)}>
			<View style={themedStyles.trackItemContainer}>
				<View>
					<Image
						source={{
							uri: track.artwork ?? unknownTrackImageUri,
						}}
						priority={"normal"}
						contentFit="cover"
						style={{
							...themedStyles.trackArtworkImage,
							opacity: isActiveTrack ? 0.6 : 1,
						}}
					/>

					{isActiveTrack &&
						(playing ? (
							<ActivityIndicator
								style={themedStyles.trackPlayingIconIndicator}
								color={colors.icon}
								size="small"
							/>
						) : (
							<Ionicons
								style={themedStyles.trackPausedIndicator}
								name="play"
								size={24}
								color={colors.icon}
							/>
						))}
				</View>

				<View
					style={{
						flex: 1,
						flexDirection: "row",
						justifyContent: "flex-start",
						alignItems: "center",
					}}
				>
					{/* Track title + artist */}
					<View style={{ width: "100%" }}>
						<Text
							numberOfLines={1}
							style={{
								...themedStyles.trackTitleText,
								color: isActiveTrack ? colors.primary : colors.text,
							}}
						>
							{track.title}
						</Text>

						{track.artist && (
							<Text numberOfLines={1} style={themedStyles.trackArtistText}>
								{track.artist}
							</Text>
						)}
					</View>
				</View>
			</View>
		</TouchableHighlight>
	);
};

const styles = (
	colors: ReturnType<typeof useThemeStyles>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
) =>
	StyleSheet.create({
		trackItemContainer: {
			flexDirection: "row",
			columnGap: 14,
			alignItems: "center",
			paddingRight: 20,
		},
		trackPlayingIconIndicator: {
			position: "absolute",
			top: 18,
			left: 16,
			width: 16,
			height: 16,
		},
		trackPausedIndicator: {
			position: "absolute",
			top: 14,
			left: 14,
		},
		trackArtworkImage: {
			borderRadius: 8,
			width: 50,
			height: 50,
		},
		trackTitleText: {
			...defaultStyles.text,
			fontSize: fontSize.sm,
			fontWeight: "600",
			maxWidth: "90%",
		},
		trackArtistText: {
			...defaultStyles.text,
			color: colors.textMuted,
			fontSize: 14,
			marginTop: 4,
		},
	});
