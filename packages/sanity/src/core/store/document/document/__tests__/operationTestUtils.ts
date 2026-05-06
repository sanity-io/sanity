import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {of} from 'rxjs'
import {vi} from 'vitest'

import {createMockSanityClient} from '../../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../../schema'
import {type DocumentVersionSnapshots} from '../../document-pair/snapshotPair'
import {type DocumentOperationArgs} from '../operations/types'
import {type DocumentTarget} from '../types'

export type MockSanityClient = ReturnType<typeof createMockSanityClient> & SanityClient

export const draftTarget = {baseId: 'example-id', bundleId: 'drafts'} satisfies DocumentTarget
export const publishedTarget = {
  baseId: 'example-id',
  bundleId: 'published',
} satisfies DocumentTarget
export const releaseTarget = {
  baseId: 'example-id',
  bundleId: 'release-id',
} satisfies DocumentTarget

export function createOperationClient(): MockSanityClient {
  // oxlint-disable-next-line no-unsafe-type-assertion -- test client implements the SanityClient surface these operations use
  return createMockSanityClient() as MockSanityClient
}

export function createMockSchema({liveEdit = false}: {liveEdit?: boolean} = {}) {
  return createSchema({
    name: 'default',
    types: [
      {
        name: 'movie',
        type: 'document',
        liveEdit,
        fields: [{name: 'title', type: 'string'}],
      },
    ],
  })
}

export function createSnapshot(overrides: Partial<SanityDocument> = {}): SanityDocument {
  const snapshot = {
    _id: 'drafts.example-id',
    _type: 'movie',
    _rev: 'exampleRev',
    _createdAt: '2021-09-14T22:48:02.303Z',
    _updatedAt: '2021-09-14T22:48:02.303Z',
    _system: {bundleId: 'drafts'},
    title: 'Alien',
    ...overrides,
  }

  return snapshot
}

export function createMockDocumentVersionSnapshots(
  documentId = 'drafts.example-id',
): DocumentVersionSnapshots {
  return {
    snapshots$: of(createSnapshot({_id: documentId})),
    patch: vi.fn((patches: Array<Record<string, unknown>>) =>
      patches.map((patch) => ({patch: {id: documentId, ...patch}})),
    ),
    create: vi.fn((document) => ({create: document})),
    createIfNotExists: vi.fn((document) => ({createIfNotExists: document})),
    createOrReplace: vi.fn((document) => ({createOrReplace: document})),
    delete: vi.fn(() => ({delete: {id: documentId}})),
    mutate: vi.fn(),
    commit: vi.fn(),
  }
}

export function createMockDocumentOperationArgs(
  overrides: Partial<DocumentOperationArgs> = {},
): DocumentOperationArgs {
  const documentId = overrides.documentId ?? 'drafts.example-id'
  const snapshot =
    overrides.snapshot === undefined ? createSnapshot({_id: documentId}) : overrides.snapshot

  return {
    client: createOperationClient(),
    publishedId: 'example-id',
    draftId: 'drafts.example-id',
    schema: createMockSchema(),
    typeName: 'movie',
    documentId,
    snapshot,
    target: draftTarget,
    // oxlint-disable-next-line no-unsafe-type-assertion -- history store is not exercised by these operation tests
    historyStore: {} as DocumentOperationArgs['historyStore'],
    document: createMockDocumentVersionSnapshots(documentId),
    ...overrides,
  }
}
