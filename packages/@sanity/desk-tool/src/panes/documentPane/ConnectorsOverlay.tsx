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
  trackerRef: React.RefObject<HTMLDivElement>
  regions: ReportedRegion<ChangeConnectorPayload>[]
}

const DEBUG = false

const isScrollContainer = el => el.scrollHeight !== el.offsetHeight

const getOffsetsTo = (source: HTMLElement, target: HTMLElement) => {
  let el: HTMLElement | null = source
  const bounds: {top: number; bottom: number} = {
    top: 0,
    bottom: 0
  }
  let top = 0
  let left = 0
  let foundScrollContainer = false
  while (el && el !== target) {
    if (foundScrollContainer) {
      bounds.top += el.offsetTop
      bounds.bottom += el.offsetTop
    }

    if (isScrollContainer(el)) {
      bounds.top = el.offsetTop
      bounds.bottom = el.offsetTop + el.offsetHeight - 36 // todo: figure out why this is needed
      foundScrollContainer = true
    }
    top += el.offsetTop - el.scrollTop
    left += el.offsetLeft - el.scrollLeft
    el = el.offsetParent as HTMLElement
  }
  return {top, left, bounds}
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

const ADJUST_MARGIN_TOP = -3
const ADJUST_MARGIN_BOTTOM = 10

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

            const clampLeft = {
              top: changedField.rect.bounds.top + ADJUST_MARGIN_TOP + 8,
              bottom: changedRegion.rect.bounds.bottom + ADJUST_MARGIN_BOTTOM
            }
            const clampRight = {
              top: changedRegion.rect.bounds.top,
              bottom: changedRegion.rect.bounds.bottom
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
                        clampLeft={clampLeft}
                        clampRight={clampRight}
                        verticalCenter={verticalLineLeft + 3}
                      />
                      {/* arrow left top */}
                      {connectorFrom.top + changedField.rect.height - 8 < clampLeft.top && (
                        <Arrow
                          className={styles.connector}
                          top={Math.max(clampLeft.top)}
                          left={connectorFrom.left}
                          length={5}
                          wingLength={8}
                          direction="n"
                        />
                      )}
                      {/* arrow left bottom */}
                      {connectorFrom.top - 8 > clampLeft.bottom + ADJUST_MARGIN_BOTTOM + 10 && (
                        <Arrow
                          className={styles.connector}
                          top={
                            clampLeft.bottom +
                            ADJUST_MARGIN_BOTTOM +
                            10 /*todo: make the arrow anchor customizable to remove this */
                          }
                          left={connectorFrom.left}
                          length={5}
                          wingLength={8}
                          direction="s"
                        />
                      )}
                      {/* arrow right top */}
                      {connectorTo.top + changedRegion.rect.height - 8 < clampRight.top && (
                        <Arrow
                          className={styles.connector}
                          top={Math.max(clampRight.top)}
                          left={connectorTo.left}
                          length={5}
                          wingLength={8}
                          direction="n"
                        />
                      )}
                      {/* arrow right bottom */}
                      {connectorTo.top - 8 > clampRight.bottom + ADJUST_MARGIN_BOTTOM + 10 && (
                        <Arrow
                          className={styles.connector}
                          top={
                            clampRight.bottom +
                            ADJUST_MARGIN_BOTTOM +
                            10 /*todo: make the arrow anchor customizable to remove this */
                          }
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
