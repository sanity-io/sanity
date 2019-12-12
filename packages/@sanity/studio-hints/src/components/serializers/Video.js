import React from 'react'
import dynamic from 'next/dynamic'
import parse from 'url-parse'
import PropTypes from 'prop-types'

const YouTube = dynamic(() => import('react-youtube'))
const resolveYTId = url => parse(url).pathname.replace('/', '')

const Video = ({url = '', containerClassName, className}) => {
  return (
    <YouTube
      videoId={resolveYTId(url)}
      containerClassName={containerClassName}
      className={className}
    />
  )
}

Video.propTypes = {
  url: PropTypes.string,
  containerClassName: PropTypes.string,
  className: PropTypes.string
}

export default Video
