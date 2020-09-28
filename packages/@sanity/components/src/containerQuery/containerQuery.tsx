import React, {useEffect, useRef, useState} from 'react'
import {ResizeObserver} from '../resizeObserver'

interface ContainerBreakpoint {
  name: string
  minWidth: number
}

const CONTAINER_BREAKPOINTS: ContainerBreakpoint[] = [
  {name: 'xsmall', minWidth: 220},
  {name: 'small', minWidth: 320},
  {name: 'medium', minWidth: 512},
  {name: 'default', minWidth: 640},
  {name: 'large', minWidth: 960},
  {name: 'xlarge', minWidth: 1600}
]

function findMinBreakpoints(width: number) {
  const ret: ContainerBreakpoint[] = []

  for (const bp of CONTAINER_BREAKPOINTS) {
    if (bp.minWidth <= width) {
      ret.push(bp)
    }
  }

  return ret
}

export function ContainerQuery(props: React.HTMLProps<HTMLDivElement>) {
  const {children, ...restProps} = props
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(() => {
    return window.innerWidth
  })

  useEffect(() => {
    let ro: ResizeObserver

    if (rootRef.current) {
      const handleResizeEntries: ResizeObserverCallback = entries => {
        setWidth(entries[0].contentRect.width)
      }

      ro = new ResizeObserver(handleResizeEntries)
      ro.observe(rootRef.current)
    }

    return () => {
      if (ro) {
        ro.disconnect()
      }
    }
  }, [])

  const min = findMinBreakpoints(width)

  return (
    <div
      {...restProps}
      data-container-min={min.length ? min.map(bp => bp.name).join(' ') : undefined}
      ref={rootRef}
    >
      {children}
    </div>
  )
}
