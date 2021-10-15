import React, {useCallback, useMemo, useState} from 'react'
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

  const [{connectors, isHoverConnector}, setState] = useState<State>(() =>
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

  return (
    <ScrollMonitor onScroll={handleScrollOrResize}>
      <SvgWrapper style={{zIndex: visibleConnectors[0] && visibleConnectors[0].field.zIndex}}>
        {visibleConnectors.map(({field, change, hasFocus, hasHover, hasRevertHover}) => {
          if (!change) {
            return null
          }

          return (
            <ConnectorGroup
              field={field}
              change={change}
              hasFocus={hasFocus}
              hasHover={hasHover}
              hasRevertHover={hasRevertHover}
              key={field.id}
              onSetFocus={onSetFocus}
              setHovered={setHovered}
              isHoverConnector={isHoverConnector}
            />
          )
        })}
      </SvgWrapper>
    </ScrollMonitor>
  )
}

interface ConnectorGroupProps {
  field: TrackedChange & {id: string; rect: Rect; bounds: Rect}
  change: TrackedChange & {id: string; rect: Rect; bounds: Rect}
  hasFocus: boolean
  hasHover: boolean
  hasRevertHover: boolean
  setHovered: (id: string | null) => void
  onSetFocus: (nextFocusPath: Path) => void
  isHoverConnector: boolean
}

function ConnectorGroup(props: ConnectorGroupProps) {
  const {
    change,
    field,
    hasFocus,
    hasHover,
    hasRevertHover,
    onSetFocus,
    setHovered,
    isHoverConnector,
  } = props

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
          focused={hasFocus}
          hovered={hasHover || isHoverConnector}
          revertHovered={hasRevertHover}
        />
      </g>

      {DEBUG_LAYER_BOUNDS && <DebugLayers field={field} change={change} />}
    </>
  )
}
