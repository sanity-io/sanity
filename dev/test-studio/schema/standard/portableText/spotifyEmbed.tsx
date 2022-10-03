import React from 'react'
import {defineType, PreviewProps} from 'sanity'

const IFRAME_URL_RE = /^<iframe src="([^"]+)"/

function parseSpotifyShareUrl(str: string): {type: string; id: string} | null {
  if (str.startsWith('https://')) {
    const url = new URL(str)
    const parts = url.pathname.slice(1).split('/')

    if (parts[0] === 'embed' || parts[0] === 'embed-podcast') {
      return {
        type: parts[1],
        id: parts[2],
      }
    }

    return {
      type: parts[0],
      id: parts[1],
    }
  }

  if (str.startsWith('spotify:')) {
    const parts = str.split(':')

    return {
      type: parts[1],
      id: parts[2],
    }
  }

  if (str.startsWith('<iframe')) {
    const match = IFRAME_URL_RE.exec(str)

    if (match) {
      return parseSpotifyShareUrl(match[1])
    }
  }

  return null
}

function SpotifyEmbedPreview(props: PreviewProps) {
  if (!isValidPreview(props.value)) {
    return <div>Please provide a Spotify share URL</div>
  }

  const params = parseSpotifyShareUrl(props.value.url)

  if (!params) {
    return <div>Could not parse the provided Spotify share URL: {props.value.url}</div>
  }

  let embedType = 'embed'

  if (params.type === 'show') {
    embedType = 'embed-podcast'
  }

  return (
    <iframe
      src={`https://open.spotify.com/${embedType}/${params.type}/${params.id}`}
      width="300"
      height="380"
      frameBorder="0"
      allow="encrypted-media"
      style={{width: '100%', verticalAlign: 'top'}}
    />
  )
}

function isValidPreview(value: unknown): value is {url: string} {
  return Boolean(value && typeof value === 'object' && typeof (value as any).url === 'string')
}

export default defineType({
  type: 'object',
  name: 'spotifyEmbed',
  title: 'Spotify Embed',
  fields: [
    {
      type: 'string',
      name: 'url',
      title: 'URL',
    },
  ],
  preview: {
    select: {url: 'url'},
  },
  components: {
    preview: SpotifyEmbedPreview,
  },
})
