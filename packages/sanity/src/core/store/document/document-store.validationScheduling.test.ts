import {type ValidationScheduling} from '@sanity/validation/_internal'
import {BehaviorSubject, NEVER} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../i18n/fallback'
import {createDocumentPreviewStore} from '../../preview/documentPreviewStore'
import {createSchema} from '../../schema/createSchema'
import {validateDocumentWithReferences} from '../../validation'
import {createHistoryStore} from '../history/createHistoryStore'
import {createDocumentStore} from './document-store'

vi.mock('./document-pair/editState', () => ({editState: vi.fn(() => NEVER)}))
vi.mock('../../validation', () => ({
  validateDocumentWithReferences: vi.fn(() => NEVER),
}))

let testId = 0

/**
 * A document store, and the scheduling its validation hands to every run of one document. The
 * memoized streams outlive a test, so each test validates a document of its own.
 */
function setup() {
  const documentId = `doc-${testId}`
  testId += 1
  const client = createMockSanityClientAsClient()
  const store = createDocumentStore({
    getClient: () => client,
    documentPreviewStore: createDocumentPreviewStore({client}),
    historyStore: createHistoryStore({client}),
    initialValueTemplates: [],
    schema: createSchema({name: 'test', types: []}),
    i18n: getFallbackLocaleSource(),
  })
  const validate = (scheduling?: ValidationScheduling) =>
    store.pair.validation(documentId, 'movie', false, {scheduling}).subscribe()

  store.pair.validation(documentId, 'movie', false)
  const scheduling = vi.mocked(validateDocumentWithReferences).mock.lastCall?.[2]
  if (!(scheduling instanceof BehaviorSubject)) {
    throw new Error('validation was not handed a scheduling that runs can follow')
  }
  const switches: ValidationScheduling[] = []
  scheduling.subscribe((mode) => switches.push(mode))
  return {validate, scheduling, switches}
}

describe('documentStore.pair.validation immediate scheduling', () => {
  it('keeps immediate pacing while another immediate subscriber is still active', () => {
    const {validate, scheduling} = setup()

    const first = validate('immediate')
    expect(scheduling.getValue()).toBe('immediate')
    const second = validate('immediate')

    first.unsubscribe()
    expect(scheduling.getValue()).toBe('immediate')

    second.unsubscribe()
    expect(scheduling.getValue()).toBe('idle')
  })

  it('stays immediate when one subscriber remounts while another is still active', () => {
    const {validate, scheduling, switches} = setup()
    const other = validate('immediate')
    const first = validate('immediate')
    const switchesBeforeRemount = switches.length

    first.unsubscribe()
    const remounted = validate('immediate')
    // the replacement subscribes before the one it replaces finalizes
    const replacement = validate('immediate')
    remounted.unsubscribe()

    expect(switches).toHaveLength(switchesBeforeRemount)
    expect(scheduling.getValue()).toBe('immediate')

    replacement.unsubscribe()
    other.unsubscribe()
    expect(scheduling.getValue()).toBe('idle')
  })

  it('returns to idle when the only immediate subscriber unsubscribes', () => {
    const {validate, scheduling, switches} = setup()
    const subscription = validate('immediate')

    expect(scheduling.getValue()).toBe('immediate')
    subscription.unsubscribe()
    expect(switches).toEqual(['idle', 'immediate', 'idle'])
  })

  it('keeps immediate pacing when an idle subscriber unsubscribes first', () => {
    const {validate, scheduling} = setup()
    const waiting = validate('immediate')
    const background = validate('idle')
    const plain = validate()

    background.unsubscribe()
    plain.unsubscribe()
    expect(scheduling.getValue()).toBe('immediate')

    waiting.unsubscribe()
    expect(scheduling.getValue()).toBe('idle')
  })

  it('tracks immediate subscribers separately per document', () => {
    const first = setup()
    const second = setup()
    const firstSubscription = first.validate('immediate')
    const secondSubscription = second.validate('immediate')

    firstSubscription.unsubscribe()

    expect(first.scheduling.getValue()).toBe('idle')
    expect(second.scheduling.getValue()).toBe('immediate')

    secondSubscription.unsubscribe()
    expect(second.scheduling.getValue()).toBe('idle')
  })
})
