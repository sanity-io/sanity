import {useEffect, useState} from 'react'

interface PaneSizeOptions {
  defaultSize: number
  size?: number
  allowResize: boolean
  minSize: number
  maxSize: number
}
function narrowBreakpoint(): boolean {
  return typeof window !== 'undefined' && window.innerWidth > 600
}

function calculatePaneSizeOptions(height: number | undefined): PaneSizeOptions {
  let rootHeight = height

  if (!rootHeight) {
    // Initial root height without header
    rootHeight =
      typeof window !== 'undefined' && typeof document !== 'undefined'
        ? document.body.getBoundingClientRect().height - 60
        : 0
  }
  return {
    defaultSize: rootHeight / (narrowBreakpoint() ? 2 : 1),
    size: rootHeight > 550 ? undefined : rootHeight * 0.4,
    allowResize: rootHeight > 550,
    minSize: Math.min(170, Math.max(170, rootHeight / 2)),
    maxSize: rootHeight > 650 ? rootHeight * 0.7 : rootHeight * 0.6,
  }
}

export function usePaneSize({
  visionRootRef,
}: {
  visionRootRef: React.RefObject<HTMLDivElement | null>
}) {
  const [isNarrowBreakpoint, setIsNarrowBreakpoint] = useState(() => narrowBreakpoint())
  const [paneSizeOptions, setPaneSizeOptions] = useState<PaneSizeOptions>(() =>
    calculatePaneSizeOptions(undefined),
  )

  useEffect(() => {
    if (!visionRootRef.current) {
      return undefined
    }
    const handleResize = (entries: ResizeObserverEntry[]) => {
      setIsNarrowBreakpoint(narrowBreakpoint())
      const entry = entries?.[0]
      if (entry) {
        setPaneSizeOptions(calculatePaneSizeOptions(entry.contentRect.height))
      }
    }
    const resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(visionRootRef.current)

    return () => {
      resizeObserver.disconnect()
    }
  }, [visionRootRef])

  return {paneSizeOptions, isNarrowBreakpoint}
}
