import {type CurrentUser, type SanityDocument, type Schema} from '@sanity/types'
import {type DocumentValidationResult} from '@sanity/validation'
import {evaluateDocumentObservable} from '@sanity/validation/_internal'
import {lastValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {type LocaleSource} from '../../i18n/types'
import {type DraftsModelDocumentAvailability} from '../../preview/types'
import {type DocumentValidationContext, validateDocumentImmediately} from '../index'

vi.mock('@sanity/validation/_internal', async (importOriginal) => ({
  ...(await importOriginal()),
  evaluateDocumentObservable: vi.fn(),
}))

const mockEvaluateDocumentObservable = evaluateDocumentObservable as Mock<
  typeof evaluateDocumentObservable
>

const READABLE = {available: true, reason: 'READABLE'} as const
const NOT_FOUND = {available: false, reason: 'NOT_FOUND'} as const
const VERSION_DELETED = {available: false, reason: 'VERSION_DELETED'} as const

const DOCUMENT: SanityDocument = {
  _id: 'drafts.author-1',
  _type: 'author',
  _rev: 'rev-1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
}

const RESULT: DocumentValidationResult = {
  status: 'failed',
  markers: [{code: 'value.required', level: 'error', message: 'Required', path: ['name']}],
}

describe('validateDocumentImmediately', () => {
  let ctx: DocumentValidationContext
  let observeDocumentPairAvailability: Mock<
    DocumentValidationContext['observeDocumentPairAvailability']
  >

  beforeEach(() => {
    observeDocumentPairAvailability = vi.fn()
    // the engine is mocked, so the context only needs to be passed through
    ctx = {
      getClient: vi.fn(),
      observeDocumentPairAvailability,
      schema: {} as Schema,
      i18n: {} as LocaleSource,
      currentUser: {id: 'user-1'} as Omit<CurrentUser, 'role'>,
    }
    mockEvaluateDocumentObservable.mockReturnValue(of(RESULT))
  })

  it('runs the validation engine on the document right away, without idle pacing', async () => {
    const markers = await lastValueFrom(validateDocumentImmediately(ctx, DOCUMENT, true))

    expect(markers).toEqual(RESULT.markers)
    expect(mockEvaluateDocumentObservable).toHaveBeenCalledTimes(1)
    expect(mockEvaluateDocumentObservable).toHaveBeenCalledWith(
      expect.objectContaining({
        document: DOCUMENT,
        scheduling: 'immediate',
        environment: 'studio',
        getClient: ctx.getClient,
        schema: ctx.schema,
        i18n: ctx.i18n,
        currentUser: ctx.currentUser,
      }),
    )
  })

  function getDocumentExists() {
    const [options] = mockEvaluateDocumentObservable.mock.lastCall ?? []
    if (!options?.getDocumentExists) throw new Error('expected a getDocumentExists function')
    return options.getDocumentExists
  }

  it('checks that referenced documents are published when published references are required', async () => {
    const availability: DraftsModelDocumentAvailability = {draft: READABLE, published: NOT_FOUND}
    observeDocumentPairAvailability.mockReturnValue(of(availability))
    await lastValueFrom(validateDocumentImmediately(ctx, DOCUMENT, true))

    await expect(getDocumentExists()({id: 'author-2'})).resolves.toBe(false)
    expect(observeDocumentPairAvailability).toHaveBeenCalledWith('author-2', {version: undefined})

    observeDocumentPairAvailability.mockReturnValue(of({draft: NOT_FOUND, published: READABLE}))
    await expect(getDocumentExists()({id: 'author-3'})).resolves.toBe(true)
  })

  it('accepts a referenced document that exists in the same release otherwise', async () => {
    const versionDocument = {...DOCUMENT, _id: 'versions.spring.author-1'}
    const availability: DraftsModelDocumentAvailability = {
      draft: NOT_FOUND,
      published: NOT_FOUND,
      version: READABLE,
    }
    observeDocumentPairAvailability.mockReturnValue(of(availability))
    await lastValueFrom(validateDocumentImmediately(ctx, versionDocument, false))

    await expect(getDocumentExists()({id: 'author-2'})).resolves.toBe(true)
    expect(observeDocumentPairAvailability).toHaveBeenCalledWith('author-2', {version: 'spring'})

    observeDocumentPairAvailability.mockReturnValue(
      of({draft: NOT_FOUND, published: READABLE, version: VERSION_DELETED}),
    )
    await expect(getDocumentExists()({id: 'author-3'})).resolves.toBe(false)
  })
})
