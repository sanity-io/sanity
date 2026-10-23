import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CopyIcon} from '@sanity/icons/Copy'
import {ExpandIcon} from '@sanity/icons/Expand'
import {RemoveIcon} from '@sanity/icons/Remove'
import {Button, Text, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {
  type CSSProperties,
  type KeyboardEvent,
  memo,
  type PointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {type TFunction, useTranslation} from 'sanity'
import {useEffectEvent} from 'use-effect-event'

import {type ResultViewCopy} from '../../../components/ResultView'
import {visionLocaleNamespace} from '../../../i18n'
import {describeKeypath, getAtKeypath} from '../../../util/getAtKeypath'
import {useContentSize} from '../../hooks/useContentSize'
import {
  buildResultGraph,
  GRAPH_METRICS,
  type GraphLayout,
  type GraphRow,
  layoutResultGraph,
  MAX_GRAPH_NODES,
  MAX_GRAPH_ROWS,
  type ResultGraph as ResultGraphModel,
} from '../../util/resultGraph'
import * as styles from './ResultGraph.module.css'

/** The theme values and `GRAPH_METRICS` that ResultGraph.module.css reads */
interface GraphViewportStyle extends CSSProperties {
  '--vision-graph-code-family': string
  '--vision-graph-code-size': string
  '--vision-graph-property': string
  '--vision-graph-string': string
  '--vision-graph-number': string
  '--vision-graph-boolean': string
  '--vision-graph-constant': string
  '--vision-graph-header-height': string
  '--vision-graph-row-height': string
  '--vision-graph-padding-x': string
}

interface View {
  x: number
  y: number
  scale: number
}

const MIN_SCALE = 0.1
const MAX_SCALE = 2
/** Below this, a first view shows the result's node at a readable size rather than all of it */
const MIN_FIRST_VIEW_SCALE = 0.5
const FIRST_VIEW_SCALE = 0.8
const PADDING = 24
const ZOOM_STEP = 1.25
const PAN_STEP = 48
/** A monospace character is about this wide for its size */
const CHAR_WIDTH_RATIO = 0.62
/** Partly listed objects and arrays the note names; any more are counted */
const NAMED_PARTIAL_NODES = 3

/** What the graph leaves out of this result, or `undefined` when it shows all of it */
function describeLeftOut(graph: ResultGraphModel, t: TFunction<'vision'>): string | undefined {
  const {partialNodes, nodeLimitReached} = graph
  if (partialNodes.length === 0 && !nodeLimitReached) return undefined
  const sentences: string[] = []
  if (partialNodes.length > 0) {
    const named = partialNodes.slice(0, NAMED_PARTIAL_NODES).map(({id, entries}) =>
      t('vision.result.graph.partial.node', {
        name: id === '' ? t('vision.result.graph.root') : describeKeypath(id),
        entries,
      }),
    )
    const others = partialNodes.length - named.length
    const nodes = named.join(', ')
    sentences.push(
      t('vision.result.graph.partial', {
        rows: MAX_GRAPH_ROWS,
        nodes:
          others > 0 ? `${nodes} ${t('vision.result.graph.partial.more', {count: others})}` : nodes,
      }),
    )
  }
  if (nodeLimitReached) {
    sentences.push(t('vision.result.graph.node-limit', {nodes: MAX_GRAPH_NODES}))
  }
  sentences.push(t('vision.result.graph.left-out-hint'))
  return sentences.join(' ')
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale))
}

function fitView(layout: GraphLayout, size: {width: number; height: number}): View {
  const scale = clampScale(
    Math.min(
      (size.width - 2 * PADDING) / layout.width,
      (size.height - 2 * PADDING) / layout.height,
      1,
    ),
  )
  return {
    scale,
    x: (size.width - layout.width * scale) / 2,
    y: (size.height - layout.height * scale) / 2,
  }
}

/** All of the graph when it fits at a readable size, else the result's node at the left */
function firstView(layout: GraphLayout, size: {width: number; height: number}): View {
  const fit = fitView(layout, size)
  if (fit.scale >= MIN_FIRST_VIEW_SCALE) return fit
  const [root] = layout.nodes
  return {
    scale: FIRST_VIEW_SCALE,
    x: PADDING,
    y: size.height / 2 - (root.y + root.height / 2) * FIRST_VIEW_SCALE,
  }
}

/** Zooms by `factor` keeping the point `x`, `y` of the viewport where it is */
function zoomAt(view: View, factor: number, x: number, y: number): View {
  const scale = clampScale(view.scale * factor)
  const ratio = scale / view.scale
  return {scale, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio}
}

function RowContent({row}: {row: GraphRow}) {
  const {t} = useTranslation(visionLocaleNamespace)
  switch (row.kind) {
    case 'value':
      return (
        <>
          {row.key && <span className={styles.graphRowKey}>{row.key}</span>}
          <span className={styles.graphRowValue} data-type={row.type}>
            {row.text}
          </span>
        </>
      )
    case 'child':
      return (
        <>
          <span className={styles.graphRowKey}>{row.key}</span>
          <span className={styles.graphRowValue} data-type="child">
            {row.summary}
          </span>
          {row.child !== undefined && <span className={styles.graphRowPort} />}
        </>
      )
    case 'more':
      return (
        <span className={styles.graphRowValue} data-type="more">
          {t('vision.result.graph.more', {count: row.count})}
        </span>
      )
    default: {
      const unhandled: never = row
      return unhandled
    }
  }
}

interface GraphNodesProps {
  layout: GraphLayout
  copyLabel: string
  onToggle: (id: string) => void
  onCopy: (id: string) => void
}

function GraphNodes({layout, copyLabel, onToggle, onCopy}: GraphNodesProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  return (
    <>
      <svg
        className={styles.graphEdges}
        data-testid="vision-graph-edges"
        height={layout.height}
        width={layout.width}
      >
        {layout.edges.map((edge) => (
          <path d={edge.path} key={`${edge.from}>${edge.to}`} />
        ))}
      </svg>
      {layout.nodes.map(({node, x, y, width, height, collapsed, childCount}) => {
        const title = node.label ?? t('vision.result.graph.root')
        return (
          <div
            aria-label={`${title} ${node.summary}`}
            className={styles.graphNode}
            data-testid="vision-graph-node"
            data-keypath={node.id}
            key={node.id}
            role="group"
            style={{left: x, top: y, width, height}}
          >
            <div className={styles.graphNodeHeader}>
              <span className={styles.graphNodeTitle}>
                {title}
                {node.summary && <span className={styles.graphNodeSummary}>{node.summary}</span>}
              </span>
              {childCount > 0 && (
                <button
                  aria-expanded={!collapsed}
                  aria-label={
                    collapsed
                      ? t('vision.result.graph.expand', {count: childCount})
                      : t('vision.result.graph.collapse')
                  }
                  className={styles.graphNodeButton}
                  data-testid="vision-graph-toggle"
                  onClick={() => onToggle(node.id)}
                  type="button"
                >
                  {collapsed ? <ChevronRightIcon /> : <ChevronDownIcon />}
                  {collapsed && childCount}
                </button>
              )}
              <button
                aria-label={copyLabel}
                className={styles.graphNodeButton}
                data-testid="vision-graph-copy"
                onClick={() => onCopy(node.id)}
                type="button"
              >
                <CopyIcon />
              </button>
            </div>
            {node.rows.map((row, index) => (
              // Rows are positional: the edges leave from their index
              // oxlint-disable-next-line react/no-array-index-key -- a row is its place in the node
              <div className={styles.graphRow} key={index}>
                <RowContent row={row} />
              </div>
            ))}
          </div>
        )
      })}
    </>
  )
}

const GraphNodesMemo = memo(GraphNodes)

export interface ResultGraphProps {
  id: string
  value: unknown
  copy: ResultViewCopy
}

/**
 * The result as a graph to move around in: drag to pan, scroll or the buttons to zoom, and
 * collapse what a node holds. The tree and JSON views remain the way to read all of a large
 * result; the graph stops at `MAX_GRAPH_NODES` objects and arrays.
 */
export function ResultGraph({id, value, copy}: ResultGraphProps) {
  const {t} = useTranslation(visionLocaleNamespace)
  const {color, font} = useThemeV2()
  const codeSize = font.code.sizes[1]
  const charWidth = codeSize.fontSize * CHAR_WIDTH_RATIO

  const graph = useMemo(() => buildResultGraph(value), [value])
  const leftOut = describeLeftOut(graph, t)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => new Set())
  const layout = useMemo(
    () => layoutResultGraph(graph, {collapsed, charWidth}),
    [charWidth, collapsed, graph],
  )

  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const size = useContentSize(viewport)
  // A view the user moved to, for the graph it was moved on; a new result starts over
  const [moved, setMoved] = useState<{graph: ResultGraphModel; view: View} | null>(null)
  const view: View | null =
    moved && moved.graph === graph ? moved.view : size ? firstView(layout, size) : null
  const setView = (next: View) => setMoved({graph, view: next})

  const drag = useRef<{pointerId: number; x: number; y: number; view: View} | null>(null)
  const [dragging, setDragging] = useState(false)

  const zoomBy = (factor: number) => {
    if (!view || !size) return
    setView(zoomAt(view, factor, size.width / 2, size.height / 2))
  }
  const fit = () => {
    if (size) setView(fitView(layout, size))
  }

  const onWheel = useEffectEvent((event: WheelEvent) => {
    if (!view || !viewport) return
    event.preventDefault()
    const bounds = viewport.getBoundingClientRect()
    setView(
      zoomAt(
        view,
        Math.exp(-event.deltaY * 0.0015),
        event.clientX - bounds.left,
        event.clientY - bounds.top,
      ),
    )
  })
  useEffect(() => {
    if (!viewport) return undefined
    // Not passive, so scrolling over the graph zooms it instead of scrolling the page
    const listener = (event: WheelEvent) => onWheel(event)
    viewport.addEventListener('wheel', listener, {passive: false})
    return () => viewport.removeEventListener('wheel', listener)
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- useEffectEvent callbacks must not be listed
  }, [viewport])

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!view || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('button')) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = {pointerId: event.pointerId, x: event.clientX, y: event.clientY, view}
    setDragging(true)
  }
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const start = drag.current
    if (!start || start.pointerId !== event.pointerId) return
    setView({
      ...start.view,
      x: start.view.x + event.clientX - start.x,
      y: start.view.y + event.clientY - start.y,
    })
  }
  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (drag.current?.pointerId !== event.pointerId) return
    drag.current = null
    setDragging(false)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !view) return
    const pans: Record<string, [number, number]> = {
      ArrowLeft: [PAN_STEP, 0],
      ArrowRight: [-PAN_STEP, 0],
      ArrowUp: [0, PAN_STEP],
      ArrowDown: [0, -PAN_STEP],
    }
    if (event.key in pans) {
      const [dx, dy] = pans[event.key]
      setView({...view, x: view.x + dx, y: view.y + dy})
    } else if (event.key === '+' || event.key === '=') zoomBy(ZOOM_STEP)
    else if (event.key === '-') zoomBy(1 / ZOOM_STEP)
    else if (event.key === '0') fit()
    else return
    event.preventDefault()
  }

  // Stable while the view moves, so panning and zooming do not draw the nodes again
  const onToggle = useCallback((nodeId: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(nodeId)) next.add(nodeId)
      return next
    })
  }, [])
  const onCopy = useCallback(
    (nodeId: string) => {
      const found = getAtKeypath(value, nodeId)
      if (found) copy.onCopy(found.value, nodeId)
    },
    [copy, value],
  )
  const controls = [
    {
      action: 'zoom-out',
      label: t('vision.result.graph.zoom-out'),
      icon: RemoveIcon,
      onClick: () => zoomBy(1 / ZOOM_STEP),
    },
    {
      action: 'zoom-in',
      label: t('vision.result.graph.zoom-in'),
      icon: AddIcon,
      onClick: () => zoomBy(ZOOM_STEP),
    },
    {action: 'fit', label: t('vision.result.graph.fit'), icon: ExpandIcon, onClick: fit},
  ]

  const viewportStyle: GraphViewportStyle = {
    '--vision-graph-code-family': font.code.family,
    '--vision-graph-code-size': `${codeSize.fontSize}px`,
    '--vision-graph-property': color.syntax.property,
    '--vision-graph-string': color.syntax.string,
    '--vision-graph-number': color.syntax.number,
    '--vision-graph-boolean': color.syntax.boolean,
    '--vision-graph-constant': color.syntax.constant,
    '--vision-graph-header-height': `${GRAPH_METRICS.headerHeight}px`,
    '--vision-graph-row-height': `${GRAPH_METRICS.rowHeight}px`,
    '--vision-graph-padding-x': `${GRAPH_METRICS.paddingX}px`,
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- role="application" is for a widget that handles its own pointer and keys (pan, zoom, fit)
    <div
      aria-label={t('vision.result.graph.label')}
      className={styles.graphViewport}
      data-dragging={dragging}
      data-testid="vision-result-graph"
      id={id}
      onKeyDown={onKeyDown}
      onLostPointerCapture={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      ref={setViewport}
      role="application"
      style={viewportStyle}
      tabIndex={0}
    >
      {view && (
        <div
          className={styles.graphCanvas}
          data-testid="vision-graph-canvas"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
          }}
        >
          <GraphNodesMemo
            copyLabel={copy.label}
            layout={layout}
            onCopy={onCopy}
            onToggle={onToggle}
          />
        </div>
      )}
      {leftOut && (
        <div className={styles.graphNotice} data-testid="vision-graph-left-out">
          <Text muted size={1}>
            {leftOut}
          </Text>
        </div>
      )}
      <div className={styles.graphControls}>
        {controls.map(({action, label, icon, onClick}) => (
          <Tooltip
            animate
            content={<Text size={1}>{label}</Text>}
            key={action}
            placement="top"
            portal
          >
            <Button
              aria-label={label}
              data-testid={`vision-graph-${action}`}
              fontSize={1}
              icon={icon}
              mode="bleed"
              onClick={onClick}
              padding={2}
            />
          </Tooltip>
        ))}
      </div>
    </div>
  )
}
