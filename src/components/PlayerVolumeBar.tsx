import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, type LayoutChangeEvent, View, type ViewProps } from "react-native";
import { useTrackPlayerVolume } from "@/hooks/useTrackPlayerVolume";
import { useThemeStyles } from "@/styles";

const SLIDER_HEIGHT = 36;
const DRAG_SCALE = 3;

export const PlayerVolumeBar = ({ style }: ViewProps) => {
	const { volume, updateVolume } = useTrackPlayerVolume();
	const { colors } = useThemeStyles();

	const [value, setValue] = useState(volume ?? 0);
	const [isSliding, setIsSliding] = useState(false);
	const [_trackWidth, setTrackWidth] = useState(0);
	const sliderScaleY = useRef(new Animated.Value(1)).current;

	useEffect(() => {
		setValue(volume ?? 0);
	}, [volume]);

	useEffect(() => {
		Animated.spring(sliderScaleY, {
			toValue: isSliding ? DRAG_SCALE : 1,
			useNativeDriver: true,
			friction: 10,
			tension: 80,
		}).start();
	}, [isSliding, sliderScaleY]);

	const handleLayout = useCallback((event: LayoutChangeEvent) => {
		setTrackWidth(event.nativeEvent.layout.width);
	}, []);

	const handleSlidingStart = useCallback(() => {
		setIsSliding(true);
	}, []);

	const handleValueChange = useCallback(
		(newValue: number) => {
			setValue(newValue);
			void updateVolume(newValue);
		},
		[updateVolume],
	);

	const handleSlidingComplete = useCallback(
		(finalValue: number) => {
			setIsSliding(false);
			void updateVolume(finalValue);
		},
		[updateVolume],
	);

	return (
		<View style={style}>
			<View style={{ flexDirection: "row", alignItems: "center" }}>
				<Ionicons name="volume-low" size={20} color={colors.icon} style={{ opacity: 0.8 }} />

				<View style={{ flex: 1, flexDirection: "row", paddingHorizontal: 10 }}>
					<View style={{ position: "relative", width: "100%", height: SLIDER_HEIGHT }}>
						<Animated.View style={{ transform: [{ scaleY: sliderScaleY }] }}>
							<Slider
								style={{ width: "100%", height: SLIDER_HEIGHT }}
								minimumValue={0}
								maximumValue={1}
								value={value}
								step={0}
								tapToSeek={true}
								minimumTrackTintColor={colors.minimumTrackTintColor}
								maximumTrackTintColor={colors.maximumTrackTintColor}
								thumbTintColor="transparent"
								onSlidingStart={handleSlidingStart}
								onValueChange={handleValueChange}
								onSlidingComplete={handleSlidingComplete}
								onLayout={handleLayout}
							/>
						</Animated.View>
					</View>
				</View>

				<Ionicons name="volume-high" size={20} color={colors.icon} style={{ opacity: 0.8 }} />
			</View>
		</View>
	);
};
