import { useNavigation } from "expo-router";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SearchBarProps } from "react-native-screens";
import { useTheme } from "@/hooks/useTheme";

const shallowEqual = (a?: SearchBarProps, b?: SearchBarProps) => {
	if (a === b) return true;
	if (!a || !b) return false;

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) return false;

	return aKeys.every((key) => a[key as keyof SearchBarProps] === b[key as keyof SearchBarProps]);
};

export const useNavigationSearch = ({
	searchBarOptions,
}: {
	searchBarOptions?: SearchBarProps;
}) => {
	const { colors } = useTheme();
	const [search, setSearch] = useState("");
	const lastOptionsRef = useRef<SearchBarProps | undefined>(undefined);

	const navigation = useNavigation();

	const handleOnChangeText: SearchBarProps["onChangeText"] = useCallback(
		({ nativeEvent: { text } }: { nativeEvent: { text: string } }) => {
			setSearch(text);
		},
		[],
	);

	const defaultSearchOptions = useMemo(
		() => ({
			tintColor: colors.primary,
			hideWhenScrolling: false,
		}),
		[colors.primary],
	);

	useLayoutEffect(() => {
		const nextOptions: SearchBarProps = {
			...defaultSearchOptions,
			...searchBarOptions,
			onChangeText: handleOnChangeText,
		};

		if (shallowEqual(lastOptionsRef.current, nextOptions)) return;

		lastOptionsRef.current = nextOptions;
		navigation.setOptions({
			headerSearchBarOptions: nextOptions,
		});
	}, [navigation, searchBarOptions, handleOnChangeText, defaultSearchOptions]);

	return search;
};
