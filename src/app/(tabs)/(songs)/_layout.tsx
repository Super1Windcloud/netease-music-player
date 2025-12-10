import { Stack } from 'expo-router'
import { View } from 'react-native'
import { useStackScreenWithSearchBar } from '@/constants/layout'
import { useStrings } from '@/hooks/useStrings'
import { useThemeStyles } from '@/styles'

const SongsScreenLayout = () => {
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
						headerTitle: t.tabs_localMusic,
					}}
				/>
			</Stack>
		</View>
	)
}

export default SongsScreenLayout
