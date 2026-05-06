import {type SanityClient} from '@sanity/client'
import {type SanityDocument, type Schema} from '@sanity/types'
import {firstValueFrom, of, Subject} from 'rxjs'
import {map, take, toArray} from 'rxjs/operators'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../../i18n/fallback'
import {validateDocumentWithReferences} from '../../../validation'
import {type EditStateFor} from '../document-pair/editState'
import {documentEditState} from './documentEditState'
import {
  type DocumentValidationContext,
  createDocumentValidation,
  documentValidation,
} from './documentValidation'

vi.mock('../../../validation', () => ({validateDocumentWithReferences: vi.fn()}))
vi.mock('./documentEditState', () => ({documentEditState: vi.fn()}))

const mockValidateDocumentWithReferences = validateDocumentWithReferences as Mock<
  typeof validateDocumentWithReferences
>
const mockDocumentEditState = documentEditState as Mock<typeof documentEditState>

function getContext(): DocumentValidationContext {
  const client = createMockSanityClient() as unknown as SanityClient
  return {
    client,
    getClient: () => client,
    observeDocumentPairAvailability: vi.fn(),
    // oxlint-disable-next-line no-unsafe-type-assertion -- schema is only forwarded to the mocked validation helper in these tests
    schema: {} as Schema,
    i18n: getFallbackLocaleSource(),
  } as unknown as DocumentValidationContext
}

function createEditState(snapshot: SanityDocument | null): EditStateFor {
  return {
    id: snapshot?._id ?? 'example-id',
    snapshot,
    draft: null,
    published: null,
    version: null,
    ready: true,
    transactionSyncLock: null,
    release: undefined,
  }
}

function createDocument(overrides: Partial<SanityDocument>): SanityDocument {
  return {
    _id: 'example-id',
    _type: 'movie',
    _rev: 'rev1',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    _system: {bundleId: 'drafts'},
    ...overrides,
  }
}

describe('documentValidation', () => {
  beforeEach(() => {
    mockDocumentEditState.mockReset()
    mockValidateDocumentWithReferences.mockReset()
  })

  it('validates the single resolved snapshot and preserves the latest revision', async () => {
    const editState$ = new Subject<EditStateFor>()

    mockDocumentEditState.mockReturnValue(editState$)
    mockValidateDocumentWithReferences.mockImplementation((_ctx, document$) =>
      document$.pipe(
        take(2),
        toArray(),
        // Return a stale revision to prove documentValidation overrides it.
        map((documents) => ({
          isValidating: false,
          validation: [],
          revision: `stale-${documents.length}`,
        })),
      ),
    )

    const validation = firstValueFrom(documentValidation('example-id', true, getContext()))

    editState$.next(
      createEditState(createDocument({_id: 'example-id', _rev: 'rev1', title: 'Alien'})),
    )
    editState$.next(
      createEditState(createDocument({_id: 'example-id', _rev: 'rev2', title: 'Aliens'})),
    )

    await expect(validation).resolves.toEqual({
      isValidating: false,
      validation: [],
      revision: 'rev2',
    })
    expect(mockDocumentEditState).toHaveBeenCalledWith('example-id', expect.any(Object))
    expect(mockValidateDocumentWithReferences).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      true,
    )
  })

  it('memoizes by document id and published reference mode', () => {
    const ctx = getContext()
    mockDocumentEditState.mockReturnValue(of(createEditState(null)))
    mockValidateDocumentWithReferences.mockReturnValue(of({isValidating: false, validation: []}))

    expect(documentValidation('example-id', true, ctx)).toBe(
      documentValidation('example-id', true, ctx),
    )
    expect(documentValidation('example-id', true, ctx)).not.toBe(
      documentValidation('example-id', false, ctx),
    )
  })

  it('does not revalidate when only the revision changes', async () => {
    const editState$ = new Subject<EditStateFor>()
    const validatedDocuments: unknown[] = []

    mockDocumentEditState.mockReturnValue(editState$)
    mockValidateDocumentWithReferences.mockImplementation((_ctx, document$) => {
      document$.subscribe((document) => validatedDocuments.push(document))
      return of({isValidating: false, validation: []})
    })

    const validation = firstValueFrom(documentValidation('same-rev-id', true, getContext()))

    editState$.next(
      createEditState(createDocument({_id: 'same-rev-id', _rev: 'rev1', title: 'Alien'})),
    )
    editState$.next(
      createEditState(createDocument({_id: 'same-rev-id', _rev: 'rev1', title: 'Aliens'})),
    )

    await validation

    expect(validatedDocuments).toEqual([
      createDocument({_id: 'same-rev-id', _rev: 'rev1', title: 'Alien'}),
    ])
  })

  it('creates a target-based validation function', async () => {
    const ctx = getContext()
    mockDocumentEditState.mockReturnValue(of(createEditState(null)))
    mockValidateDocumentWithReferences.mockReturnValue(of({isValidating: false, validation: []}))

    await expect(
      firstValueFrom(
        createDocumentValidation(ctx)({baseId: 'example-id', bundleId: 'drafts'}, true),
      ),
    ).resolves.toEqual({isValidating: false, validation: [], revision: undefined})

    expect(mockDocumentEditState).toHaveBeenCalledWith('drafts.example-id', expect.any(Object))
  })
})
