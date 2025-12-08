import { useEffect, useState } from 'react'
import { colors } from '@/constants/tokens'

type PlayerImageColors = {
	background: string
	primary: string
}

export const usePlayerBackground = (_imageUrl: string) => {
	const [imageColors, setImageColors] = useState<PlayerImageColors | null>(null)

	useEffect(() => {
		// Expo Go fallback: use theme colors without native image analysis
		setImageColors({
			background: colors.background,
			primary: colors.primary,
		})
	}, [])

	return { imageColors }
}
