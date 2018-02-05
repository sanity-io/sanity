import React from 'react'
import PropTypes from 'prop-types'
import ImageLoader from './ImageLoader'
import ImageTool from './ImageTool'
import Resize from './Resize'

export default function ImageToolWrapper(props) {
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
          return (
            <Resize image={image} maxHeight={500} maxWidth={1000}>
              {canvas => <ImageTool image={canvas} {...props} />}
            </Resize>
          )
        }
        return null
      }}
    </ImageLoader>
  )
}

ImageToolWrapper.propTypes = {
  src: PropTypes.string.isRequired
}
