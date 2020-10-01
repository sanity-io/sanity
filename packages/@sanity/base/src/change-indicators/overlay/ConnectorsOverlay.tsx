import React from 'react'
import {sortBy} from 'lodash'
import {Path} from '@sanity/types'
import {ScrollMonitor} from 'part:@sanity/components/scroll'
import {useReportedValues, Reported, TrackedChange} from '../'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import getRelativeRect from '../helpers/getRelativeRect'
import isChangeBar from '../helpers/isChangeBar'
import scrollIntoView from '../helpers/scrollIntoView'
import {
  CONNECTOR_BOUNDS_MARGIN,
  CONNECTOR_STROKE_WIDTH,
  DEBUG_LAYER_BOUNDS,
  VERTICAL_CONNECTOR_PADDING
} from '../constants'
import {Connector, drawLine, vLine} from './Connector'
import {Arrow} from './Arrow'
import styles from './ConnectorsOverlay.css'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

const DEBUG = false

interface Props {
  rootRef: HTMLDivElement
  onSetFocus: (nextFocusPath: Path) => void
}

export const ConnectorsOverlay = React.memo(function ConnectorsOverlay(props: Props) {
  const {rootRef, onSetFocus} = props

  const [hovered, setHovered] = React.useState<string | null>(null)

  const allReportedValues = useReportedValues()
  const [, forceUpdate] = React.useReducer(n => n + 1, 0)
  const byId = new Map(allReportedValues)

  const reportedChangesPanel = byId.get('changesPanel')

  if (!reportedChangesPanel) {
    return null
  }

  const changesPanelRect = getRelativeRect(reportedChangesPanel.element, rootRef)

  const changeBarsWithHover: Reported<TrackedChange>[] = []
  const changeBarsWithFocus: Reported<TrackedChange>[] = []
  for (const value of allReportedValues) {
    if (!isChangeBar(value) || !value[1].isChanged) {
      continue
    }

    const [id, reportedChangeBar] = value
    if (id === hovered) {
      changeBarsWithHover.push(value)
      continue
    }

    if (reportedChangeBar.hasHover) {
      changeBarsWithHover.push(value)
      continue
    }

    if (reportedChangeBar.hasFocus) {
      changeBarsWithFocus.push(value)
      continue
    }
  }

  const isHoverConnector = changeBarsWithHover.length > 0
  const changeBarsWithFocusOrHover = isHoverConnector ? changeBarsWithHover : changeBarsWithFocus

  const enabledConnectors = changeBarsWithFocusOrHover
    .map(([id]) => ({
      field: {id, ...findMostSpecificTarget('field', id, byId)},
      change: {id, ...findMostSpecificTarget('change', id, byId)}
    }))
    .filter(({field, change}) => field && change && field.element && change.element)
    .map(({field, change}) => ({
      hasHover: field.hasHover || change.hasHover,
      hasFocus: field.hasFocus,
      field: {...field, rect: getRelativeRect(field.element, rootRef)},
      change: {...change, rect: getRelativeRect(change.element, rootRef)}
    }))

  // note: this assumes the changes panel header and the document panel always have the same height
  const topEdge = changesPanelRect?.top
  const verticalLineLeft = changesPanelRect?.left

  const visibleConnectors = sortBy(enabledConnectors, c => -c.field.path.length).slice(0, 1)

  return (
    <ScrollMonitor onScroll={forceUpdate}>
      <svg
        className={styles.svg}
        style={{
          ...(DEBUG ? {backgroundColor: 'rgba(0, 100, 100, 0.2)'} : {}),
          top: changesPanelRect.top,
          height: changesPanelRect.height
        }}
      >
        {visibleConnectors.map(({field, change, hasFocus}) => {
          const changeMarkerLeft = change.rect.left + CONNECTOR_STROKE_WIDTH / 2

          const fieldTop = field.rect.top + VERTICAL_CONNECTOR_PADDING
          const fieldBottom = field.rect.top + field.rect.height - VERTICAL_CONNECTOR_PADDING
          const changeTop = change.rect.top + VERTICAL_CONNECTOR_PADDING
          const changeBottom = change.rect.top + change.rect.height - VERTICAL_CONNECTOR_PADDING

          let connectorFromTop
          let connectorToTop

          if (fieldBottom < changeTop) {
            connectorFromTop = fieldBottom
            connectorToTop = changeTop
          } else if (fieldTop > changeBottom) {
            connectorFromTop = fieldTop
            connectorToTop = changeBottom
          } else {
            connectorFromTop = Math.max(fieldTop, changeTop)
            connectorToTop = Math.max(fieldTop, changeTop)
          }

          const connectorFrom = {
            left: field.rect.left + field.rect.width + CONNECTOR_STROKE_WIDTH / 2,
            top: connectorFromTop
          }

          const connectorTo = {
            left: changeMarkerLeft,
            top: connectorToTop
          }

          const fieldClampConnector = {
            top: field.rect.bounds.top + CONNECTOR_BOUNDS_MARGIN,
            bottom: field.rect.bounds.bottom - CONNECTOR_BOUNDS_MARGIN
          }

          const changeClampConnector = {
            top: change.rect.bounds.top + CONNECTOR_BOUNDS_MARGIN,
            bottom: change.rect.bounds.bottom - CONNECTOR_BOUNDS_MARGIN
          }

          const drawArrowRightTop = changeBottom <= changeClampConnector.top
          const drawArrowLeftTop = fieldBottom <= fieldClampConnector.top
          const drawArrowLeftBottom = fieldTop >= fieldClampConnector.bottom
          const drawArrowRightBottom = changeTop > changeClampConnector.bottom

          if (drawArrowLeftTop && drawArrowRightTop) {
            // Prevent drawing ^----^ arrow
            return null
          } else if (drawArrowLeftBottom && drawArrowRightBottom) {
            // Prevent drawing v----v arrow
            return null
          }

          let connectorClassName = styles.connector
          if (change.hasRevertHover) {
            connectorClassName = styles.dangerConnector
          } else if (!hasFocus && isHoverConnector) {
            connectorClassName = styles.hoverConnector
          }

          const onConnectorClick = () => {
            scrollIntoView(field)
            scrollIntoView(change)

            onSetFocus(field.path)
          }

          return (
            <React.Fragment key={`field-${field.id}`}>
              {change && (
                <g onClick={onConnectorClick} className={connectorClassName}>
                  <Connector
                    from={connectorFrom}
                    to={connectorTo}
                    onMouseEnter={() => setHovered(field.id)}
                    onMouseLeave={() => setHovered(null)}
                    clampLeft={fieldClampConnector}
                    clampRight={changeClampConnector}
                    verticalCenter={verticalLineLeft! + 3}
                  />

                  {/* arrow left top */}
                  {drawArrowLeftTop && (
                    <Arrow
                      top={fieldClampConnector.top}
                      left={connectorFrom.left}
                      length={5}
                      wingLength={8}
                      direction="n"
                    />
                  )}

                  {/* arrow left bottom */}
                  {drawArrowLeftBottom && (
                    <Arrow
                      top={fieldClampConnector.bottom}
                      left={connectorFrom.left}
                      length={5}
                      wingLength={8}
                      direction="s"
                    />
                  )}

                  {/* arrow right top */}
                  {drawArrowRightTop && (
                    <Arrow
                      top={changeClampConnector.top}
                      left={connectorTo.left}
                      length={5}
                      wingLength={8}
                      direction="n"
                    />
                  )}

                  {/* arrow right bottom */}
                  {drawArrowRightBottom && (
                    <Arrow
                      top={changeClampConnector.bottom}
                      left={connectorTo.left}
                      length={5}
                      wingLength={8}
                      direction="s"
                    />
                  )}

                  {/* this is the bar marking the line in the changes panel */}
                  <path
                    onClick={onConnectorClick}
                    d={drawLine(
                      vLine(
                        connectorTo.left,
                        Math.max(
                          change.rect.bounds.top,
                          Math.min(
                            change.rect.top - topEdge! + change.rect.bounds.bottom - 19,
                            change.rect.top - topEdge!
                          )
                        ),
                        Math.max(
                          change.rect.bounds.top,
                          Math.min(
                            change.rect.top - topEdge! + change.rect.bounds.bottom - 19,
                            change.rect.top - topEdge! + change.rect.height
                          )
                        )
                      )
                    )}
                    strokeWidth={CONNECTOR_STROKE_WIDTH}
                  />
                </g>
              )}
              {DEBUG_LAYER_BOUNDS && (
                <>
                  <line
                    x1={field.rect.left}
                    y1={field.rect.bounds.top}
                    x2={field.rect.left + field.rect.width}
                    y2={field.rect.bounds.top}
                    stroke="black"
                    strokeWidth={CONNECTOR_STROKE_WIDTH}
                  />
                  <line
                    x1={field.rect.left}
                    y1={fieldClampConnector.top}
                    x2={field.rect.left + field.rect.width}
                    y2={fieldClampConnector.top}
                    stroke="yellow"
                    strokeWidth={CONNECTOR_STROKE_WIDTH}
                  />
                  <line
                    x1={field.rect.left}
                    y1={field.rect.bounds.bottom}
                    x2={field.rect.left + field.rect.width}
                    y2={field.rect.bounds.bottom}
                    stroke="black"
                    strokeWidth={CONNECTOR_STROKE_WIDTH}
                  />

                  <line
                    x1={field.rect.left}
                    y1={fieldClampConnector.bottom}
                    x2={field.rect.left + field.rect.width}
                    y2={fieldClampConnector.bottom}
                    stroke="yellow"
                    strokeWidth={CONNECTOR_STROKE_WIDTH}
                  />
                </>
              )}
            </React.Fragment>
          )
        })}
      </svg>
    </ScrollMonitor>
  )
})
