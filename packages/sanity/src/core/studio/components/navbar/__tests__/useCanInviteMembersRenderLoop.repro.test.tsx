/**
 * Regression guard for the observable-identity render loop
 * (see useDocumentValuesRenderLoop.repro.test.tsx for the original incident).
 *
 * `useCanInviteProjectMembers` (and its sibling `useCanDeployStudio`) built
 * `projectStore.getGrants().pipe(...)` — and a fresh `of(false)` for the
 * disabled branch — directly in the render body, with no memo. A new
 * observable identity per render turns `useObservable`'s deferred pass into
 * a self-sustaining loop in the always-mounted navbar (PresenceMenu /
 * ManageMenu). The pipelines are now memoized on the store, and the disabled
 * branch reuses a module-level constant.
 *
 * Note: React Compiler auto-memoization masks the unmemoized shape wherever
 * compilation succeeds (it does for this hook, including in this vitest
 * pipeline), so this suite cannot demonstrate the pre-fix loop. It pins the
 * explicit contract instead — one grants pipeline across re-renders — so it
 * fails if the memo is removed AND the compiler bails on the hook (silent
 * bailouts are exactly how the unmemoized shape goes live).
 *
 * Mounted via a raw createRoot with IS_REACT_ACT_ENVIRONMENT disabled: act
 * would flush and mask the loop's scheduling.
 */
import {createRoot, type Root} from 'react-dom/client'
import {BehaviorSubject} from 'rxjs'
import {map} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {useCanInviteProjectMembers} from '../useCanInviteMembers'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// Mirrors the real project store: `getGrants` replays a cached value
// synchronously to new subscribers (the underlying request is memoized).
const cachedGrants$ = new BehaviorSubject<Record<string, {grants: {name: string}[]}[]>>({
  'sanity.project.members': [{grants: [{name: 'invite'}]}],
})
const getGrants = vi.fn(() => cachedGrants$.pipe(map((grants) => grants)))
const mockProjectStore = {getGrants}
vi.mock('../../../../store/datastores', () => ({
  useProjectStore: () => mockProjectStore,
}))

const counters = {enabled: 0, disabled: 0}

function EnabledProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.enabled++
  const canInvite = useCanInviteProjectMembers()
  return <div data-testid="enabled">{String(canInvite)}</div>
}

function DisabledProbe() {
  // oxlint-disable-next-line react/immutability -- deliberate render counter: this guard exists to make a loop measurable
  counters.disabled++
  const canInvite = useCanInviteProjectMembers({enabled: false})
  return <div data-testid="disabled">{String(canInvite)}</div>
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('useCanInviteProjectMembers render stability', () => {
  let container: HTMLElement
  let root: Root
  let previousActEnvironment: boolean | undefined

  beforeEach(() => {
    counters.enabled = 0
    counters.disabled = 0
    getGrants.mockClear()
    cachedGrants$.next({'sanity.project.members': [{grants: [{name: 'invite'}]}]})
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

  it('settles when enabled (regression: pipeline was rebuilt every render)', async () => {
    root.render(<EnabledProbe />)
    await sleep(50)
    // A second render is the kick that closed the loop before the fix: the
    // unmemoized pipeline minted a new observable identity, whose deferred
    // useObservable pass re-rendered and minted another one, forever.
    root.render(<EnabledProbe />)
    await sleep(500)
    expect(counters.enabled).toBeLessThan(10)
    // One pipeline for the store — not one per render
    expect(getGrants).toHaveBeenCalledTimes(1)
    expect(container.textContent).toBe('true')
  })

  it('settles when disabled (regression: of(false) was minted every render)', async () => {
    root.render(<DisabledProbe />)
    await sleep(50)
    root.render(<DisabledProbe />)
    await sleep(500)
    expect(counters.disabled).toBeLessThan(10)
    expect(container.textContent).toBe('false')
  })

  it('still propagates grant updates from the store', async () => {
    root.render(<EnabledProbe />)
    await sleep(100)
    expect(container.textContent).toBe('true')
    cachedGrants$.next({'sanity.project.members': [{grants: [{name: 'read'}]}]})
    await sleep(100)
    expect(container.textContent).toBe('false')
  })
})
