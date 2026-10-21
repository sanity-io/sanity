/**
 * Regression guard for the observable-identity render loop
 * (see useDocumentValuesRenderLoop.repro.test.tsx for the original incident).
 *
 * `createHookFromObservableFactory` memoized its observable on the arg
 * REFERENCE. Hooks created from it take option objects/arrays
 * (useTemplatePermissions, useDocumentPairPermissions, useWorkspaceAuthStates,
 * plus the exported raw *FromHookFactory hooks), so a caller passing an inline
 * object busted the memo every render — react-rx v5 keys its store on
 * observable identity, and each new identity's deferred `useObservable` pass
 * re-renders and mints another identity, closing a self-sustaining loop.
 * The factory now keys the observable on the arg's CONTENTS via
 * useShallowUnique.
 *
 * Mounted via a raw createRoot with IS_REACT_ACT_ENVIRONMENT disabled: act
 * would flush and mask the loop's scheduling.
 */
import {createRoot, type Root} from 'react-dom/client'
import {BehaviorSubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createHookFromObservableFactory} from '../createHookFromObservableFactory'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Mirrors the shape of the permission stores: the underlying value replays
// synchronously to new subscribers, but every factory call returns a NEW
// observable identity.
const cachedValue$ = new BehaviorSubject<string>('granted')
const observableFactory = vi.fn((arg: {id: string}) =>
  cachedValue$.pipe(map((value) => `${value}:${arg.id}`)),
)
const useHook = createHookFromObservableFactory(observableFactory)

const counters = {inline: 0}

function InlineProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.inline++
  // The footgun call shape: fresh object literal every render
  const [value] = useHook({id: 'inline'})
  return <div data-testid="inline">{value}</div>
}

function ArgProbe(props: {arg: {id: string}}) {
  useHook(props.arg)
  return null
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('createHookFromObservableFactory render stability', () => {
  let container: HTMLElement
  let root: Root
  let previousActEnvironment: boolean | undefined

  beforeEach(() => {
    counters.inline = 0
    observableFactory.mockClear()
    cachedValue$.next('granted')
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

  it('settles despite an inline object arg (regression: render loop)', async () => {
    root.render(<InlineProbe />)
    await sleep(500)
    expect(counters.inline).toBeLessThan(10)
    // A handful of subscriptions at most (warm-up + store subscription), not
    // one per render
    expect(observableFactory.mock.calls.length).toBeLessThan(5)
  })

  it('still propagates value updates from the source', async () => {
    root.render(<InlineProbe />)
    await sleep(100)
    expect(container.textContent).toBe('granted:inline')
    cachedValue$.next('revoked')
    await sleep(100)
    expect(container.textContent).toBe('revoked:inline')
  })

  it('rebuilds the observable only when the arg contents actually change', async () => {
    root.render(<ArgProbe arg={{id: 'a'}} />)
    await sleep(100)
    const callsAfterMount = observableFactory.mock.calls.length
    expect(callsAfterMount).toBeGreaterThan(0)

    // Same contents, new object identity: no rebuild
    root.render(<ArgProbe arg={{id: 'a'}} />)
    await sleep(100)
    expect(observableFactory.mock.calls.length).toBe(callsAfterMount)

    // Different contents: rebuild
    root.render(<ArgProbe arg={{id: 'b'}} />)
    await sleep(100)
    expect(observableFactory.mock.calls.length).toBeGreaterThan(callsAfterMount)
    expect(observableFactory).toHaveBeenLastCalledWith({id: 'b'})
  })
})
