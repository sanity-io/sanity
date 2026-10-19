import {
  defineField,
  defineType,
  type InitialValueResolverContext,
  type SanityDocumentLike,
} from '@sanity/types'
import {type Observable, Subject, TimeoutError} from 'rxjs'
import {afterEach, beforeEach, describe, expect, test, vi} from 'vitest'

import {type ObservePathsFn} from '../../../preview/types'
import {createSchema} from '../../../schema/createSchema'
import {RESOLVE_INITIAL_VALUE_TIMEOUT_MS} from '../../../templates/resolve'
import {type Template} from '../../../templates/types'
import {getDraftId, getPublishedId} from '../../../util/draftUtils'
import {getInitialValueStream, type InitialValueOptions} from './initialValue'
import {type InitialValueMsg} from './types'

type ObservedSnapshot =
  ReturnType<ObservePathsFn> extends Observable<infer Snapshot> ? Snapshot : never

const DOCUMENT_ID = 'author-1'
const EXISTING: SanityDocumentLike = {_id: DOCUMENT_ID, _type: 'author'}

const schema = createSchema({
  name: 'default',
  types: [
    defineType({
      name: 'author',
      type: 'document',
      fields: [defineField({name: 'title', type: 'string'})],
    }),
  ],
})

const context: InitialValueResolverContext = {
  projectId: 'test-project',
  dataset: 'test-dataset',
  schema,
  currentUser: null,
  getClient: () => {
    throw new Error('getClient is not used by these templates')
  },
}

const authorTemplate: Template = {
  id: 'author',
  title: 'Author',
  schemaType: 'author',
  value: {title: 'Ada'},
}

function createPreviewStore(
  draft$: Observable<ObservedSnapshot>,
  published$: Observable<ObservedSnapshot>,
): {observePaths: ObservePathsFn} {
  const observePaths: ObservePathsFn = (value) => {
    if ('_ref' in value && value._ref === getDraftId(DOCUMENT_ID)) {
      return draft$
    }
    return published$
  }

  return {observePaths: vi.fn(observePaths)}
}

function streamOpts(overrides: Partial<InitialValueOptions> = {}): InitialValueOptions {
  return {
    documentId: DOCUMENT_ID,
    documentType: 'author',
    templateName: 'author',
    ...overrides,
  }
}

async function flushDebounce() {
  // debounceTime(25) schedules on RxJS asyncScheduler. Fake timers only
  // deliver that work once the clock moves.
  await vi.advanceTimersByTimeAsync(25)
}

describe('getInitialValueStream', () => {
  let draft$: Subject<ObservedSnapshot>
  let published$: Subject<ObservedSnapshot>
  let previewStore: ReturnType<typeof createPreviewStore>
  let warn: ReturnType<typeof vi.spyOn>
  let group: ReturnType<typeof vi.spyOn>
  let error: ReturnType<typeof vi.spyOn>
  let groupEnd: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    draft$ = new Subject()
    published$ = new Subject()
    previewStore = createPreviewStore(draft$, published$)
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    group = vi.spyOn(console, 'group').mockImplementation(() => undefined)
    error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    groupEnd = vi.spyOn(console, 'groupEnd').mockImplementation(() => undefined)
  })

  afterEach(() => {
    draft$.complete()
    published$.complete()
    warn.mockRestore()
    group.mockRestore()
    error.mockRestore()
    groupEnd.mockRestore()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  test('emits loading immediately and waits for both draft and published snapshots', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    expect(previewStore.observePaths).toHaveBeenCalledWith(
      {_type: 'reference', _ref: getDraftId(DOCUMENT_ID)},
      ['_type'],
    )
    expect(previewStore.observePaths).toHaveBeenCalledWith(
      {_type: 'reference', _ref: getPublishedId(DOCUMENT_ID)},
      ['_type'],
    )
    expect(values).toEqual([{type: 'loading'}])

    draft$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}])

    published$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: {title: 'Ada'}}])

    sub.unsubscribe()
  })

  test('does not resolve a template when a draft already exists', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(EXISTING)
    published$.next(null)
    await flushDebounce()

    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    sub.unsubscribe()
  })

  test('does not resolve a template when only the published document exists', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(EXISTING)
    await flushDebounce()

    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    sub.unsubscribe()
  })

  test('returns success with a null value when no template name is provided', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts({templateName: undefined}),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await flushDebounce()

    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    sub.unsubscribe()
  })

  test('warns and returns success with a null value when the named template is missing', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts({templateName: 'missing'}),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await flushDebounce()

    expect(warn).toHaveBeenCalledWith(
      'Template "%s" not defined, using empty initial value',
      'missing',
    )
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    sub.unsubscribe()
  })

  test('passes template params through to the resolver', async () => {
    const values: InitialValueMsg[] = []
    const parameterized: Template = {
      id: 'author',
      title: 'Author',
      schemaType: 'author',
      value: (params: {name?: string} | undefined) => ({title: String(params?.name)}),
    }
    const sub = getInitialValueStream(
      schema,
      [parameterized],
      previewStore,
      streamOpts({templateParams: {name: 'Zadie'}}),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await flushDebounce()

    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: {title: 'Zadie'}}])

    sub.unsubscribe()
  })

  test('emits the original resolver error after logging it', async () => {
    const resolveError = new Error('resolver failed')
    const failing: Template = {
      id: 'author',
      title: 'Author',
      schemaType: 'author',
      value: () => Promise.reject(resolveError),
    }
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [failing],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await flushDebounce()

    expect(group).toHaveBeenCalledWith('Failed to resolve initial value')
    expect(error).toHaveBeenCalledWith(resolveError)
    expect(error).toHaveBeenCalledWith('Template ID: %s', 'author')
    expect(error).toHaveBeenCalledWith('Parameters: %o', undefined)
    expect(groupEnd).toHaveBeenCalled()
    expect(values).toEqual([{type: 'loading'}, {type: 'error', error: resolveError}])

    sub.unsubscribe()
  })

  test('times out a resolver that never settles', async () => {
    const hanging: Template = {
      id: 'author',
      title: 'Author',
      schemaType: 'author',
      value: () => new Promise(() => undefined),
    }
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [hanging],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}])

    await vi.advanceTimersByTimeAsync(RESOLVE_INITIAL_VALUE_TIMEOUT_MS)

    expect(values).toHaveLength(2)
    expect(values[1]?.type).toBe('error')
    expect(values[1]?.type === 'error' && values[1].error).toBeInstanceOf(TimeoutError)

    sub.unsubscribe()
  })

  test('resolves once for repeated snapshots of the same existence state', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await vi.advanceTimersByTimeAsync(10)
    published$.next(null)
    await vi.advanceTimersByTimeAsync(10)
    expect(values).toEqual([{type: 'loading'}])

    await vi.advanceTimersByTimeAsync(25)
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: {title: 'Ada'}}])

    published$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: {title: 'Ada'}}])

    sub.unsubscribe()
  })

  test('emits success with a null value when a document appears after the stream resolved a template', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(null)
    published$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: {title: 'Ada'}}])

    draft$.next(EXISTING)
    await flushDebounce()
    expect(values).toEqual([
      {type: 'loading'},
      {type: 'success', value: {title: 'Ada'}},
      {type: 'success', value: null},
    ])

    sub.unsubscribe()
  })

  test('re-resolves the template when the document disappears after it existed', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(EXISTING)
    published$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    draft$.next(null)
    await flushDebounce()
    expect(values).toEqual([
      {type: 'loading'},
      {type: 'success', value: null},
      {type: 'loading'},
      {type: 'success', value: {title: 'Ada'}},
    ])

    sub.unsubscribe()
  })

  test('collapses an existence flip that reverts within the debounce window', async () => {
    const values: InitialValueMsg[] = []
    const sub = getInitialValueStream(
      schema,
      [authorTemplate],
      previewStore,
      streamOpts(),
      context,
    ).subscribe((value) => values.push(value))

    draft$.next(EXISTING)
    published$.next(null)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    // A publish deletes the draft and creates the published document in one
    // transaction; the two snapshots arrive moments apart.
    draft$.next(null)
    await vi.advanceTimersByTimeAsync(10)
    published$.next(EXISTING)
    await flushDebounce()
    expect(values).toEqual([{type: 'loading'}, {type: 'success', value: null}])

    sub.unsubscribe()
  })
})
