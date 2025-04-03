import {useEffect, useRef, useState} from 'react'

import {LoadingBlock} from '../../../../../components/loadingBlock'
import {resizeObserver} from '../../../../../util/resizeObserver'
import {ImageLoader} from './ImageLoader'
import {ResizeSVG} from './Resize'
import {ToolSVG} from './ToolSVG'
import {type ToolSVGProps} from './types'

export interface ImageToolProps extends Omit<ToolSVGProps, 'image' | 'size'> {
  src: string
}

export function ImageTool(props: ImageToolProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState<{width: number; height: number} | null>(null)

  // Set up resize observer to track container size changes
  useEffect(() => {
    if (!containerRef.current) return undefined

    const updateSize = (entry: ResizeObserverEntry) => {
      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    }

    if (containerRef.current) {
      setContainerSize({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      })
    }

    return resizeObserver.observe(containerRef.current, updateSize)
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
      {containerSize && (
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
                <ResizeSVG
                  image={image}
                  maxHeight={containerSize.height}
                  maxWidth={containerSize.width}
                >
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
