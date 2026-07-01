import {type ReferenceSchemaType} from '@sanity/types'
import {firstValueFrom, of} from 'rxjs'
import {describe, expect, it, vi} from 'vitest'

import {type DocumentPreviewStore} from '../../../../../preview'
import {getReferenceInfo} from '../reference'

// Availability constants matching preview/constants.tsx
const AVAILABILITY_READABLE = {available: true, reason: 'READABLE'} as const
const AVAILABILITY_NOT_FOUND = {available: false, reason: 'NOT_FOUND'} as const
const AVAILABILITY_PERMISSION_DENIED = {
  available: false,
  reason: 'PERMISSION_DENIED',
} as const
const AVAILABILITY_VERSION_DELETED = {
  available: false,
  reason: 'VERSION_DELETED',
} as const

function createMockDocumentPreviewStore(
  overrides: Partial<DocumentPreviewStore> = {},
): DocumentPreviewStore {
  return {
    observePaths: vi.fn().mockReturnValue(of(null)),
    observeForPreview: vi.fn().mockReturnValue(of({snapshot: null})),
    observeDocumentTypeFromId: vi.fn().mockReturnValue(of(undefined)),
    unstable_observeDocumentPairAvailability: vi.fn().mockReturnValue(of({})),
    unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(of([])),
    unstable_observePathsDocumentPair: vi.fn().mockReturnValue(of({})),
    unstable_observeDocumentIdSet: vi.fn().mockReturnValue(of({status: 'reconnecting'})),
    unstable_observeDocument: vi.fn().mockReturnValue(of(undefined)),
    unstable_observeDocuments: vi.fn().mockReturnValue(of([])),
    ...overrides,
  }
}

function createMockReferenceType(toTypes: string[] = ['testDoc']): ReferenceSchemaType {
  return {
    name: 'reference',
    type: {name: 'reference', type: null, jsonType: 'object'},
    jsonType: 'object',
    to: toTypes.map((name) => ({
      name,
      type: {name, type: null, jsonType: 'object'},
      jsonType: 'object',
      fields: [],
    })),
    fields: [],
  } as unknown as ReferenceSchemaType
}

describe('getReferenceInfo', () => {
  it('returns NOT_FOUND when all versions are unavailable', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'drafts.doc1', availability: AVAILABILITY_NOT_FOUND},
          {id: 'doc1', availability: AVAILABILITY_NOT_FOUND},
        ]),
      ),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), ['published']),
    )

    expect(result.availability).toEqual({available: false, reason: 'NOT_FOUND'})
    expect(result.type).toBeUndefined()
  })

  it('returns PERMISSION_DENIED when the only match is permission denied', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'drafts.doc1', availability: AVAILABILITY_NOT_FOUND},
          {id: 'doc1', availability: AVAILABILITY_PERMISSION_DENIED},
        ]),
      ),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), ['published']),
    )

    expect(result.availability).toEqual({available: false, reason: 'PERMISSION_DENIED'})
  })

  it('returns NOT_FOUND when a version is VERSION_DELETED and type cannot be resolved', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'versions.release-1.doc1', availability: AVAILABILITY_VERSION_DELETED},
          {id: 'drafts.doc1', availability: AVAILABILITY_NOT_FOUND},
          {id: 'doc1', availability: AVAILABILITY_READABLE},
        ]),
      ),
      // The perspective resolves through the release, which deleted the doc,
      // so the type cannot be determined
      observeDocumentTypeFromId: vi.fn().mockReturnValue(of(undefined)),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), [
        'release-1' as any,
        'drafts',
        'published',
      ]),
    )

    // Should treat as NOT_FOUND rather than returning available:true with type:undefined
    expect(result.availability).toEqual({available: false, reason: 'NOT_FOUND'})
    expect(result.type).toBeUndefined()
  })

  it('returns READABLE with type when a version is VERSION_DELETED but type can be resolved', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'versions.release-1.doc1', availability: AVAILABILITY_VERSION_DELETED},
          {id: 'drafts.doc1', availability: AVAILABILITY_NOT_FOUND},
          {id: 'doc1', availability: AVAILABILITY_READABLE},
        ]),
      ),
      observeDocumentTypeFromId: vi.fn().mockReturnValue(of('testDoc')),
      observePaths: vi.fn().mockReturnValue(of({_id: 'doc1', _rev: 'rev1'})),
      observeForPreview: vi.fn().mockReturnValue(of({snapshot: {title: 'Test'}})),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), [
        'release-1' as any,
        'drafts',
        'published',
      ]),
    )

    expect(result.availability).toEqual({available: true, reason: 'READABLE'})
    expect(result.type).toBe('testDoc')
  })

  it('returns NOT_FOUND when all versions are VERSION_DELETED or NOT_FOUND', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'versions.release-1.doc1', availability: AVAILABILITY_VERSION_DELETED},
          {id: 'drafts.doc1', availability: AVAILABILITY_NOT_FOUND},
          {id: 'doc1', availability: AVAILABILITY_NOT_FOUND},
        ]),
      ),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), [
        'release-1' as any,
        'drafts',
        'published',
      ]),
    )

    expect(result.availability).toEqual({available: false, reason: 'NOT_FOUND'})
  })

  it('returns available:true with READABLE status when type resolves normally', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'drafts.doc1', availability: AVAILABILITY_NOT_FOUND},
          {id: 'doc1', availability: AVAILABILITY_READABLE},
        ]),
      ),
      observeDocumentTypeFromId: vi.fn().mockReturnValue(of('testDoc')),
      observePaths: vi.fn().mockReturnValue(of({_id: 'doc1', _rev: 'rev1'})),
      observeForPreview: vi.fn().mockReturnValue(of({snapshot: {title: 'Test'}})),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), ['published']),
    )

    expect(result.availability).toEqual({available: true, reason: 'READABLE'})
    expect(result.type).toBe('testDoc')
    expect(result.id).toBe('doc1')
  })

  it('returns available:true with undefined type when type is temporarily unresolvable (no VERSION_DELETED)', async () => {
    const store = createMockDocumentPreviewStore({
      unstable_observeDocumentStackAvailability: vi.fn().mockReturnValue(
        of([
          {id: 'drafts.doc1', availability: AVAILABILITY_READABLE},
          {id: 'doc1', availability: AVAILABILITY_READABLE},
        ]),
      ),
      // Transient state: type not yet available
      observeDocumentTypeFromId: vi.fn().mockReturnValue(of(undefined)),
    })

    const result = await firstValueFrom(
      getReferenceInfo(store, 'doc1', createMockReferenceType(), ['drafts', 'published']),
    )

    // Without VERSION_DELETED, this is treated as a transient inconsistent state
    expect(result.availability).toEqual({available: true, reason: 'READABLE'})
    expect(result.type).toBeUndefined()
  })
})
