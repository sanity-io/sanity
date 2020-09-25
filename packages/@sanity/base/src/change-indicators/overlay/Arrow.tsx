import * as React from 'react'
import {arrowPath} from './svgHelpers'

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

type Props = {
  wingLength: number
  length: number
  top: number
  left: number
  direction: number | Direction
} & Omit<React.ComponentProps<'path'>, 'length' | 'top' | 'left' | 'd'>
export function Arrow({wingLength, length, top, left, direction, ...rest}: Props) {
  const angle = typeof direction === 'number' ? direction : DIRECTIONS[direction]
  return (
    <path
      {...rest}
      d={arrowPath(wingLength, length, left, top)}
      transform={`rotate(${angle}, ${left}, ${top})`}
      fill="none"
    />
  )
}
