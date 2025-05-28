import {type ClientPerspective} from '@sanity/client'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {initialState, reducer} from '../useLiveQueries'

describe('useLiveQueries', () => {
  const query1 = `count(*)`
  const params1 = {}
  const perspective1 = 'drafts' satisfies ClientPerspective
  const query2 = `count(*[_type == $type])`
  const params2 = {type: 'foo'}
  const perspective2 = ['rFOO', 'drafts'] satisfies ClientPerspective
  const heartbeat = 1_000

  describe('dispatch: query-listen', () => {
    test('listening for a query also sets heartbeat state', () => {
      const state = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })
      expect(state.queries.size).toBe(1)
      expect(state.heartbeats.size).toBe(1)
      const [key] = state.queries.keys()
      expect(state.queries.get(key)).toStrictEqual({
        query: query1,
        params: params1,
        perspective: perspective1,
      })
      expect(state.heartbeats.get(key)).toStrictEqual({
        receivedAt: expect.any(Number),
        heartbeat: expect.any(Number),
      })
    })

    test('queries are deduped', () => {
      const prevState1 = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })
      const prevState2 = reducer(prevState1, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: perspective1,
          heartbeat,
        },
      })
      const state = reducer(prevState2, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })
      expect(state.queries.size).toBe(2)
      expect(state.heartbeats.size).toBe(2)
      const [key1, key2] = state.queries.keys()
      expect(state.queries.get(key1)).toStrictEqual({
        query: query1,
        params: params1,
        perspective: perspective1,
      })
      expect(state.heartbeats.get(key1)).toStrictEqual({
        receivedAt: expect.any(Number),
        heartbeat: expect.any(Number),
      })
      expect(state.queries.get(key2)).toStrictEqual({
        query: query2,
        params: params2,
        perspective: perspective1,
      })
      expect(state.heartbeats.get(key2)).toStrictEqual({
        receivedAt: expect.any(Number),
        heartbeat: expect.any(Number),
      })
    })

    test('unstable params is fine', () => {
      /**
       * 1. Empty objects
       */
      let prevState = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })
      let prevQueries = prevState.queries
      let prevHeartbeats = prevState.heartbeats
      let state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: {...params1},
          perspective: perspective1,
          heartbeat,
        },
      })
      expect(state.queries).toBe(prevQueries)
      // Heartbeats will always be a new instance, as it sets `receivedAt` to `Date.now()`
      expect(state.heartbeats).not.toBe(prevHeartbeats)

      /**
       * 2. Simple objects
       */
      prevState = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: perspective1,
          heartbeat,
        },
      })
      prevQueries = prevState.queries
      prevHeartbeats = prevState.heartbeats
      state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: {...params2},
          perspective: perspective1,
          heartbeat,
        },
      })
      // Nothing should have changed, the params are deep equal
      expect(state.queries).toBe(prevQueries)
      // Giving the object a new string property should make it a new instance
      state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: {...params2, type: 'bar'},
          perspective: perspective1,
          heartbeat,
        },
      })
      expect(state.queries).not.toBe(prevQueries)

      /**
       * 3. Deeply nested objects
       */
      prevState = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: {
            foo: ['a', 'b', 'c'],
            // @ts-expect-error - this is fine
            bar: {baz: true},
          },
          perspective: perspective1,
          heartbeat,
        },
      })
      prevQueries = prevState.queries
      prevHeartbeats = prevState.heartbeats
      state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: {
            foo: ['a', 'b', 'c'],
            // @ts-expect-error - this is fine
            bar: {baz: true},
          },
          perspective: perspective1,
          heartbeat,
        },
      })
      // Nothing should have changed, the params are deep equal
      expect(state.queries).toBe(prevQueries)
      // Changing the array order should make it a new instance
      state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: {
            foo: ['a', 'c', 'b'],
            // @ts-expect-error - this is fine
            bar: {baz: true},
          },
          perspective: perspective1,
          heartbeat,
        },
      })
      expect(state.queries).not.toBe(prevQueries)
    })

    test('unstable perspective is fine', () => {
      const prevState = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: perspective2,
          heartbeat,
        },
      })
      const {queries: prevQueries, heartbeats: prevHeartbeats} = prevState

      let state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: [...perspective2],
          heartbeat,
        },
      })
      expect(state.queries).toBe(prevQueries)
      // Heartbeats will always be a new instance, as it sets `receivedAt` to `Date.now()`
      expect(state.heartbeats).not.toBe(prevHeartbeats)
      // Changing the perspective in a meaningful way creates a new instance
      state = reducer(prevState, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: ['rBAR', 'drafts'],
          heartbeat,
        },
      })
      expect(state.queries).not.toBe(prevQueries)
    })
  })

  describe('dispatch: gc', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })
    afterEach(() => {
      vi.useRealTimers()
    })

    test('removes queries that have not been heard from in a while', () => {
      const now = new Date(2025, 4, 4)
      vi.setSystemTime(now)
      const prevState = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })

      // Move time forward, but not enough to warrant a GC
      vi.setSystemTime(now.getTime() + heartbeat - 1)
      let state = reducer(prevState, {type: 'gc'})
      // Nothing should have changed, as time has not passed sufficiently yet
      expect(state.queries.size).toBe(1)
      expect(state.queries).toBe(prevState.queries)
      expect(state.heartbeats.size).toBe(1)
      expect(state.heartbeats).toBe(prevState.heartbeats)

      // Move time forward, past the heartbeat threshold
      vi.setSystemTime(now.getTime() + heartbeat + 1)
      state = reducer(state, {type: 'gc'})
      // The query should have been removed
      expect(state.queries.size).toBe(0)
      expect(state.queries).not.toBe(prevState.queries)
      expect(state.heartbeats.size).toBe(0)
      expect(state.heartbeats).not.toBe(prevState.heartbeats)
    })

    test('does not touch legacy queries that do not support the heartbeat pattern', () => {
      const now = new Date(2025, 4, 4)
      vi.setSystemTime(now)
      const prevState1 = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })
      const prevState2 = reducer(prevState1, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: perspective1,
          heartbeat: false,
        },
      })

      // Move time forward, but not enough to warrant a GC
      vi.setSystemTime(now.getTime() + heartbeat - 1)
      let state = reducer(prevState2, {type: 'gc'})
      // Nothing should have changed, as time has not passed sufficiently yet
      expect(state.queries.size).toBe(2)
      expect(state.queries).toBe(prevState2.queries)
      expect(state.heartbeats.size).toBe(2)
      expect(state.heartbeats).toBe(prevState2.heartbeats)

      // Move time forward, past the heartbeat threshold
      vi.setSystemTime(now.getTime() + heartbeat + 1)
      state = reducer(state, {type: 'gc'})
      // The query should have been removed
      expect(state.queries.size).toBe(1)
      expect(state.queries).not.toBe(prevState2.queries)
      expect(state.heartbeats.size).toBe(1)
      expect(state.heartbeats).not.toBe(prevState2.heartbeats)
      // The remaining query is the one with heartbeat disabled
      const [key] = state.queries.keys()
      expect(state.queries.get(key)).toStrictEqual({
        query: query2,
        params: params2,
        perspective: perspective1,
      })
      expect(state.heartbeats.get(key)).toStrictEqual({
        receivedAt: expect.any(Number),
        heartbeat: false,
      })
    })

    test('supports a custom heartbeat interval', () => {
      const now = new Date(2025, 4, 4)
      vi.setSystemTime(now)
      const prevState1 = reducer(initialState, {
        type: 'query-listen',
        payload: {
          query: query1,
          params: params1,
          perspective: perspective1,
          heartbeat,
        },
      })
      const prevState2 = reducer(prevState1, {
        type: 'query-listen',
        payload: {
          query: query2,
          params: params2,
          perspective: perspective1,
          heartbeat: heartbeat * 2,
        },
      })

      // Move time forward, but not enough to warrant a GC
      vi.setSystemTime(now.getTime() + heartbeat - 1)
      let state = reducer(prevState2, {type: 'gc'})
      // Nothing should have changed, as time has not passed sufficiently yet
      expect(state.queries.size).toBe(2)
      expect(state.queries).toBe(prevState2.queries)
      expect(state.heartbeats.size).toBe(2)
      expect(state.heartbeats).toBe(prevState2.heartbeats)

      // Move time forward, past the first heartbeat threshold
      vi.setSystemTime(now.getTime() + heartbeat + 1)
      let prevQueries = state.queries
      let prevHeartbeats = state.heartbeats
      state = reducer(state, {type: 'gc'})
      // The first query should have been removed
      expect(state.queries.size).toBe(1)
      expect(state.queries).not.toBe(prevState2.queries)
      expect(state.heartbeats.size).toBe(1)
      expect(state.heartbeats).not.toBe(prevState2.heartbeats)
      // The remaining query is the one with double heartbeat interval
      const [key] = state.queries.keys()
      expect(state.queries.get(key)).toStrictEqual({
        query: query2,
        params: params2,
        perspective: perspective1,
      })
      expect(state.heartbeats.get(key)).toStrictEqual({
        receivedAt: expect.any(Number),
        heartbeat: heartbeat * 2,
      })

      // Move time forward, past the last heartbeat threshold
      vi.setSystemTime(now.getTime() + heartbeat * 2 + 1)
      prevQueries = state.queries
      prevHeartbeats = state.heartbeats
      state = reducer(state, {type: 'gc'})
      // The query should have been removed
      expect(state.queries.size).toBe(0)
      expect(state.queries).not.toBe(prevQueries)
      expect(state.heartbeats.size).toBe(0)
      expect(state.heartbeats).not.toBe(prevHeartbeats)
    })
  })
})
