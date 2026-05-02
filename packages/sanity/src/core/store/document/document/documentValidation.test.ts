import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of, Subject} from 'rxjs'
import {map, take, toArray} from 'rxjs/operators'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {validateDocumentWithReferences} from '../../../validation'
import {documentEditState} from './documentEditState'
import {documentValidation} from './documentValidation'

vi.mock('./documentEditState', () => ({documentEditState: vi.fn()}))
vi.mock('../../../validation', () => ({validateDocumentWithReferences: vi.fn()}))

const mockDocumentEditState = documentEditState as Mock<typeof documentEditState>
const mockValidateDocumentWithReferences = validateDocumentWithReferences as Mock<
  typeof validateDocumentWithReferences
>

function getContext() {
  return {client: createMockSanityClient() as unknown as SanityClient}
}

describe('documentValidation', () => {
  beforeEach(() => {
    mockDocumentEditState.mockReset()
    mockValidateDocumentWithReferences.mockReset()
  })

  it('validates the single resolved snapshot and preserves the latest revision', async () => {
    const editState$ = new Subject<any>()

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

    const validation = firstValueFrom(
      documentValidation('example-id', 'movie', true, getContext() as any),
    )

    editState$.next({snapshot: {_id: 'example-id', _type: 'movie', _rev: 'rev1', title: 'Alien'}})
    editState$.next({snapshot: {_id: 'example-id', _type: 'movie', _rev: 'rev2', title: 'Aliens'}})

    await expect(validation).resolves.toEqual({
      isValidating: false,
      validation: [],
      revision: 'rev2',
    })
    expect(mockDocumentEditState).toHaveBeenCalledWith('example-id', 'movie', expect.any(Object))
    expect(mockValidateDocumentWithReferences).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      true,
    )
  })

  it('memoizes by document id and published reference mode', () => {
    const ctx = getContext() as any
    mockDocumentEditState.mockReturnValue(of({snapshot: null}))
    mockValidateDocumentWithReferences.mockReturnValue(of({isValidating: false, validation: []}))

    expect(documentValidation('example-id', 'movie', true, ctx)).toBe(
      documentValidation('example-id', 'movie', true, ctx),
    )
    expect(documentValidation('example-id', 'movie', true, ctx)).not.toBe(
      documentValidation('example-id', 'movie', false, ctx),
    )
  })

  it('does not revalidate when only the revision changes', async () => {
    const editState$ = new Subject<any>()
    const validatedDocuments: unknown[] = []

    mockDocumentEditState.mockReturnValue(editState$)
    mockValidateDocumentWithReferences.mockImplementation((_ctx, document$) => {
      document$.subscribe((document) => validatedDocuments.push(document))
      return of({isValidating: false, validation: []})
    })

    const validation = firstValueFrom(
      documentValidation('same-rev-id', 'movie', true, getContext() as any),
    )

    editState$.next({snapshot: {_id: 'same-rev-id', _type: 'movie', _rev: 'rev1', title: 'Alien'}})
    editState$.next({snapshot: {_id: 'same-rev-id', _type: 'movie', _rev: 'rev1', title: 'Aliens'}})

    await validation

    expect(validatedDocuments).toEqual([
      {_id: 'same-rev-id', _type: 'movie', _rev: 'rev1', title: 'Alien'},
    ])
  })
})
