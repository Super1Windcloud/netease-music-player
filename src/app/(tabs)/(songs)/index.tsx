import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { TracksList } from '@/components/TracksList'
import { screenPadding } from '@/constants/tokens'
import { trackTitleFilter } from '@/helpers/filter'
import { generateTracksListId } from '@/helpers/miscellaneous'
import { useNavigationSearch } from '@/hooks/useNavigationSearch'
import { useStrings } from '@/hooks/useStrings'
import { useTheme } from '@/hooks/useTheme'
import { useEnsureLibraryLoaded, useLibraryStatus, useTracks } from '@/store/library'
import { useThemeStyles } from '@/styles'

const SongsScreen = () => {
	const { colors } = useTheme()
	const { defaultStyles } = useThemeStyles()
	const { t } = useStrings()
	const search = useNavigationSearch({
		searchBarOptions: {
			placeholder: t.songs_search_placeholder,
		},
	})

	useEnsureLibraryLoaded()
	const { status, error } = useLibraryStatus()
	const tracks = useTracks()

	const filteredTracks = useMemo(() => {
		if (!search) return tracks

		return tracks.filter(trackTitleFilter(search))
	}, [search, tracks])

	if (status === 'loading' || status === 'idle') {
		return (
			<View style={[defaultStyles.container, { justifyContent: 'center' }]}>
				<ActivityIndicator color={colors.primary} />
				<Text style={{ ...defaultStyles.text, marginTop: 12, color: colors.textMuted }}>
					{t.songs_loading}
				</Text>
			</View>
		)
	}

	return (
		<View style={defaultStyles.container}>
			<ScrollView
				contentInsetAdjustmentBehavior="automatic"
				style={{ paddingHorizontal: screenPadding.horizontal }}
			>
				{error && (
					<Text style={{ ...defaultStyles.text, color: colors.textMuted, marginBottom: 12 }}>
						{error}
					</Text>
				)}

				<TracksList
					id={generateTracksListId('songs', search)}
					tracks={filteredTracks}
					scrollEnabled={false}
				/>
			</ScrollView>
		</View>
	)
}

export default SongsScreen
