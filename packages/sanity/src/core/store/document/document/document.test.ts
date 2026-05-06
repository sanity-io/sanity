import {type SanityClient} from '@sanity/client'
import {firstValueFrom, of} from 'rxjs'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {getFallbackLocaleSource} from '../../../i18n/fallback'
import {createSchema} from '../../../schema'
import {createDocumentStoreDocument} from './document'
import {documentEvents} from './documentEvents'
import {documentOperationEvents} from './documentOperationEvents'
import {documentValidation} from './documentValidation'
import {type DocumentTarget} from './types'

vi.mock('./documentEvents', () => ({documentEvents: vi.fn()}))
vi.mock('./documentOperationEvents', () => ({documentOperationEvents: vi.fn()}))
vi.mock('./documentValidation', () => ({documentValidation: vi.fn()}))

const mockDocumentEvents = documentEvents as Mock<typeof documentEvents>
const mockDocumentOperationEvents = documentOperationEvents as Mock<typeof documentOperationEvents>
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
    documentPreviewStore: {} as never,
    historyStore: {} as never,
  })
}

describe('document store document', () => {
  beforeEach(() => {
    mockDocumentEvents.mockReset()
    mockDocumentOperationEvents.mockReset()
    mockDocumentValidation.mockReset()
  })

  it('memoizes resolved document targets for the same arguments', () => {
    const document = createDocumentStoreDocumentFixture()
    const target = {baseId: 'example-id', bundleId: 'drafts'} satisfies DocumentTarget

    expect(document.resolveDocumentTarget(target)).toBe(document.resolveDocumentTarget(target))
  })

  it('resolves draft targets to the concrete draft id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(document.resolveDocumentTarget({baseId: 'example-id', bundleId: 'drafts'})),
    ).resolves.toBe('drafts.example-id')
  })

  it('resolves published targets to the concrete published id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(
        document.resolveDocumentTarget({baseId: 'drafts.example-id', bundleId: 'published'}),
      ),
    ).resolves.toBe('example-id')
  })

  it('resolves release document targets to the concrete version id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(
        document.resolveDocumentTarget({
          baseId: 'example-id',
          bundleId: 'release-id',
        }),
      ),
    ).resolves.toBe('versions.release-id.example-id')
  })

  it('throws for release document targets without a release id', async () => {
    const document = createDocumentStoreDocumentFixture()

    await expect(
      firstValueFrom(document.resolveDocumentTarget({baseId: 'example-id', bundleId: ''})),
    ).rejects.toThrow('Invalid release id')
  })

  it('uses the variant when memoizing resolved targets', () => {
    const document = createDocumentStoreDocumentFixture()

    expect(
      document.resolveDocumentTarget({baseId: 'example-id', bundleId: 'drafts', variantId: 'a'}),
    ).not.toBe(
      document.resolveDocumentTarget({baseId: 'example-id', bundleId: 'drafts', variantId: 'b'}),
    )
  })

  it('validates through the document validation implementation', async () => {
    const document = createDocumentStoreDocumentFixture()
    const validationStatus = {isValidating: false, validation: []}
    const target = {baseId: 'example-id', bundleId: 'drafts'} satisfies DocumentTarget

    mockDocumentValidation.mockReturnValue(of(validationStatus))

    await expect(firstValueFrom(document.validation(target, true))).resolves.toEqual(
      validationStatus,
    )

    expect(mockDocumentValidation).toHaveBeenCalledWith(
      'drafts.example-id',
      true,
      expect.any(Object),
    )
  })

  it('streams document events through the document events implementation', async () => {
    const document = createDocumentStoreDocumentFixture()
    const target = {baseId: 'example-id', bundleId: 'drafts'} satisfies DocumentTarget
    const event = {type: 'committed' as const, version: 'draft' as const}

    mockDocumentEvents.mockReturnValue(of(event))

    await expect(firstValueFrom(document.documentEvents(target))).resolves.toEqual(event)
    expect(mockDocumentEvents).toHaveBeenCalledWith(
      'drafts.example-id',
      expect.any(Object),
      undefined,
    )
  })

  it('streams operation events through the document operation events implementation', async () => {
    const document = createDocumentStoreDocumentFixture()
    const target = {baseId: 'example-id', bundleId: 'drafts'} satisfies DocumentTarget
    const event = {
      type: 'success' as const,
      args: {
        operationName: 'patch' as const,
        documentId: 'drafts.example-id',
        extraArgs: [],
      },
    }

    mockDocumentOperationEvents.mockReturnValue(of(event))

    await expect(firstValueFrom(document.operationEvents(target, 'movie'))).resolves.toEqual({
      type: 'success',
      op: 'patch',
      id: 'drafts.example-id',
    })
    expect(mockDocumentOperationEvents).toHaveBeenCalledWith(
      expect.any(Object),
      'drafts.example-id',
      target,
      'movie',
    )
  })
})
