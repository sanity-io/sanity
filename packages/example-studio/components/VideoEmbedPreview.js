import React from 'react'
import PropTypes from 'prop-types'
import getVideoId from 'get-video-id'

export default class YoutubeVideo extends React.Component {
  static propTypes = {
    value: PropTypes.object
  }

  getEmbedCode(value) {
    const videoId = (value && value.url) ? getVideoId(value.url) : ''

    if (!videoId) {
      return <span />
    }

    switch (videoId.service) {
      case 'youtube': {
        return <iframe src={`https://www.youtube.com/embed/${videoId.id}?rel=0`} frameBorder="0" allowFullScreen />
      }

      case 'vimeo': {
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId.id}`}
            width="640"
            frameBorder="0"
            webkitallowfullscreen
            mozallowfullscreen
            allowFullScreen
          />
        )
      }
      default: {
        return <span>Unsupported video service: {videoId.service}</span>
      }
    }
  }
  render() {
    const {value} = this.props
    return (
      <div style={{minHeight: '2em'}}>
        {this.getEmbedCode(value)}
      </div>
    )
  }
}
