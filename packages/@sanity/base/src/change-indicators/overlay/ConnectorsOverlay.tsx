import {Layer} from '@sanity/ui'
import React from 'react'
import {sortBy} from 'lodash'
import {Path} from '@sanity/types'
import {ScrollMonitor} from 'part:@sanity/components/scroll'
import {useReportedValues, Reported, TrackedChange} from '../'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import {getElementGeometry} from '../helpers/getElementGeometry'
import isChangeBar from '../helpers/isChangeBar'
import scrollIntoView from '../helpers/scrollIntoView'
import {DEBUG_LAYER_BOUNDS} from '../constants'
import {resizeObserver} from '../../util/resizeObserver'
import {useZIndex} from '../../components'
import {Connector} from './Connector'

import styles from './ConnectorsOverlay.css'
import {DebugLayers} from './DebugLayers'

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

function useResizeObserver(
  element: HTMLDivElement,
  onResize: (event: ResizeObserverEntry) => void
) {
  React.useEffect(() => resizeObserver.observe(element, onResize), [element, onResize])
}
export const ConnectorsOverlay = React.memo(function ConnectorsOverlay(props: Props) {
  const {rootRef, onSetFocus} = props
  const zindex = useZIndex()

  const [hovered, setHovered] = React.useState<string | null>(null)

  const allReportedValues = useReportedValues()
  const [, forceUpdate] = React.useReducer((n) => n + 1, 0)

  useResizeObserver(rootRef, forceUpdate)

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
      change: {id, ...findMostSpecificTarget('change', id, byId)},
    }))
    .filter(({field, change}) => field && change && field.element && change.element)
    .map(({field, change}) => ({
      hasHover: field.hasHover || change.hasHover,
      hasFocus: field.hasFocus,
      hasRevertHover: change.hasRevertHover,
      field: {...field, ...getElementGeometry(field.element, rootRef)},
      change: {...change, ...getElementGeometry(change.element, rootRef)},
    }))

  const visibleConnectors = sortBy(enabledConnectors, (c) => -c.field.path.length).slice(0, 1)

  return (
    <ScrollMonitor onScroll={forceUpdate}>
      <Layer as="svg" className={styles.svg} zOffset={zindex.portal - 1}>
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
                  {DEBUG_LAYER_BOUNDS && <DebugLayers field={field} change={change} />}
                </>
              )}
            </React.Fragment>
          )
        })}
      </Layer>
    </ScrollMonitor>
  )
})
