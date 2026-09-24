import {
  type StyleCensus,
  styledRuleShare,
  takeStyleCensus,
  ui5Share,
} from '@repo/utils/style-systems'
import {type KeyboardEvent, type PointerEvent, useEffect, useRef, useState} from 'react'

import {
  cornerFromPoint,
  DEFAULT_CORNER,
  type DragDirection,
  isPanelCorner,
  moveCorner,
  PANEL_CORNERS,
  type PanelCorner,
} from './corners'
import {
  adoption,
  checkbox,
  cssMeter,
  cssMeterFill,
  dot,
  donut,
  donutValue,
  dropZone,
  dropZoneActive,
  dropZoneCorner,
  dropZoneLayer,
  escapeCount,
  escapeCountValue,
  escapeDetails,
  group,
  groupHeading,
  handleDragging,
  header,
  legend,
  metricLabel,
  panel,
  root,
  rootCorner,
  rootDragging,
  row,
  rowCount,
  rowLabel,
  sectionDivider,
  trigger,
} from './styleOutline.css'
import {
  STYLE_OUTLINE_ATTRIBUTE,
  STYLE_OUTLINE_STORAGE_KEY,
  STYLE_SYSTEMS,
  type StyleSystemId,
} from './styleSystems'

interface PanelState {
  open: boolean
  active: StyleSystemId[]
  corner: PanelCorner
}

// A pointer that moves less than this on the handle is a click on it, not a drag
// of the widget.
const DRAG_THRESHOLD = 4

interface DragState {
  pointerId: number
  // Pointer position and widget centre when the drag started; the drop target is
  // read off the centre as it is dragged, not off the pointer.
  pointerX: number
  pointerY: number
  centerX: number
  centerY: number
  offsetX: number
  offsetY: number
  target: PanelCorner
  moved: boolean
}

const KEY_DIRECTIONS: Record<string, DragDirection | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

const DEFAULT_STATE: PanelState = {open: false, active: [], corner: DEFAULT_CORNER}

function classNames(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(' ')
}

function isStyleSystemId(value: unknown): value is StyleSystemId {
  return STYLE_SYSTEMS.some((system) => system.id === value)
}

function inRegistryOrder(ids: ReadonlySet<StyleSystemId>): StyleSystemId[] {
  return STYLE_SYSTEMS.filter((system) => ids.has(system.id)).map((system) => system.id)
}

function readStoredState(): PanelState {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STYLE_OUTLINE_STORAGE_KEY) ?? 'null')
    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_STATE
    if (!('open' in parsed) || !('active' in parsed)) return DEFAULT_STATE
    const {open, active} = parsed
    if (typeof open !== 'boolean' || !Array.isArray(active)) return DEFAULT_STATE
    const ids: unknown[] = active
    const stored: unknown = 'corner' in parsed ? parsed.corner : undefined
    return {
      open,
      corner: isPanelCorner(stored) ? stored : DEFAULT_CORNER,
      active: inRegistryOrder(new Set(ids.filter(isStyleSystemId))),
    }
  } catch {
    return DEFAULT_STATE
  }
}

function writeStoredState(state: PanelState): void {
  try {
    localStorage.setItem(STYLE_OUTLINE_STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

function toggleId(active: StyleSystemId[], id: StyleSystemId): StyleSystemId[] {
  const next = new Set(active)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return inRegistryOrder(next)
}

// The census is a plain JSON tree of counts and strings, so a structural
// comparison is what "nothing changed" means for the panel.
function sameMetrics(a: StyleCensus | null, b: StyleCensus): boolean {
  return a !== null && JSON.stringify(a) === JSON.stringify(b)
}

function formatPercentage(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`
}

export default function StyleOutlinePanel() {
  const [state, setState] = useState(readStoredState)
  const [metrics, setMetrics] = useState<StyleCensus | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  const droppedRef = useRef(false)
  const {open, active, corner} = state

  useEffect(() => {
    writeStoredState(state)
  }, [state])

  useEffect(() => {
    const html = document.documentElement
    if (active.length > 0) html.setAttribute(STYLE_OUTLINE_ATTRIBUTE, active.join(' '))
    else html.removeAttribute(STYLE_OUTLINE_ATTRIBUTE)
    return () => html.removeAttribute(STYLE_OUTLINE_ATTRIBUTE)
  }, [active])

  useEffect(() => {
    if (!open) return undefined
    let frame: number | null = null
    const recount = () => {
      frame = null
      const next = takeStyleCensus(document)
      setMetrics((prev) => (sameMetrics(prev, next) ? prev : next))
    }
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(recount)
    }
    const bodyObserver = new MutationObserver(schedule)
    const headObserver = new MutationObserver(schedule)
    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ui'],
    })
    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['data-styled', 'disabled', 'href', 'media', 'rel'],
    })
    document.addEventListener('load', schedule, true)
    schedule()
    return () => {
      bodyObserver.disconnect()
      headObserver.disconnect()
      document.removeEventListener('load', schedule, true)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [open])

  const ui5Count = metrics?.nodes.ui5 ?? 0
  const ui4Count = metrics?.nodes.ui4 ?? 0
  const styledCount = metrics?.nodes.styled
  // Shares come from the shared census helpers so the widget, the bench probe
  // and Radar can never round or compute them differently
  const ui5Percentage = metrics ? ui5Share(metrics) : null
  const ui4Percentage = ui5Percentage === null ? null : 100 - ui5Percentage
  const styledRulePercentage = metrics ? styledRuleShare(metrics) : null
  const toggleSystem = (id: StyleSystemId) =>
    setState((prev) => ({...prev, active: toggleId(prev.active, id)}))

  // Nothing moves below the threshold, so a click on the handle cannot nudge the
  // widget on its way to toggling the panel.
  const activeDrag = drag?.moved === true ? drag : null

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    const widget = widgetRef.current
    if (event.button !== 0 || widget === null) return
    const rect = widget.getBoundingClientRect()
    droppedRef.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({
      pointerId: event.pointerId,
      pointerX: event.clientX,
      pointerY: event.clientY,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      offsetX: 0,
      offsetY: 0,
      target: corner,
      moved: false,
    })
  }

  const continueDrag = (event: PointerEvent<HTMLElement>) => {
    const {clientX, clientY} = event
    setDrag((prev) => {
      if (prev === null || prev.pointerId !== event.pointerId) return prev
      const offsetX = clientX - prev.pointerX
      const offsetY = clientY - prev.pointerY
      return {
        ...prev,
        offsetX,
        offsetY,
        moved: prev.moved || Math.hypot(offsetX, offsetY) > DRAG_THRESHOLD,
        target: cornerFromPoint(
          {x: prev.centerX + offsetX, y: prev.centerY + offsetY},
          {width: window.innerWidth, height: window.innerHeight},
        ),
      }
    })
  }

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (drag === null || drag.pointerId !== event.pointerId) return
    setDrag(null)
    if (!drag.moved) return
    // A drop is not a click on the handle, but the browser fires one anyway.
    droppedRef.current = true
    setState((prev) => ({...prev, corner: drag.target}))
  }

  const cancelDrag = (event: PointerEvent<HTMLElement>) => {
    setDrag((prev) => (prev?.pointerId === event.pointerId ? null : prev))
  }

  const toggleOpen = () => {
    if (droppedRef.current) {
      droppedRef.current = false
      return
    }
    setState((prev) => ({...prev, open: !prev.open}))
  }

  const nudge = (event: KeyboardEvent<HTMLElement>) => {
    const direction = KEY_DIRECTIONS[event.key]
    if (direction === undefined) return
    event.preventDefault()
    setState((prev) => ({...prev, corner: moveCorner(prev.corner, direction)}))
  }

  const handleProps = {
    onPointerDown: startDrag,
    onPointerMove: continueDrag,
    onPointerUp: endDrag,
    onPointerCancel: cancelDrag,
    onLostPointerCapture: cancelDrag,
    onKeyDown: nudge,
    onClick: toggleOpen,
  }

  return (
    <>
      {activeDrag === null ? null : (
        <div className={dropZoneLayer} aria-hidden="true">
          {PANEL_CORNERS.map((candidate) => (
            <span
              key={candidate}
              className={classNames(
                dropZone,
                dropZoneCorner[candidate],
                candidate === activeDrag.target && dropZoneActive,
              )}
              data-active={candidate === activeDrag.target}
              data-testid={`style-outline-drop-zone-${candidate}`}
            />
          ))}
        </div>
      )}
      <div
        ref={widgetRef}
        className={classNames(root, rootCorner[corner], activeDrag !== null && rootDragging)}
        style={
          activeDrag === null
            ? undefined
            : {transform: `translate(${activeDrag.offsetX}px, ${activeDrag.offsetY}px)`}
        }
        data-corner={corner}
        data-testid="style-outline"
      >
        {open ? (
          <fieldset className={panel} aria-label="Style outline" data-testid="style-outline-panel">
            <button
              type="button"
              className={classNames(header, activeDrag !== null && handleDragging)}
              title="Drag to a corner, or click to collapse"
              aria-expanded
              data-testid="style-outline-collapse"
              {...handleProps}
            >
              Style migrations
            </button>
            <section className={group} aria-labelledby="style-outline-ui-adoption">
              <h2 className={groupHeading} id="style-outline-ui-adoption">
                UI v5 adoption
              </h2>
              <div className={adoption}>
                <div
                  className={donut}
                  style={{
                    background: `conic-gradient(${STYLE_SYSTEMS[0].color} ${
                      ui5Percentage ?? 0
                    }%, ${STYLE_SYSTEMS[1].color} 0)`,
                  }}
                  role="img"
                  aria-label={`@sanity/ui v5 makes up ${formatPercentage(ui5Percentage)} of UI components`}
                  data-testid="style-outline-ui-adoption-chart"
                >
                  <span className={donutValue}>{formatPercentage(ui5Percentage)}</span>
                </div>
                <div className={legend}>
                  <div className={row}>
                    <span className={dot} style={{background: STYLE_SYSTEMS[0].color}} />
                    <span className={rowLabel}>{STYLE_SYSTEMS[0].label}</span>
                    <span className={rowCount}>
                      {ui5Count.toLocaleString()} · {formatPercentage(ui5Percentage)}
                    </span>
                  </div>
                  <div className={row}>
                    <span className={dot} style={{background: STYLE_SYSTEMS[1].color}} />
                    <span className={rowLabel}>{STYLE_SYSTEMS[1].label}</span>
                    <span className={rowCount}>
                      {ui4Count.toLocaleString()} · {formatPercentage(ui4Percentage)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
            <div className={sectionDivider} />
            <section className={group} aria-labelledby="style-outline-styled-escape">
              <h2 className={groupHeading} id="style-outline-styled-escape">
                Styled-components escape
              </h2>
              <div className={escapeDetails}>
                <div className={escapeCount}>
                  <span className={escapeCountValue}>
                    {styledCount === undefined ? '—' : styledCount.toLocaleString()}
                  </span>
                  <span className={metricLabel}>components</span>
                </div>
                <div
                  className={rowCount}
                  title={`${metrics?.stylesheets.inaccessible ?? 0} unreadable stylesheets`}
                >
                  {formatPercentage(styledRulePercentage)} of CSS rules
                </div>
              </div>
              <div
                className={cssMeter}
                role="img"
                aria-label={`styled-components supplies ${formatPercentage(styledRulePercentage)} of readable CSS rules`}
                data-testid="style-outline-styled-rules-meter"
              >
                <span className={cssMeterFill} style={{width: `${styledRulePercentage ?? 0}%`}} />
              </div>
            </section>
            <div className={sectionDivider} />
            <section className={group} aria-labelledby="style-outline-debug">
              <h2 className={groupHeading} id="style-outline-debug">
                Debug outlines
              </h2>
              {STYLE_SYSTEMS.map((system) => (
                <label key={system.id} className={row}>
                  <span className={dot} style={{background: system.color}} />
                  <span className={rowLabel}>{system.label}</span>
                  <input
                    type="checkbox"
                    className={checkbox}
                    checked={active.includes(system.id)}
                    onChange={() => toggleSystem(system.id)}
                    data-testid={`style-outline-toggle-${system.id}`}
                  />
                </label>
              ))}
            </section>
          </fieldset>
        ) : (
          <button
            type="button"
            className={classNames(trigger, activeDrag !== null && handleDragging)}
            title="Drag to a corner, or click to open"
            aria-label="Style migrations"
            aria-expanded={false}
            data-testid="style-outline-trigger"
            {...handleProps}
          >
            {STYLE_SYSTEMS.map((system) => (
              <span
                key={system.id}
                className={dot}
                style={{background: system.color, opacity: active.includes(system.id) ? 1 : 0.3}}
              />
            ))}
          </button>
        )}
      </div>
    </>
  )
}
