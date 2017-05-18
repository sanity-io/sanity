/* eslint-disable react/no-multi-comp, react/display-name */

import React from 'react'
import PropTypes from 'prop-types'
import getVideoId from 'get-video-id'

const SERVICES = {
  youtube: id => (
    <iframe
      src={`https://www.youtube.com/embed/${id}?rel=0`}
      frameBorder="0"
      allowFullScreen
    />
  ),
  vimeo: id => (
    <iframe
      src={`https://player.vimeo.com/video/${id}`}
      frameBorder="0"
      webkitallowfullscreen
      mozallowfullscreen
      allowFullScreen
    />
  )
}

function getEmbedCode(value) {
  if (!value || !value.url) {
    return <span>[Video]</span>
  }

  const videoId = (value && value.url) ? getVideoId(value.url) : ''

  if (!videoId) {
    return <span>Unrecognized video service. Supported services: {Object.keys(SERVICES).join(', ')}</span>
  }
  if (!(videoId.service in SERVICES)) {
    return <span>Unsupported video service: {videoId.service}</span>
  }

  return SERVICES[videoId.service](videoId.id)
}
export default class YoutubeVideo extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  render() {
    const {value} = this.props
    return (
      <div>
        {getEmbedCode(value)}
      </div>
    )
  }
}
