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

// up is default
const makeArrowHead = (size: number, length: number, left: number, top: number) => {
  const c = Math.sqrt(size ** 2 + size ** 2) / 2
  return [
    moveTo(left - c, top + c),
    lineTo(left, top),
    lineTo(left + c, top + c),
    moveTo(left, top),
    lineTo(left, top + length)
  ].join('')
}

export function ArrowHead({
  size,
  length,
  top,
  left,
  strokeWidth,
  direction,
  color
}: {
  size: number
  length: number
  strokeWidth: number
  top: number
  left: number
  direction: number | Direction
  color: string
}) {
  const angle = typeof direction === 'number' ? direction : DIRECTIONS[direction]
  return (
    <path
      d={makeArrowHead(size, length, left, top)}
      stroke={color}
      transform={`rotate(${angle}, ${left}, ${top})`}
      strokeWidth={strokeWidth}
      fill="none"
    />
  )
}
