import { useMemo } from 'react'
import { Locale, strings } from '@/constants/strings'
import { useLanguagePreference } from '@/store/preferences'

const detectSystemLocale = (): Locale => {
	const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? ''
	return locale.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export const useStrings = () => {
	const { value: preference } = useLanguagePreference()
	const systemLocale = detectSystemLocale()

	const locale = preference === 'system' ? systemLocale : preference

	const t = useMemo(() => strings[locale], [locale])

	return { locale, t }
}
