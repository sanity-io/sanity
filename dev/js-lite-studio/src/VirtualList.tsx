/** A windowed list with fixed row heights: only the rows in view (plus `overscan`) are in the
 * DOM, however long the list is. */
import {
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

/** The rows to render for a scroll position: `[start, end)`. */
export function visibleRange(
  length: number,
  rowHeight: number,
  scrollTop: number,
  height: number,
  overscan: number,
): [number, number] {
  if (length === 0 || rowHeight <= 0) return [0, 0]
  const first = Math.max(Math.floor(scrollTop / rowHeight), 0)
  const count = Math.ceil(height / rowHeight) + 1
  return [
    Math.min(Math.max(first - overscan, 0), length),
    Math.min(first + count + overscan, length),
  ]
}

interface Viewport {
  scrollTop: number
  height: number
}

function measureViewport(
  element: HTMLDivElement | null,
  setViewport: Dispatch<SetStateAction<Viewport>>,
): void {
  if (!element) return
  const next = {scrollTop: element.scrollTop, height: element.clientHeight}
  setViewport((current) =>
    current.scrollTop === next.scrollTop && current.height === next.height ? current : next,
  )
}

export function VirtualList<T>(props: {
  items: T[]
  rowHeight: number
  rowKey: (item: T, index: number) => string
  render: (item: T, index: number) => ReactNode
  overscan?: number
  /** Called with the rendered `[start, end)` whenever it changes, eg to fetch those rows. */
  onRange?: (range: [number, number]) => void
  /** Scrolls back to the top when it changes. */
  scrollReset?: number
}) {
  const {items, rowHeight, onRange, scrollReset} = props
  const overscan = props.overscan ?? 8
  const container = useRef<HTMLDivElement>(null)
  const [viewport, setViewport] = useState<Viewport>({scrollTop: 0, height: 800})

  const measure = () => measureViewport(container.current, setViewport)

  useLayoutEffect(() => {
    const onResize = () => measureViewport(container.current, setViewport)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const firstReset = useRef(scrollReset)
  useLayoutEffect(() => {
    if (firstReset.current === scrollReset) return
    firstReset.current = scrollReset
    if (container.current) container.current.scrollTop = 0
  }, [scrollReset])

  const [start, end] = visibleRange(
    items.length,
    rowHeight,
    viewport.scrollTop,
    viewport.height,
    overscan,
  )
  useEffect(() => {
    onRange?.([start, end])
  }, [start, end, onRange])

  const rows: ReactNode[] = []
  for (let index = start; index < end; index++) {
    const item = items[index]
    rows.push(
      <div
        key={`${props.rowKey(item, index)}:${index}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: rowHeight,
          transform: `translateY(${index * rowHeight}px)`,
        }}
      >
        {props.render(item, index)}
      </div>,
    )
  }

  return (
    <div
      ref={container}
      data-ui="VirtualList"
      style={{height: '100%', overflowY: 'auto', overflowAnchor: 'none', contain: 'strict'}}
      onScroll={measure}
    >
      <div style={{position: 'relative', width: '100%', height: items.length * rowHeight}}>
        {rows}
      </div>
    </div>
  )
}
