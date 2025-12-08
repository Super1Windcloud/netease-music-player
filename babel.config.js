const config = (api) => {
	api.cache(true)
	return {
		presets: ['babel-preset-expo'],
	}
}

export default config
