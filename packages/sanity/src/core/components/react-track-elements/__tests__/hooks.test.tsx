import {act, render, renderHook} from '@testing-library/react'
import {afterAll, afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {
  type TrackerContextGetSnapshot,
  type TrackerContextStore,
  useTrackerStore,
  useTrackerStoreReporter,
} from '../hooks'

type Value = {label: string}

// The store publishes its snapshot with a trailing 10 ms debounce
const PUBLISH_DELAY = 10

// React runs unmount cleanups parent-first, so a reporter unmounting after its tracker re-arms
// that debounce against the already unmounted reducer: a harmless no-op in the browser.
// Testing-library's automatic cleanup does exactly that after the last `afterEach`, with real
// timers, so let the timer fire while the DOM environment still exists rather than racing its
// teardown (`window is not defined` from inside react-dom).
afterAll(() => new Promise((resolve) => setTimeout(resolve, 2 * PUBLISH_DELAY)))

/**
 * Mounts a tracker store and exposes the store, the latest published snapshot and how many
 * snapshots have been published (every publish yields a new snapshot array)
 */
function renderStore() {
  const latest: {
    store: TrackerContextStore<Value> | null
    snapshot: TrackerContextGetSnapshot<Value>
    publishes: number
  } = {store: null, snapshot: [], publishes: 0}

  const {rerender} = renderHook(() => {
    const result = useTrackerStore<Value>()
    latest.store = result.store
    if (result.snapshot !== latest.snapshot) {
      latest.snapshot = result.snapshot
      latest.publishes += 1
    }
    return result
  })
  // The initial snapshot is not a publish
  latest.publishes = 0

  return {latest, rerender}
}

function Reporter(props: {
  store: TrackerContextStore<Value> | null
  id: string | null
  value: () => Value
  isEqual?: (a: Value | null, b: Value | null) => boolean
}) {
  useTrackerStoreReporter(props.store, props.id, props.value, props.isEqual)
  return null
}

const flushPublish = () =>
  act(() => {
    vi.advanceTimersByTime(PUBLISH_DELAY)
  })

describe('useTrackerStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts out empty', () => {
    const {latest} = renderStore()

    expect(latest.snapshot).toEqual([])
  })

  it('publishes added values as [id, value] entries after the debounce', () => {
    const {latest} = renderStore()

    act(() => {
      latest.store!.add('a', {label: 'A'})
      latest.store!.add('b', {label: 'B'})
    })
    expect(latest.snapshot).toEqual([])

    flushPublish()
    expect(latest.snapshot).toEqual([
      ['a', {label: 'A'}],
      ['b', {label: 'B'}],
    ])
  })

  it('coalesces a burst of changes into a single publish', () => {
    const {latest} = renderStore()

    act(() => {
      latest.store!.add('a', {label: 'A'})
      latest.store!.update('a', {label: 'A2'})
      latest.store!.add('b', {label: 'B'})
      latest.store!.remove('b')
    })
    flushPublish()

    expect(latest.publishes).toBe(1)
    expect(latest.snapshot).toEqual([['a', {label: 'A2'}]])
  })

  it('removes entries', () => {
    const {latest} = renderStore()

    act(() => {
      latest.store!.add('a', {label: 'A'})
    })
    flushPublish()
    expect(latest.snapshot).toHaveLength(1)

    act(() => {
      latest.store!.remove('a')
    })
    flushPublish()
    expect(latest.snapshot).toEqual([])
  })

  it('keeps the same store instance across re-renders', () => {
    const {latest, rerender} = renderStore()
    const store = latest.store

    rerender()

    expect(latest.store).toBe(store)
  })
})

describe('useTrackerStoreReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('adds its value on mount and removes it on unmount', () => {
    const {latest} = renderStore()
    const value = () => ({label: 'A'})

    const {unmount} = render(<Reporter store={latest.store} id="a" value={value} />)
    flushPublish()
    expect(latest.snapshot).toEqual([['a', {label: 'A'}]])

    unmount()
    flushPublish()
    expect(latest.snapshot).toEqual([])
  })

  it('does not register while the id is null', () => {
    const {latest} = renderStore()
    const value = () => ({label: 'A'})

    const {rerender} = render(<Reporter store={latest.store} id={null} value={value} />)
    flushPublish()
    expect(latest.snapshot).toEqual([])

    // Once the id is known (e.g. the element has mounted), the value is registered
    rerender(<Reporter store={latest.store} id="a" value={value} />)
    flushPublish()
    expect(latest.snapshot).toEqual([['a', {label: 'A'}]])
  })

  it('does not even read the value without a store', () => {
    const value = vi.fn(() => ({label: 'A'}))

    render(<Reporter store={null} id="a" value={value} />)
    flushPublish()

    expect(value).not.toHaveBeenCalled()
  })

  it('updates the value on re-render when the getter returns something new', () => {
    const {latest} = renderStore()
    let label = 'A'
    const value = () => ({label})

    const {rerender} = render(<Reporter store={latest.store} id="a" value={value} />)
    flushPublish()
    expect(latest.snapshot).toEqual([['a', {label: 'A'}]])

    label = 'B'
    rerender(<Reporter store={latest.store} id="a" value={value} />)
    flushPublish()
    expect(latest.snapshot).toEqual([['a', {label: 'B'}]])
  })

  it('skips the update when the custom equality says the value is unchanged', () => {
    const {latest} = renderStore()
    const update = vi.spyOn(latest.store!, 'update')
    let label = 'A'
    const value = () => ({label})
    const isEqual = (a: Value | null, b: Value | null) => a?.label === b?.label

    const {rerender} = render(
      <Reporter store={latest.store} id="a" value={value} isEqual={isEqual} />,
    )
    flushPublish()

    rerender(<Reporter store={latest.store} id="a" value={value} isEqual={isEqual} />)
    flushPublish()
    expect(update).not.toHaveBeenCalled()

    label = 'B'
    rerender(<Reporter store={latest.store} id="a" value={value} isEqual={isEqual} />)
    flushPublish()
    expect(update).toHaveBeenCalledTimes(1)
    expect(latest.snapshot).toEqual([['a', {label: 'B'}]])
  })

  it('re-registers under the new id when the id changes', () => {
    const {latest} = renderStore()
    const value = () => ({label: 'A'})

    const {rerender} = render(<Reporter store={latest.store} id="a" value={value} />)
    flushPublish()

    rerender(<Reporter store={latest.store} id="b" value={value} />)
    flushPublish()

    expect(latest.snapshot).toEqual([['b', {label: 'A'}]])
  })

  it('tracks several reporters and removes only the one that unmounts', () => {
    const {latest} = renderStore()

    const {rerender} = render(
      <>
        <Reporter store={latest.store} id="a" value={() => ({label: 'A'})} />
        <Reporter store={latest.store} id="b" value={() => ({label: 'B'})} />
      </>,
    )
    flushPublish()
    expect(latest.snapshot).toEqual([
      ['a', {label: 'A'}],
      ['b', {label: 'B'}],
    ])

    rerender(<Reporter store={latest.store} id="b" value={() => ({label: 'B'})} />)
    flushPublish()
    expect(latest.snapshot).toEqual([['b', {label: 'B'}]])
  })
})
