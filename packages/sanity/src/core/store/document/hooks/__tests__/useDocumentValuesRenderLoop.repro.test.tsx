/**
 * Reproduces the render loop behind a customer-reported studio-wide slowdown
 * (traced from a Firefox profile: ~60 update passes/second, sustained).
 *
 * `useDocumentValues(documentId, paths)` memoizes its observable on the
 * `paths` ARRAY REFERENCE. A caller passing an inline literal — the natural
 * call shape, e.g. `useDocumentValues(id, ['title'])` — busts the memo every
 * render: each render builds a new observable (the preview store's
 * observePaths returns a fresh pipeline per call), react-rx treats it as a
 * brand-new external store whose warm-up replays the cached value
 * synchronously, the snapshot is a fresh object (asLoadable maps per
 * emission), useSyncExternalStore sees "changed" and re-renders — around
 * again forever. One looping preview component per visible list item.
 *
 * The control (module-constant paths array) renders a handful of times and
 * settles.
 *
 * Mounted via a raw createRoot with IS_REACT_ACT_ENVIRONMENT disabled: act
 * would flush and mask the loop's scheduling.
 */
import {createRoot, type Root} from 'react-dom/client'
import {BehaviorSubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useDocumentValues} from '../useDocumentValues'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Mirrors the real preview store's shape: the underlying value is cached and
// replays synchronously to new subscribers, but every observePaths() call
// returns a NEW observable identity (createPathObserver builds a fresh
// pipeline per call)
const cachedValue$ = new BehaviorSubject<Record<string, unknown>>({title: 'hello'})
// The store instance itself is stable (as the real one is) — only the
// observable returned per observePaths() call has a fresh identity
const mockPreviewStore = {
  observePaths: () => cachedValue$.pipe(map((value) => value)),
}
vi.mock('../../../datastores', () => ({
  useDocumentPreviewStore: () => mockPreviewStore,
}))

const counters = {inline: 0, stable: 0}

function InlineProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this repro exists to make the loop measurable
  counters.inline++
  // The footgun: fresh array literal every render
  useDocumentValues('doc-inline', ['title'])
  return null
}

const STABLE_PATHS = ['title']

function StableProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this repro exists to make the loop measurable
  counters.stable++
  useDocumentValues('doc-stable', STABLE_PATHS)
  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('useDocumentValues render loop (repro)', () => {
  let container: HTMLElement
  let root: Root
  let previousActEnvironment: boolean | undefined

  beforeEach(() => {
    counters.inline = 0
    counters.stable = 0
    previousActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT
    globalThis.IS_REACT_ACT_ENVIRONMENT = false
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    root.unmount()
    container.remove()
    globalThis.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment
  })

  it('a stable paths array settles after a handful of renders', async () => {
    root.render(<StableProbe />)
    await sleep(500)
    expect(counters.stable).toBeLessThan(10)
  })

  it('an inline paths array re-renders unboundedly', async () => {
    root.render(<InlineProbe />)
    await sleep(500)
    // The loop: hundreds of renders in half a second with no external input
    expect(counters.inline).toBeGreaterThan(50)
  })
})
