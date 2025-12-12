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
	const { colors, defaultStyles, utilsStyles } = useThemeStyles();
	const themedStyles = useMemo(
		() => styles(colors, defaultStyles, utilsStyles),
		[colors, defaultStyles, utilsStyles],
	);

	const isActiveTrack = useActiveTrack()?.url === track.url;

	return (
		<TouchableHighlight
			onPress={() => handleTrackSelect(track)}
			underlayColor={colors.border}
			style={themedStyles.touchable}
		>
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
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"],
) =>
	StyleSheet.create({
		touchable: {
			borderRadius: 16,
			overflow: "hidden",
		},
		trackItemContainer: {
			...utilsStyles.glassCard,
			flexDirection: "row",
			columnGap: 14,
			alignItems: "center",
			paddingRight: 18,
			paddingVertical: 10,
			borderRadius: 16,
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
			borderRadius: 12,
			width: 56,
			height: 56,
			borderWidth: StyleSheet.hairlineWidth,
			borderColor: colors.border,
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
