import {
  type StyleCensus,
  styledRuleShare,
  takeStyleCensus,
  ui5Share,
} from '@repo/utils/style-systems'
import {animate, motion, useDragControls, useMotionValue, useReducedMotion} from 'motion/react'
import {type KeyboardEvent, type PointerEvent, useEffect, useRef, useState} from 'react'

import {
  anchorOrigin,
  DEFAULT_CORNER,
  type DragDirection,
  isPanelCorner,
  moveCorner,
  type PanelCorner,
  type Point,
  rebaseAnchor,
  releaseCorner,
  restingAnchor,
  type Size,
} from './corners'
import {
  adoption,
  checkbox,
  cssMeter,
  cssMeterFill,
  dot,
  donut,
  donutValue,
  escapeCount,
  escapeCountValue,
  escapeDetails,
  group,
  groupHeading,
  handleDragging,
  header,
  legend,
  lifted,
  metricLabel,
  panel,
  root,
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

// Fast enough to read as a snap, with enough bounce left to read as a throw.
const SNAP_TRANSITION = {type: 'spring', visualDuration: 0.35, bounce: 0.2} as const

const NO_MOMENTUM: Point = {x: 0, y: 0}

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

function readViewport(): Size {
  return {width: window.innerWidth, height: window.innerHeight}
}

export default function StyleOutlinePanel() {
  const [state, setState] = useState(readStoredState)
  const [metrics, setMetrics] = useState<StyleCensus | null>(null)
  const [dragging, setDragging] = useState(false)
  const [initialAnchor] = useState(() => restingAnchor(state.corner, readViewport()))
  const x = useMotionValue(initialAnchor.x)
  const y = useMotionValue(initialAnchor.y)
  const dragControls = useDragControls()
  const prefersReducedMotion = useReducedMotion()
  const widgetRef = useRef<HTMLDivElement>(null)
  const droppedRef = useRef(false)
  // The corner the anchor is currently held against. It leads `state.corner`, which
  // only persists it, because the transform origin and the anchor have to change in
  // the same Motion render or the widget would draw a corner away for a frame.
  const anchorCornerRef = useRef(state.corner)
  const {open, active, corner} = state

  useEffect(() => {
    writeStoredState(state)
  }, [state])

  // Docking against the far edges means a resized viewport moves the anchor.
  useEffect(() => {
    const redock = () => {
      const anchor = restingAnchor(anchorCornerRef.current, readViewport())
      x.jump(anchor.x)
      y.jump(anchor.y)
    }
    window.addEventListener('resize', redock)
    return () => window.removeEventListener('resize', redock)
  }, [x, y])

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

  // Carries the widget to `next` with the momentum it was released with, which is
  // what makes a throw look like it was thrown rather than teleported.
  const dock = (next: PanelCorner, momentum: Point) => {
    const element = widgetRef.current
    if (element === null) return
    const previous = anchorCornerRef.current
    if (next !== previous) {
      const rebased = rebaseAnchor(
        {x: x.get(), y: y.get()},
        element.getBoundingClientRect(),
        previous,
        next,
      )
      anchorCornerRef.current = next
      x.jump(rebased.x)
      y.jump(rebased.y)
    }
    const anchor = restingAnchor(next, readViewport())
    if (prefersReducedMotion === true) {
      x.jump(anchor.x)
      y.jump(anchor.y)
    } else {
      animate(x, anchor.x, {...SNAP_TRANSITION, velocity: momentum.x})
      animate(y, anchor.y, {...SNAP_TRANSITION, velocity: momentum.y})
    }
    setState((prev) => (prev.corner === next ? prev : {...prev, corner: next}))
  }

  // Motion reports the release velocity in px per second, and the widget's centre
  // decides the corner so that grabbing the panel by one end does not skew it.
  const drop = (momentum: Point) => {
    setDragging(false)
    const element = widgetRef.current
    if (element === null) return
    const rect = element.getBoundingClientRect()
    const center = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
    dock(releaseCorner(center, momentum, readViewport()), momentum)
  }

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    // Cleared here as well as by the click it suppresses, so that a release outside
    // the window — which fires no click — cannot swallow the next real one.
    droppedRef.current = false
    dragControls.start(event)
  }

  // Motion only reports a drag once the pointer has passed its own threshold, so a
  // click on the handle still toggles the panel and a drop never does.
  const beginDrag = () => {
    droppedRef.current = true
    setDragging(true)
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
    // From the ref rather than from `corner`, so holding an arrow key keeps moving
    // the widget instead of re-deciding from the corner of the last render.
    dock(moveCorner(anchorCornerRef.current, direction), NO_MOMENTUM)
  }

  const handleProps = {
    onPointerDown: startDrag,
    onKeyDown: nudge,
    onClick: toggleOpen,
  }

  return (
    <motion.div
      ref={widgetRef}
      className={classNames(root, dragging && rootDragging)}
      style={{x, y}}
      // Hangs the widget off its docked corner. Read from the ref so that the origin
      // and the anchor it belongs to are always written in the same render.
      transformTemplate={(_values, transform) => {
        const origin = anchorOrigin(anchorCornerRef.current)
        return `${transform} translate(${origin.x}, ${origin.y})`
      }}
      drag
      dragListener={false}
      dragControls={dragControls}
      // The throw is a spring towards a corner, not Motion's free inertia.
      dragMomentum={false}
      onDragStart={beginDrag}
      onDragEnd={(_event, info) => drop(info.velocity)}
      data-corner={corner}
      data-testid="style-outline"
    >
      {open ? (
        <fieldset
          className={classNames(panel, dragging && lifted)}
          aria-label="Style outline"
          data-testid="style-outline-panel"
        >
          <button
            type="button"
            className={classNames(header, dragging && handleDragging)}
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
          className={classNames(trigger, dragging && handleDragging, dragging && lifted)}
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
    </motion.div>
  )
}
