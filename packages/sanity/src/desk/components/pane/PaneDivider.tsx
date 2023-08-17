import {Layer} from '@sanity/ui'
import React, {useCallback, useState} from 'react'
import styled from 'styled-components'
import {usePaneLayout} from './usePaneLayout'

const Root = styled(Layer)`
  position: relative;
  width: 1px;
  min-width: 1px;

  &:before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 1px;
    background-color: var(--card-border-color);
  }

  &:not([data-disabled]) {
    cursor: ew-resize;
    width: 9px;
    min-width: 9px;
    margin: 0 -4px;

    &:before {
      left: 4px;
    }

    &:after {
      content: '';
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 9px;
      bottom: 0;
      background-color: var(--card-border-color);
      opacity: 0;
      transition: opacity 150ms;
    }

    &[data-dragging]:after,
    &:hover:after {
      opacity: 0.2;
    }
  }
`

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
    <Root
      data-disabled={disabled ? '' : undefined}
      data-dragging={dragging ? '' : undefined}
      onMouseDown={handleMouseDown}
    />
  )
}
