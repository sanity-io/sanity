import React from 'react'
import {LoadingBlock} from '../../../../../components/loadingBlock'
import {ImageLoader} from './ImageLoader'
import {ToolCanvas} from './ToolCanvas'
import {Resize} from './Resize'
import type {ToolCanvasProps} from './types'

export interface ImageToolProps extends Omit<ToolCanvasProps, 'image'> {
  image?: HTMLCanvasElement
  src: string
}

export function ImageTool(props: ImageToolProps) {
  return (
    <ImageLoader src={props.src}>
      {({isLoading, image, error}) => {
        if (isLoading) {
          return <LoadingBlock showText />
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

ImageTool.maxHeight = 500
ImageTool.maxWidth = 1000
