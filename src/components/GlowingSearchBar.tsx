import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef } from "react";
import {
	Animated,
	Easing,
	StyleSheet,
	TextInput,
	type StyleProp,
	type ViewStyle,
	View,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";

type GlowingSearchBarProps = {
	value: string;
	placeholder?: string;
	onChangeText: (text: string) => void;
	onSubmitEditing?: () => void;
	autoFocus?: boolean;
	style?: StyleProp<ViewStyle>;
};

const toRgba = (hexColor: string, alpha: number) => {
	const sanitized = hexColor.replace("#", "");

	const parse = (value: string) => Number.parseInt(value, 16);
	const [r, g, b] =
		sanitized.length === 3
			? [
					parse(sanitized[0] + sanitized[0]),
					parse(sanitized[1] + sanitized[1]),
					parse(sanitized[2] + sanitized[2]),
				]
			: [parse(sanitized.slice(0, 2)), parse(sanitized.slice(2, 4)), parse(sanitized.slice(4, 6))];

	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const GlowingSearchBar = ({
	value,
	placeholder,
	onChangeText,
	onSubmitEditing,
	autoFocus,
	style,
}: GlowingSearchBarProps) => {
	const { colors } = useTheme();
	const glow = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(glow, {
					toValue: 1,
					duration: 1600,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: false,
				}),
				Animated.timing(glow, {
					toValue: 0,
					duration: 1600,
					easing: Easing.inOut(Easing.ease),
					useNativeDriver: false,
				}),
			]),
		);

		loop.start();

		return () => loop.stop();
	}, [glow]);

	const animatedStyles = useMemo(
		() => ({
			shadowOpacity: glow.interpolate({
				inputRange: [0, 1],
				outputRange: [0.18, 0.4],
			}),
			shadowRadius: glow.interpolate({
				inputRange: [0, 1],
				outputRange: [8, 18],
			}),
			shadowColor: colors.primary,
		}),
		[colors.primary, glow],
	);

	const gradientColors = useMemo<[string, string, string]>(
		() => [toRgba(colors.primary, 0.9), toRgba(colors.primary, 0.35), toRgba(colors.primary, 0.9)],
		[colors.primary],
	);

	return (
		<Animated.View
			style={[
				styles.wrapper,
				{
					shadowOffset: { width: 0, height: 0 },
					elevation: 8,
				},
				animatedStyles,
				style,
			]}
		>
			<LinearGradient
				colors={gradientColors}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.gradient}
			>
				<View style={[styles.inner, { backgroundColor: colors.card, borderColor: colors.border }]}>
					<Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 10 }} />
					<TextInput
						value={value}
						onChangeText={onChangeText}
						placeholder={placeholder}
						placeholderTextColor={colors.textMuted}
						style={[styles.input, { color: colors.text }]}
						autoFocus={autoFocus}
						returnKeyType="search"
						autoCapitalize="none"
						clearButtonMode="while-editing"
						onSubmitEditing={onSubmitEditing}
						cursorColor={colors.primary}
					/>
				</View>
			</LinearGradient>
		</Animated.View>
	);
};

const styles = StyleSheet.create({
	wrapper: {
		borderRadius: 18,
		width: "100%",
	},
	gradient: {
		padding: 2,
		borderRadius: 18,
	},
	inner: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 14,
		paddingVertical: 12,
		borderRadius: 16,
		borderWidth: StyleSheet.hairlineWidth,
	},
	input: {
		flex: 1,
		fontSize: 16,
	},
});

export default GlowingSearchBar;
