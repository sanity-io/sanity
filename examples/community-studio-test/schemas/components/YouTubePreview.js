import React from 'react'
import getYouTubeId from 'get-youtube-id'
import YouTube from 'react-youtube'
import propTypes from 'prop-types'

const YouTubePreview = ({value}) => {
  const {url} = value
  if (!url) {
    return <div><p>Add a video URL</p></div>
  }
  const id = getYouTubeId(url)
  return (<YouTube videoId={id} />)

}

YouTubePreview.propTypes = {
  value: propTypes.shape({
    url: propTypes.string.isRequired
  }).isRequired
}

export default YouTubePreview
