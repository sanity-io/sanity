/**
 * Regression guard for a render loop reported from the field (customer
 * profile showed ~60 update passes/second, sustained, studio-wide slowdown).
 *
 * `useDocumentValues(documentId, paths)` used to memoize its observable on
 * the `paths` ARRAY REFERENCE. A caller passing an inline literal — the
 * natural call shape, e.g. `useDocumentValues(id, ['title'])` — busted the
 * memo every render: each render built a new observable (the preview store's
 * observePaths returns a fresh pipeline per call), react-rx treated it as a
 * brand-new external store whose warm-up replays the cached value
 * synchronously, and the fresh snapshot forced another render — around again
 * forever (~22k renders in 500ms before the fix; the hook now keys the memo
 * on path CONTENTS via useShallowUnique).
 *
 * Version-linked: under react-rx v4 (studio before 6.9.0) the unfixed inline case
 * rendered exactly twice and settled — the footgun was latent. Under v5
 * (adopted in 6.9.0 via #13799 + #13814) each new identity's deferred pass
 * re-rendered and minted another identity, closing the loop (verified by
 * swapping the react-rx resolution to 4.2.5 and re-running).
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
const observePaths = vi.fn(() => cachedValue$.pipe(map((value) => value)))
const mockPreviewStore = {observePaths}
vi.mock('../../../datastores', () => ({
  useDocumentPreviewStore: () => mockPreviewStore,
}))

const counters = {inline: 0, stable: 0}

function InlineProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.inline++
  // The footgun call shape: fresh array literal every render
  const {value} = useDocumentValues<{title?: string}>('doc-inline', ['title'])
  return <div data-testid="inline">{value?.title}</div>
}

const STABLE_PATHS = ['title']

function StableProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.stable++
  useDocumentValues('doc-stable', STABLE_PATHS)
  return null
}

function PathsProbe(props: {paths: string[]}) {
  useDocumentValues('doc-paths', props.paths)
  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('useDocumentValues render stability', () => {
  let container: HTMLElement
  let root: Root
  let previousActEnvironment: boolean | undefined

  beforeEach(() => {
    counters.inline = 0
    counters.stable = 0
    observePaths.mockClear()
    cachedValue$.next({title: 'hello'})
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

  it('settles despite an inline paths array (regression: render loop)', async () => {
    root.render(<InlineProbe />)
    await sleep(500)
    expect(counters.inline).toBeLessThan(10)
    // One observable for the one logical (id, paths) pair — not one per render
    expect(observePaths).toHaveBeenCalledTimes(1)
  })

  it('settles with a stable paths array', async () => {
    root.render(<StableProbe />)
    await sleep(500)
    expect(counters.stable).toBeLessThan(10)
  })

  it('still propagates value updates from the store', async () => {
    root.render(<InlineProbe />)
    await sleep(100)
    expect(container.textContent).toBe('hello')
    cachedValue$.next({title: 'updated'})
    await sleep(100)
    expect(container.textContent).toBe('updated')
  })

  it('rebuilds the observable when the path contents actually change', async () => {
    root.render(<PathsProbe paths={['title']} />)
    await sleep(100)
    expect(observePaths).toHaveBeenCalledTimes(1)
    // Same contents, new array identity: no rebuild
    root.render(<PathsProbe paths={['title']} />)
    await sleep(100)
    expect(observePaths).toHaveBeenCalledTimes(1)
    // Different contents: rebuild
    root.render(<PathsProbe paths={['name']} />)
    await sleep(100)
    expect(observePaths).toHaveBeenCalledTimes(2)
    expect(observePaths).toHaveBeenLastCalledWith({_type: 'reference', _ref: 'doc-paths'}, ['name'])
  })
})
