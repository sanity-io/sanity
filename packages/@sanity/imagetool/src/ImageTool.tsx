/* eslint-disable react/jsx-filename-extension */
import React from 'react'
import PropTypes from 'prop-types'
import {ImageLoader} from './ImageLoader'
import {ToolCanvas} from './ToolCanvas'
import {Resize} from './Resize'

export function ImageTool(props) {
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
            <Resize image={image} maxHeight={ImageTool.maxHeight} maxWidth={ImageTool.maxWidth}>
              {(canvas) => <ToolCanvas image={canvas} {...props} />}
            </Resize>
          )
        }
        return null
      }}
    </ImageLoader>
  )
}

ImageTool.propTypes = {
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

ImageTool.maxHeight = 500
ImageTool.maxWidth = 1000
