import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {evaluateDocumentObservable} from '@sanity/validation/_internal'
import {BehaviorSubject, Observable, of, Subject} from 'rxjs'
import {afterEach, describe, expect, it, type Mock, vi} from 'vitest'

import {getFallbackLocaleSource} from '../../i18n/fallback'
import {createSchema} from '../../schema/createSchema'
import {
  validateDocumentWithReferences,
  type ValidationStatus,
} from '../validateDocumentWithReferences'

vi.mock('@sanity/validation/_internal', async (importOriginal) => ({
  ...(await importOriginal()),
  evaluateDocumentObservable: vi.fn(),
}))

const mockEvaluate = evaluateDocumentObservable as Mock<typeof evaluateDocumentObservable>

const schema = createSchema({
  name: 'test',
  types: [{name: 'article', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

const document: SanityDocument = {
  _id: 'drafts.article',
  _type: 'article',
  _rev: 'rev-1',
  _createdAt: '2026-01-01T00:00:00.000Z',
  _updatedAt: '2026-01-01T00:00:00.000Z',
  title: 'Hello',
}

const ctx = {
  getClient: () => ({}) as SanityClient,
  observeDocumentPairAvailability: () => of({published: {available: true, reason: 'READABLE'}}),
  schema,
  i18n: getFallbackLocaleSource(),
} as unknown as Parameters<typeof validateDocumentWithReferences>[0]

/** `exhaustMapWithTrailing` subscribes each run on the async scheduler: one macrotask later. */
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

/** Each engine run is an observable the test completes by hand, so runs can be observed in flight. */
function stubRuns() {
  const runs: Array<{
    scheduling: string | undefined
    result$: Subject<{status: 'passed' | 'failed'; markers: never[]}>
    unsubscribed: boolean
  }> = []
  mockEvaluate.mockImplementation((options) => {
    const run = {scheduling: options.scheduling, result$: new Subject<any>(), unsubscribed: false}
    runs.push(run)
    return new Observable((subscriber) => {
      const subscription = run.result$.subscribe(subscriber)
      return () => {
        run.unsubscribed = true
        subscription.unsubscribe()
      }
    })
  })
  return runs
}

describe('validateDocumentWithReferences scheduling', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('runs with idle scheduling by default', async () => {
    const runs = stubRuns()
    const statuses: ValidationStatus[] = []
    const subscription = validateDocumentWithReferences(ctx, of(document), true).subscribe(
      (status) => statuses.push(status),
    )
    await vi.waitFor(() => expect(runs).toHaveLength(1))
    expect(runs[0].scheduling).toBe('idle')
    await vi.waitFor(() =>
      expect(statuses.at(-1)).toMatchObject({isValidating: true, revision: 'rev-1'}),
    )

    runs[0].result$.next({status: 'passed', markers: []})
    runs[0].result$.complete()
    await vi.waitFor(() =>
      expect(statuses.at(-1)).toMatchObject({isValidating: false, validation: []}),
    )
    subscription.unsubscribe()
  })

  it('drops an idle run in flight and validates immediately when scheduling becomes immediate', async () => {
    const runs = stubRuns()
    const scheduling$ = new BehaviorSubject<'idle' | 'immediate'>('idle')
    const statuses: ValidationStatus[] = []
    const subscription = validateDocumentWithReferences(
      ctx,
      of(document),
      true,
      scheduling$,
    ).subscribe((status) => statuses.push(status))
    await vi.waitFor(() => expect(runs).toHaveLength(1))
    expect(runs[0].scheduling).toBe('idle')

    scheduling$.next('immediate')

    await vi.waitFor(() => expect(runs).toHaveLength(2))
    expect(runs[0].unsubscribed).toBe(true)
    expect(runs[1].scheduling).toBe('immediate')
    // still validating: the dropped run never reported
    expect(statuses.at(-1)).toMatchObject({isValidating: true})

    runs[1].result$.next({status: 'passed', markers: []})
    runs[1].result$.complete()
    await vi.waitFor(() =>
      expect(statuses.at(-1)).toMatchObject({isValidating: false, validation: []}),
    )

    // back to idle: nothing new starts until the document changes
    scheduling$.next('idle')
    await tick()
    await tick()
    expect(runs).toHaveLength(2)
    subscription.unsubscribe()
  })

  it('validates edits made while scheduling is immediate without waiting for idle time', async () => {
    const runs = stubRuns()
    const scheduling$ = new BehaviorSubject<'idle' | 'immediate'>('immediate')
    const document$ = new BehaviorSubject<SanityDocument>(document)
    const subscription = validateDocumentWithReferences(
      ctx,
      document$,
      true,
      scheduling$,
    ).subscribe()
    await vi.waitFor(() => expect(runs).toHaveLength(1))
    expect(runs[0].scheduling).toBe('immediate')
    runs[0].result$.next({status: 'passed', markers: []})
    runs[0].result$.complete()

    document$.next({...document, _rev: 'rev-2', title: 'Hello again'})

    await vi.waitFor(() => expect(runs).toHaveLength(2))
    expect(runs[1].scheduling).toBe('immediate')
    subscription.unsubscribe()
  })

  it('does not interrupt an immediate run when scheduling goes back to idle', async () => {
    const runs = stubRuns()
    const scheduling$ = new BehaviorSubject<'idle' | 'immediate'>('immediate')
    const subscription = validateDocumentWithReferences(
      ctx,
      of(document),
      true,
      scheduling$,
    ).subscribe()
    await vi.waitFor(() => expect(runs).toHaveLength(1))
    expect(runs[0].scheduling).toBe('immediate')

    scheduling$.next('idle')
    await tick()
    await tick()

    expect(runs[0].unsubscribed).toBe(false)
    expect(runs).toHaveLength(1)
    subscription.unsubscribe()
  })
})
