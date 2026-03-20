import {type MouseEvent, useCallback, useRef} from 'react'

import {borderSpan, hoverSpan, hoverSpanWithHover, resizerRoot} from './Resizer.css'

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

      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [onResize, onResizeStart],
  )

  return (
    <div className={resizerRoot[position]} onMouseDown={handleMouseDown}>
      {/* Hover effect */}
      <span className={borderSpan[position]} />

      {/* Border */}
      <span className={`${hoverSpan[position]} ${hoverSpanWithHover}`} />
    </div>
  )
}
