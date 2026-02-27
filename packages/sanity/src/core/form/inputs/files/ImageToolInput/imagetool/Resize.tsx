import {type ReactNode} from 'react'

import {type Size} from './types'

export interface ResizeSVGProps {
  image: HTMLImageElement
  maxHeight: number
  maxWidth: number
  children: (targetSize: Size) => ReactNode
}

export function ResizeSVG(props: ResizeSVGProps): ReactNode {
  const {image, maxHeight, maxWidth, children} = props

  const ratio = image.width / image.height
  const landscape = image.width > image.height

  const targetSize = {
    width: landscape ? maxWidth : maxHeight * ratio,
    height: landscape ? maxWidth / ratio : maxHeight,
  }

  // Scale down if exceeds max dimensions
  if (targetSize.width > maxWidth) {
    targetSize.width = maxWidth
    targetSize.height = maxWidth / ratio
  }
  if (targetSize.height > maxHeight) {
    targetSize.height = maxHeight
    targetSize.width = maxHeight * ratio
  }

  return children(targetSize)
}
