import React from 'react'
import {sortBy} from 'lodash'
import classNames from 'classnames/bind'
import {Path} from '@sanity/types'
import {ScrollMonitor} from 'part:@sanity/components/scroll'
import {useReportedValues, Reported, TrackedChange} from '../'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import getRelativeRect from '../helpers/getRelativeRect'
import isChangeBar from '../helpers/isChangeBar'
import scrollIntoView from '../helpers/scrollIntoView'
import {CONNECTOR_BOUNDS_MARGIN, DEBUG_LAYER_BOUNDS, VERTICAL_CONNECTOR_PADDING} from '../constants'
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
  const changeBarsWithFocusOrHover = allReportedValues
    .filter(isChangeBar)
    .filter(
      ([id, reportedChangeBar]) =>
        reportedChangeBar.isChanged &&
        (id === hovered || reportedChangeBar.hasHover || reportedChangeBar.hasFocus)
    )

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
          const changeMarkerLeft = change.rect.left

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
            left: field.rect.left + field.rect.width,
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

          const cx = classNames.bind(styles)
          const connectorClassNames = cx({
            dangerConnector: change.hasRevertHover,
            connector: !change.hasRevertHover,
            hoverConnector: !change.hasRevertHover && !hasFocus && change.hasHover
          })

          const onConnectorClick = () => {
            scrollIntoView(field)
            scrollIntoView(change)

            onSetFocus(field.path)
          }

          return (
            <React.Fragment key={`field-${field.id}`}>
              {change && (
                <g onClick={onConnectorClick} className={connectorClassNames}>
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
                  {fieldBottom <= fieldClampConnector.top && (
                    <Arrow
                      top={fieldClampConnector.top}
                      left={connectorFrom.left}
                      length={5}
                      wingLength={8}
                      direction="n"
                    />
                  )}

                  {/* arrow left bottom */}
                  {fieldTop >= fieldClampConnector.bottom && (
                    <Arrow
                      top={fieldClampConnector.bottom}
                      left={connectorFrom.left}
                      length={5}
                      wingLength={8}
                      direction="s"
                    />
                  )}

                  {/* arrow right top */}
                  {changeBottom <= changeClampConnector.top && (
                    <Arrow
                      top={changeClampConnector.top}
                      left={connectorTo.left}
                      length={5}
                      wingLength={8}
                      direction="n"
                    />
                  )}

                  {/* arrow right bottom */}
                  {changeTop > changeClampConnector.bottom && (
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
                    strokeWidth={2}
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
                    strokeWidth={2}
                  />
                  <line
                    x1={field.rect.left}
                    y1={fieldClampConnector.top}
                    x2={field.rect.left + field.rect.width}
                    y2={fieldClampConnector.top}
                    stroke="yellow"
                    strokeWidth={2}
                  />
                  <line
                    x1={field.rect.left}
                    y1={field.rect.bounds.bottom}
                    x2={field.rect.left + field.rect.width}
                    y2={field.rect.bounds.bottom}
                    stroke="black"
                    strokeWidth={2}
                  />

                  <line
                    x1={field.rect.left}
                    y1={fieldClampConnector.bottom}
                    x2={field.rect.left + field.rect.width}
                    y2={fieldClampConnector.bottom}
                    stroke="yellow"
                    strokeWidth={2}
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
