import React from 'react'
import {ArrowHead, Direction} from './ArrowHead'

interface Bounds {
  height: number
  width: number
}

const moveTo = (from: number, to: number) => `M${from},${to}`
const lineTo = (from: number, to: number) => `L${from},${to}`

export interface Point {
  top: number
  left: number
}

function cubicBezierPath(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number,
  p4x: number,
  p4y: number
) {
  return `M${p1x},${p1y}C${p2x},${p2y} ${p3x},${p3y} ${p4x},${p4y}`
}

function quadraticBezierPath(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  p3x: number,
  p3y: number
) {
  return `M${p1x},${p1y}Q${p2x},${p2y} ${p3x},${p3y}`
}

function linePath(p1x: number, p1y: number, p2x: number, p2y: number) {
  return `M${p1x},${p1y}L${p2x},${p2y}`
}

const blue = (opacity = 1) => `rgba(34, 118, 252, ${opacity})`
const BLUE = blue()

const DEBUG = true

const ARROW_EDGE_THRESHOLD = 10
// when the arrow reaches the top / bottom threshold it will move this amount in pixels towards the midle
const ARROW_PADDING = 20
const padLeft = (point: Point, bounds: Bounds) => {
  const distEdge = Math.min(point.top, bounds.height - point.top)
  return {
    ...point,
    left: point.left + Math.min(ARROW_EDGE_THRESHOLD, Math.max(0, ARROW_PADDING - distEdge))
  }
}

const padRight = (point: Point, bounds: Bounds) => {
  const distEdge = Math.min(point.top, bounds.height - point.top)
  return {
    ...point,
    left: point.left - Math.min(ARROW_EDGE_THRESHOLD, Math.max(0, ARROW_PADDING - distEdge))
  }
}

const clamp = (point: Point, bounds: Bounds) => {
  return {...point, top: Math.min(Math.max(0, point.top), bounds.height)}
}

function isNotNullable<T>(v: T | null): v is T {
  return Boolean(v)
}

const ARROW_THRESHOLD = 20
function getArrow(
  point: Point,
  bounds: Bounds
): null | {point: Point; direction: Direction; color: string} {
  const distTop = point.top - ARROW_THRESHOLD
  if (distTop < 0) {
    return {
      point: clamp(point, bounds),
      direction: 'n',
      color: blue(1 / Math.max(0, ARROW_THRESHOLD / -distTop))
    }
  }
  const distBottom = bounds.height - point.top - ARROW_THRESHOLD
  if (distBottom < 0) {
    return {
      point: clamp(point, bounds),
      direction: 's',
      color: blue(1 / Math.max(0, ARROW_THRESHOLD / -distBottom))
    }
  }
  return null
}

type Line = {from: Point; to: Point}

const STROKE_WIDTH = 2
const CORNER_RADIUS = 15

const hLine = (top: number, from: number, to: number): Line => ({
  from: {top, left: from},
  to: {top, left: to}
})

const vLine = (left: number, from: number, to: number): Line => ({
  from: {top: from, left: left},
  to: {top: to, left: left}
})

const drawLine = (line: Line) => linePath(line.from.left, line.from.top, line.to.left, line.to.top)

const connect = (p1: Point, p2: Point, dir: 'h' | 'v') => {
  const midLeft = dir === 'v' ? p2.left : p1.left
  const midTop = dir === 'v' ? p1.top : p2.top
  return quadraticBezierPath(p1.left, p1.top, midLeft, midTop, p2.left, p2.top)
}

interface Props {
  from: Point
  to: Point
  clampLeft: {top: number; bottom: number}
  clampRight: {top: number; bottom: number}
}
export function Connector(props: Props) {
  const from = props.from
  const to = props.to
  const verticalCenter =
    typeof props.verticalCenter === 'number'
      ? props.verticalCenter
      : from.left + (to.left - from.left) / 2

  const clampedFromTop = Math.min(
    props.clampLeft.bottom + CORNER_RADIUS,
    Math.max(from.top, props.clampLeft.top + CORNER_RADIUS)
  )
  const clampedToTop = Math.min(
    props.clampRight.bottom + CORNER_RADIUS,
    Math.max(to.top, props.clampRight.top + CORNER_RADIUS)
  )

  // vertical distance between the two horizontal lines
  const vDist = clampedToTop - clampedFromTop

  const leftArrowDir = clampedFromTop > from.top ? -1 : 1
  const rightArrowDir = clampedToTop > to.top ? -1 : 1

  // there are four arcs, so distribute their height evenly
  const arcHeight = Math.min(CORNER_RADIUS, vDist / 2)

  const shiftLeft = Math.min(Math.abs(from.top - clampedFromTop), CORNER_RADIUS / 2)
  const shiftRight = Math.min(Math.abs(to.top - clampedToTop), CORNER_RADIUS / 2)
  const hLine1 = hLine(clampedFromTop, from.left + shiftLeft, verticalCenter - CORNER_RADIUS)

  const hLine2 = hLine(
    clampedToTop,
    verticalCenter + CORNER_RADIUS,
    to.left - Math.min(Math.abs(to.top - clampedToTop), CORNER_RADIUS / 2)
  )

  const vMidLine = vLine(
    verticalCenter,
    Math.max(clampedFromTop + arcHeight, clampedFromTop - CORNER_RADIUS),
    Math.min(clampedToTop - arcHeight, clampedToTop + CORNER_RADIUS)
  )

  return (
    <>
      <path
        d={
          connect(
            {top: clampedFromTop + shiftLeft * leftArrowDir, left: from.left},
            hLine1.from,
            'h'
          ) +
          drawLine(hLine1) +
          connect(hLine1.to, vMidLine.from, 'v') +
          drawLine(vMidLine) +
          connect(vMidLine.to, hLine2.from, 'h') +
          drawLine(hLine2) +
          connect(
            hLine2.to,
            {
              top: clampedToTop + shiftRight * rightArrowDir,
              left: to.left
            },
            'v'
          )
        }
        width={1}
        fill="none"
        stroke={BLUE}
        strokeWidth={STROKE_WIDTH}
      />
    </>
  )
}
