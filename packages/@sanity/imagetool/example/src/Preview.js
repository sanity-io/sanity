import PropTypes from 'prop-types'
/* eslint-disable react/no-multi-comp, react/prop-types */
import React from 'react'
import HotspotImage from '../../src/HotspotImage'
import createImageLoadProxy from '../../src/createImageLoadProxy'

function Preview(props) {
  const {image, ...rest} = props
  const srcAspectRatio = image.width / image.height
  return (
    <HotspotImage {...rest} srcAspectRatio={srcAspectRatio} />
  )
}
Preview.propTypes = {
  image: PropTypes.shape({
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired
  }).isRequired
}

export default createImageLoadProxy(Preview, {
  error(error) {
    return <div>{error.message}</div>
  }
})

