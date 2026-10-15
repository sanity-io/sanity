import {type ValidationScheduling} from '@sanity/validation/_internal'
import {act, render} from '@testing-library/react'
import {useEffect, useState} from 'react'
import {defer, ReplaySubject, Subject} from 'rxjs'
import {finalize} from 'rxjs/operators'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {type ValidationStatus} from '../../validation'
import {useValidationStatus} from '../useValidationStatus'

/**
 * Guards the synchronous read in `useValidationStatus`. Its consumers use it
 * as a write-side gate: `PublishAction` enables publish from
 * `hasValidationErrors` and fires `doPublish()` once `isValidating` is false
 * and `validationStatus.revision` matches the live edit revision.
 * Reference-driven revalidation re-runs validation without changing the
 * document revision, so a deferred read would let a stale — but
 * revision-matching — "valid" snapshot pass that gate while live validation
 * is discovering errors. Identity-coherent deferral cannot prevent this: the
 * validation observable's identity is stable while the pane is mounted; only
 * the value lags.
 *
 * The discriminating assertion below fails if the hook is ever routed
 * through a deferred read (`useDeferredValue` / react-rx's deferred
 * `useObservable`) again: a deferred read commits one frame pairing fresh
 * urgent state with the stale (error-free) validation snapshot.
 */

let validationSubject: Subject<ValidationStatus>
let immediateSubscribers = 0

// The store must be referentially stable across renders: the hook memoizes
// the validation observable on `documentStore.pair`, and a fresh object per
// render would rebuild + resubscribe every render (losing subject emissions).
const mockDocumentStore = {
  pair: {
    validation: (
      _validationTargetId: string,
      _type: string,
      _validatePublishedReferences: boolean,
      options?: {scheduling?: ValidationScheduling},
    ) => {
      if (options?.scheduling !== 'immediate') return validationSubject.asObservable()
      return defer(() => {
        immediateSubscribers += 1
        return validationSubject.pipe(
          finalize(() => {
            immediateSubscribers -= 1
          }),
        )
      })
    },
  },
}

vi.mock('../../store/datastores', () => ({
  useDocumentStore: () => mockDocumentStore,
}))

const errorMarker = {
  level: 'error',
  message: 'Reference is no longer published',
  path: ['someRef'],
} as unknown as ValidationStatus['validation'][number]

describe('useValidationStatus', () => {
  beforeEach(() => {
    validationSubject = new Subject<ValidationStatus>()
    immediateSubscribers = 0
  })

  it('returns the initial status until the observable emits', () => {
    const results: ValidationStatus[] = []
    function Probe() {
      results.push(useValidationStatus('doc-1', 'author', false))
      return null
    }
    render(<Probe />)

    expect(results[results.length - 1]).toEqual({validation: [], isValidating: false})
  })

  it('commits validation emissions on the first frame, even batched with urgent updates', () => {
    const frames: {tick: number; isValidating: boolean; errorCount: number}[] = []
    let bumpTick: (() => void) | null = null

    function Probe() {
      const status = useValidationStatus('doc-1', 'author', false)
      const [tick, setTick] = useState(0)
      useEffect(() => {
        bumpTick = () => setTick((current) => current + 1)
      }, [])
      frames.push({
        tick,
        isValidating: status.isValidating,
        errorCount: status.validation.length,
      })
      return null
    }
    render(<Probe />)

    // Reference-driven revalidation: same document revision throughout. The
    // `isValidating: true` frame doubles as proof the subscription delivers.
    act(() => {
      validationSubject.next({validation: [], isValidating: true, revision: 'rev-1'})
    })
    expect(frames[frames.length - 1]).toMatchObject({isValidating: true, errorCount: 0})

    // Validation discovers an error while an urgent update (any re-render
    // source: presence, sync, a keystroke) lands in the same batch.
    act(() => {
      validationSubject.next({validation: [errorMarker], isValidating: false, revision: 'rev-1'})
      bumpTick!()
    })

    // The frame carrying the urgent update must already show the error. A
    // deferred read would commit {tick: 1, isValidating: true, errorCount: 0}
    // first — the stale still-validating (or stale "valid") snapshot a
    // publish gate could act on.
    expect(frames).toContainEqual({tick: 1, isValidating: false, errorCount: 1})
    expect(frames.filter((frame) => frame.tick === 1)).toEqual([
      {tick: 1, isValidating: false, errorCount: 1},
    ])
  })

  it('keeps the live status across a switch to immediate scheduling, which it holds only meanwhile', () => {
    // the store replays the latest status to every new subscriber
    validationSubject = new ReplaySubject<ValidationStatus>(1)
    const frames: ValidationStatus[] = []
    let schedule: ((scheduling: ValidationScheduling | undefined) => void) | null = null

    function Probe() {
      const [scheduling, setScheduling] = useState<ValidationScheduling>()
      useEffect(() => {
        schedule = setScheduling
      }, [])
      frames.push(useValidationStatus('doc-1', 'author', false, {scheduling}))
      return null
    }
    const {unmount} = render(<Probe />)
    act(() => {
      validationSubject.next({validation: [], isValidating: true, revision: 'rev-1'})
    })
    expect(frames.at(-1)).toEqual({validation: [], isValidating: true, revision: 'rev-1'})
    expect(immediateSubscribers).toBe(0)

    const framesBeforeSwitch = frames.length
    act(() => schedule!('immediate'))

    // A frame of the initial status here would tell a publish gate that validation is done.
    expect(frames.length).toBeGreaterThan(framesBeforeSwitch)
    expect(frames.slice(framesBeforeSwitch).filter((frame) => !frame.isValidating)).toEqual([])
    expect(immediateSubscribers).toBe(1)

    act(() => schedule!(undefined))
    expect(immediateSubscribers).toBe(0)

    act(() => schedule!('immediate'))
    expect(immediateSubscribers).toBe(1)
    unmount()
    expect(immediateSubscribers).toBe(0)
  })
})
