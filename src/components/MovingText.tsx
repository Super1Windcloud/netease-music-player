import { useEffect, useState } from "react";
import { type StyleProp, type TextStyle, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withRepeat,
	withTiming,
} from "react-native-reanimated";

export type MovingTextProps = {
	text: string;
	animationThreshold: number;
	style?: StyleProp<TextStyle>;
	direction?: "ltr" | "rtl";
};

export const MovingText = ({
	text,
	animationThreshold,
	style,
	direction = "ltr",
}: MovingTextProps) => {
	const translateX = useSharedValue(0);
	const [containerWidth, setContainerWidth] = useState(0);
	const [measuredTextWidth, setMeasuredTextWidth] = useState(0);
	const overflowAmount = Math.max(measuredTextWidth - containerWidth, 0);
	const shouldAnimate = containerWidth > 0 && overflowAmount > animationThreshold;

	const travelDistance =
		measuredTextWidth && containerWidth ? overflowAmount : measuredTextWidth || text.length * 3;
	const isRTL = direction === "rtl";

	useEffect(() => {
		cancelAnimation(translateX);
		const start = 0;
		const target = isRTL ? -travelDistance : travelDistance;
		translateX.value = start;

		if (!shouldAnimate) return;

		translateX.value = withDelay(
			1000,
			withRepeat(
				withTiming(target, {
					duration: Math.max(6000, travelDistance * 14),
					easing: Easing.linear,
				}),
				-1,
				false,
			),
		);

		return () => {
			cancelAnimation(translateX);
			translateX.value = 0;
		};
	}, [translateX, shouldAnimate, travelDistance, isRTL]);

	const animatedStyle = useAnimatedStyle<TextStyle>(() => {
		return {
			transform: [{ translateX: translateX.value }],
		};
	});

	return (
		<View
			onLayout={(event) => {
				const width = event.nativeEvent.layout.width;
				if (width !== containerWidth) setContainerWidth(width);
			}}
			style={{ overflow: "hidden" }}
		>
			<Animated.Text
				numberOfLines={1}
				onLayout={(event) => {
					const width = event.nativeEvent.layout.width;
					if (width !== measuredTextWidth) setMeasuredTextWidth(width);
				}}
				style={[
					style,
					animatedStyle,
					shouldAnimate && {
						width: measuredTextWidth || undefined,
						// pad the leading edge so the first character stays visible when the animation starts
						paddingLeft: isRTL ? 0 : 16,
						paddingRight: isRTL ? 16 : 0,
					},
				]}
			>
				{text}
			</Animated.Text>
		</View>
	);
};
