export const trackTitleFilter = (title: string) => (track: any) =>
	track.title?.toLowerCase().includes(title.toLowerCase())

export const albumNameFilter = (name: string) => (album: { name: string }) =>
	album.name.toLowerCase().includes(name.toLowerCase())
