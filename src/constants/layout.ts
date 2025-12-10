import { useMemo } from 'react'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { useTheme } from '@/hooks/useTheme'

export const useStackScreenWithSearchBar = (): NativeStackNavigationOptions => {
	const { colors } = useTheme()

	return useMemo(
		() => ({
			headerLargeTitle: true,
			headerLargeStyle: {
				backgroundColor: colors.background,
			},
			headerLargeTitleStyle: {
				color: colors.text,
			},
			headerTintColor: colors.text,
			headerTransparent: true,
			headerBlurEffect: 'prominent',
			headerShadowVisible: false,
		}),
		[colors.background, colors.text],
	)
}
