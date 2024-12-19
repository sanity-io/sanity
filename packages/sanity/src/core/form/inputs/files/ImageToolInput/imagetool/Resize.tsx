import {type ReactNode, useEffect, useLayoutEffect, useState} from 'react'

export interface ResizeProps {
  image: HTMLImageElement
  maxHeight: number
  maxWidth: number
  children: (canvas: HTMLCanvasElement) => ReactNode
}

export function Resize(props: ResizeProps): ReactNode {
  const {image, maxHeight, maxWidth, children} = props
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)

  const hasCanvas = Boolean(canvas)
  useEffect(() => {
    if (hasCanvas) {
      return undefined
    }
    const canvasElement = document.createElement('canvas')
    canvasElement.style.display = 'none'
    document.body.appendChild(canvasElement)
    setCanvas(canvasElement)
    return () => {
      document.body.removeChild(canvasElement)
    }
  }, [hasCanvas])
  /**
   * The useLayoutEffect is used here intentionally.
   * It ensures that changes to the painted image, height and width are applied synchronously, before the next paint.
   * If we used a passive useEffect it would cause a flicker as the canvas would be painted after the next paint.
   * Two effect hooks are used to ensure the `document.body.appendChild` related logic only run once, while resizing the canvas and painting a new image can run multiple times as needed.
   */
  useLayoutEffect(() => {
    if (!canvas) {
      return
    }

    const ratio = image.width / image.height
    const width = Math.min(image.width, maxWidth)
    const height = Math.min(image.height, maxHeight)

    const landscape = image.width > image.height
    const targetWidth = landscape ? width : height * ratio
    const targetHeight = landscape ? width / ratio : height

    Object.assign(canvas, {width: targetWidth, height: targetHeight})

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, targetWidth, targetHeight)
    }
  }, [canvas, image, maxHeight, maxWidth])

  if (!canvas) {
    return null
  }

  return children(canvas)
}
