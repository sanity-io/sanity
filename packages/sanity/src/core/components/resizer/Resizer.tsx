import {type MouseEvent, useCallback, useRef} from 'react'

import {root} from './Resizer.css'

export function Resizer(props: {
  onResize: (delta: number) => void
  onResizeStart: () => void
  position: 'left' | 'right'
}) {
  const {onResize, onResizeStart, position} = props

  const mouseXRef = useRef(0)

  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      event.preventDefault()

      mouseXRef.current = event.pageX

      onResizeStart()

      const handleMouseMove = (e: globalThis.MouseEvent) => {
        e.preventDefault()
        onResize(mouseXRef.current - e.pageX)
      }

      const controller = new AbortController()
      const handleMouseUp = () => controller.abort()

      const {signal} = controller
      window.addEventListener('mousemove', handleMouseMove, {signal})
      window.addEventListener('mouseup', handleMouseUp, {signal})
    },
    [onResize, onResizeStart],
  )

  return (
    <div className={root[position]} onMouseDown={handleMouseDown}>
      {/* Hover effect */}
      <span />

      {/* Border */}
      <span />
    </div>
  )
}
