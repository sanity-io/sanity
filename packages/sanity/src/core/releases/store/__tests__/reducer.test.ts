import {describe, expect, it} from 'vitest'

import {activeASAPRelease, activeScheduledRelease} from '../../__fixtures__/release.fixture'
import {releasesReducer, type ReleasesReducerState} from '../reducer'

describe('releasesReducer', () => {
  describe('RELEASES_SET', () => {
    it('stores the payload keyed by release id', () => {
      const initialState: ReleasesReducerState = {
        releases: new Map(),
        state: 'loaded',
      }

      const nextState = releasesReducer(initialState, {
        type: 'RELEASES_SET',
        payload: [activeASAPRelease, activeScheduledRelease],
      })

      expect(Array.from(nextState.releases.keys())).toEqual([
        activeASAPRelease._id,
        activeScheduledRelease._id,
      ])
      expect(nextState.releases.get(activeASAPRelease._id)).toBe(activeASAPRelease)
    })

    it('preserves state identity when the payload is equivalent to the current state', () => {
      const initialState: ReleasesReducerState = {
        releases: new Map([[activeASAPRelease._id, activeASAPRelease]]),
        state: 'loaded',
      }

      const nextState = releasesReducer(initialState, {
        type: 'RELEASES_SET',
        // Equivalent payload (same `_id` and `_rev`), but a fresh document instance — as produced
        // by the refetch-on-listener-event behaviour in `createReleaseStore`
        payload: [{...activeASAPRelease}],
      })

      expect(nextState).toBe(initialState)
      expect(nextState.releases).toBe(initialState.releases)
    })

    it('returns a new map when a release has a new revision', () => {
      const initialState: ReleasesReducerState = {
        releases: new Map([[activeASAPRelease._id, activeASAPRelease]]),
        state: 'loaded',
      }

      const nextState = releasesReducer(initialState, {
        type: 'RELEASES_SET',
        payload: [{...activeASAPRelease, _rev: 'newRev'}],
      })

      expect(nextState).not.toBe(initialState)
      expect(nextState.releases.get(activeASAPRelease._id)?._rev).toBe('newRev')
    })

    it('returns a new map when a release is added', () => {
      const initialState: ReleasesReducerState = {
        releases: new Map([[activeASAPRelease._id, activeASAPRelease]]),
        state: 'loaded',
      }

      const nextState = releasesReducer(initialState, {
        type: 'RELEASES_SET',
        payload: [activeASAPRelease, activeScheduledRelease],
      })

      expect(nextState).not.toBe(initialState)
      expect(nextState.releases.size).toBe(2)
    })

    it('returns a new map when a release is removed', () => {
      const initialState: ReleasesReducerState = {
        releases: new Map([
          [activeASAPRelease._id, activeASAPRelease],
          [activeScheduledRelease._id, activeScheduledRelease],
        ]),
        state: 'loaded',
      }

      const nextState = releasesReducer(initialState, {
        type: 'RELEASES_SET',
        payload: [activeASAPRelease],
      })

      expect(nextState).not.toBe(initialState)
      expect(nextState.releases.size).toBe(1)
    })

    it('returns a new map when a release is replaced by another with the same count', () => {
      const initialState: ReleasesReducerState = {
        releases: new Map([[activeASAPRelease._id, activeASAPRelease]]),
        state: 'loaded',
      }

      const nextState = releasesReducer(initialState, {
        type: 'RELEASES_SET',
        payload: [activeScheduledRelease],
      })

      expect(nextState).not.toBe(initialState)
      expect(Array.from(nextState.releases.keys())).toEqual([activeScheduledRelease._id])
    })
  })

  describe('LOADING_STATE_CHANGED', () => {
    it('updates loading state without touching releases', () => {
      const releases = new Map([[activeASAPRelease._id, activeASAPRelease]])
      const initialState: ReleasesReducerState = {
        releases,
        state: 'loading',
      }

      const nextState = releasesReducer(initialState, {
        type: 'LOADING_STATE_CHANGED',
        payload: {loading: false, error: undefined},
      })

      expect(nextState.state).toBe('loaded')
      expect(nextState.releases).toBe(releases)
    })
  })
})
