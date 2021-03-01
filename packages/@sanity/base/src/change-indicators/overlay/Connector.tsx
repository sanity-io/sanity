import React from 'react'

import {arrowPath, generateConnectorPath} from './connectorPath'
import {mapConnectorToLine} from './mapConnectorToLine'
import {
  ARROW_MARGIN_X,
  ARROW_MARGIN_Y,
  ARROW_THRESHOLD,
  DEBUG,
  INTERACTIVE_STROKE_WIDTH,
  STROKE_WIDTH,
} from '../constants'
import {Rect} from './types'
import styles from './Connector.css'
import classNames from 'classnames'
import {ClampedRect} from './ClampedRect'

interface Props {
  from: {rect: Rect; bounds: Rect}
  to: {rect: Rect; bounds: Rect}
  hovered: boolean
  revertHovered: boolean
  focused: boolean
}

export function Connector({from, to, hovered, focused, revertHovered}: Props) {
  const line = mapConnectorToLine({from, to})

  // If both ends of the connector are out of bounds, then do not render
  if (line.from.outOfBounds && line.to.outOfBounds) {
    return null
  }

  const linePathDescription = generateConnectorPath(line)

  const pathClassName = classNames(
    styles.path,
    focused && styles.focused,
    revertHovered && styles.revertHovered,
    hovered && !focused && !revertHovered && styles.hovered
  )

  const rightBarClassName = classNames(
    styles.rightBar,
    focused && styles.rightBarFocused,
    revertHovered && styles.rightBarRevertHovered,
    hovered && !focused && !revertHovered && styles.rightBarHovered
  )

  return (
    <>
      <path
        className={styles.interactivePath}
        d={linePathDescription}
        strokeWidth={INTERACTIVE_STROKE_WIDTH}
      />

      <path className={pathClassName} d={linePathDescription} strokeWidth={STROKE_WIDTH} />
      <ClampedRect
        className={rightBarClassName}
        top={to.rect.top}
        left={to.rect.left}
        height={to.rect.height}
        width={STROKE_WIDTH}
        bounds={to.bounds}
      />

      {line.from.isAbove && (
        <path
          className={pathClassName}
          d={arrowPath(
            line.from.left + ARROW_MARGIN_X,
            line.from.bounds.top - ARROW_THRESHOLD + ARROW_MARGIN_Y,
            -1
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {line.from.isBelow && (
        <path
          className={pathClassName}
          d={arrowPath(
            line.from.left + ARROW_MARGIN_X,
            line.from.bounds.top + line.from.bounds.height + ARROW_THRESHOLD - ARROW_MARGIN_Y,
            1
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {line.to.isAbove && (
        <path
          className={pathClassName}
          d={arrowPath(
            line.to.bounds.left + ARROW_MARGIN_X,
            line.to.bounds.top - ARROW_THRESHOLD + ARROW_MARGIN_Y,
            -1
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {line.to.isBelow && (
        <path
          className={pathClassName}
          d={arrowPath(
            line.to.bounds.left + ARROW_MARGIN_X,
            line.to.bounds.top + line.to.bounds.height + ARROW_THRESHOLD - ARROW_MARGIN_Y,
            1
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {DEBUG && (
        <>
          <rect
            className={styles.debugRect}
            x={line.from.bounds.left}
            y={line.from.bounds.top}
            width={line.from.bounds.width}
            height={line.from.bounds.height}
            stroke="green"
          />

          <rect
            className={styles.debugRect}
            x={line.to.bounds.left}
            y={line.to.bounds.top}
            width={line.to.bounds.width}
            height={line.to.bounds.height}
            stroke="yellow"
          />

          {!line.from.outOfBounds && (
            <g transform={`translate(${line.from.bounds.left} ${line.from.bounds.top})`}>
              <rect
                className={styles.debugRect}
                width={line.from.bounds.width}
                height={line.from.bounds.height}
                strokeWidth={STROKE_WIDTH}
                stroke="green"
              />
            </g>
          )}

          {!line.to.outOfBounds && (
            <g transform={`translate(${line.to.bounds.left} ${line.to.bounds.top})`}>
              <rect
                className={styles.debugRect}
                width={line.to.bounds.width}
                height={line.to.bounds.height}
                strokeWidth={STROKE_WIDTH}
                stroke="red"
              />
            </g>
          )}
        </>
      )}
    </>
  )
}
