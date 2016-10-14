import React from 'react'
import ImageTool from './ImageTool'
import createImageLoadProxy from './createImageLoadProxy'

/* eslint-disable react/no-multi-comp, react/prop-types */
export default createImageLoadProxy(ImageTool, {
  loading(props) {
    return <div>Loading...</div>
  },
  error(props) {
    return <div>Could not load image "{props.src}" {props.error.message}</div>
  }
})
