import React from 'react'
import styles from './ConnectorsOverlay.css'
import * as PathUtils from '@sanity/util/paths'
import {groupBy, partition} from 'lodash'
import {ScrollMonitor} from '@sanity/base/ScrollContainer'
import smoothScrollIntoViewIfNeeded from 'smooth-scroll-into-view-if-needed'
import {Connector, drawLine, vLine} from './Connector'
import {Arrow} from './Arrow'
import {
  useReportedValues,
  Reported,
  TrackedChange,
  TrackedArea
} from '@sanity/base/lib/change-indicators'
export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

interface Props {
  children?: React.ReactNode
  className?: string
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

function computeRect<T>(
  [id, region]: Reported<TrackedChange>,
  anchorElement: HTMLElement
): RegionWithRectMetadata {
  return {...region, id, rect: getRelativeRect(region.element, anchorElement)}
}

type RegionWithRectMetadata = TrackedChange & {
  id: string
  rect: Rect & {bounds: {top: number; bottom: number}}
}

function scrollIntoView(element) {
  smoothScrollIntoViewIfNeeded(element, {
    scrollMode: 'if-needed',
    block: 'nearest',
    duration: 400,
    inline: 'start'
  })
}

const ADJUST_MARGIN_TOP = 10
const ADJUST_MARGIN_BOTTOM = -10

export function ConnectorsOverlay(props: Props) {
  const {children, ...rest} = props

  const trackerRef = React.useRef<HTMLDivElement>(null)

  const [hovered, setHovered] = React.useState<string | null>(null)

  const [, forceUpdate] = React.useReducer(n => n + 1, 0)

  const [_changesPanel, _regions] = partition(
    useReportedValues(),
    (v): v is Reported<TrackedArea> => v[0] === 'changesPanel'
  )
  const changesPanel = _changesPanel && _changesPanel[0] && _changesPanel[0][1]

  const regions = trackerRef.current
    ? _regions.map(region => computeRect(region, trackerRef.current!))
    : []

  const changesPanelRect = changesPanel
    ? getRelativeRect(changesPanel.element, trackerRef.current)
    : null

  // note: this assumes the changes panel header and the document panel always have the same height
  const topEdge = changesPanelRect?.top
  const verticalLineLeft = changesPanelRect?.left

  const [fieldRegions, changeRegions] = partition(regions, fieldRegion =>
    fieldRegion.id.startsWith('field-')
  )

  const combined = fieldRegions
    .filter(fieldRegion => fieldRegion.isChanged)
    .map(fieldRegion => ({
      field: fieldRegion,
      change: changeRegions.find(r => PathUtils.isEqual(r.path, fieldRegion.path))
    }))
    .map(({field, change}) => ({
      hasHover: field.hasHover || field.hasHover,
      hasFocus: field.hasFocus || field.hasFocus,
      field,
      change
    }))
    .filter(({hasFocus, hasHover, field}) => field.id === hovered || hasFocus || hasHover)

  const visibleConnector =
    combined.find(({field, hasHover}) => field.id === hovered || hasHover) ||
    combined.find(({hasFocus}) => hasFocus)
  return (
    <div ref={trackerRef} {...rest} className={props.className}>
      <ScrollMonitor onScroll={forceUpdate}>{children}</ScrollMonitor>
      {changesPanelRect &&
        visibleConnector &&
        [visibleConnector].map(({field, change}) => {
          if (!change) {
            return null
          }
          const changeMarkerLeft = change?.rect?.left
          const connectorFrom = {
            left: field.rect.left + field.rect.width,
            top: field.rect.top - topEdge! + 8
          }
          const connectorTo = {
            left: changeMarkerLeft,
            top: change.rect.top - topEdge! + 8
          }

          const clampConnectorLeft = {
            top: field.rect.bounds.top + ADJUST_MARGIN_TOP,
            bottom: field.rect.bounds.bottom + ADJUST_MARGIN_BOTTOM - 14 // todo: fix issue with clamping bottom in the connector
          }
          const clampConnectorRight = {
            top: change.rect.bounds.top + ADJUST_MARGIN_TOP,
            bottom: change.rect.bounds.bottom + ADJUST_MARGIN_BOTTOM - 14
          }
          return (
            <svg
              key={field.id}
              onClick={() => {
                scrollIntoView(field?.element)
                scrollIntoView(change?.element)
                // props.onRequestFocusPathChange(changedField.path)
              }}
              className={styles.svg}
              style={{
                pointerEvents: 'none',
                position: 'absolute',
                ...(DEBUG ? {backgroundColor: 'rgba(0, 100, 100, 0.2)'} : {}),
                top: changesPanelRect.top,
                left: 0,
                right: 0,
                bottom: 0,
                height: changesPanelRect.height,
                width: '100%'
              }}
            >
              <React.Fragment key={`field-${field.id}`}>
                {change && (
                  <>
                    <Connector
                      from={connectorFrom}
                      to={connectorTo}
                      onMouseEnter={() => setHovered(visibleConnector.field.id)}
                      onMouseLeave={() => setHovered(null)}
                      clampLeft={clampConnectorLeft}
                      clampRight={clampConnectorRight}
                      verticalCenter={verticalLineLeft! + 3}
                    />
                    {/*<line*/}
                    {/*  x1={field.rect.left}*/}
                    {/*  y1={field.rect.bounds.top}*/}
                    {/*  x2={field.rect.left + field.rect.width}*/}
                    {/*  y2={field.rect.bounds.top}*/}
                    {/*  stroke="black"*/}
                    {/*  strokeWidth={2}*/}
                    {/*/>*/}
                    {/*<line*/}
                    {/*  x1={field.rect.left}*/}
                    {/*  y1={clampConnectorLeft.top}*/}
                    {/*  x2={field.rect.left + field.rect.width}*/}
                    {/*  y2={clampConnectorLeft.top}*/}
                    {/*  stroke="yellow"*/}
                    {/*  strokeWidth={2}*/}
                    {/*/>*/}
                    {/*<line*/}
                    {/*  x1={field.rect.left}*/}
                    {/*  y1={field.rect.bounds.bottom}*/}
                    {/*  x2={field.rect.left + field.rect.width}*/}
                    {/*  y2={field.rect.bounds.bottom}*/}
                    {/*  stroke="black"*/}
                    {/*  strokeWidth={2}*/}
                    {/*/>*/}

                    {/*<line*/}
                    {/*  x1={field.rect.left}*/}
                    {/*  y1={clampConnectorLeft.bottom}*/}
                    {/*  x2={field.rect.left + field.rect.width}*/}
                    {/*  y2={clampConnectorLeft.bottom}*/}
                    {/*  stroke="yellow"*/}
                    {/*  strokeWidth={2}*/}
                    {/*/>*/}
                    {/* arrow left top */}
                    {connectorFrom.top + field.rect.height - 8 < clampConnectorLeft.top && (
                      <Arrow
                        className={styles.connector}
                        top={Math.max(clampConnectorLeft.top)}
                        left={connectorFrom.left}
                        length={5}
                        wingLength={8}
                        direction="n"
                      />
                    )}
                    {/* arrow left bottom */}
                    {connectorFrom.top > field.rect.bounds.bottom - 5 && (
                      <Arrow
                        className={styles.connector}
                        top={field.rect.bounds.bottom - 5}
                        left={connectorFrom.left}
                        length={5}
                        wingLength={8}
                        direction="s"
                      />
                    )}
                    {/* arrow right top */}
                    {connectorTo.top + change.rect.height - 8 < clampConnectorRight.top && (
                      <Arrow
                        className={styles.connector}
                        top={Math.max(clampConnectorRight.top)}
                        left={connectorTo.left}
                        length={5}
                        wingLength={8}
                        direction="n"
                      />
                    )}
                    {/* arrow right bottom */}
                    {connectorTo.top > change.rect.bounds.bottom - 5 && (
                      <Arrow
                        className={styles.connector}
                        top={change.rect.bounds.bottom - 5}
                        left={connectorTo.left}
                        length={5}
                        wingLength={8}
                        direction="s"
                      />
                    )}
                    {/* this is the bar marking the line in the changes panel */}
                    <path
                      className={styles.connector}
                      d={drawLine(
                        vLine(
                          connectorTo.left,
                          Math.max(
                            change.rect.bounds.top,
                            Math.min(
                              connectorTo.top + change.rect.bounds.bottom - 19 - 8,
                              connectorTo.top - 8
                            )
                          ),
                          Math.max(
                            change.rect.bounds.top,
                            Math.min(
                              connectorTo.top + change.rect.bounds.bottom - 19 - 8,
                              connectorTo.top - 8 + change.rect.height
                            )
                          )
                        )
                      )}
                      strokeWidth={2}
                    />
                  </>
                )}
              </React.Fragment>
            </svg>
          )
        })}
    </div>
  )
}
