import React from 'react'

const IFRAME_URL_RE = /^<iframe src="([^"]+)"/

function parseSpotifyShareUrl(str) {
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

function SpotifyEmbedPreview(props) {
  if (!props.value.url) {
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
      allowtransparency="true"
      allow="encrypted-media"
      style={{width: '100%', verticalAlign: 'top'}}
    />
  )
}

export default {
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
    component: SpotifyEmbedPreview,
  },
}
