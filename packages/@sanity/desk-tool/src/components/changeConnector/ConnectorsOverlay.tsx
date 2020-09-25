import React from 'react'
import _scrollIntoView from 'scroll-into-view-if-needed'
import {
  useReportedValues,
  Reported,
  TrackedChange,
  TrackedArea
} from '@sanity/base/lib/change-indicators'
import {CONNECTOR_BOUNDS_MARGIN, DEBUG_LAYER_BOUNDS, VERTICAL_CONNECTOR_PADDING} from './constants'
import {Connector, drawLine, vLine} from './Connector'
import {Arrow} from './Arrow'

import styles from './ConnectorsOverlay.css'

import {Path} from '@sanity/types'
import {ScrollMonitor} from 'part:@sanity/components/scroll'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

const DEBUG = false

const isScrollContainer = el => el.scrollHeight !== el.offsetHeight

const getOffsetsTo = (source: HTMLElement, target: HTMLElement) => {
  let el: HTMLElement | null = source
  const bounds: {top: number; height: number} = {
    top: 0,
    height: Number.MAX_SAFE_INTEGER
  }
  let top = 0
  let left = 0
  let foundScrollContainer = false
  while (el && el !== target) {
    if (foundScrollContainer) {
      bounds.top += el.offsetTop
    }

    if (isScrollContainer(el)) {
      bounds.top = el.offsetTop
      bounds.height = el.offsetHeight
      foundScrollContainer = true
    }
    top += el.offsetTop - el.scrollTop
    left += el.offsetLeft - el.scrollLeft
    el = el.offsetParent as HTMLElement
  }
  return {
    top,
    left,
    bounds: {
      top: bounds.top,
      bottom: bounds.top + bounds.height
    }
  }
}

function getRelativeRect(element, parent) {
  return {
    ...getOffsetsTo(element, parent),
    width: element.offsetWidth,
    height: element.offsetHeight
  }
}

function scrollIntoView(element) {
  _scrollIntoView(element, {
    scrollMode: 'if-needed',
    block: 'nearest',
    inline: 'start'
  })
}

function isChangeBar(v: Reported<TrackedArea | TrackedChange>): v is Reported<TrackedChange> {
  return v[0] !== 'changePanel'
}

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

  const visibleConnectors = changeBarsWithFocusOrHover
    .map(([id, value]) => ({
      field: {
        id,
        ...(id.startsWith('field-')
          ? value
          : (byId.get(`field-${id.substring(7)}`) as TrackedChange))
      },
      change: {
        id,
        ...(id.startsWith('change-')
          ? value
          : (byId.get(`change-${id.substring(6)}`) as TrackedChange))
      }
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
        {visibleConnectors.map(({field, change}) => {
          const changeMarkerLeft = change.rect.left
          const fieldMarkerLeft = field.rect.left + field.rect.width

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

          const clampConnector = {
            top: field.rect.bounds.top + CONNECTOR_BOUNDS_MARGIN,
            bottom: field.rect.bounds.bottom - CONNECTOR_BOUNDS_MARGIN
          }

          const connectorClassName = change.hasRevertHover
            ? styles.dangerConnector
            : styles.connector

          return (
            <React.Fragment key={`field-${field.id}`}>
              {change && (
                <g
                  onClick={() => {
                    onSetFocus(field.path)
                    // todo: this is needed because onSetFocus doesn't trigger scroll to focus if focus is already
                    scrollIntoView(field?.element)
                    scrollIntoView(change?.element)
                  }}
                  className={connectorClassName}
                >
                  <Connector
                    from={connectorFrom}
                    to={connectorTo}
                    onMouseEnter={() => setHovered(field.id)}
                    onMouseLeave={() => setHovered(null)}
                    clampLeft={clampConnector}
                    clampRight={clampConnector}
                    verticalCenter={verticalLineLeft! + 3}
                  />

                  {/* arrow left top */}
                  {fieldBottom <= clampConnector.top && (
                    <Arrow
                      top={clampConnector.top}
                      left={connectorFrom.left}
                      length={5}
                      wingLength={8}
                      direction="n"
                    />
                  )}

                  {/* arrow left bottom */}
                  {fieldTop >= clampConnector.bottom && (
                    <Arrow
                      top={clampConnector.bottom}
                      left={connectorFrom.left}
                      length={5}
                      wingLength={8}
                      direction="s"
                    />
                  )}

                  {/* arrow right top */}
                  {changeBottom <= clampConnector.top && (
                    <Arrow
                      top={clampConnector.top}
                      left={connectorTo.left}
                      length={5}
                      wingLength={8}
                      direction="n"
                    />
                  )}

                  {/* arrow right bottom */}
                  {changeTop > clampConnector.bottom && (
                    <Arrow
                      top={clampConnector.bottom}
                      left={connectorTo.left}
                      length={5}
                      wingLength={8}
                      direction="s"
                    />
                  )}

                  {/* this is the bar marking the line in the changes panel */}
                  <path
                    style={{pointerEvents: 'none'}}
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
                    y1={clampConnector.top}
                    x2={field.rect.left + field.rect.width}
                    y2={clampConnector.top}
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
                    y1={clampConnector.bottom}
                    x2={field.rect.left + field.rect.width}
                    y2={clampConnector.bottom}
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
