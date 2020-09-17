import React from 'react'
import styles from './ConnectorsOverlay.css'
import * as PathUtils from '@sanity/util/paths'
import {groupBy} from 'lodash'
import {ScrollMonitor} from '@sanity/base/ScrollContainer'
import {ReportedRegion} from '@sanity/base/lib/components/react-track-elements'
import {Path} from '@sanity/util/lib/typedefs/path'
import smoothScrollIntoViewIfNeeded from 'smooth-scroll-into-view-if-needed'
import {Connector} from '../../components/changeConnector/Connector'

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

const getOffsetsTo = (source, target) => {
  let el = source
  let top = 0
  let left = 0
  let relativeScrollTop = 0
  let minTop = 0
  let maxTop = Number.MAX_SAFE_INTEGER

  while (el && el !== target) {
    if (el.scrollHeight === el.offsetHeight) {
      // accumulate relative scroll top until we hit a scroll container
      relativeScrollTop += el.offsetTop
    } else {
      // we reached a scroll container, make sure we clamp the top to be within the bounds
      const actualTop = relativeScrollTop - el.scrollTop
      const clampedTop = Math.min(el.offsetHeight - 12, Math.max(12, actualTop))
      if (clampedTop > actualTop) {
        minTop = actualTop - clampedTop
      }
      if (clampedTop < actualTop) {
        maxTop = clampedTop - actualTop
      }

      relativeScrollTop = 0
    }

    top += el.offsetTop - el.scrollTop
    left += el.offsetLeft
    el = el.offsetParent
  }
  return {top: top, left, minTop, maxTop}
}

function getRelativeRect(element, parent): Rect {
  return {
    ...getOffsetsTo(element, parent),
    width: element.offsetWidth,
    height: element.offsetHeight
  }
}

function computeRect<T>(region: ReportedRegion<T>, anchorElement: HTMLElement): RegionWithRect<T> {
  return {...region, rect: getRelativeRect(region.element, anchorElement)}
}
type RegionWithRect<T> = ReportedRegion<T> & {rect: Rect}

function scrollIntoView(element) {
  smoothScrollIntoViewIfNeeded(element, {
    scrollMode: 'if-needed',
    block: 'nearest',
    duration: 100,
    inline: 'start'
  })
}

export function ConnectorsOverlay(props: Props) {
  const {children, trackerRef, ...rest} = props

  const [tick, setTick] = React.useState(0)
  const handleScroll = React.useCallback(() => {
    setTick(t => t + 1)
  }, [])

  const regions = trackerRef.current
    ? props.regions.map(region => computeRect(region, trackerRef.current!))
    : []

  // console.log(regions.filter(region => region.rect.clamped).map(region => region.rect.clamped))
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
          .filter(r => r.data)
          .map(changedField => {
            const changedRegion = changeRegions.find(r =>
              PathUtils.isEqual(r.data.path, changedField.data.path)
            )
            if (!changedRegion) {
              return null
            }
            const changeMarkerLeft = changedRegion?.rect?.left
            const connectorFrom = {
              left: changedField.rect.left - 1 + changedField.rect.width,
              top: changedField.rect.top - topEdge + 8
            }
            const connectorTo = {
              left: changeMarkerLeft,
              top: changedRegion.rect.top - topEdge + 8
            }

            return (
              <svg
                key={changedField.id}
                onClick={() => {
                  scrollIntoView(changedField?.element)
                  scrollIntoView(changedRegion?.element)
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
                    <Connector
                      from={connectorFrom}
                      to={connectorTo}
                      clampLeft={{
                        top: connectorFrom.top - changedField.rect.minTop - 27,
                        bottom: connectorFrom.top + changedField.rect.maxTop - 19
                      }}
                      verticalCenter={verticalLineLeft + 2}
                      clampRight={{
                        top: connectorTo.top - changedRegion.rect.minTop - 27,
                        bottom: connectorTo.top + changedRegion.rect.maxTop - 19
                      }}
                    />
                  )}
                </React.Fragment>
              </svg>
            )
          })}
    </div>
  )
}
