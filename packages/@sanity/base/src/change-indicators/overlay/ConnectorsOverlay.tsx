import React from 'react'
import {sortBy} from 'lodash'
import {Path} from '@sanity/types'
import {ScrollMonitor} from 'part:@sanity/components/scroll'
import {useReportedValues, Reported, TrackedChange} from '../'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import {getElementGeometry} from '../helpers/getElementGeometry'
import isChangeBar from '../helpers/isChangeBar'
import scrollIntoView from '../helpers/scrollIntoView'
import {Connector} from './Connector'

import styles from './ConnectorsOverlay.css'
import {DEBUG_LAYER_BOUNDS} from '../constants'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
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
      hasRevertHover: change.hasRevertHover,
      field: {...field, ...getElementGeometry(field.element, rootRef)},
      change: {...change, ...getElementGeometry(change.element, rootRef)}
    }))

  const visibleConnectors = sortBy(enabledConnectors, c => -c.field.path.length).slice(0, 1)

  return (
    <ScrollMonitor onScroll={forceUpdate}>
      <svg className={styles.svg}>
        {visibleConnectors.map(({field, change, hasFocus, hasHover, hasRevertHover}) => {
          const onConnectorClick = () => {
            scrollIntoView(field)
            scrollIntoView(change)

            onSetFocus(field.path)
          }

          return (
            <React.Fragment key={`field-${field.id}`}>
              {change && (
                <>
                  <g
                    onClick={onConnectorClick}
                    onMouseEnter={() => setHovered(field.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <Connector
                      from={{rect: field.rect, bounds: field.bounds}}
                      to={{rect: change.rect, bounds: change.bounds}}
                      focused={hasFocus}
                      hovered={hasHover || isHoverConnector}
                      revertHovered={hasRevertHover}
                    />
                  </g>
                  {DEBUG_LAYER_BOUNDS && (
                    <g style={{pointerEvents: 'none'}}>
                      <rect
                        x={field.bounds.left}
                        y={field.bounds.top}
                        height={field.bounds.height}
                        width={field.bounds.width}
                        stroke="green"
                        fill="none"
                        strokeWidth={1}
                      />
                      <rect
                        x={field.rect.left}
                        y={field.rect.top}
                        height={field.rect.height}
                        width={field.rect.width}
                        stroke="black"
                        fill="none"
                        strokeWidth={1}
                      />
                      <rect
                        x={change.bounds.left}
                        y={change.bounds.top}
                        height={change.bounds.height}
                        width={change.bounds.width}
                        stroke="crimson"
                        fill="none"
                        strokeWidth={1}
                      />
                      <rect
                        x={change.rect.left}
                        y={change.rect.top}
                        height={change.rect.height}
                        width={change.rect.width}
                        stroke="black"
                        fill="none"
                        strokeWidth={1}
                      />
                    </g>
                  )}
                </>
              )}
            </React.Fragment>
          )
        })}
      </svg>
    </ScrollMonitor>
  )
})
