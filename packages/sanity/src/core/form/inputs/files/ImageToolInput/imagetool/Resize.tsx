import {type ReactNode, useLayoutEffect, useRef, useState} from 'react'

export interface ResizeProps {
  image: HTMLImageElement
  maxHeight: number
  maxWidth: number
  children: (canvas: HTMLCanvasElement) => ReactNode
}

export function Resize(props: ResizeProps): any {
  const {image, maxHeight, maxWidth, children} = props
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)

  /**
   * The useLayoutEffect is used here intentionally.
   * Since the first render doesn't have a canvas element yet we return `null` instead of calling `children` so that `ImageTool` don't have to deal with
   * the initial render not having a canvas element.
   * Now, the flow is that first ImageTool will render a loading state, then it will render <Resize> and expect it to have a canvas that
   * renders the provided image.
   * If we use `useEffect` there will be a flash where <ImageTool> just finished rendering loading,
   * then it will render with nothing, causing a jump,
   * and finally it renders the image inside the canvas.
   * By using `useLayoutEffect` we ensure that the intermediary state where there is no canvas doesn't paint in the browser,
   * React blocks it, runs render again, this time we have a canvas element that got setup inside the effect and assigned to the ref,
   * and then we render the image inside the canvas.
   * No flash, no jumps, just a smooth transition from loading to image.
   */
  useLayoutEffect(() => {
    if (!canvasRef.current) {
      const canvasElement = document.createElement('canvas')
      canvasElement.style.display = 'none'
      canvasRef.current = canvasElement
      setReady(true)
    }

    const ratio = image.width / image.height
    const width = Math.min(image.width, maxWidth)
    const height = Math.min(image.height, maxHeight)

    const landscape = image.width > image.height
    const targetWidth = landscape ? width : height * ratio
    const targetHeight = landscape ? width / ratio : height

    canvasRef.current.width = targetWidth
    canvasRef.current.height = targetHeight

    const ctx = canvasRef.current.getContext('2d')
    if (ctx) {
      ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, targetWidth, targetHeight)
    }

    const node = canvasRef.current
    document.body.appendChild(node)
    return () => {
      document.body.removeChild(node)
    }
  }, [image, maxHeight, maxWidth])

  if (!canvasRef.current || !ready) {
    return null
  }

  return children(canvasRef.current)
}
