import {type MouseEvent, useCallback, useRef} from 'react'
import {css, styled} from 'styled-components'

interface PositionProps {
  position: 'left' | 'right'
}

const Root = styled.div<PositionProps>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 9px;
  z-index: 201;
  cursor: ew-resize;

  ${({position}) =>
    position === 'right'
      ? css`
          right: -4px;
        `
      : css`
          left: -4px;
        `}

  /* Border */
  & > span:nth-child(1) {
    display: block;
    border-left: 1px solid var(--card-border-color);
    position: absolute;
    top: 0;
    ${({position}) =>
      position === 'right'
        ? css`
            right: 4px;
          `
        : css`
            left: 4px;
          `}
    bottom: 0;
    transition: opacity 200ms;
  }

  /* Hover effect */
  & > span:nth-child(2) {
    display: block;
    position: absolute;
    top: 0;
    ${({position}) =>
      position === 'right'
        ? css`
            right: 0px;
          `
        : css`
            left: 0px;
          `}
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
    <Root onMouseDown={handleMouseDown} position={position}>
      {/* Hover effect */}
      <span />

      {/* Border */}
      <span />
    </Root>
  )
}
