import {type SanityDocument, type Schema, type ValidationMarker} from '@sanity/types'
import {type ValidationScheduling} from '@sanity/validation/_internal'
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
 * emits a result, so a run can be observed in flight.
 */
interface RecordedRun {
  scheduling: unknown
  revision: string
  cancelled: boolean
  finish: (markers: ValidationMarker[]) => void
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

function finishBeforeSubscribe(): void {
  throw new Error('validation run finished before it was subscribed')
}

function installRuns(): RecordedRun[] {
  const runs: RecordedRun[] = []
  evaluateDocumentObservable.mockImplementation(
    (options: {scheduling?: unknown; document: SanityDocument}) => {
      const run: RecordedRun = {
        scheduling: options.scheduling,
        revision: options.document._rev,
        cancelled: false,
        finish: finishBeforeSubscribe,
      }
      runs.push(run)
      return new Observable<{markers: ValidationMarker[]}>((subscriber) => {
        let finished = false
        run.finish = (markers) => {
          finished = true
          subscriber.next({markers})
          subscriber.complete()
        }
        return () => {
          if (!finished) run.cancelled = true
        }
      })
    },
  )
  return runs
}

async function flushScheduled() {
  // exhaustMapWithTrailing subscribes on RxJS asyncScheduler (setInterval(0)).
  await vi.advanceTimersByTimeAsync(1)
  await vi.advanceTimersByTimeAsync(1)
}

const titleRequired: ValidationMarker = {
  level: 'error',
  message: 'Title is required',
  path: ['title'],
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

  function validate(
    document$: Observable<SanityDocument | null>,
    scheduling: BehaviorSubject<ValidationScheduling>,
  ) {
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
      scheduling,
    )
    const first: ValidationStatus[] = []
    const second: ValidationStatus[] = []
    subscriptions.push(
      status$.subscribe((status) => first.push(status)),
      status$.subscribe((status) => second.push(status)),
    )
    return {first, second}
  }

  it('lets the run in flight follow a switch to immediate instead of starting another one', async () => {
    const runs = installRuns()
    const scheduling = new BehaviorSubject<ValidationScheduling>('idle')
    const {first, second} = validate(new BehaviorSubject(movie('rev-1', 'Original')), scheduling)
    await flushScheduled()

    expect(runs).toHaveLength(1)
    expect(runs[0].scheduling).toBe(scheduling)
    expect(first.at(-1)).toMatchObject({isValidating: true, revision: 'rev-1'})

    const emissionsBeforeSwitch = first.length
    scheduling.next('immediate')
    await flushScheduled()

    expect(runs).toHaveLength(1)
    expect(runs[0].cancelled).toBe(false)
    expect(first).toHaveLength(emissionsBeforeSwitch)

    runs[0].finish([titleRequired])
    await flushScheduled()

    expect(first.at(-1)).toMatchObject({
      isValidating: false,
      revision: 'rev-1',
      validation: [titleRequired],
    })
    expect(second.at(-1)).toEqual(first.at(-1))
  })

  it('does not validate again when the scheduling switches to immediate after a run has finished', async () => {
    const runs = installRuns()
    const scheduling = new BehaviorSubject<ValidationScheduling>('idle')
    const {first} = validate(new BehaviorSubject(movie('rev-1', 'Original')), scheduling)
    await flushScheduled()
    runs[0].finish([])
    await flushScheduled()
    const settled = first.at(-1)
    expect(settled).toMatchObject({isValidating: false, revision: 'rev-1'})

    scheduling.next('immediate')
    await flushScheduled()

    expect(runs).toHaveLength(1)
    expect(first.at(-1)).toBe(settled)
  })

  it('validates the latest document once the run in flight has finished', async () => {
    const runs = installRuns()
    const scheduling = new BehaviorSubject<ValidationScheduling>('idle')
    const document$ = new BehaviorSubject<SanityDocument | null>(movie('rev-1', 'Original'))
    const {first, second} = validate(document$, scheduling)
    await flushScheduled()

    document$.next(movie('rev-2', 'Latest'))
    scheduling.next('immediate')
    await flushScheduled()
    expect(runs.map(({revision}) => revision)).toEqual(['rev-1'])

    runs[0].finish([])
    await flushScheduled()

    expect(runs.map(({revision}) => revision)).toEqual(['rev-1', 'rev-2'])
    expect(runs[1].scheduling).toBe(scheduling)
    expect(first.at(-1)).toMatchObject({isValidating: true, revision: 'rev-2'})

    runs[1].finish([titleRequired])
    await flushScheduled()

    expect(first.at(-1)).toMatchObject({
      isValidating: false,
      revision: 'rev-2',
      validation: [titleRequired],
    })
    expect(second.at(-1)).toEqual(first.at(-1))
  })
})
