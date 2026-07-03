import {type Path} from '@sanity/types'
import {useCallback, useEffect, useMemo, useState} from 'react'

import {type Reported} from '../../components/react-track-elements'
import {useOnScroll} from '../../components/scroll'
import {useReviewChanges} from '../../hooks/useReviewChanges'
import {DEBUG_LAYER_BOUNDS} from '../constants'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import {getOffsetsTo} from '../helpers/getOffsetsTo'
import {isChangeBar} from '../helpers/isChangeBar'
import {scrollIntoView} from '../helpers/scrollIntoView'
import {type TrackedArea, type TrackedChange, useChangeIndicatorsReportedValues} from '../tracker'
import {Connector} from './Connector'
import {svgWrapper} from './ConnectorsOverlay.css'
import {DebugLayers} from './DebugLayers'
import {useResizeObserver} from './useResizeObserver'

export interface Rect {
  height: number
  width: number
  top: number
  left: number
}

type ConnectorEndpoint = TrackedChange & {id: string; rect: Rect; bounds: Rect}

interface ConnectorPair {
  field: ConnectorEndpoint
  change: ConnectorEndpoint
  hasFocus: boolean
  hasHover: boolean
  hasRevertHover: boolean
}

interface ConnectorsOverlayProps {
  rootElement: HTMLDivElement
  onSetFocus: (nextFocusPath: Path) => void
}

const EMPTY_CONNECTORS: ConnectorPair[] = []

function getConnectors(
  allReportedValues: Reported<TrackedChange | TrackedArea>[],
  hovered: string | null,
  byId: Map<string, TrackedChange | TrackedArea>,
  rootElement: HTMLElement,
): ConnectorPair[] {
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

  const changeBars = changeBarsWithHover.length > 0 ? changeBarsWithHover : changeBarsWithFocus

  return changeBars
    .map(([id]) => {
      const field = findMostSpecificTarget('field', id, byId)
      const change = findMostSpecificTarget('change', id, byId)

      if (!field || !change) return null

      return {field: {id, ...field}, change: {id, ...change}}
    })
    .filter(
      (value): value is NonNullable<typeof value> =>
        Boolean(value?.field.element) && Boolean(value?.change.element),
    )
    .map(({field, change}) => ({
      hasHover: field.hasHover || change.hasHover,
      hasFocus: field.hasFocus,
      hasRevertHover: change.hasRevertHover,
      field: {...field, ...getOffsetsTo(field.element!, rootElement)},
      change: {...change, ...getOffsetsTo(change.element!, rootElement)},
    }))
}

export function ConnectorsOverlay(props: ConnectorsOverlayProps) {
  const {rootElement, onSetFocus} = props
  const [hovered, setHovered] = useState<string | null>(null)
  const allReportedValues = useChangeIndicatorsReportedValues()
  const {isReviewChangesOpen} = useReviewChanges()
  const byId: Map<string, TrackedChange | TrackedArea> = useMemo(
    () => new Map(allReportedValues),
    [allReportedValues],
  )

  const [connectors, setConnectors] = useState<ConnectorPair[]>(EMPTY_CONNECTORS)

  const updateConnectors = useCallback(() => {
    // Connectors are only shown while the review changes panel is open. Clearing them when
    // it closes ensures no stale connector lines linger on screen.
    const next = isReviewChangesOpen
      ? getConnectors(allReportedValues, hovered, byId, rootElement)
      : EMPTY_CONNECTORS
    // Reuse EMPTY_CONNECTORS so React can bail out of re-rendering while there are no
    // connectors to draw.
    setConnectors(next.length === 0 ? EMPTY_CONNECTORS : next)
  }, [allReportedValues, byId, hovered, isReviewChangesOpen, rootElement])

  // Re-measure the connectors on the next frame whenever the tracked elements, the hovered
  // connector or the review changes panel's open state change…
  useEffect(() => {
    const frame = requestAnimationFrame(updateConnectors)
    return () => cancelAnimationFrame(frame)
  }, [updateConnectors])

  // …and when the layout shifts, since scrolling and resizing don't change the tracked
  // values themselves.
  useResizeObserver(rootElement, updateConnectors)
  useOnScroll(updateConnectors)

  const visibleConnector = useMemo(() => {
    // Get the connector with the longest id, it will be the one that is most specific
    let mostSpecific: ConnectorPair | undefined
    for (const connector of connectors) {
      if (!mostSpecific || connector.field.id.length > mostSpecific.field.id.length) {
        mostSpecific = connector
      }
    }
    return mostSpecific
  }, [connectors])

  return (
    <svg
      className={svgWrapper}
      data-testid="change-connectors-overlay"
      style={{zIndex: visibleConnector && visibleConnector.field.zIndex}}
    >
      {isReviewChangesOpen && visibleConnector?.change && (
        <ConnectorGroup
          key={visibleConnector.field.id}
          field={visibleConnector.field}
          change={visibleConnector.change}
          onSetFocus={onSetFocus}
          setHovered={setHovered}
        />
      )}
    </svg>
  )
}

interface ConnectorGroupProps {
  field: ConnectorEndpoint
  change: ConnectorEndpoint
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
