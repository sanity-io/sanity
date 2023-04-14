import React, {useCallback, useRef} from 'react'
import styled from 'styled-components'

const Root = styled.div`
  position: absolute;
  top: 0;
  left: -4px;
  bottom: 0;
  width: 9px;
  z-index: 201;
  cursor: col-resize;

  & > span:nth-child(1),
  & > span:nth-child(3) {
    opacity: 0;
    display: block;
    border-left: 1px solid var(--card-border-color);
    position: absolute;
    top: 50%;
    margin-top: -16px;
    height: 32px;
    transition: opacity 200ms;
  }

  & > span:nth-child(2) {
    display: block;
    border-left: 1px solid var(--card-border-color);
    position: absolute;
    top: 0;
    left: 4px;
    bottom: 0;
    transition: opacity 200ms;
    opacity: 0.5;
  }

  & > span:nth-child(1) {
    left: 0;
  }

  & > span:nth-child(3) {
    left: 8px;
  }

  &:hover > span {
    opacity: 1;

    &:nth-child(2) {
      border-left-style: solid;
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
    [onResize, onResizeStart]
  )

  return (
    <Root onMouseDown={handleMouseDown}>
      <span />
      <span />
      <span />
    </Root>
  )
}
