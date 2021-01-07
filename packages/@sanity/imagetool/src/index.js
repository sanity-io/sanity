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
            <Resize
              image={image}
              maxHeight={ImageToolWrapper.maxHeight}
              maxWidth={ImageToolWrapper.maxWidth}
            >
              {(canvas) => <ImageTool image={canvas} {...props} />}
            </Resize>
          )
        }
        return null
      }}
    </ImageLoader>
  )
}

ImageToolWrapper.propTypes = {
  src: PropTypes.string.isRequired,
  value: PropTypes.shape({
    hotspot: PropTypes.shape({
      x: PropTypes.number,
      y: PropTypes.number,
      height: PropTypes.number,
      width: PropTypes.number,
    }),
  }),
  image: PropTypes.shape({
    height: PropTypes.number,
    width: PropTypes.number,
  }),
  onChange: PropTypes.func,
  onChangeEnd: PropTypes.func,
  readOnly: PropTypes.bool,
}

ImageToolWrapper.maxHeight = 500
ImageToolWrapper.maxWidth = 1000
