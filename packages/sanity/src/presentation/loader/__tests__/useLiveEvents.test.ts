import {createClient, type LiveEvent} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {Subject} from 'rxjs'
import {afterEach, describe, expect, test, vi} from 'vitest'

import {stubDocumentVisibility} from '../../../../test/testUtils/documentVisibility'
import {
  LISTENER_PAUSE_GRACE_PERIOD,
  listenerGate,
} from '../../../core/store/listenerGate/listenerGate'
import {initialState, reducer, useLiveEvents} from '../useLiveEvents'

let releaseListenerGate: (() => void) | undefined

describe('useLiveEvents', () => {
  const msg1 = {type: 'message' as const, id: '123', tags: ['s1:abc' as const]}
  const msg2 = {type: 'message' as const, id: '456', tags: ['s1:abc' as const]}

  test('new live events are added at the end of the list', () => {
    const state = reducer(reducer(initialState, msg1), msg2)
    expect(state.messages).toEqual([msg1, msg2])
    expect(state.messages).not.toEqual([msg2, msg1])
  })

  test('reconnect and restart events clear the message list', () => {
    const prevState = reducer(initialState, msg1)
    expect(prevState.messages).toEqual([msg1])
    expect(reducer(prevState, {type: 'reconnect'}).messages).toEqual([])
    expect(reducer(prevState, {type: 'restart', id: 'abc123'}).messages).toEqual([])
  })

  test('reconnect and restart events increments the resets counter', () => {
    const prevState = reducer(initialState, msg1)
    expect(prevState.messages).toEqual([msg1])
    expect(reducer(prevState, {type: 'reconnect'}).resets).toEqual(1)
    expect(reducer(prevState, {type: 'restart', id: 'abc123'}).resets).toEqual(1)
  })

  test('welcome is ignored', () => {
    expect(reducer(initialState, {type: 'welcome'})).toEqual(initialState)
  })

  test('the message list is capped, keeping the most recent messages', () => {
    const messages = Array.from({length: 120}, (_, i) => ({
      type: 'message' as const,
      id: `${i}`,
      tags: ['s1:abc' as const],
    }))
    const state = messages.reduce(reducer, initialState)

    expect(state.messages).toHaveLength(100)
    expect(state.messages.at(0)?.id).toBe('20')
    expect(state.messages.at(-1)?.id).toBe('119')
  })

  describe('on a hidden page', () => {
    afterEach(() => {
      releaseListenerGate?.()
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    test('stops listening while paused, and resets when the page is shown', () => {
      vi.useFakeTimers()
      releaseListenerGate = listenerGate.enable()
      const documentVisibility = stubDocumentVisibility()
      const client = createClient({
        projectId: 'abc',
        dataset: 'production',
        apiVersion: '2025-02-19',
        useCdn: false,
      })
      const events = new Subject<LiveEvent>()
      vi.spyOn(client.live, 'events').mockReturnValue(events as never)

      const {result, unmount} = renderHook(() => useLiveEvents(client))
      act(() => events.next(msg1))
      expect(result.current).toEqual({messages: [msg1], resets: 0})

      act(() => documentVisibility.set('hidden'))
      act(() => {
        vi.advanceTimersByTime(LISTENER_PAUSE_GRACE_PERIOD)
      })
      expect(events.observed).toBe(false)

      act(() => documentVisibility.set('visible'))
      expect(events.observed).toBe(true)
      expect(result.current).toEqual({messages: [], resets: 1})
      unmount()
    })

    test('resets when a page opened in the background is first shown', () => {
      releaseListenerGate = listenerGate.enable()
      const documentVisibility = stubDocumentVisibility('hidden')
      const client = createClient({
        projectId: 'abc',
        dataset: 'production',
        apiVersion: '2025-02-19',
        useCdn: false,
      })
      const events = new Subject<LiveEvent>()
      vi.spyOn(client.live, 'events').mockReturnValue(events as never)

      // The loader's queries fetch on mount, while live events are not connected yet
      const {result, unmount} = renderHook(() => useLiveEvents(client))
      expect(events.observed).toBe(false)
      expect(result.current).toEqual({messages: [], resets: 0})

      act(() => documentVisibility.set('visible'))
      expect(events.observed).toBe(true)
      expect(result.current).toEqual({messages: [], resets: 1})
      unmount()
    })
  })

  test('throws on unknown event types', () => {
    expect(() =>
      reducer(initialState, {
        // @ts-expect-error - intentionally invalid event type
        type: 'unknown',
      }),
    ).toThrow('Unknown event: unknown')
  })
})
