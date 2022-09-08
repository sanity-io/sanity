import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {sortBy} from 'lodash'
import {Path} from '@sanity/types'
import {ScrollMonitor} from '../../components/scroll'
import {useReportedValues, Reported, TrackedChange} from '../'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import {isChangeBar} from '../helpers/isChangeBar'
import {scrollIntoView} from '../helpers/scrollIntoView'
import {DEBUG_LAYER_BOUNDS} from '../constants'
import {getOffsetsTo} from '../helpers/getOffsetsTo'
import {TrackedArea} from '../tracker'
import {Connector} from './Connector'
import {DebugLayers} from './DebugLayers'
import {useResizeObserver} from './useResizeObserver'

import {SvgWrapper} from './ConnectorsOverlay.styled'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

interface ConnectorsOverlayProps {
  rootElement: HTMLDivElement
  onSetFocus: (nextFocusPath: Path) => void
}

function getState(
  allReportedValues: Reported<TrackedChange | TrackedArea>[],
  hovered: string | null,
  byId: Map<string, TrackedChange | TrackedArea>,
  rootElement: HTMLElement
) {
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

  const changeBars = isHoverConnector ? changeBarsWithHover : changeBarsWithFocus

  const connectors = changeBars
    .map(([id]) => ({
      field: {id, ...findMostSpecificTarget('field', id, byId)},
      change: {id, ...findMostSpecificTarget('change', id, byId)},
    }))
    .filter(({field, change}) => field && change && field.element && change.element)
    .map(({field, change}) => ({
      hasHover: field.hasHover || change.hasHover,
      hasFocus: field.hasFocus,
      hasRevertHover: change.hasRevertHover,
      field: {...field, ...getOffsetsTo(field.element, rootElement)},
      change: {...change, ...getOffsetsTo(change.element, rootElement)},
    }))

  return {connectors, isHoverConnector}
}

interface State {
  connectors: {
    field: TrackedChange & {id: string; rect: Rect; bounds: Rect}
    change: TrackedChange & {id: string; rect: Rect; bounds: Rect}
    hasFocus: boolean
    hasHover: boolean
    hasRevertHover: boolean
  }[]
  isHoverConnector: boolean
}

export function ConnectorsOverlay(props: ConnectorsOverlayProps) {
  const {rootElement, onSetFocus} = props
  const [hovered, setHovered] = React.useState<string | null>(null)
  const allReportedValues = useReportedValues()
  const byId = useMemo(() => new Map(allReportedValues), [allReportedValues])

  const [{connectors}, setState] = useState<State>(() =>
    getState(allReportedValues, hovered, byId, rootElement)
  )

  const visibleConnectors = useMemo(
    () => sortBy(connectors, (c) => -c.field.path.length).slice(0, 1),
    [connectors]
  )

  const handleScrollOrResize = useCallback(() => {
    setState(getState(allReportedValues, hovered, byId, rootElement))
  }, [byId, allReportedValues, hovered, rootElement])

  useResizeObserver(rootElement, handleScrollOrResize)

  const zIndex = visibleConnectors[0]?.field.zIndex
  const style = useMemo(() => ({zIndex}), [zIndex])
  useWhyDidYouUpdate('connectorsOverlay', {
    handleScrollOrResize,
    onSetFocus,
    style,
    visibleConnectors,
  })
  return useMemo(
    () => (
      <ScrollMonitor onScroll={handleScrollOrResize}>
        <SvgWrapper style={style}>
          {visibleConnectors.map(({field, change}) => {
            if (!change) {
              return null
            }

            return (
              <ConnectorGroup
                field={field}
                change={change}
                key={field.id}
                onSetFocus={onSetFocus}
                setHovered={setHovered}
              />
            )
          })}
        </SvgWrapper>
      </ScrollMonitor>
    ),
    [handleScrollOrResize, onSetFocus, style, visibleConnectors]
  )
}

interface ConnectorGroupProps {
  field: TrackedChange & {id: string; rect: Rect; bounds: Rect}
  change: TrackedChange & {id: string; rect: Rect; bounds: Rect}
  setHovered: (id: string | null) => void
  onSetFocus: (nextFocusPath: Path) => void
}

function ConnectorGroup(props: ConnectorGroupProps) {
  const {change, field, onSetFocus, setHovered} = props

  const onConnectorClick = useCallback(() => {
    scrollIntoView(field)
    scrollIntoView(change)

    onSetFocus(field.path)
  }, [field, change, onSetFocus])

  const handleMouseEnter = useCallback(() => setHovered(field.id), [field, setHovered])
  const handleMouseLeave = useCallback(() => setHovered(null), [setHovered])

  return (
    <>
      <g onClick={onConnectorClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Connector
          from={{
            rect: {
              left: field.rect.left + 2,
              top: field.rect.top,
              height: field.rect.height,
              width: field.rect.width,
            },
            bounds: field.bounds,
          }}
          to={{rect: change.rect, bounds: change.bounds}}
        />
      </g>

      {DEBUG_LAYER_BOUNDS && <DebugLayers field={field} change={change} />}
    </>
  )
}

function useWhyDidYouUpdate(name, props) {
  // Get a mutable ref object where we can store props ...
  // ... for comparison next time this hook runs.
  const previousProps = useRef()
  useEffect(() => {
    if (previousProps.current) {
      // Get all keys from previous and current props
      const allKeys = Object.keys({...previousProps.current, ...props})
      // Use this object to keep track of changed props
      const changesObj = {}
      // Iterate through keys
      allKeys.forEach((key) => {
        // If previous is different from current
        if (previousProps.current[key] !== props[key]) {
          // Add to changesObj
          changesObj[key] = {
            from: previousProps.current[key],
            to: props[key],
          }
        }
      })
      // If changesObj not empty then output to console
      if (Object.keys(changesObj).length) {
        console.log('[why-did-you-update]', name, changesObj)
      }
    }
    // Finally update previousProps with current props for next hook call
    previousProps.current = props
  })
}
