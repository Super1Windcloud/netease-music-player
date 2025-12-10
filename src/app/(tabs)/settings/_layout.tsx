import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useStackScreenWithSearchBar } from '@/constants/layout'
import { useThemeStyles } from '@/styles'
import { useStrings } from '@/hooks/useStrings'

const SettingsLayout = () => {
	const { t } = useStrings()
	const { defaultStyles } = useThemeStyles()
	const stackOptions = useStackScreenWithSearchBar()

	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						...stackOptions,
						headerTitle: t.tabs_settings,
					}}
				/>
			</Stack>
		</View>
	)
}

export default SettingsLayout
