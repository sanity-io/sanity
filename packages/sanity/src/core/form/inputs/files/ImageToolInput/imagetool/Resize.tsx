/* eslint-disable @typescript-eslint/no-shadow */
import React, {useCallback, useEffect, useState} from 'react'

export interface ResizeProps {
  image: HTMLImageElement
  maxHeight: number
  maxWidth: number
  children: (canvas: HTMLCanvasElement) => React.ReactNode
}

export function Resize(props: ResizeProps): any {
  const {image, maxHeight, maxWidth, children} = props

  const [canvas] = useState<HTMLCanvasElement>(() => {
    const canvasElement = document.createElement('canvas')
    canvasElement.style.display = 'none'
    return canvasElement
  })
  useEffect(() => {
    document.body.appendChild(canvas)
    return () => {
      document.body.removeChild(canvas)
    }
  }, [canvas])

  const resize = useCallback(
    (image: HTMLImageElement, maxHeight: number, maxWidth: number) => {
      const ratio = image.width / image.height
      const width = Math.min(image.width, maxWidth)
      const height = Math.min(image.height, maxHeight)

      const landscape = image.width > image.height
      const targetWidth = landscape ? width : height * ratio
      const targetHeight = landscape ? width / ratio : height

      canvas.width = targetWidth
      canvas.height = targetHeight

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, targetWidth, targetHeight)
      }

      return canvas
    },
    [canvas]
  )

  return children(resize(image, maxHeight, maxWidth))
}
