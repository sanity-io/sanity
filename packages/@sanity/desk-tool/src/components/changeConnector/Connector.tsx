import React from 'react'
import {linePath, quadraticBezierPath} from './svgHelpers'

export interface Point {
  top: number
  left: number
}

const blue = (opacity = 1) => `rgba(34, 118, 252, ${opacity})`
const BLUE = blue()

type Line = {from: Point; to: Point}

const STROKE_WIDTH = 2
const CORNER_RADIUS = 10

const hLine = (top: number, from: number, to: number): Line => ({
  from: {top, left: from},
  to: {top, left: to}
})

export const vLine = (left: number, from: number, to: number): Line => ({
  from: {top: from, left: left},
  to: {top: to, left: left}
})

export const drawLine = (line: Line) => linePath(line.from.left, line.from.top, line.to.left, line.to.top)

const connect = (p1: Point, p2: Point, dir: 'h' | 'v') => {
  const midLeft = dir === 'v' ? p2.left : p1.left
  const midTop = dir === 'v' ? p1.top : p2.top
  return quadraticBezierPath(p1.left, p1.top, midLeft, midTop, p2.left, p2.top)
}

interface Props {
  from: Point
  to: Point
  verticalCenter?: number
  clampLeft: {top: number; bottom: number}
  clampRight: {top: number; bottom: number}
}
export function Connector(props: React.ComponentProps<'path'> & Props) {
  const {from, to, verticalCenter: _, clampLeft, clampRight, ...rest} = props
  const verticalCenter =
    typeof props.verticalCenter === 'number'
      ? props.verticalCenter
      : from.left + (to.left - from.left) / 2

  const clampedFromTop = Math.min(
    clampLeft.bottom + CORNER_RADIUS,
    Math.max(from.top, clampLeft.top + CORNER_RADIUS)
  )
  const clampedToTop = Math.min(
    clampRight.bottom + CORNER_RADIUS,
    Math.max(to.top, clampRight.top + CORNER_RADIUS)
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

  const path =
    connect({top: clampedFromTop + shiftLeft * leftArrowDir, left: from.left}, hLine1.from, 'h') +
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
  return (
    <>
      <path d={path} fill="none" stroke={BLUE} strokeWidth={STROKE_WIDTH} />
      <path
        d={path}
        fill="none"
        stroke="none"
        strokeWidth={STROKE_WIDTH + 2}
        style={{pointerEvents: 'all'}}
      />
    </>
  )
}
