import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View, type ViewProps } from "react-native";
import { PlayPauseButton, SkipToNextButton } from "@/components/PlayerControls";
import { unknownTrackImageUri } from "@/constants/images";
import { useLastActiveTrack } from "@/hooks/useLastActiveTrack";
import { useActiveTrack } from "@/lib/expo-track-player";
import { useThemeStyles } from "@/styles";
import { MovingText } from "./MovingText";

export const FloatingPlayer = ({ style }: ViewProps) => {
	const router = useRouter();
	const { defaultStyles, utilsStyles } = useThemeStyles();

	const themedStyles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					...utilsStyles.glassCard,
					flexDirection: "row",
					alignItems: "center",
					padding: 10,
					borderRadius: 18,
				},
				trackArtworkImage: {
					width: 46,
					height: 46,
					borderRadius: 12,
				},
				trackTitleContainer: {
					flex: 1,
					overflow: "hidden",
					marginLeft: 12,
				},
				trackTitle: {
					...defaultStyles.text,
					fontSize: 16,
					fontWeight: "700",
					paddingLeft: 4,
				},
				trackControlsContainer: {
					flexDirection: "row",
					alignItems: "center",
					columnGap: 16,
					marginRight: 10,
					paddingLeft: 12,
				},
			}),
		[defaultStyles.text, utilsStyles.glassCard],
	);

	const activeTrack = useActiveTrack();
	const lastActiveTrack = useLastActiveTrack();

	const displayedTrack = activeTrack ?? lastActiveTrack;

	const handlePress = () => {
		router.navigate("/player");
	};

	if (!displayedTrack) return null;

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.9}
			style={[themedStyles.container, style]}
		>
			<Image
				source={{
					uri: displayedTrack.artwork ?? unknownTrackImageUri,
				}}
				contentFit="cover"
				style={themedStyles.trackArtworkImage}
			/>

			<View style={themedStyles.trackTitleContainer}>
				<MovingText
					style={themedStyles.trackTitle}
					text={displayedTrack.title ?? ""}
					animationThreshold={25}
				/>
			</View>

			<View style={themedStyles.trackControlsContainer}>
				<PlayPauseButton iconSize={24} />
				<SkipToNextButton iconSize={22} />
			</View>
		</TouchableOpacity>
	);
};
