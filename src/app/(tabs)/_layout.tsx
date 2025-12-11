import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Tabs } from 'expo-router'
import { StyleSheet } from 'react-native'
import { FloatingPlayer } from '@/components/FloatingPlayer'
import { fontSize } from '@/constants/tokens'
import { useStrings } from '@/hooks/useStrings'
import { useTheme } from '@/hooks/useTheme'

const TabsNavigation = () => {
	const { colors } = useTheme()
	const { t } = useStrings()

	return (
		<>
			<Tabs
				screenOptions={{
					tabBarActiveTintColor: colors.primary,
					tabBarLabelStyle: {
						fontSize: fontSize.xs,
						fontWeight: '500',
					},
					headerShown: false,
					tabBarStyle: {
						position: 'absolute',
						borderTopLeftRadius: 20,
						borderTopRightRadius: 20,
						borderTopWidth: 0,
						paddingTop: 8,
					},
					tabBarBackground: () => (
						<BlurView
							intensity={95}
							style={{
								...StyleSheet.absoluteFillObject,
								overflow: 'hidden',
								borderTopLeftRadius: 20,
								borderTopRightRadius: 20,
							}}
						/>
					),
				}}
			>
				<Tabs.Screen
					name="(songs)"
					options={{
						title: t.tabs_localMusic,
						tabBarIcon: ({ color }: Record<string, string>) => (
							<Ionicons name="musical-notes-sharp" size={24} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="explore"
					options={{
						title: t.tabs_explore,
						tabBarIcon: ({ color }: Record<string, string>) => (
							<Ionicons name="search" size={22} color={color} />
						),
					}}
				/>
				<Tabs.Screen
					name="settings"
					options={{
						title: t.tabs_settings,
						tabBarIcon: ({ color }: Record<string, string>) => (
							<Ionicons name="settings-sharp" size={22} color={color} />
						),
					}}
				/>
			</Tabs>

			<FloatingPlayer
				style={{
					position: 'absolute',
					left: 8,
					right: 8,
					bottom: 78,
				}}
			/>
		</>
	)
}

export default TabsNavigation
