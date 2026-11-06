import {type ValidationScheduling} from '@sanity/validation/_internal'
import {BehaviorSubject, NEVER} from 'rxjs'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../i18n/fallback'
import {createDocumentPreviewStore} from '../../preview/documentPreviewStore'
import {createSchema} from '../../schema/createSchema'
import {validateDocumentWithReferences} from '../../validation'
import {createHistoryStore} from '../history/createHistoryStore'
import {checkedOutEditState, editState, type EditStateFor} from './document-pair/editState'
import {type ValidationListener} from './document-pair/validation'
import {createDocumentStore} from './document-store'

vi.mock('./document-pair/editState', () => ({
  editState: vi.fn(() => NEVER),
  checkedOutEditState: vi.fn(),
}))
vi.mock('../../validation', () => ({
  validateDocumentWithReferences: vi.fn(() => NEVER),
}))

// What `checkedOutEditState` reports for each published id: whether a pane has the pair checked out
const checkedOutStates = new Map<string, BehaviorSubject<EditStateFor | null>>()

function checkedOutStatesOf(publishedId: string) {
  let states = checkedOutStates.get(publishedId)
  if (!states) {
    states = new BehaviorSubject<EditStateFor | null>(null)
    checkedOutStates.set(publishedId, states)
  }
  return states
}

beforeEach(() => {
  vi.mocked(checkedOutEditState).mockImplementation((_client, idPair) =>
    checkedOutStatesOf(idPair.publishedId).asObservable(),
  )
})

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
  // `document` builds its run as it is asked for, so the run's scheduling can be read right away
  const validate = (scheduling?: ValidationScheduling) =>
    store.pair
      .validation(documentId, 'movie', false, {scheduling, listener: 'document'})
      .subscribe()

  store.pair.validation(documentId, 'movie', false, {listener: 'document'})
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

describe('documentStore.pair.validation listener', () => {
  /**
   * A document store, the preview store's `unstable_observeDocument` it reads global listener
   * documents from, and a draft of its own to validate.
   */
  function setupListener() {
    const draftId = `drafts.doc-${testId}`
    testId += 1
    const client = createMockSanityClientAsClient()
    const documentPreviewStore = createDocumentPreviewStore({client})
    const observeDocument = vi.spyOn(documentPreviewStore, 'unstable_observeDocument')
    const store = createDocumentStore({
      getClient: () => client,
      documentPreviewStore,
      historyStore: createHistoryStore({client}),
      initialValueTemplates: [],
      schema: createSchema({name: 'test', types: []}),
      i18n: getFallbackLocaleSource(),
    })
    return {draftId, publishedId: draftId.slice('drafts.'.length), store, observeDocument}
  }

  /** Reports the pair as checked out, the way a document pane's `editState` does. */
  function checkOutPair(publishedId: string) {
    checkedOutStatesOf(publishedId).next({
      id: publishedId,
      type: 'movie',
      transactionSyncLock: null,
      draft: null,
      published: null,
      version: null,
      liveEdit: false,
      liveEditSchemaType: false,
      ready: true,
      release: undefined,
      scopeId: undefined,
    })
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  it('follows the document through the preview store with the global listener', () => {
    const {draftId, store, observeDocument} = setupListener()

    store.pair.validation(draftId, 'movie', false, {listener: 'global'})

    expect(observeDocument).toHaveBeenCalledExactlyOnceWith(draftId)
    expect(editState).not.toHaveBeenCalled()
  })

  it('checks out the document pair with the document listener', () => {
    const {draftId, store, observeDocument} = setupListener()

    store.pair.validation(draftId, 'movie', false, {listener: 'document'})

    expect(editState).toHaveBeenCalledExactlyOnceWith(
      expect.anything(),
      expect.objectContaining({draftId}),
      'movie',
    )
    expect(observeDocument).not.toHaveBeenCalled()
  })

  it.each([
    {name: 'no listener option', options: undefined},
    {name: 'the auto listener', options: {listener: 'auto' as const}},
  ])(
    'follows the global listener while nothing has the pair checked out, with $name',
    ({options}) => {
      vi.useFakeTimers()
      const {draftId, store, observeDocument} = setupListener()
      observeDocument.mockReturnValue(NEVER)

      const subscription = store.pair.validation(draftId, 'movie', false, options).subscribe()
      // the pair gets a tick to be checked out first
      expect(observeDocument).not.toHaveBeenCalled()
      vi.advanceTimersByTime(0)

      expect(observeDocument).toHaveBeenCalledExactlyOnceWith(draftId)
      expect(editState).not.toHaveBeenCalled()
      subscription.unsubscribe()
    },
  )

  it('reads a pair another subscriber has checked out, without checking it out itself', () => {
    vi.useFakeTimers()
    const {draftId, publishedId, store, observeDocument} = setupListener()
    observeDocument.mockReturnValue(NEVER)
    checkOutPair(publishedId)

    const subscription = store.pair.validation(draftId, 'movie', false).subscribe()
    vi.advanceTimersByTime(1_000)

    expect(checkedOutEditState).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({draftId}),
      'movie',
    )
    expect(observeDocument).not.toHaveBeenCalled()
    expect(editState).not.toHaveBeenCalled()
    subscription.unsubscribe()
  })

  it('switches the scheduling of the run the auto listener reads to immediate', () => {
    vi.useFakeTimers()
    const {draftId, publishedId, store, observeDocument} = setupListener()
    observeDocument.mockReturnValue(NEVER)
    const schedulingOf = (validationListener: ValidationListener) => {
      store.pair.validation(draftId, 'movie', false, {listener: validationListener})
      const scheduling = vi.mocked(validateDocumentWithReferences).mock.lastCall?.[2]
      if (!(scheduling instanceof BehaviorSubject)) {
        throw new Error('validation was not handed a scheduling that runs can follow')
      }
      return scheduling
    }
    const pair = schedulingOf('document')
    const global = schedulingOf('global')

    const hold = store.pair
      .validation(draftId, 'movie', false, {scheduling: 'immediate'})
      .subscribe()
    vi.advanceTimersByTime(0)
    expect(global.getValue()).toBe('immediate')
    expect(pair.getValue()).toBe('idle')

    checkOutPair(publishedId)
    expect(pair.getValue()).toBe('immediate')
    expect(global.getValue()).toBe('idle')

    hold.unsubscribe()
    expect(pair.getValue()).toBe('idle')
    expect(global.getValue()).toBe('idle')
  })

  it.each(['document', 'global'] as const)(
    'switches only the validation of the %s listener to immediate',
    (listener) => {
      const {draftId, store, observeDocument} = setupListener()
      observeDocument.mockReturnValue(NEVER)
      const schedulingOf = (validationListener: ValidationListener) => {
        store.pair.validation(draftId, 'movie', false, {listener: validationListener})
        const scheduling = vi.mocked(validateDocumentWithReferences).mock.lastCall?.[2]
        if (!(scheduling instanceof BehaviorSubject)) {
          throw new Error('validation was not handed a scheduling that runs can follow')
        }
        return scheduling
      }
      const scheduling = {document: schedulingOf('document'), global: schedulingOf('global')}
      const other = listener === 'document' ? 'global' : 'document'

      const hold = store.pair
        .validation(draftId, 'movie', false, {scheduling: 'immediate', listener})
        .subscribe()
      expect(scheduling[listener].getValue()).toBe('immediate')
      expect(scheduling[other].getValue()).toBe('idle')

      hold.unsubscribe()
      expect(scheduling[listener].getValue()).toBe('idle')
    },
  )
})
