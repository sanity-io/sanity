import {firstValueFrom, take, toArray} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  createBroadcastState,
  createLocalStorageStorage,
  createMemoryStorage,
} from '../createBroadcastState'

// jsdom provides a stub BroadcastChannel; it delivers messages synchronously
// via `postMessage` within the same realm, which is sufficient for unit tests.

describe('createBroadcastState', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('emits the initial value immediately', async () => {
    const state = createBroadcastState<string>('test-initial', () => 'hello')
    const value = await firstValueFrom(state.value)
    expect(value).toBe('hello')
    state.dispose()
  })

  it('emits undefined when no initial function is provided (void overload)', async () => {
    const state = createBroadcastState('test-void')
    const value = await firstValueFrom(state.value)
    expect(value).toBeUndefined()
    state.dispose()
  })

  it('delivers updates to subscribers', async () => {
    const state = createBroadcastState<string>('test-update', () => 'first')

    const valuesPromise = firstValueFrom(state.value.pipe(take(2), toArray()))

    state.update('second')

    expect(await valuesPromise).toEqual(['first', 'second'])
    state.dispose()
  })

  it('replays the latest value to new subscribers', async () => {
    const state = createBroadcastState<string>('test-replay', () => 'init')

    // subscribe once to activate, then update
    const sub = state.value.subscribe(() => {})
    state.update('updated')

    const value = await firstValueFrom(state.value)
    expect(value).toBe('updated')

    sub.unsubscribe()
    state.dispose()
  })

  it('passes the current storage value to the initial function', () => {
    const storage = createMemoryStorage<string>()
    storage.store('persisted')

    const state = createBroadcastState<string>(
      'test-storage-init',
      (current) => current ?? 'default',
      storage,
    )

    // Should have received 'persisted' from storage
    const sub = state.value.subscribe((v) => {
      expect(v).toBe('persisted')
    })
    sub.unsubscribe()
    state.dispose()
  })

  it('persists values to the provided storage on update', () => {
    const storage = createMemoryStorage<string>()
    const state = createBroadcastState<string>('test-persist', () => 'init', storage)

    state.update('saved')
    expect(storage.load()).toBe('saved')

    state.dispose()
  })

  it('completes the observable on dispose', async () => {
    const state = createBroadcastState<string>('test-dispose', () => 'value')

    let completed = false
    state.value.subscribe({complete: () => (completed = true)})
    state.dispose()

    expect(completed).toBe(true)
  })
})

describe('createLocalStorageStorage', () => {
  afterEach(() => {
    localStorage.clear()
  })

  it('returns undefined when key does not exist', () => {
    const storage = createLocalStorageStorage<string>('nonexistent')
    expect(storage.load()).toBeUndefined()
  })

  it('stores and loads JSON values', () => {
    const storage = createLocalStorageStorage<{token: string}>('test-key')
    storage.store({token: 'abc'})
    expect(storage.load()).toEqual({token: 'abc'})
  })

  it('removes the key when storing undefined', () => {
    const storage = createLocalStorageStorage<string>('test-remove')
    storage.store('value')
    expect(localStorage.getItem('test-remove')).not.toBeNull()

    storage.store(undefined)
    expect(localStorage.getItem('test-remove')).toBeNull()
  })

  it('returns undefined for corrupt JSON without throwing', () => {
    localStorage.setItem('corrupt', '{bad json')
    const storage = createLocalStorageStorage<string>('corrupt')
    expect(storage.load()).toBeUndefined()
  })
})

describe('createMemoryStorage', () => {
  it('returns undefined when empty', () => {
    const storage = createMemoryStorage<string>()
    expect(storage.load()).toBeUndefined()
  })

  it('stores and loads values', () => {
    const storage = createMemoryStorage<string>()
    storage.store('hello')
    expect(storage.load()).toBe('hello')
  })

  it('removes value when storing undefined', () => {
    const storage = createMemoryStorage<string>()
    storage.store('hello')
    storage.store(undefined)
    expect(storage.load()).toBeUndefined()
  })
})
