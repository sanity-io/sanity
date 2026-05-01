import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../../i18n/fallback'
import {createSchema} from '../../../schema'
import {validation as pairValidation} from '../document-pair/validation'
import {createDocumentStoreDocument} from './document'

vi.mock('./document-pair/validation', () => ({validation: vi.fn()}))

const mockPairValidation = pairValidation as Mock<typeof pairValidation>

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
  return createMockSanityClient() as any as SanityClient
}

// Builds the single-document facade with enough context to exercise resolver and validation wiring.
function createDocumentStoreDocumentFixture() {
  const client = getMockClient()

  return createDocumentStoreDocument({
    client,
    getClient: () => client,
    observeDocumentPairAvailability: () => of({available: true, reason: 'READABLE'}),
    schema,
    i18n: getFallbackLocaleSource(),
    serverActionsEnabled: of(false),
  })
}

describe('document store document', () => {
  beforeEach(() => {
    mockPairValidation.mockReset()
  })

  it('memoizes resolved document targets for the same arguments', () => {
    const document = createDocumentStoreDocumentFixture()
    const target = {documentId: 'drafts.example-id', typeName: 'movie'}

    expect(document.resolve(target)).toBe(document.resolve(target))
  })

  it('memoizes validation streams for the same arguments', () => {
    const document = createDocumentStoreDocumentFixture()

    expect(document.validation('drafts.example-id', 'movie', true)).toBe(
      document.validation('drafts.example-id', 'movie', true),
    )
  })

  it('resolves concrete document IDs to the current pair shape', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(
        document.resolve({documentId: 'versions.release-id.example-id', typeName: 'movie'}),
      ),
    ).resolves.toMatchObject({
      documentId: 'versions.release-id.example-id',
      idPair: {
        draftId: 'drafts.example-id',
        publishedId: 'example-id',
        versionId: 'versions.release-id.example-id',
      },
      target: {
        baseId: 'example-id',
        typeName: 'movie',
        version: '_.releases.release-id',
      },
      typeName: 'movie',
      validationTarget: 'version',
    })
  })

  it('resolves release document IDs in target descriptors to current version IDs', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(
        document.resolve({
          baseId: 'example-id',
          typeName: 'movie',
          version: '_.releases.release-id',
        }),
      ),
    ).resolves.toMatchObject({
      documentId: 'versions.release-id.example-id',
      idPair: {
        draftId: 'drafts.example-id',
        publishedId: 'example-id',
        versionId: 'versions.release-id.example-id',
      },
      validationTarget: 'version',
    })
  })

  it('validates through the existing pair validation implementation', async () => {
    const document = createDocumentStoreDocumentFixture()
    const validationStatus = {isValidating: false, validation: []}

    mockPairValidation.mockReturnValue(of(validationStatus))

    await expect(
      firstValueFrom(document.validation('drafts.example-id', 'movie', true)),
    ).resolves.toEqual(validationStatus)

    expect(mockPairValidation).toHaveBeenCalledWith(
      expect.any(Object),
      {
        draftId: 'drafts.example-id',
        publishedId: 'example-id',
      },
      'movie',
      'draft',
      true,
    )
  })
})
