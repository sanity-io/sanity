import {type Path} from '@sanity/types'
import {useCallback, useMemo, useState} from 'react'

import type {Reported} from '../../components/react-track-elements/types'
import {useOnScroll} from '../../components/scroll/hooks'
import {useReviewChanges} from '../../hooks/useReviewChanges'
import {DEBUG_LAYER_BOUNDS} from '../constants'
import {findMostSpecificTarget} from '../helpers/findMostSpecificTarget'
import {getOffsetsTo} from '../helpers/getOffsetsTo'
import {isChangeBar} from '../helpers/isChangeBar'
import {scrollIntoView} from '../helpers/scrollIntoView'
import {type TrackedArea, type TrackedChange, useChangeIndicatorsReportedValues} from '../tracker'
import {Connector} from './Connector'
import {SvgWrapper} from './ConnectorsOverlay.styled'
import {DebugLayers} from './DebugLayers'
import {useResizeObserver} from './useResizeObserver'

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

  return {connectors, isHoverConnector}
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

  const [{connectors}, setState] = useState<State>(() =>
    getState(allReportedValues, hovered, byId, rootElement),
  )

  const visibleConnector = useMemo(
    () =>
      // Get the connector with longest path, it will be the one that is most specific
      connectors.sort((a, b) => b.field.id.length - a.field.id.length)[0],
    [connectors],
  )

  const handleScrollOrResize = useCallback(() => {
    // Only update the state if the review changes panel is open
    // Otherwise we don't need to show the connectors.
    if (isReviewChangesOpen) {
      setState(getState(allReportedValues, hovered, byId, rootElement))
    }
  }, [byId, allReportedValues, hovered, rootElement, isReviewChangesOpen])

  useResizeObserver(rootElement, handleScrollOrResize)
  useOnScroll(handleScrollOrResize)

  return (
    <SvgWrapper style={{zIndex: visibleConnector && visibleConnector.field.zIndex}}>
      {visibleConnector?.change && (
        <ConnectorGroup
          key={visibleConnector.field.id}
          field={visibleConnector.field}
          change={visibleConnector.change}
          onSetFocus={onSetFocus}
          setHovered={setHovered}
        />
      )}
    </SvgWrapper>
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
