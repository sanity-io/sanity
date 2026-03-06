import {firstValueFrom, take, toArray} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createBroadcastChannel} from '../createBroadcastChannel'
import * as storage from '../storage'

describe('createBroadcastChannel', () => {
  afterEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('delivers broadcast messages to the same tab (via internal Subject)', async () => {
    const channel = createBroadcastChannel<string>('test-same-tab')

    const messagePromise = firstValueFrom(channel.messages)
    channel.broadcast('hello')

    expect(await messagePromise).toBe('hello')
  })

  it('replays the last message to new subscribers via shareReplay', async () => {
    const channel = createBroadcastChannel<string>('test-replay')

    const sub = channel.messages.subscribe(() => {})
    channel.broadcast('first-message')

    const message = await firstValueFrom(channel.messages)
    expect(message).toBe('first-message')

    sub.unsubscribe()
  })

  it('delivers multiple messages in order', async () => {
    const channel = createBroadcastChannel<string>('test-sequence')

    const messagesPromise = firstValueFrom(channel.messages.pipe(take(3), toArray()))

    channel.broadcast('one')
    channel.broadcast('two')
    channel.broadcast('three')

    expect(await messagesPromise).toEqual(['one', 'two', 'three'])
  })

  it('receives cross-tab storage events for its namespace key', () => {
    const channel = createBroadcastChannel<string>('test-cross-tab')

    const messages: string[] = []
    channel.messages.subscribe((m) => messages.push(m))

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: '__studio_local_storage_messaging_test-cross-tab',
        newValue: JSON.stringify('from-another-tab'),
      }),
    )

    expect(messages).toEqual(['from-another-tab'])
  })

  it('ignores storage events for other namespaces and null values', () => {
    const channel = createBroadcastChannel<string>('test-filter')

    const messages: string[] = []
    channel.messages.subscribe((m) => messages.push(m))

    // Different namespace
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: '__studio_local_storage_messaging_other-channel',
        newValue: JSON.stringify('ignored'),
      }),
    )
    // Null newValue (from removeItem)
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: '__studio_local_storage_messaging_test-filter',
        newValue: null,
      }),
    )

    expect(messages).toEqual([])
  })

  it('clears storage key after write so identical messages still trigger events', () => {
    const setSpy = vi.spyOn(storage, 'setItem')
    const removeSpy = vi.spyOn(storage, 'removeItem')

    const channel = createBroadcastChannel<string>('test-clear')
    channel.broadcast('test')

    expect(setSpy).toHaveBeenCalledTimes(1)
    expect(removeSpy).toHaveBeenCalledWith('__studio_local_storage_messaging_test-clear')
  })

  it('does not throw when storage operations fail', () => {
    vi.spyOn(storage, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    const channel = createBroadcastChannel<string>('test-error')
    expect(() => channel.broadcast('test')).not.toThrow()
  })
})
