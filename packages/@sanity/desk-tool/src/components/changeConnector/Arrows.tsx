import React from 'react'
import {ArrowHead, Direction} from './ArrowHead'
import {Point} from './svgHelpers'

interface Bounds {
  height: number
  width: number
}

const clamp = (point: Point, bounds: Bounds) => {
  return {...point, top: Math.min(Math.max(0, point.top), bounds.height)}
}

function isNotNullable<T>(v: T | null): v is T {
  return Boolean(v)
}

const ARROW_THRESHOLD = 1
const ARROW_EDGE_DISTANCE = -4
function getArrow(
  point: Point,
  bounds: Bounds
): null | {point: Point; direction: Direction; opacity: number} {
  const distTop = point.top - ARROW_EDGE_DISTANCE
  if (distTop < ARROW_THRESHOLD) {
    return {
      point: clamp(point, bounds),
      direction: 'n',
      opacity: distTop < ARROW_EDGE_DISTANCE + 1 ? 1 : 0
    }
  }
  const distBottom = bounds.height - point.top - ARROW_EDGE_DISTANCE
  if (distBottom < ARROW_THRESHOLD) {
    return {
      point: clamp(point, bounds),
      direction: 's',
      opacity: distBottom < ARROW_EDGE_DISTANCE + 1 ? 1 : 0
    }
  }
  return null
}

interface Props {
  from: Point
  to: Point
  bounds: Bounds
  left: number
}

export function Arrows(props: Props) {
  const {from, to, left = (to.left - from.left) / 2} = props

  const arrows = [
    getArrow({top: from.top, left}, props.bounds),
    getArrow({top: to.top, left}, props.bounds)
  ]
  return (
    <>
      {arrows.filter(isNotNullable).map((arrow, i) => (
        <ArrowHead
          key={i}
          size={10}
          top={arrow.point.top}
          left={arrow.point.left}
          direction={arrow.direction}
          opacity={arrow.opacity}
        />
      ))}
    </>
  )
}
