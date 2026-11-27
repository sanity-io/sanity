import {type CDPSession} from '@playwright/test'

/** The user timing mark the ready script sets, so the trace shows where ready was reached. */
export const READY_MARK = 'version-compare:ready'

/** Roughly what the DevTools Performance panel records, with the JS sampling profiler. */
const CATEGORIES = [
  '-*',
  'blink.user_timing',
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'disabled-by-default-devtools.timeline.frame',
  'disabled-by-default-devtools.timeline.stack',
  'disabled-by-default-v8.compile',
  'disabled-by-default-v8.cpu_profiler',
  'loading',
  'toplevel',
  'v8',
  'v8.execute',
]

export interface TraceEvent {
  name: string
  cat: string
  ph: string
  ts: number
  dur?: number
  pid: number
  tid: number
  args?: Record<string, unknown>
}

export async function startTrace(cdp: CDPSession): Promise<void> {
  await cdp.send('Tracing.start', {
    traceConfig: {includedCategories: CATEGORIES, recordMode: 'recordAsMuchAsPossible'},
    transferMode: 'ReturnAsStream',
  })
}

export async function stopTrace(cdp: CDPSession): Promise<TraceEvent[]> {
  const complete = new Promise<string>((resolve) => {
    cdp.once('Tracing.tracingComplete', ({stream}) => resolve(stream!))
  })
  await cdp.send('Tracing.end')
  const handle = await complete
  const chunks: string[] = []
  for (;;) {
    // oxlint-disable-next-line no-await-in-loop -- the stream is read in order
    const {base64Encoded, data, eof} = await cdp.send('IO.read', {handle})
    chunks.push(base64Encoded ? Buffer.from(data, 'base64').toString('utf8') : data)
    if (eof) break
  }
  await cdp.send('IO.close', {handle})
  const parsed = JSON.parse(chunks.join('')) as {traceEvents: TraceEvent[]} | TraceEvent[]
  return Array.isArray(parsed) ? parsed : parsed.traceEvents
}

export interface TraceWindow {
  /** Trace timestamp (µs) of navigation start. */
  navigationStart: number
  /** Trace timestamp (µs) of the ready mark. */
  ready: number
  /** The renderer main thread that set the mark. */
  pid: number
  tid: number
}

/** Locates the ready mark; `readyMs` is the same moment measured from navigation start. */
export function findTraceWindow(events: TraceEvent[], readyMs: number): TraceWindow | null {
  const mark = events.find((event) => event.name === READY_MARK && event.ph !== 'M')
  if (!mark) return null
  return {navigationStart: mark.ts - readyMs * 1000, pid: mark.pid, ready: mark.ts, tid: mark.tid}
}

/** Drops every event that starts after ready; metadata (process and thread names) stays. */
export function cutTrace(events: TraceEvent[], window: TraceWindow): TraceEvent[] {
  return events.filter((event) => event.ph === 'M' || event.ts <= window.ready)
}

export interface MainThreadTime {
  /** Navigation start to ready. */
  windowMs: number
  /** Time inside any task. */
  busyMs: number
  /** Parsing HTML and CSS, and compiling JS (including code caching). */
  parseCompileMs: number
  /** Evaluating and running JS, including garbage collection. */
  scriptMs: number
  /** Style, layout, paint and compositing work. */
  renderMs: number
  /** Busy time in none of the above (task scheduling, IPC, ...). */
  otherMs: number
}

type Bucket = 'parseCompile' | 'script' | 'render'

const PARSE_COMPILE = new Set([
  'ParseAuthorStyleSheet',
  'ParseHTML',
  'V8.FinalizeDeserialization',
  'v8.produceCache',
  'v8.produceModuleCache',
])
const SCRIPT = new Set([
  'EvaluateScript',
  'EventDispatch',
  'FireAnimationFrame',
  'FireIdleCallback',
  'FunctionCall',
  'MajorGC',
  'MinorGC',
  'RunMicrotasks',
  'TimerFire',
  'V8.Execute',
  'XHRLoad',
  'XHRReadyStateChange',
  'v8.evaluateModule',
  'v8.run',
])
const RENDER = new Set([
  'Commit',
  'CompositeLayers',
  'Decode Image',
  'HitTest',
  'Layerize',
  'Layout',
  'Paint',
  'PaintImage',
  'PrePaint',
  'RecalculateStyles',
  'UpdateLayer',
  'UpdateLayerTree',
  'UpdateLayoutTree',
])

function classify(name: string): Bucket | null {
  if (PARSE_COMPILE.has(name) || /^v8\.(compile|parse)|^V8\.(Compile|Parse)/.test(name)) {
    return 'parseCompile'
  }
  if (SCRIPT.has(name) || /^(V8\.GC|BlinkGC)/.test(name)) return 'script'
  if (RENDER.has(name)) return 'render'
  return null
}

interface Slice {
  name: string
  start: number
  end: number
}

/** Complete (`X`) and paired begin/end (`B`/`E`) events of one thread, as time slices. */
function threadSlices(events: TraceEvent[], pid: number, tid: number): Slice[] {
  const slices: Slice[] = []
  const open: TraceEvent[] = []
  for (const event of events) {
    if (event.pid !== pid || event.tid !== tid) continue
    if (event.ph === 'X' && event.dur !== undefined) {
      slices.push({end: event.ts + event.dur, name: event.name, start: event.ts})
    } else if (event.ph === 'B') {
      open.push(event)
    } else if (event.ph === 'E') {
      const begin = open.pop()
      if (begin) slices.push({end: event.ts, name: begin.name, start: begin.ts})
    }
  }
  return slices
}

/** Top-level tasks of the main thread before ready, as `[start, end]` in ms from navigation start. */
export function mainThreadTasks(
  events: TraceEvent[],
  window: TraceWindow,
): Array<[number, number]> {
  const tasks: Array<[number, number]> = []
  let coveredUntil = -Infinity
  const slices = threadSlices(events, window.pid, window.tid)
    .filter((slice) => slice.start <= window.ready && slice.end >= window.navigationStart)
    .toSorted((a, b) => a.start - b.start || b.end - a.end)
  for (const slice of slices) {
    if (slice.start < coveredUntil) continue
    coveredUntil = slice.end
    tasks.push([
      (slice.start - window.navigationStart) / 1000,
      (slice.end - window.navigationStart) / 1000,
    ])
  }
  return tasks
}

/**
 * Splits the main thread's time between navigation start and ready. Every slice's self time
 * (its duration minus its children's) goes to its own bucket, or to the nearest enclosing
 * slice's bucket when its name is not classified, so V8 internals under a `FunctionCall` count
 * as script and a compile inside it as parse/compile.
 */
export function mainThreadTime(events: TraceEvent[], window: TraceWindow): MainThreadTime {
  const clip = (time: number) => Math.min(Math.max(time, window.navigationStart), window.ready)
  const slices = threadSlices(events, window.pid, window.tid)
    .map((slice) => ({...slice, end: clip(slice.end), start: clip(slice.start)}))
    .filter((slice) => slice.end > slice.start)
    // Parents first: earlier start, then longer.
    .toSorted((a, b) => a.start - b.start || b.end - a.end)

  const totals = {other: 0, parseCompile: 0, render: 0, script: 0}
  let busy = 0
  const stack: Array<Slice & {bucket: Bucket | null; childTime: number}> = []
  const close = () => {
    const done = stack.pop()!
    totals[done.bucket ?? 'other'] += done.end - done.start - done.childTime
  }
  for (const slice of slices) {
    while (stack.length > 0 && stack.at(-1)!.end <= slice.start) close()
    const parent = stack.at(-1)
    // A slice that overlaps its parent's end without nesting is clipped to it.
    const end = parent ? Math.min(slice.end, parent.end) : slice.end
    if (end <= slice.start) continue
    if (parent) parent.childTime += end - slice.start
    else busy += end - slice.start
    stack.push({
      ...slice,
      bucket: classify(slice.name) ?? parent?.bucket ?? null,
      childTime: 0,
      end,
    })
  }
  while (stack.length > 0) close()

  const ms = (micros: number) => micros / 1000
  return {
    busyMs: ms(busy),
    otherMs: ms(totals.other),
    parseCompileMs: ms(totals.parseCompile),
    renderMs: ms(totals.render),
    scriptMs: ms(totals.script),
    windowMs: ms(window.ready - window.navigationStart),
  }
}
