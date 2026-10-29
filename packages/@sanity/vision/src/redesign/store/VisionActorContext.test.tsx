import {renderHook} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createActor, createMachine} from 'xstate'

import {clearLocalStorage} from '../../util/localStorage'
import {createSidebarBadges, usePersistVisionState} from './VisionActorContext'
import {visionMachine} from './visionMachine'
import {createInitialState, getVisionStorageKey} from './visionStorage'

const defaults = {
  datasets: ['production'],
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
}

// The runners are exercised in queryRunnerMachine.test.ts; here they only need to be spawnable
const runnerStub = createMachine({id: 'runnerStub'})

function startActor() {
  const actor = createActor(visionMachine.provide({actors: {queryRunner: runnerStub as never}}), {
    input: {projectId: 'proj', persisted: createInitialState(defaults), defaults},
  })
  actor.start()
  return actor
}

/** The perspective the stored settings hold, or `null` while nothing is stored */
function storedPerspective(): unknown {
  const raw = localStorage.getItem(getVisionStorageKey('proj'))
  return raw === null ? null : JSON.parse(raw).settings.perspective
}

describe('usePersistVisionState', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('writes a change after the debounce, and one still pending when the tool unmounts', () => {
    const actor = startActor()
    const {unmount} = renderHook(() => usePersistVisionState(actor, 'proj'))

    actor.send({type: 'settings.update', settings: {perspective: 'drafts'}})
    expect(storedPerspective()).toBeNull()
    vi.runOnlyPendingTimers()
    expect(storedPerspective()).toBe('drafts')

    actor.send({type: 'settings.update', settings: {perspective: 'published'}})
    unmount()
    expect(storedPerspective()).toBe('published')
    actor.stop()
  })

  it('drops a write pending when the storage is cleared, so the cleared state stays gone', () => {
    const actor = startActor()
    const {unmount} = renderHook(() => usePersistVisionState(actor, 'proj'))
    actor.send({type: 'settings.update', settings: {perspective: 'drafts'}})

    // "Clear cache and retry" while that write is pending: neither the debounce nor leaving the
    // tool afterwards may put the edit back
    clearLocalStorage()
    vi.runOnlyPendingTimers()
    expect(storedPerspective()).toBeNull()

    // What changes after the clear is persisted like anything else
    actor.send({type: 'settings.update', settings: {perspective: 'raw'}})
    vi.runOnlyPendingTimers()
    expect(storedPerspective()).toBe('raw')

    actor.send({type: 'settings.update', settings: {perspective: 'published'}})
    clearLocalStorage()
    unmount()
    expect(storedPerspective()).toBeNull()
    actor.stop()
  })
})

describe('createSidebarBadges', () => {
  it('keeps the counts the tab sets, and tells the sidebar only when one changes', () => {
    const badges = createSidebarBadges()
    const listener = vi.fn()
    const unsubscribe = badges.subscribe(listener)

    badges.set('lint', {count: 2, tone: 'caution'})
    expect(badges.get()).toEqual({lint: {count: 2, tone: 'caution'}})
    const first = badges.get()
    // The same count again is no change, and the snapshot stays the same object
    badges.set('lint', {count: 2, tone: 'caution'})
    expect(badges.get()).toBe(first)
    expect(listener).toHaveBeenCalledTimes(1)

    badges.set('functions', {count: 1, tone: 'default'})
    badges.set('lint', undefined)
    expect(badges.get()).toEqual({functions: {count: 1, tone: 'default'}})
    expect(listener).toHaveBeenCalledTimes(3)

    unsubscribe()
    badges.set('functions', undefined)
    expect(listener).toHaveBeenCalledTimes(3)
  })
})
