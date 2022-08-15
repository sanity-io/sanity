import {defineType} from 'sanity'

export default defineType({
  name: 'playlistTrack',
  title: 'Playlist track',
  type: 'object',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
    },
    {
      name: 'album',
      title: 'Album',
      type: 'string',
    },
    {
      name: 'duration',
      title: 'Duration (milliseconds)',
      type: 'number',
      readOnly: true,
    },
    {
      name: 'albumImage',
      title: 'Album image',
      type: 'image',
    },
  ],
  preview: {
    prepare(value) {
      const {title, duration, album, media} = value
      return {
        title: `${title} (${formatDuration(duration)})`,
        subtitle: album ? `Album: ${album}` : undefined,
        media,
      }
    },
    select: {
      title: 'name',
      album: 'album',
      duration: 'duration',
      media: 'albumImage',
    },
  },
})

export function formatDuration(dur: unknown): string {
  if (typeof dur !== 'number') {
    return 'unknown'
  }

  const seconds = (dur / 1000) % 60
  const minutes = dur / 1000 / 60

  return [minutes, seconds]
    .map((num) => (num > 9 ? num.toFixed(0) : `0${num.toFixed(0)}`))
    .join(':')
}
