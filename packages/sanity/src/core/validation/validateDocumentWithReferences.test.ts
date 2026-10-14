import {type SanityDocument, type Schema, type ValidationMarker} from '@sanity/types'
import {BehaviorSubject, Observable, type Subscription} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {getFallbackLocaleSource} from '../i18n/fallback'
import {
  validateDocumentWithReferences,
  type ValidationStatus,
} from './validateDocumentWithReferences'

const {evaluateDocumentObservable} = vi.hoisted(() => ({
  evaluateDocumentObservable: vi.fn(),
}))

vi.mock('@sanity/validation/_internal', () => ({
  evaluateDocumentObservable,
}))

/**
 * One call to the validation engine. The observable stays open until the test
 * emits a result, so an idle run can be observed in flight and then cancelled.
 */
interface RecordedRun {
  scheduling: 'idle' | 'immediate'
  revision: string
  cancelled: boolean
  emit: (markers: ValidationMarker[]) => void
}

function movie(revision: string, title: string): SanityDocument {
  return {
    _id: 'drafts.movie',
    _type: 'movie',
    _rev: revision,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-01T00:00:00.000Z',
    title,
  }
}

function emitBeforeSubscribe(): void {
  throw new Error('validation run emitted before it was subscribed')
}

function installRuns(): RecordedRun[] {
  const runs: RecordedRun[] = []
  evaluateDocumentObservable.mockImplementation(
    (options: {scheduling?: 'idle' | 'immediate'; document: SanityDocument}) => {
      const run: RecordedRun = {
        scheduling: options.scheduling ?? 'idle',
        revision: options.document._rev,
        cancelled: false,
        emit: emitBeforeSubscribe,
      }
      runs.push(run)
      return new Observable<{markers: ValidationMarker[]}>((subscriber) => {
        run.emit = (markers) => subscriber.next({markers})
        return () => {
          run.cancelled = true
        }
      })
    },
  )
  return runs
}

async function flushScheduled() {
  // exhaustMapWithTrailing subscribes on RxJS asyncScheduler (setInterval(0)).
  await vi.advanceTimersByTimeAsync(1)
}

describe('validateDocumentWithReferences scheduling', () => {
  const subscriptions: Subscription[] = []

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    for (const subscription of subscriptions) subscription.unsubscribe()
    subscriptions.length = 0
    vi.useRealTimers()
  })

  it('cancels an in-flight idle run when scheduling switches to immediate and revalidates the latest document on the shared stream', async () => {
    const runs = installRuns()
    const original = movie('rev-1', 'Original')
    const latest = movie('rev-2', 'Latest')
    const document$ = new BehaviorSubject<SanityDocument | null>(original)
    const scheduling$ = new BehaviorSubject<'idle' | 'immediate'>('idle')
    const firstSubscriber: ValidationStatus[] = []
    const secondSubscriber: ValidationStatus[] = []

    const status$ = validateDocumentWithReferences(
      {
        getClient: () => {
          throw new Error('reference validation should not fetch')
        },
        observeDocumentPairAvailability: () => {
          throw new Error('reference validation should not listen')
        },
        schema: {} as Schema,
        i18n: getFallbackLocaleSource(),
      },
      document$,
      false,
      scheduling$,
    )
    subscriptions.push(
      status$.subscribe((status) => firstSubscriber.push(status)),
      status$.subscribe((status) => secondSubscriber.push(status)),
    )

    await flushScheduled()
    await flushScheduled()

    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({scheduling: 'idle', revision: 'rev-1', cancelled: false})
    expect(firstSubscriber.at(-1)).toMatchObject({isValidating: true, revision: 'rev-1'})
    expect(secondSubscriber.at(-1)).toEqual(firstSubscriber.at(-1))

    document$.next(latest)
    await flushScheduled()
    expect(runs).toHaveLength(1)

    scheduling$.next('immediate')
    await flushScheduled()
    await flushScheduled()

    expect(runs[0].cancelled).toBe(true)
    expect(runs).toHaveLength(2)
    expect(runs[1]).toMatchObject({scheduling: 'immediate', revision: 'rev-2', cancelled: false})

    const idleMarker: ValidationMarker = {
      level: 'error',
      message: 'from the cancelled idle run',
      path: ['title'],
    }
    const emissionsBeforeCancelledResult = firstSubscriber.length
    runs[0].emit([idleMarker])
    await flushScheduled()
    expect(firstSubscriber).toHaveLength(emissionsBeforeCancelledResult)

    const immediateMarker: ValidationMarker = {
      level: 'error',
      message: 'Title is required',
      path: ['title'],
    }
    runs[1].emit([immediateMarker])
    await flushScheduled()

    const published = {
      isValidating: false,
      revision: 'rev-2',
      validation: [immediateMarker],
    }
    expect(firstSubscriber.at(-1)).toMatchObject(published)
    expect(secondSubscriber.at(-1)).toEqual(firstSubscriber.at(-1))
  })
})
