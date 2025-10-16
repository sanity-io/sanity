import {type MouseEvent, useCallback, useRef} from 'react'

import * as styles from './Resizer.css'

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
    <div className={styles.rootStyles[position]} onMouseDown={handleMouseDown}>
      {/* Border */}
      <span className={styles.borderStyles[position]} />

      {/* Hover effect */}
      <span className={`${styles.hoverEffectStyles[position]} ${styles.hoverEffectHoverStyle}`} />
    </div>
  )
}
