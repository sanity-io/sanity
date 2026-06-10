import {useLayoutEffect, useRef, useState} from 'react'

import {LoadingBlock} from '../../../../../components/loadingBlock'
import {ImageLoader} from './ImageLoader'
import {ResizeSVG} from './Resize'
import {ToolSVG} from './ToolSVG'
import {type ToolSVGProps} from './types'

export interface ImageToolProps extends Omit<ToolSVGProps, 'image' | 'size'> {
  src: string
}

export function ImageTool(props: ImageToolProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number | null>(null)
  const [containerHeight, setContainerHeight] = useState<number | null>(null)

  // Set up resize observer to track container size changes
  useLayoutEffect(() => {
    const element = containerRef.current
    if (!element) return undefined

    setContainerWidth(element.clientWidth)
    setContainerHeight(element.clientHeight)

    const observer = new ResizeObserver((entries) => {
      const entry = entries.find((e) => e.target === element)
      if (entry) {
        setContainerWidth(entry.contentRect.width)
        setContainerHeight(entry.contentRect.height)
      }
    })

    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {containerWidth !== null && containerHeight !== null && (
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
                <ResizeSVG image={image} maxHeight={containerHeight} maxWidth={containerWidth}>
                  {(size) => <ToolSVG {...props} image={image} size={size} />}
                </ResizeSVG>
              )
            }
            return null
          }}
        </ImageLoader>
      )}
    </div>
  )
}
