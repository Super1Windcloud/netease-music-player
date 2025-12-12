import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { View, type ViewProps } from "react-native";
import { Slider } from "react-native-awesome-slider";
import { useSharedValue } from "react-native-reanimated";
import { useTrackPlayerVolume } from "@/hooks/useTrackPlayerVolume";
import { useThemeStyles } from "@/styles";

export const PlayerVolumeBar = ({ style }: ViewProps) => {
	const { volume, updateVolume } = useTrackPlayerVolume();
	const { colors, utilsStyles } = useThemeStyles();

	const progress = useSharedValue(0);
	const min = useSharedValue(0);
	const max = useSharedValue(1);

	useEffect(() => {
		progress.value = volume ?? 0;
	}, [progress, volume]);

	return (
		<View style={style}>
			<View style={{ flexDirection: "row", alignItems: "center" }}>
				<Ionicons name="volume-low" size={20} color={colors.icon} style={{ opacity: 0.8 }} />

				<View style={{ flex: 1, flexDirection: "row", paddingHorizontal: 10 }}>
					<Slider
						progress={progress}
						minimumValue={min}
						containerStyle={utilsStyles.slider}
						onValueChange={(value) => {
							updateVolume(value);
						}}
						renderBubble={() => null}
						theme={{
							maximumTrackTintColor: colors.maximumTrackTintColor,
							minimumTrackTintColor: colors.minimumTrackTintColor,
						}}
						thumbWidth={0}
						maximumValue={max}
					/>
				</View>

				<Ionicons name="volume-high" size={20} color={colors.icon} style={{ opacity: 0.8 }} />
			</View>
		</View>
	);
};
