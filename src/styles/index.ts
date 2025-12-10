import { useMemo } from 'react'
import { StyleSheet } from 'react-native'
import { fontSize } from '@/constants/tokens'
import { useTheme } from '@/hooks/useTheme'

export const useThemeStyles = () => {
	const { colors } = useTheme()

	const defaultStyles = useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					backgroundColor: colors.background,
				},
				text: {
					fontSize: fontSize.base,
					color: colors.text,
				},
			}),
		[colors],
	)

	const utilsStyles = useMemo(
		() =>
			StyleSheet.create({
				centeredRow: {
					flexDirection: 'row',
					justifyContent: 'center',
					alignItems: 'center',
				},
				slider: {
					height: 7,
					borderRadius: 16,
				},
				itemSeparator: {
					borderColor: colors.textMuted,
					borderWidth: StyleSheet.hairlineWidth,
					opacity: 0.3,
				},
				emptyContentText: {
					...defaultStyles.text,
					color: colors.textMuted,
					textAlign: 'center',
					marginTop: 20,
				},
				emptyContentImage: {
					width: 200,
					height: 200,
					alignSelf: 'center',
					marginTop: 40,
					opacity: 0.3,
				},
			}),
		[colors, defaultStyles.text],
	)

	return { colors, defaultStyles, utilsStyles }
}
