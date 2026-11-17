/** Uses a raw root because `act` masks the scheduling that caused the original loop. */
import {createRoot, type Root} from 'react-dom/client'
import {BehaviorSubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useDocumentValues} from '../useDocumentValues'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const cachedValue$ = new BehaviorSubject<Record<string, unknown>>({title: 'hello'})
// Each call must return a new observable identity to reproduce the original bug.
const observePaths = vi.fn(() => cachedValue$.pipe(map((value) => value)))
const mockPreviewStore = {observePaths}
vi.mock('../../../datastores', () => ({
  useDocumentPreviewStore: () => mockPreviewStore,
}))

const counters = {inline: 0, stable: 0}

function InlineProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.inline++
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
