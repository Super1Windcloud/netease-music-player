import { Stack } from 'expo-router'
import { View } from 'react-native'
import { StackScreenWithSearchBar } from '@/constants/layout'
import { defaultStyles } from '@/styles'

const SongsScreenLayout = () => {
	return (
		<View style={defaultStyles.container}>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						...StackScreenWithSearchBar,
						headerTitle: 'Songs',
					}}
				/>
			</Stack>
		</View>
	)
}

export default SongsScreenLayout
