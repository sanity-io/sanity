import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {NEVER, type Observable, type Subscription} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {getFallbackLocaleSource} from '../../i18n/fallback'
import {type DocumentPreviewStore} from '../../preview/documentPreviewStore'
import {validateDocumentWithReferences} from '../../validation'
import {type HistoryStore} from '../history/createHistoryStore'
import {createDocumentStore, type DocumentStore} from './document-store'

vi.mock('./document-pair/editState', () => ({editState: vi.fn(() => NEVER)}))
vi.mock('../../validation', () => ({
  validateDocumentWithReferences: vi.fn(() => NEVER),
}))

const schema = {} as Schema

let testId = 0

/**
 * The scheduling observable handed to reference validation. That observable is
 * the shared per-document mode, so its latest value is what the next run paces as.
 */
function watchScheduling(scheduling$: Observable<'idle' | 'immediate'>): {
  current: () => 'idle' | 'immediate'
  values: Array<'idle' | 'immediate'>
  unsubscribe: () => void
} {
  const values: Array<'idle' | 'immediate'> = []
  const subscription = scheduling$.subscribe((value) => {
    values.push(value)
  })
  return {
    current: () => values[values.length - 1],
    values,
    unsubscribe: () => subscription.unsubscribe(),
  }
}

function setup(): {
  store: DocumentStore
  documentId: string
  immediate: () => Observable<unknown>
  idle: () => Observable<unknown>
  scheduling: ReturnType<typeof watchScheduling>
} {
  const documentId = `doc-${testId}`
  const config = {projectId: `project-${testId}`, dataset: 'dataset', token: 'token'}
  testId += 1
  const client = {config: () => config} as unknown as SanityClient

  const store = createDocumentStore({
    getClient: () => client,
    documentPreviewStore: {
      unstable_observeDocumentPairAvailability: vi.fn(),
    } as unknown as DocumentPreviewStore,
    historyStore: {} as unknown as HistoryStore,
    initialValueTemplates: [],
    schema,
    i18n: getFallbackLocaleSource(),
  })

  // Creating the stream builds the shared mode and passes it to validation.
  const immediate = () =>
    store.pair.validation(documentId, 'movie', false, {scheduling: 'immediate'})
  const idle = () => store.pair.validation(documentId, 'movie', false, {scheduling: 'idle'})
  immediate()

  const scheduling$ = vi.mocked(validateDocumentWithReferences).mock.calls.at(-1)?.[3]
  if (!scheduling$) throw new Error('validation did not receive a scheduling observable')

  return {store, documentId, immediate, idle, scheduling: watchScheduling(scheduling$)}
}

describe('documentStore.pair.validation immediate scheduling', () => {
  it('keeps immediate pacing while another immediate subscriber is still active', () => {
    const {immediate, scheduling} = setup()
    const subscriptions: Subscription[] = []

    subscriptions.push(immediate().subscribe())
    expect(scheduling.current()).toBe('immediate')

    subscriptions.push(immediate().subscribe())
    const first = subscriptions[0]
    first.unsubscribe()

    expect(scheduling.current()).toBe('immediate')

    subscriptions[1].unsubscribe()
    expect(scheduling.current()).toBe('idle')
    scheduling.unsubscribe()
  })

  it('stays immediate when one subscriber remounts while another is still active', () => {
    const {immediate, scheduling} = setup()
    const other = immediate().subscribe()
    const first = immediate().subscribe()
    expect(scheduling.current()).toBe('immediate')

    const lengthBeforeRemount = scheduling.values.length
    first.unsubscribe()
    const remounted = immediate().subscribe()

    expect(scheduling.values).toHaveLength(lengthBeforeRemount)
    expect(scheduling.current()).toBe('immediate')

    // The clobber order: the replacement subscribes before the old one finalizes.
    const replacement = immediate().subscribe()
    remounted.unsubscribe()
    expect(scheduling.current()).toBe('immediate')

    replacement.unsubscribe()
    other.unsubscribe()
    expect(scheduling.current()).toBe('idle')
    scheduling.unsubscribe()
  })

  it('returns to idle when the only immediate subscriber unsubscribes', () => {
    const {immediate, scheduling} = setup()
    const subscription = immediate().subscribe()

    expect(scheduling.current()).toBe('immediate')
    subscription.unsubscribe()
    expect(scheduling.current()).toBe('idle')
    scheduling.unsubscribe()
  })

  it('keeps immediate pacing when an idle subscriber unsubscribes first', () => {
    const {immediate, idle, scheduling} = setup()
    const waiting = immediate().subscribe()
    const background = idle().subscribe()

    background.unsubscribe()
    expect(scheduling.current()).toBe('immediate')

    waiting.unsubscribe()
    expect(scheduling.current()).toBe('idle')
    scheduling.unsubscribe()
  })

  it('tracks immediate subscribers separately per document', () => {
    const first = setup()
    const second = setup()
    const firstSubscription = first.immediate().subscribe()
    const secondSubscription = second.immediate().subscribe()

    firstSubscription.unsubscribe()

    expect(first.scheduling.current()).toBe('idle')
    expect(second.scheduling.current()).toBe('immediate')

    secondSubscription.unsubscribe()
    expect(second.scheduling.current()).toBe('idle')
    first.scheduling.unsubscribe()
    second.scheduling.unsubscribe()
  })
})
