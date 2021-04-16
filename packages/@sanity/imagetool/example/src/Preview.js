import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp, react/prop-types */
import React from 'react'
import HotspotImage from '../../src/HotspotImage'
import ImageLoader from '../../src/ImageLoader'

function InnerPreview(props) {
  const {image, ...rest} = props
  const srcAspectRatio = image.width / image.height
  return <HotspotImage {...rest} srcAspectRatio={srcAspectRatio} />
}
InnerPreview.propTypes = {
  image: PropTypes.shape({
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
  }).isRequired,
}

export default function Preview(props) {
  return (
    <ImageLoader src={props.src}>
      {({isLoading, image, error}) => {
        if (isLoading) {
          return <div>Loading...</div>
        }
        if (error) {
          return <div>{error.message}</div>
        }
        if (image) {
          return <InnerPreview {...props} image={image} />
        }
        return null
      }}
    </ImageLoader>
  )
}

Preview.propTypes = {
  src: PropTypes.string,
}
