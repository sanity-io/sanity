import React, {useCallback, useMemo, useState} from 'react'
import {sortBy} from 'lodash'
import {Path} from '@sanity/types'
import {ScrollMonitor} from '../../components/scroll'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import {isChangeBar} from '../helpers/isChangeBar'
import {scrollIntoView} from '../helpers/scrollIntoView'
import {DEBUG_LAYER_BOUNDS} from '../constants'
import {getOffsetsTo} from '../helpers/getOffsetsTo'
import {TrackedArea, TrackedChange, useReportedValues} from '../tracker'
import {Reported} from '../../components/react-track-elements'
import {isNonNullable} from '../../util'
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

interface ConnectorsOverlayProps {
  rootElement: HTMLDivElement
  onSetFocus: (nextFocusPath: Path) => void
}

function getState(
  allReportedValues: Reported<TrackedChange | TrackedArea>[],
  hovered: string | null,
  byId: Map<string, TrackedChange | TrackedArea>,
  rootElement: HTMLElement,
): State {
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
    .map(([id]) => {
      const field = findMostSpecificTarget('field', id, byId)
      const change = findMostSpecificTarget('change', id, byId)

      if (!field || !change) return null

      return {field: {id, ...field}, change: {id, ...change}}
    })
    .filter(isNonNullable)
    // .filter(({field, change}) => field && change && field.element && change.element)
    .map(({field, change}) => ({
      hasHover: field.hasHover || change.hasHover,
      hasFocus: field.hasFocus,
      hasRevertHover: change.hasRevertHover,
      field: {...field, ...getOffsetsTo(field.element, rootElement)},
      change: {...change, ...getOffsetsTo(change.element, rootElement)},
    }))

  return {connectors, isHoverConnector}
}

export function ConnectorsOverlay(props: ConnectorsOverlayProps) {
  const {rootElement, onSetFocus} = props
  const [hovered, setHovered] = React.useState<string | null>(null)
  const allReportedValues = useReportedValues()
  const byId: Map<string, TrackedChange | TrackedArea> = useMemo(
    () => new Map(allReportedValues),
    [allReportedValues],
  )

  const [{connectors}, setState] = useState<State>(() =>
    getState(allReportedValues, hovered, byId, rootElement),
  )

  const visibleConnectors = useMemo(
    () => sortBy(connectors, (c) => 0 - c.field.path.length).slice(0, 1),
    [connectors],
  )

  const handleScrollOrResize = useCallback(() => {
    setState(getState(allReportedValues, hovered, byId, rootElement))
  }, [byId, allReportedValues, hovered, rootElement])

  useResizeObserver(rootElement, handleScrollOrResize)

  return (
    <ScrollMonitor onScroll={handleScrollOrResize}>
      <SvgWrapper style={{zIndex: visibleConnectors[0] && visibleConnectors[0].field.zIndex}}>
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
  )
}

interface ConnectorGroupProps {
  field: TrackedChange & {id: string; rect: Rect; bounds: Rect}
  change: TrackedChange & {id: string; rect: Rect; bounds: Rect}
  setHovered: (id: string | null) => void
  onSetFocus: (path: Path) => void
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

  const from = useMemo(
    () => ({
      rect: {
        ...field.rect,
        left: field.rect.left + 3,
      },
      bounds: field.bounds,
    }),
    [field.bounds, field.rect],
  )

  const to = useMemo(
    () => ({
      rect: {
        ...change.rect,
        left: change.rect.left + 1,
      },
      bounds: change.bounds,
    }),
    [change.bounds, change.rect],
  )

  return (
    <>
      <g onClick={onConnectorClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <Connector from={from} to={to} />
      </g>

      {DEBUG_LAYER_BOUNDS && <DebugLayers field={field} change={change} />}
    </>
  )
}
