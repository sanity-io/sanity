import React from 'react'
import styles from './ConnectorsOverlay.css'
import * as PathUtils from '@sanity/util/paths'
import {groupBy} from 'lodash'
import {ScrollMonitor} from '@sanity/base/ScrollContainer'
import {ReportedRegion} from '@sanity/base/lib/components/react-track-elements'
import {Path} from '@sanity/util/lib/typedefs/path'
import smoothScrollIntoViewIfNeeded from 'smooth-scroll-into-view-if-needed'
import {Connector, drawLine, vLine} from '../../components/changeConnector/Connector'
import {Arrow} from '../../components/changeConnector/Arrow'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

interface ChangeConnectorPayload {
  path: Path
  hasFocus: boolean
}

interface Props {
  children?: React.ReactNode
  trackerRef: any //todo: fix
  regions: ReportedRegion<ChangeConnectorPayload>[]
}

const DEBUG = false

const isScrollContainer = el => el.scrollHeight !== el.offsetHeight

const getOffsetsTo = (source: HTMLElement, target: HTMLElement) => {
  let el: HTMLElement | null = source
  const bounds: {top: number; height: number} = {
    top: 0,
    height: 0
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
  return {top, left, bounds: {top: bounds.top, bottom: bounds.top + bounds.height}}
}

function getRelativeRect(element, parent) {
  return {
    ...getOffsetsTo(element, parent),
    width: element.offsetWidth,
    height: element.offsetHeight
  }
}

function computeRect<T>(
  region: ReportedRegion<T>,
  anchorElement: HTMLElement
): RegionWithRectMetadata<T> {
  return {...region, rect: getRelativeRect(region.element, anchorElement)}
}

type RegionWithRectMetadata<T> = ReportedRegion<T> & {
  rect: Rect & {bounds: {top: number; bottom: number}}
}

function scrollIntoView(element) {
  smoothScrollIntoViewIfNeeded(element, {
    scrollMode: 'if-needed',
    block: 'nearest',
    duration: 100,
    inline: 'start'
  })
}

const ADJUST_MARGIN_TOP = 10
const ADJUST_MARGIN_BOTTOM = -10

export function ConnectorsOverlay(props: Props) {
  const {children, trackerRef, ...rest} = props

  const [tick, setTick] = React.useState(0)
  const handleScroll = React.useCallback(() => {
    setTick(t => t + 1)
  }, [])

  const regions = trackerRef.current
    ? props.regions.map(region => computeRect(region, trackerRef.current!))
    : []

  const grouped = groupBy(regions, region => {
    if (region.id === 'changesPanel') {
      return 'changesPanel'
    }
    return region.id.startsWith('field-') ? 'fieldRegions' : 'changeRegions'
  })

  const changesPanel = grouped.changesPanel && grouped.changesPanel[0]
  // note: this assumes the changes panel header and the document panel always have the same height
  const topEdge = changesPanel?.rect?.top
  const verticalLineLeft = changesPanel?.rect?.left

  const {fieldRegions = [], changeRegions = []} = grouped
  return (
    <div ref={trackerRef} {...rest}>
      <ScrollMonitor onScroll={handleScroll}>{children}</ScrollMonitor>
      {changesPanel &&
        fieldRegions
          .filter(r => r.data?.hasFocus)
          .map(changedField => {
            const changedRegion = changeRegions.find(r =>
              PathUtils.isEqual(r.data.path, changedField.data.path)
            )
            if (!changedRegion) {
              return null
            }
            const changeMarkerLeft = changedRegion?.rect?.left
            const connectorFrom = {
              left: changedField.rect.left + changedField.rect.width - 1,
              top: changedField.rect.top - topEdge + 8
            }
            const connectorTo = {
              left: changeMarkerLeft,
              top: changedRegion.rect.top - topEdge + 8
            }

            const clampConnectorLeft = {
              top: changedField.rect.bounds.top + ADJUST_MARGIN_TOP,
              bottom: changedField.rect.bounds.bottom + ADJUST_MARGIN_BOTTOM - 14 // todo: fix issue with clamping bottom in the connector
            }
            const clampConnectorRight = {
              top: changedRegion.rect.bounds.top + ADJUST_MARGIN_TOP,
              bottom: changedRegion.rect.bounds.bottom + ADJUST_MARGIN_BOTTOM - 14
            }
            return (
              <svg
                key={changedField.id}
                onClick={() => {
                  scrollIntoView(changedField?.element)
                  scrollIntoView(changedRegion?.element)
                  // props.onRequestFocusPathChange(changedField.data.path)
                }}
                className={styles.svg}
                style={{
                  pointerEvents: 'none',
                  position: 'absolute',
                  ...(DEBUG ? {backgroundColor: 'rgba(0, 100, 100, 0.2)'} : {}),
                  top: changesPanel.rect.top,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: changesPanel.rect.height,
                  width: '100%'
                }}
              >
                <React.Fragment key={`field-${changedField.id}`}>
                  {changedRegion && (
                    <>
                      <Connector
                        from={connectorFrom}
                        to={connectorTo}
                        clampLeft={clampConnectorLeft}
                        clampRight={clampConnectorRight}
                        verticalCenter={verticalLineLeft + 3}
                      />
                      {/*<line*/}
                      {/*  x1={changedField.rect.left}*/}
                      {/*  y1={changedField.rect.bounds.top}*/}
                      {/*  x2={changedField.rect.left + changedField.rect.width}*/}
                      {/*  y2={changedField.rect.bounds.top}*/}
                      {/*  stroke="black"*/}
                      {/*  strokeWidth={2}*/}
                      {/*/>*/}
                      {/*<line*/}
                      {/*  x1={changedField.rect.left}*/}
                      {/*  y1={clampConnectorLeft.top}*/}
                      {/*  x2={changedField.rect.left + changedField.rect.width}*/}
                      {/*  y2={clampConnectorLeft.top}*/}
                      {/*  stroke="yellow"*/}
                      {/*  strokeWidth={2}*/}
                      {/*/>*/}
                      {/*<line*/}
                      {/*  x1={changedField.rect.left}*/}
                      {/*  y1={changedField.rect.bounds.bottom}*/}
                      {/*  x2={changedField.rect.left + changedField.rect.width}*/}
                      {/*  y2={changedField.rect.bounds.bottom}*/}
                      {/*  stroke="black"*/}
                      {/*  strokeWidth={2}*/}
                      {/*/>*/}

                      {/*<line*/}
                      {/*  x1={changedField.rect.left}*/}
                      {/*  y1={clampConnectorLeft.bottom}*/}
                      {/*  x2={changedField.rect.left + changedField.rect.width}*/}
                      {/*  y2={clampConnectorLeft.bottom}*/}
                      {/*  stroke="yellow"*/}
                      {/*  strokeWidth={2}*/}
                      {/*/>*/}
                      {/* arrow left top */}
                      {connectorFrom.top + changedField.rect.height - 8 <
                        clampConnectorLeft.top && (
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
                      {connectorFrom.top > changedField.rect.bounds.bottom - 5 && (
                        <Arrow
                          className={styles.connector}
                          top={changedField.rect.bounds.bottom - 5}
                          left={connectorFrom.left}
                          length={5}
                          wingLength={8}
                          direction="s"
                        />
                      )}
                      {/* arrow right top */}
                      {connectorTo.top + changedRegion.rect.height - 8 <
                        clampConnectorRight.top && (
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
                      {connectorTo.top > changedRegion.rect.bounds.bottom - 5 && (
                        <Arrow
                          className={styles.connector}
                          top={changedRegion.rect.bounds.bottom - 5}
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
                              changedRegion.rect.bounds.top,
                              Math.min(
                                connectorTo.top + changedRegion.rect.bounds.bottom - 19 - 8,
                                connectorTo.top - 8
                              )
                            ),
                            Math.max(
                              changedRegion.rect.bounds.top,
                              Math.min(
                                connectorTo.top + changedRegion.rect.bounds.bottom - 19 - 8,
                                connectorTo.top - 8 + changedRegion.rect.height
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
