import {describe, expect, test} from 'vitest'

import {initialState, reducer} from '../useLiveEvents'

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

  test('throws on unknown event types', () => {
    expect(() =>
      reducer(initialState, {
        // @ts-expect-error - intentionally invalid event type
        type: 'unknown',
      }),
    ).toThrowError('Unknown event: unknown')
  })
})
