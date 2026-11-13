import {animate, motion, useDragControls, useMotionValue, useReducedMotion} from 'motion/react'
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'
import {type LayoutProps} from 'sanity'

import {
  anchorOrigin,
  type DragDirection,
  isPanelCorner,
  moveCorner,
  type PanelCorner,
  type Point,
  rebaseAnchor,
  releaseCorner,
  restingAnchor,
} from '../style-outline/corners'
import {
  getGroqStoreStatus,
  setGroqStoreEnabled,
  subscribeGroqStoreStatus,
  type GroqStoreStatus,
} from './groqStore'

// The bar can be thrown between the four corners the same way the style outline
// panel is (see ../style-outline/corners.ts for the anchor maths), so it never has to
// sit on top of the studio's own bottom toolbars.
//
// Bottom left by default: the document pane keeps its primary action (Publish) in the
// bottom right corner, and on a phone the left of that footer only holds the status
// text. Whatever it covers, it can be moved.
const DEFAULT_BAR_CORNER: PanelCorner = 'bottom-left'
const CORNER_KEY = 'groq-store-wasm:debug-bar-corner'

// Fast enough to read as a snap, with enough bounce left to read as a throw.
const SNAP_TRANSITION = {type: 'spring', visualDuration: 0.35, bounce: 0.2} as const

const NO_MOMENTUM: Point = {x: 0, y: 0}

const KEY_DIRECTIONS: Record<string, DragDirection | undefined> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

// Docked at the viewport origin; its corner lives in the transform Motion writes.
const bar: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 100_000,
  maxWidth: 'calc(100vw - 24px - env(safe-area-inset-left, 0px) - env(safe-area-inset-right, 0px))',
  padding: '4px 8px',
  borderRadius: 6,
  background: 'rgba(20, 20, 24, 0.88)',
  color: '#eee',
  font: '11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace',
  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
  textAlign: 'left',
}
// Measures the safe-area insets (iOS notch, home indicator) without affecting layout.
const safeAreaProbe: CSSProperties = {
  position: 'absolute',
  width: 0,
  height: 0,
  visibility: 'hidden',
  pointerEvents: 'none',
  padding:
    'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)',
}
const plain: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  userSelect: 'none',
}
const toggle: CSSProperties = {
  ...plain,
  marginTop: 4,
  padding: '0 6px',
  borderRadius: 4,
  border: '1px solid #666',
}

const dot = (color: string): CSSProperties => ({color, marginRight: 4})
const mib = (bytes?: number): string => ((bytes ?? 0) / 1024 / 1024).toFixed(1)

/** Why the store can't accelerate this tab at all, if it can't. */
function blocker(status: GroqStoreStatus): string | undefined {
  if (!status.boot.started) return status.boot.reason
  if (status.store === 'failed') return `wasm store failed: ${status.storeError ?? ''}`
  if (!status.controlled) return 'no service worker controls this tab (reload)'
  return undefined
}

function Latency({status}: {status: GroqStoreStatus}) {
  if (status.latency.count === 0) return null
  return (
    <span>
      {' · '}query p50 {Math.round(status.latency.p50)} ms / p95 {Math.round(status.latency.p95)} ms
    </span>
  )
}

function Details({status}: {status: GroqStoreStatus}) {
  const reasons = Object.entries(status.reasons).toSorted(([, a], [, b]) => b - a)
  const average = status.answered === 0 ? 0 : status.answerMs / status.answered
  const fenceAverage = status.fences.lifted === 0 ? 0 : status.fences.ms / status.fences.lifted
  const fenceMix = Object.entries(status.fences.how)
    .map(([how, count]) => `${how} ${count}`)
    .join(', ')
  return (
    <div style={{marginTop: 4, whiteSpace: 'pre-wrap'}}>
      <div>
        query latency (all /data/query, resource timing): {status.latency.count} requests, p50{' '}
        {status.latency.p50.toFixed(1)} ms, p95 {status.latency.p95.toFixed(1)} ms
      </div>
      {status.enabled ? (
        <>
          <div>store: {status.store}</div>
          {status.lastStopped === undefined ? null : (
            <div>
              last run: reached {mib(status.lastStopped.exportBytes)} MiB export /{' '}
              {mib(status.lastStopped.memoryBytes)} MiB wasm, then stopped
            </div>
          )}
          {status.storeError === undefined ? null : <div>error: {status.storeError}</div>}
          <div>
            listener: {status.mutations.applied} applied, {status.mutations.stale} stale
          </div>
          <div>wasm avg: {average.toFixed(1)} ms (incl. worker round trip)</div>
          <div>
            fences: {status.fences.count}, avg lift {fenceAverage.toFixed(1)} ms
            {fenceMix === '' ? '' : ` (${fenceMix})`}
          </div>
          <div>service worker: {status.controlled ? 'controlling' : 'not controlling'}</div>
          {reasons.length === 0 ? null : <div>not answered because:</div>}
          {reasons.map(([reason, count]) => (
            <div key={reason}>
              {'  '}
              {count}× {reason}
            </div>
          ))}
        </>
      ) : (
        <div>store: {status.boot.started ? 'on' : status.boot.reason}</div>
      )}
      <button
        type="button"
        style={toggle}
        onClick={() => setGroqStoreEnabled(!status.enabled)}
        title="Remembered in this browser; ?groqStore=on|off does the same"
      >
        {status.enabled ? 'switch store off (reload)' : 'switch store on (reload)'}
      </button>
    </div>
  )
}

// The one-line summary is both the toggle and the drag surface; the details below it
// stay an ordinary surface, so their text can still be selected.
const summary: CSSProperties = {
  ...plain,
  display: 'block',
  cursor: 'grab',
  // A touch drag on the summary moves the bar instead of scrolling the studio behind it.
  touchAction: 'none',
}
const gripHint: CSSProperties = {color: '#9ca3af', marginRight: 6}

interface Insets {
  top: number
  right: number
  bottom: number
  left: number
}

const NO_INSETS: Insets = {top: 0, right: 0, bottom: 0, left: 0}

function readCorner(): PanelCorner {
  try {
    const stored = localStorage.getItem(CORNER_KEY)
    return isPanelCorner(stored) ? stored : DEFAULT_BAR_CORNER
  } catch {
    return DEFAULT_BAR_CORNER
  }
}

function writeCorner(corner: PanelCorner): void {
  try {
    localStorage.setItem(CORNER_KEY, corner)
  } catch {}
}

function readInsets(probe: HTMLElement | null): Insets {
  if (probe === null) return NO_INSETS
  const style = getComputedStyle(probe)
  return {
    top: Number.parseFloat(style.paddingTop) || 0,
    right: Number.parseFloat(style.paddingRight) || 0,
    bottom: Number.parseFloat(style.paddingBottom) || 0,
    left: Number.parseFloat(style.paddingLeft) || 0,
  }
}

/** Where the anchor rests in `corner`, inside the safe area rather than the full viewport. */
function dockedAnchor(corner: PanelCorner, insets: Insets): Point {
  const anchor = restingAnchor(corner, {
    width: window.innerWidth - insets.left - insets.right,
    height: window.innerHeight - insets.top - insets.bottom,
  })
  return {x: anchor.x + insets.left, y: anchor.y + insets.top}
}

/** Counts this tab's `/data/query` requests by who answered them. Click to expand. */
function GroqStoreDebugBar() {
  const status = useSyncExternalStore(subscribeGroqStoreStatus, getGroqStoreStatus)
  const [open, setOpen] = useState(false)
  const [corner, setCorner] = useState(readCorner)
  const [dragging, setDragging] = useState(false)
  const [initialAnchor] = useState(() => dockedAnchor(corner, NO_INSETS))
  const x = useMotionValue(initialAnchor.x)
  const y = useMotionValue(initialAnchor.y)
  const dragControls = useDragControls()
  const prefersReducedMotion = useReducedMotion()
  const barRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const droppedRef = useRef(false)
  // Leads `corner`, which only persists it: the transform origin and the anchor have
  // to change in the same Motion render or the bar would draw a corner away for a frame.
  const anchorCornerRef = useRef(corner)
  const blocked = status.enabled ? blocker(status) : undefined

  useEffect(() => writeCorner(corner), [corner])

  // Docking against the far edges (and inside the safe area, which needs the probe to
  // be mounted to measure) means a resized viewport, or Safari's toolbars showing and
  // hiding, moves the anchor.
  useLayoutEffect(() => {
    const redock = () => {
      const anchor = dockedAnchor(anchorCornerRef.current, readInsets(probeRef.current))
      x.jump(anchor.x)
      y.jump(anchor.y)
    }
    redock()
    window.addEventListener('resize', redock)
    window.visualViewport?.addEventListener('resize', redock)
    return () => {
      window.removeEventListener('resize', redock)
      window.visualViewport?.removeEventListener('resize', redock)
    }
  }, [x, y])

  // Carries the bar to `next` with the momentum it was released with.
  const dock = (next: PanelCorner, momentum: Point) => {
    const element = barRef.current
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
    const anchor = dockedAnchor(next, readInsets(probeRef.current))
    if (prefersReducedMotion === true) {
      x.jump(anchor.x)
      y.jump(anchor.y)
    } else {
      animate(x, anchor.x, {...SNAP_TRANSITION, velocity: momentum.x})
      animate(y, anchor.y, {...SNAP_TRANSITION, velocity: momentum.y})
    }
    setCorner(next)
  }

  // Motion reports the release velocity in px per second; the bar's centre decides the
  // corner so that grabbing it by one end does not skew it.
  const drop = (momentum: Point) => {
    setDragging(false)
    const element = barRef.current
    if (element === null) return
    const rect = element.getBoundingClientRect()
    const center = {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
    dock(
      releaseCorner(center, momentum, {width: window.innerWidth, height: window.innerHeight}),
      momentum,
    )
  }

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    // Cleared here as well as by the click it suppresses, so that a release outside
    // the window — which fires no click — cannot swallow the next real one.
    droppedRef.current = false
    dragControls.start(event)
  }

  // Motion only reports a drag once the pointer has passed its own threshold, so a tap
  // on the summary still toggles the details and a drop never does.
  const beginDrag = () => {
    droppedRef.current = true
    setDragging(true)
  }

  const toggleOpen = () => {
    if (droppedRef.current) {
      droppedRef.current = false
      return
    }
    setOpen((value) => !value)
  }

  const nudge = (event: KeyboardEvent<HTMLElement>) => {
    const direction = KEY_DIRECTIONS[event.key]
    if (direction === undefined) return
    event.preventDefault()
    // From the ref rather than from `corner`, so holding an arrow key keeps moving it.
    dock(moveCorner(anchorCornerRef.current, direction), NO_MOMENTUM)
  }

  return (
    <motion.div
      ref={barRef}
      style={{...bar, x, y, userSelect: dragging ? 'none' : undefined}}
      // Hangs the bar off its docked corner. Read from the ref so that the origin and
      // the anchor it belongs to are always written in the same render.
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
      data-testid="groq-store-wasm-debug-bar"
    >
      <div ref={probeRef} style={safeAreaProbe} aria-hidden />
      <button
        type="button"
        style={dragging ? {...summary, cursor: 'grabbing'} : summary}
        onPointerDown={startDrag}
        onClick={toggleOpen}
        onKeyDown={nudge}
        title="groq-store-wasm: click for details, drag (or arrow keys) to move to a corner"
        aria-expanded={open}
      >
        <span style={gripHint} aria-hidden>
          ⠿
        </span>
        {status.enabled ? (
          <>
            <span style={dot('#4ade80')}>●</span>wasm {status.answered}
            {' · '}
            <span style={dot('#facc15')}>●</span>passthrough {status.passthrough}
            {' · '}
            <span style={dot('#f87171')}>●</span>no accel {status.unaccelerated}
          </>
        ) : (
          <>
            <span style={dot('#9ca3af')}>●</span>groq store off
          </>
        )}
        <Latency status={status} />
        {status.enabled && status.store === 'building' && status.progress ? (
          <span>
            {' · '}export {mib(status.progress.exportBytes)} MiB · wasm{' '}
            {mib(status.progress.memoryBytes)} MiB
          </span>
        ) : status.enabled &&
          status.store.startsWith('live') &&
          status.progress?.memoryBytes !== undefined ? (
          <span> · wasm {mib(status.progress.memoryBytes)} MiB</span>
        ) : null}
        {status.enabled && status.guardOff ? (
          <span style={{color: '#f59e0b'}}> · guard off</span>
        ) : null}
        {blocked === undefined ? null : <span style={{color: '#f87171'}}> · {blocked}</span>}
      </button>
      {open ? <Details status={status} /> : null}
    </motion.div>
  )
}

/** Studio layout that adds the debug bar on top of the layout it wraps. */
export function GroqStoreDebugLayout(props: LayoutProps) {
  return (
    <>
      {props.renderDefault(props)}
      <GroqStoreDebugBar />
    </>
  )
}
