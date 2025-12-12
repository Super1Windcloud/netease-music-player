import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { type ReactNode, useMemo } from "react";
import {
	Linking,
	ScrollView,
	StyleSheet,
	Switch,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { type AccentColorName, accentColors, fontSize, screenPadding } from "@/constants/tokens";
import { useNavigationSearch } from "@/hooks/useNavigationSearch";
import { useStrings } from "@/hooks/useStrings";
import { useTheme } from "@/hooks/useTheme";
import {
	useAccentPreference,
	useLanguagePreference,
	useThemePreference,
} from "@/store/preferences";
import { useThemeStyles } from "@/styles";

type SettingOption<T extends string> = {
	value: T;
	label: string;
	helper?: string;
	color?: string;
};

const SettingsScreen = () => {
	const { colors, theme } = useTheme();
	const { defaultStyles, utilsStyles } = useThemeStyles();
	const { t } = useStrings();
	const themedStyles = useMemo(
		() => styles(colors, defaultStyles, utilsStyles),
		[colors, defaultStyles, utilsStyles],
	);
	const search = useNavigationSearch({
		searchBarOptions: {
			placeholder: t.settings_search_placeholder,
		},
	});

	const { value: language, setLanguage } = useLanguagePreference();
	const { value: themePreference, setTheme: setThemePreference } = useThemePreference();
	const { value: accentPreference, setAccentColor } = useAccentPreference();
	const openGithubProfile = () => {
		void Linking.openURL("https://github.com/Super1Windcloud");
	};

	const languageOptions: SettingOption<"system" | "en" | "zh">[] = useMemo(
		() => [
			{ value: "system", label: t.settings_follow_system },
			{ value: "en", label: t.settings_english },
			{ value: "zh", label: t.settings_chinese },
		],
		[t],
	);

	const accentOptions: SettingOption<AccentColorName>[] = useMemo(
		() => [
			{
				value: "appleMusic",
				label: t.settings_accent_apple_music,
				helper: t.settings_accent_apple_music_helper,
				color: accentColors.appleMusic,
			},
			{
				value: "oceanBlue",
				label: t.settings_accent_ocean_blue,
				helper: t.settings_accent_ocean_blue_helper,
				color: accentColors.oceanBlue,
			},
			{
				value: "mint",
				label: t.settings_accent_mint,
				helper: t.settings_accent_mint_helper,
				color: accentColors.mint,
			},
			{
				value: "sunset",
				label: t.settings_accent_sunset,
				helper: t.settings_accent_sunset_helper,
				color: accentColors.sunset,
			},
		],
		[t],
	);

	const themeOptions: SettingOption<"system" | "light" | "dark">[] = useMemo(
		() => [
			{ value: "system", label: t.settings_system_theme },
			{ value: "light", label: t.settings_light_theme },
			{ value: "dark", label: t.settings_dark_theme },
		],
		[t],
	);

	const aboutOptions: SettingOption<"github">[] = useMemo(
		() => [{ value: "github", label: t.settings_github, helper: t.settings_github_helper }],
		[t],
	);

	const filteredLanguageOptions = useFilteredOptions(languageOptions, search);
	const filteredThemeOptions = useFilteredOptions(themeOptions, search);
	const filteredAccentOptions = useFilteredOptions(accentOptions, search);
	const filteredAboutOptions = useFilteredOptions(aboutOptions, search);

	const backgroundGradient = useMemo(
		() =>
			theme === "dark"
				? (["#0b1120", "#0a1020", colors.background] as const)
				: (["#f9fbff", "#eef4ff", colors.background] as const),
		[colors.background, theme],
	);

	const noResults =
		search &&
		filteredLanguageOptions.length === 0 &&
		filteredThemeOptions.length === 0 &&
		filteredAccentOptions.length === 0 &&
		filteredAboutOptions.length === 0;
	const showLanguageSection = search.length === 0 || filteredLanguageOptions.length > 0;
	const showThemeSection = search.length === 0 || filteredThemeOptions.length > 0;
	const showAccentSection = search.length === 0 || filteredAccentOptions.length > 0;
	const showAboutSection = search.length === 0 || filteredAboutOptions.length > 0;

	return (
		<View style={{ flex: 1 }}>
			<LinearGradient colors={backgroundGradient} style={StyleSheet.absoluteFillObject} />

			<ScrollView
				style={[defaultStyles.container, { backgroundColor: "transparent" }]}
				contentInsetAdjustmentBehavior="automatic"
				contentContainerStyle={{
					paddingHorizontal: screenPadding.horizontal,
					paddingBottom: 32,
					paddingTop: 12,
				}}
			>
				{noResults && (
					<Text
						style={{
							...defaultStyles.text,
							color: colors.textMuted,
							marginTop: 20,
						}}
					>
						{t.settings_no_results}
					</Text>
				)}

				{showLanguageSection && (
					<SettingsSection
						title={t.settings_language}
						description={t.settings_language_description}
						themedStyles={themedStyles}
					>
						{filteredLanguageOptions.map((option) => (
							<SettingRow
								key={option.value}
								label={option.label}
								helper={option.helper}
								selected={language === option.value}
								onPress={() => setLanguage(option.value)}
								colors={colors}
								utilsStyles={utilsStyles}
								themedStyles={themedStyles}
							/>
						))}
					</SettingsSection>
				)}

				{showThemeSection && (
					<SettingsSection
						title={t.settings_theme}
						description={t.settings_theme_description}
						themedStyles={themedStyles}
					>
						{filteredThemeOptions.map((option) => (
							<SettingRow
								key={option.value}
								label={option.label}
								helper={option.helper}
								selected={themePreference === option.value}
								onPress={() => setThemePreference(option.value)}
								colors={colors}
								utilsStyles={utilsStyles}
								themedStyles={themedStyles}
							/>
						))}

						<View style={[themedStyles.row, { borderBottomWidth: 0 }]}>
							<View>
								<Text style={themedStyles.rowTitle}>{t.settings_dark_mode}</Text>
								<Text style={themedStyles.rowSubtitle}>{t.settings_dark_mode_helper}</Text>
							</View>
							<Switch
								value={themePreference === "dark"}
								onValueChange={(value) => setThemePreference(value ? "dark" : "light")}
								trackColor={{ false: colors.border, true: colors.primary }}
								thumbColor={colors.icon}
							/>
						</View>
					</SettingsSection>
				)}

				{showAccentSection && (
					<SettingsSection
						title={t.settings_accent}
						description={t.settings_accent_description}
						themedStyles={themedStyles}
					>
						{filteredAccentOptions.map((option) => (
							<SettingRow
								key={option.value}
								label={option.label}
								helper={option.helper}
								selected={accentPreference === option.value}
								onPress={() => setAccentColor(option.value)}
								colors={colors}
								utilsStyles={utilsStyles}
								themedStyles={themedStyles}
								swatchColor={option.color}
							/>
						))}
					</SettingsSection>
				)}

				{showAboutSection && (
					<SettingsSection
						title={t.settings_about}
						description={t.settings_about_description}
						themedStyles={themedStyles}
						bottomPadding={70}
					>
						{filteredAboutOptions.map((option) => (
							<SettingRow
								key={option.value}
								label={option.label}
								helper={option.helper}
								selected={false}
								onPress={openGithubProfile}
								colors={colors}
								utilsStyles={utilsStyles}
								themedStyles={themedStyles}
							/>
						))}
					</SettingsSection>
				)}
			</ScrollView>
		</View>
	);
};

const useFilteredOptions = <T extends string>(options: SettingOption<T>[], search: string) => {
	return useMemo(() => {
		if (!search) return options;

		const lowered = search.toLowerCase();
		return options.filter(
			(option) =>
				option.label.toLowerCase().includes(lowered) ||
				option.helper?.toLowerCase().includes(lowered),
		);
	}, [options, search]);
};

const SettingsSection = ({
	title,
	description,
	children,
	themedStyles,
	bottomPadding = 0,
}: {
	title: string;
	description?: string;
	children: ReactNode;
	themedStyles: ReturnType<typeof styles>;
	bottomPadding?: number;
}) => {
	return (
		<View style={[themedStyles.section, bottomPadding ? { paddingBottom: bottomPadding } : null]}>
			<Text style={themedStyles.sectionTitle}>{title}</Text>
			{description && <Text style={themedStyles.sectionDescription}>{description}</Text>}

			<View style={themedStyles.card}>{children}</View>
		</View>
	);
};

const SettingRow = ({
	label,
	helper,
	selected,
	onPress,
	colors,
	utilsStyles,
	themedStyles,
	swatchColor,
}: {
	label: string;
	helper?: string;
	selected: boolean;
	onPress: () => void;
	colors: ReturnType<typeof useTheme>["colors"];
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"];
	themedStyles: ReturnType<typeof styles>;
	swatchColor?: string;
}) => {
	return (
		<TouchableOpacity onPress={onPress} activeOpacity={0.85} style={themedStyles.row}>
			<View style={{ flexDirection: "row", alignItems: "center", columnGap: 12 }}>
				{swatchColor && (
					<View
						style={{
							width: 16,
							height: 16,
							borderRadius: 8,
							backgroundColor: swatchColor,
							borderColor: colors.border,
							borderWidth: StyleSheet.hairlineWidth,
						}}
					/>
				)}

				<View>
					<Text style={themedStyles.rowTitle}>{label}</Text>
					{helper && <Text style={themedStyles.rowSubtitle}>{helper}</Text>}
				</View>
			</View>

			{selected && (
				<View style={utilsStyles.centeredRow}>
					<Ionicons name="checkmark-circle" size={22} color={colors.primary} />
				</View>
			)}
		</TouchableOpacity>
	);
};

const styles = (
	colors: ReturnType<typeof useTheme>["colors"],
	defaultStyles: ReturnType<typeof useThemeStyles>["defaultStyles"],
	utilsStyles: ReturnType<typeof useThemeStyles>["utilsStyles"],
) =>
	StyleSheet.create({
		section: {
			marginTop: 26,
		},
		sectionTitle: {
			...defaultStyles.text,
			fontSize: fontSize.lg,
			fontWeight: "700",
		},
		sectionDescription: {
			...defaultStyles.text,
			color: colors.textMuted,
			marginTop: 4,
		},
		card: {
			...utilsStyles.glassCard,
			marginTop: 16,
			borderRadius: 18,
		},
		row: {
			paddingVertical: 14,
			paddingHorizontal: 16,
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "center",
			borderBottomWidth: StyleSheet.hairlineWidth,
			borderBottomColor: colors.border,
		},
		rowTitle: {
			...defaultStyles.text,
			fontWeight: "600",
		},
		rowSubtitle: {
			...defaultStyles.text,
			color: colors.textMuted,
			marginTop: 4,
		},
	});

export default SettingsScreen;
