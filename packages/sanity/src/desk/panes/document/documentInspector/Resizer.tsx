import React, {useCallback, useRef} from 'react'
import styled from 'styled-components'

const Root = styled.div`
  position: absolute;
  top: 0;
  left: -4px;
  bottom: 0;
  width: 9px;
  z-index: 201;
  cursor: ew-resize;

  /* Border */
  & > span:nth-child(1) {
    display: block;
    border-left: 1px solid var(--card-border-color);
    position: absolute;
    top: 0;
    left: 4px;
    bottom: 0;
    transition: opacity 200ms;
    opacity: 0.5;
  }

  /* Hover effect */
  & > span:nth-child(2) {
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

  @media (hover: hover) {
    &:hover > span:nth-child(2) {
      opacity: 0.2;
    }
  }
`

export function Resizer(props: {onResize: (delta: number) => void; onResizeStart: () => void}) {
  const {onResize, onResizeStart} = props

  const mouseXRef = useRef(0)

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()

      mouseXRef.current = event.pageX

      onResizeStart()

      const handleMouseMove = (e: MouseEvent) => {
        e.preventDefault()
        onResize(e.pageX - mouseXRef.current)
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
    <Root onMouseDown={handleMouseDown}>
      {/* Hover effect */}
      <span />

      {/* Border */}
      <span />
    </Root>
  )
}
