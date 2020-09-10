import React from 'react'
import {lineTo, moveTo} from './svgHelpers'

export type Direction = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
const DIRECTIONS: Record<Direction, number> = {
  n: 0,
  ne: 45,
  e: 90,
  se: 135,
  s: 180,
  sw: 225,
  w: 270,
  nw: 315
}

const makeArrowHead = (size: number, top: number, left: number) =>
  moveTo(left, top) +
  lineTo(left + size, top) +
  lineTo(left + size, top) +
  lineTo(left, top) +
  moveTo(left, top) +
  lineTo(left, top + size) +
  lineTo(left, top + size) +
  lineTo(left, top)

export function ArrowHead({
  size,
  top,
  left,
  direction,
  color,
  opacity
}: {
  size: number
  top: number
  left: number
  direction: number | Direction
  color?: string
  opacity: number
}) {
  const angle = typeof direction === 'number' ? direction : DIRECTIONS[direction]

  return (
    <path
      d={makeArrowHead(size, top, left)}
      fill={color}
      style={{opacity, transition: 'opacity 200ms linear 0.3s'}}
      transform={`rotate(${45 + angle}, ${left}, ${top})`}
    />
  )
}
