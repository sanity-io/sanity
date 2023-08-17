import {
  ARROW_MARGIN_X,
  ARROW_MARGIN_Y,
  ARROW_SIZE,
  ARROW_THRESHOLD,
  CORNER_RADIUS,
} from '../constants'
import {ConnectorLine} from './types'

export function arrowPath(x: number, y: number, dir: number): string {
  return [
    `M ${x - ARROW_SIZE} ${y - ARROW_SIZE * dir} `,
    `L ${x} ${y}`,
    `L ${x + ARROW_SIZE} ${y - ARROW_SIZE * dir}`,
  ].join('')
}

function moveTo(x: number, y: number) {
  return `M${x} ${y}`
}

function lineTo(x: number, y: number) {
  return `L${x} ${y}`
}

function join(strings: string[], delim = '') {
  return strings.join(delim)
}

function quadCurve(x1: number, y1: number, x: number, y: number) {
  return `Q${x1} ${y1} ${x} ${y}`
}

export function generateConnectorPath(line: ConnectorLine): string {
  const {from, to} = line
  const {left: fromX, top: fromY} = from
  const {left: toX, top: toY} = to

  const cmds: string[] = []

  // Calculate maximum corner radius
  const r1 = Math.min(CORNER_RADIUS, Math.abs(fromY - toY) / 2)

  // FROM
  if (from.isAbove) {
    cmds.push(
      moveTo(fromX + ARROW_MARGIN_X, fromY - ARROW_THRESHOLD + ARROW_MARGIN_Y),
      lineTo(fromX + ARROW_MARGIN_X, fromY - CORNER_RADIUS),
      quadCurve(fromX + ARROW_MARGIN_X, fromY, fromX + ARROW_MARGIN_X + CORNER_RADIUS, fromY),
    )
  } else if (from.isBelow) {
    cmds.push(
      moveTo(fromX + ARROW_MARGIN_X, fromY + ARROW_THRESHOLD - ARROW_MARGIN_Y),
      lineTo(fromX + ARROW_MARGIN_X, fromY + CORNER_RADIUS),
      quadCurve(fromX + ARROW_MARGIN_X, fromY, fromX + ARROW_MARGIN_X + CORNER_RADIUS, fromY),
    )
  } else {
    cmds.push(moveTo(fromX, fromY))
  }

  // TO
  if (to.isAbove) {
    if (fromY < to.bounds.top) {
      cmds.push(
        lineTo(to.bounds.left - 8 - r1, fromY),
        quadCurve(to.bounds.left - 8, fromY, to.bounds.left - 8, fromY + r1),
        lineTo(to.bounds.left - 8, toY - r1),
        quadCurve(to.bounds.left - 8, toY, to.bounds.left - 8 + r1, toY),
        lineTo(to.bounds.left + ARROW_MARGIN_X - CORNER_RADIUS, toY),
        quadCurve(
          to.bounds.left + ARROW_MARGIN_X,
          toY,
          to.bounds.left + ARROW_MARGIN_X,
          toY - CORNER_RADIUS,
        ),
        lineTo(to.bounds.left + ARROW_MARGIN_X, toY - ARROW_THRESHOLD + ARROW_MARGIN_Y),
      )
    } else {
      cmds.push(
        lineTo(to.bounds.left + ARROW_MARGIN_X - CORNER_RADIUS, fromY),
        quadCurve(
          to.bounds.left + ARROW_MARGIN_X,
          fromY,
          to.bounds.left + ARROW_MARGIN_X,
          fromY - CORNER_RADIUS,
        ),
        lineTo(to.bounds.left + ARROW_MARGIN_X, toY - ARROW_THRESHOLD + ARROW_MARGIN_Y),
      )
    }
  } else if (to.isBelow) {
    if (fromY > to.bounds.top + to.bounds.height) {
      // curl around
      cmds.push(
        lineTo(to.bounds.left - ARROW_MARGIN_X - r1, fromY),
        quadCurve(
          to.bounds.left - ARROW_MARGIN_X,
          fromY,
          to.bounds.left - ARROW_MARGIN_X,
          fromY - r1,
        ),
        lineTo(to.bounds.left - ARROW_MARGIN_X, toY + r1),
        quadCurve(to.bounds.left - ARROW_MARGIN_X, toY, to.bounds.left - ARROW_MARGIN_X + r1, toY),
        lineTo(to.bounds.left + ARROW_MARGIN_X - CORNER_RADIUS, toY),
        quadCurve(
          to.bounds.left + ARROW_MARGIN_X,
          toY,
          to.bounds.left + ARROW_MARGIN_X,
          toY + CORNER_RADIUS,
        ),
        lineTo(to.bounds.left + ARROW_MARGIN_X, toY + ARROW_THRESHOLD - ARROW_MARGIN_Y),
      )
    } else {
      cmds.push(
        lineTo(to.bounds.left + ARROW_MARGIN_X - CORNER_RADIUS, fromY),
        quadCurve(
          to.bounds.left + ARROW_MARGIN_X,
          fromY,
          to.bounds.left + ARROW_MARGIN_X,
          fromY + CORNER_RADIUS,
        ),
        lineTo(to.bounds.left + ARROW_MARGIN_X, toY + ARROW_THRESHOLD - ARROW_MARGIN_Y),
      )
    }
  } else if (fromY < toY) {
    cmds.push(
      lineTo(to.bounds.left + ARROW_MARGIN_X - r1, fromY),
      quadCurve(
        to.bounds.left + ARROW_MARGIN_X,
        fromY,
        to.bounds.left + ARROW_MARGIN_X,
        fromY + r1,
      ),
      lineTo(to.bounds.left + ARROW_MARGIN_X, toY - r1),
      quadCurve(to.bounds.left + ARROW_MARGIN_X, toY, to.bounds.left + ARROW_MARGIN_X + r1, toY),
      lineTo(toX, toY),
    )
  } else {
    cmds.push(
      lineTo(to.bounds.left + ARROW_MARGIN_X - r1, fromY),
      quadCurve(
        to.bounds.left + ARROW_MARGIN_X,
        fromY,
        to.bounds.left + ARROW_MARGIN_X,
        fromY - r1,
      ),
      lineTo(to.bounds.left + ARROW_MARGIN_X, toY + r1),
      quadCurve(to.bounds.left + ARROW_MARGIN_X, toY, to.bounds.left + ARROW_MARGIN_X + r1, toY),
      lineTo(toX, toY),
    )
  }

  return join(cmds)
}
