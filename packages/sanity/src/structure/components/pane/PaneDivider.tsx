import {Layer} from '@sanity/ui'
import {useCallback, useState} from 'react'

import * as styles from '../../Structure.css'
import {usePaneLayout} from './usePaneLayout'

/**
 *
 * @hidden
 * @beta This API will change. DO NOT USE IN PRODUCTION.
 */
export function PaneDivider({
  disabled,
  element,
}: {
  disabled?: boolean
  element: HTMLElement | null
}) {
  const {resize} = usePaneLayout()
  const [dragging, setDragging] = useState(false)

  const handleMouseDown = useCallback(
    (event: any) => {
      if (!element) return

      setDragging(true)

      event.preventDefault()

      const startX = event.pageX

      resize('start', element, 0)

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault()

        const deltaX = e.pageX - startX

        resize('move', element, deltaX)
      }

      const handleMouseUp = (e: MouseEvent) => {
        e.preventDefault()

        setDragging(false)

        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)

        resize('end', element, 0)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [element, resize],
  )

  return (
    <Layer
      className={styles.paneDividerRootStyle}
      data-disabled={disabled ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      onMouseDown={handleMouseDown}
    />
  )
}
