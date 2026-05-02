import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../../i18n/fallback'
import {createSchema} from '../../../schema'
import {createDocumentStoreDocument} from './document'
import {documentValidation} from './documentValidation'
import {type DocumentTarget} from './types'

vi.mock('./documentValidation', () => ({documentValidation: vi.fn()}))

const mockDocumentValidation = documentValidation as Mock<typeof documentValidation>

const schema = createSchema({
  name: 'default',
  types: [
    {
      name: 'movie',
      type: 'document',
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

// Test helper for the document store context; mirrors the existing pair validation tests.
function getMockClient() {
  return createMockSanityClient() as unknown as SanityClient
}

// Builds the single-document facade with enough context to exercise resolver and validation wiring.
function createDocumentStoreDocumentFixture() {
  const client = getMockClient()

  return createDocumentStoreDocument({
    client,
    getClient: () => client,
    observeDocumentPairAvailability: () =>
      of({
        draft: {available: true, reason: 'READABLE'},
        published: {available: true, reason: 'READABLE'},
      }),
    schema,
    i18n: getFallbackLocaleSource(),
  })
}

describe('document store document', () => {
  beforeEach(() => {
    mockDocumentValidation.mockReset()
  })

  it('memoizes resolved document targets for the same arguments', () => {
    const document = createDocumentStoreDocumentFixture()
    const target = {baseId: 'example-id', version: 'drafts'} satisfies DocumentTarget

    expect(document.resolve(target)).toBe(document.resolve(target))
  })

  it('resolves draft targets to the concrete draft id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(document.resolve({baseId: 'example-id', version: 'drafts'})),
    ).resolves.toBe('drafts.example-id')
  })

  it('resolves published targets to the concrete published id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(document.resolve({baseId: 'drafts.example-id', version: 'published'})),
    ).resolves.toBe('example-id')
  })

  it('resolves release document targets to the concrete version id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(
        document.resolve({
          baseId: 'example-id',
          version: '_.releases.release-id',
        }),
      ),
    ).resolves.toBe('versions.release-id.example-id')
  })

  it('uses the variant when memoizing resolved targets', () => {
    const document = createDocumentStoreDocumentFixture()

    expect(document.resolve({baseId: 'example-id', version: 'drafts', variant: 'a'})).not.toBe(
      document.resolve({baseId: 'example-id', version: 'drafts', variant: 'b'}),
    )
  })

  it('validates through the document validation implementation', async () => {
    const document = createDocumentStoreDocumentFixture()
    const validationStatus = {isValidating: false, validation: []}
    const target = {baseId: 'example-id', version: 'drafts'} satisfies DocumentTarget

    mockDocumentValidation.mockReturnValue(of(validationStatus))

    await expect(firstValueFrom(document.validation(target, 'movie', true))).resolves.toEqual(
      validationStatus,
    )

    expect(mockDocumentValidation).toHaveBeenCalledWith(
      'drafts.example-id',
      'movie',
      true,
      expect.any(Object),
    )
  })
})
