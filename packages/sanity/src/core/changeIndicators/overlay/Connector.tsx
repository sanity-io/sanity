import React, {memo} from 'react'
import {
  ARROW_MARGIN_X,
  ARROW_MARGIN_Y,
  ARROW_THRESHOLD,
  DEBUG,
  INTERACTIVE_STROKE_WIDTH,
  STROKE_WIDTH,
} from '../constants'
import {arrowPath, generateConnectorPath} from './connectorPath'
import {mapConnectorToLine} from './mapConnectorToLine'
import {Rect} from './types'
import {DebugRect, ConnectorPath, InteractivePath, RightBarWrapper} from './Connector.styled'

interface Props {
  from: {rect: Rect; bounds: Rect}
  to: {rect: Rect; bounds: Rect}
}

export const Connector = memo(function Connector({from, to}: Props) {
  const line = mapConnectorToLine({from, to})

  // If both ends of the connector are out of bounds, then do not render
  if (line.from.outOfBounds && line.to.outOfBounds) {
    return null
  }

  const linePathDescription = generateConnectorPath(line)

  return (
    <>
      <InteractivePath d={linePathDescription} strokeWidth={INTERACTIVE_STROKE_WIDTH} />

      <ConnectorPath d={linePathDescription} strokeWidth={STROKE_WIDTH} />

      <RightBarWrapper
        top={to.rect.top}
        left={to.rect.left - 0.5}
        height={to.rect.height}
        width={STROKE_WIDTH}
        bounds={to.bounds}
      />

      {line.from.isAbove && (
        <ConnectorPath
          d={arrowPath(
            line.from.left + ARROW_MARGIN_X,
            line.from.bounds.top - ARROW_THRESHOLD + ARROW_MARGIN_Y,
            -1,
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {line.from.isBelow && (
        <ConnectorPath
          d={arrowPath(
            line.from.left + ARROW_MARGIN_X,
            line.from.bounds.top + line.from.bounds.height + ARROW_THRESHOLD - ARROW_MARGIN_Y,
            1,
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {line.to.isAbove && (
        <ConnectorPath
          d={arrowPath(
            line.to.bounds.left + ARROW_MARGIN_X,
            line.to.bounds.top - ARROW_THRESHOLD + ARROW_MARGIN_Y,
            -1,
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {line.to.isBelow && (
        <ConnectorPath
          d={arrowPath(
            line.to.bounds.left + ARROW_MARGIN_X,
            line.to.bounds.top + line.to.bounds.height + ARROW_THRESHOLD - ARROW_MARGIN_Y,
            1,
          )}
          strokeWidth={STROKE_WIDTH}
        />
      )}

      {DEBUG && (
        <>
          <DebugRect
            x={line.from.bounds.left}
            y={line.from.bounds.top}
            width={line.from.bounds.width}
            height={line.from.bounds.height}
            stroke="green"
          />

          <DebugRect
            x={line.to.bounds.left}
            y={line.to.bounds.top}
            width={line.to.bounds.width}
            height={line.to.bounds.height}
            stroke="yellow"
          />

          {!line.from.outOfBounds && (
            <g transform={`translate(${line.from.bounds.left} ${line.from.bounds.top})`}>
              <DebugRect
                width={line.from.bounds.width}
                height={line.from.bounds.height}
                strokeWidth={STROKE_WIDTH}
                stroke="green"
              />
            </g>
          )}

          {!line.to.outOfBounds && (
            <g transform={`translate(${line.to.bounds.left} ${line.to.bounds.top})`}>
              <DebugRect
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
})
