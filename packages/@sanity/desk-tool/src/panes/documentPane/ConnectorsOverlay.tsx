import React from 'react'
import styles from './ConnectorsOverlay.css'
import {connectorLinePath, linePathFromPoints} from '../../components/changeConnector/svgHelpers'
import {Arrows} from '../../components/changeConnector/Arrows'
import * as PathUtils from '@sanity/util/paths'
import {groupBy} from 'lodash'
import {ScrollMonitor} from '@sanity/base/ScrollContainer'
import {ReportedRegion} from '@sanity/base/lib/components/react-track-elements'
import {Path} from '@sanity/util/lib/typedefs/path'
import scrollIntoView from 'smooth-scroll-into-view-if-needed'

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
//
// const getOffsetParents = (source, target) => {
//   let el = source
//   while (el && el !== target) {
//
//   }
// }
const getOffsetsTo = (source, target) => {
  let el = source
  let top = 0
  let left = 0
  let relativeScrollTop = 0

  while (el && el !== target) {
    if (el.scrollHeight === el.offsetHeight) {
      // accumulate relative scroll top until we hit a scroll container
      relativeScrollTop += el.offsetTop
    } else {
      // we reached a scroll container, make sure we clamp the top to be within the bounds
      top +=
        el.offsetTop + Math.min(el.offsetHeight - 12, Math.max(0, relativeScrollTop - el.scrollTop))
      relativeScrollTop = 0
    }
    left += el.offsetLeft
    el = el.offsetParent
  }
  return {top: top + relativeScrollTop, left}
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
              left: changedField.rect.left + changedField.rect.width,
              top: changedField.rect.top - topEdge + 8
            }
            const connectorTo = {
              left: changeMarkerLeft,
              top: changedRegion.rect.top - topEdge + 8
            }

            const connectorPath = connectorLinePath(
              connectorFrom,
              connectorTo,
              10,
              changesPanel.rect.left + 10
            )
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
                    <g className={styles.connector}>
                      <g
                        className={`${styles.connectorPath}${
                          changedField.data.hasFocus ? styles.hasFocus : ''
                        }`}
                      >
                        <path d={connectorPath} fill="none" />
                        {/* to make the active area wider */}
                        <path d={connectorPath} strokeWidth={15} stroke="none" fill="none" />
                        <Arrows
                          from={connectorFrom}
                          to={connectorTo}
                          left={changesPanel.rect.left + 10}
                          bounds={{
                            width: 0,
                            height: changesPanel.rect.height
                          }}
                        />
                      </g>
                    </g>
                  )}
                </React.Fragment>
              </svg>
            )
          })}
    </div>
  )
}
