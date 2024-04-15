import {useEffect, useMemo, useState} from 'react'

import {resizeObserver} from '../../../../../util/resizeObserver'
import {type Dimensions} from './types'

/**
 * Sets up a Resize Observer in such a way that it can be used in a React Class component
 * @internal
 */
export function useActualCanvasSizeObserver(): [
  Dimensions,
  React.Dispatch<React.SetStateAction<HTMLCanvasElement | null>>,
] {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [height, setHeight] = useState(0)
  const [width, setWidth] = useState(0)
  const size = useMemo(() => ({height, width}), [height, width])

  useEffect(() => {
    if (!canvas) {
      return undefined
    }

    setHeight(canvas.clientHeight)
    setWidth(canvas.clientWidth)
    resizeObserver.observe(canvas, (entry) => {
      setHeight(Math.round(entry.contentRect.height))
      setWidth(Math.round(entry.contentRect.width))
    })
    return () => {
      resizeObserver.unobserve(canvas)
    }
  }, [canvas])

  return [size, setCanvas]
}
