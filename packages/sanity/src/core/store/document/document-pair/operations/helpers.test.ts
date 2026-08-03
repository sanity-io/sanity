import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {describe, expect, it} from 'vitest'

import {createSchema} from '../../../../schema/createSchema'
import {type DocumentPairTarget, type IdPair} from '../../types'
import {createOperationsAPI, TARGET_NOT_FOUND_OPERATIONS} from './helpers'
import {type OperationArgs, type OperationsAPI} from './types'

const schema = createSchema({
  name: 'default',
  types: [{name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]}],
})

const client = {
  config: () => ({projectId: 'test', dataset: 'test'}),
} as unknown as SanityClient

function doc(id: string): SanityDocument {
  return {
    _id: id,
    _type: 'book',
    _rev: 'r1',
    _createdAt: '2024-01-01T00:00:00Z',
    _updatedAt: '2024-01-01T00:00:00Z',
  }
}

function createArgs(options: {
  idPair: IdPair
  snapshots: OperationArgs['snapshots']
  target?: DocumentPairTarget
}): OperationArgs {
  return {
    client,
    historyStore: {} as OperationArgs['historyStore'],
    schema,
    typeName: 'book',
    idPair: options.idPair,
    snapshots: options.snapshots,
    target: options.target,
    draft: {} as OperationArgs['draft'],
    published: {} as OperationArgs['published'],
    // oxlint-disable-next-line no-deprecated -- will fix in follow up PR
    serverActionsEnabled: true,
  }
}

const PUBLISHED_ID = 'book-1'
const PAIR_WITH_VERSION: IdPair = {
  publishedId: PUBLISHED_ID,
  draftId: `drafts.${PUBLISHED_ID}`,
  versionId: `versions.rel.${PUBLISHED_ID}`,
}
const PAIR_WITHOUT_VERSION: IdPair = {
  publishedId: PUBLISHED_ID,
  draftId: `drafts.${PUBLISHED_ID}`,
}

const GUARDED_OPS = ['patch', 'publish', 'unpublish', 'discardChanges', 'commit'] as const

describe('TARGET_NOT_FOUND_OPERATIONS', () => {
  it('disables every operation with TARGET_NOT_FOUND and throws on execute', () => {
    for (const opName of Object.keys(TARGET_NOT_FOUND_OPERATIONS) as (keyof OperationsAPI)[]) {
      const operation = TARGET_NOT_FOUND_OPERATIONS[opName]
      const execute = operation.execute as () => void
      expect(operation.disabled).toBe('TARGET_NOT_FOUND')
      expect(() => execute()).toThrow(/does not contain this document/)
    }
  })
})

describe('createOperationsAPI — self-derived target guard', () => {
  it('disables mutating operations when the version is missing for an existing document (draft exists)', () => {
    const operations = createOperationsAPI(
      createArgs({
        idPair: PAIR_WITH_VERSION,
        snapshots: {draft: doc(PAIR_WITH_VERSION.draftId), published: null, version: null},
      }),
    )

    for (const opName of GUARDED_OPS) {
      const execute = operations[opName].execute as () => void
      expect(operations[opName].disabled, opName).toBe('TARGET_NOT_FOUND')
      expect(() => execute(), opName).toThrow(/does not contain this document/)
    }

    // Non-mutating / group-level operations stay functional.
    expect(operations.restore.disabled).toBe(false)
    expect(operations.delete.disabled).toBe(false)
    expect(operations.duplicate.disabled).toBe(false)
  })

  it('disables mutating operations when the version is missing for an existing document (published exists)', () => {
    const operations = createOperationsAPI(
      createArgs({
        idPair: PAIR_WITH_VERSION,
        snapshots: {draft: null, published: doc(PUBLISHED_ID), version: null},
      }),
    )

    for (const opName of GUARDED_OPS) {
      expect(operations[opName].disabled, opName).toBe('TARGET_NOT_FOUND')
    }
  })

  it('does not guard the new-document flow when a version is requested (no snapshots at all)', () => {
    const operations = createOperationsAPI(
      createArgs({
        idPair: PAIR_WITH_VERSION,
        snapshots: {draft: null, published: null, version: null},
      }),
    )

    // Typing into a brand-new document with a pinned release must still create the version
    // locally via its deterministic id (create-on-first-edit). The guard only applies when the
    // document already exists (draft or published snapshot present).
    expect(operations.patch.disabled).toBe(false)
    expect(operations.commit.disabled).toBe(false)
  })

  it('does not guard the new-document flow without a version (no snapshots at all)', () => {
    const operations = createOperationsAPI(
      createArgs({
        idPair: PAIR_WITHOUT_VERSION,
        snapshots: {draft: null, published: null, version: null},
      }),
    )

    // Typing into a brand-new base document must create the draft/published document.
    expect(operations.patch.disabled).toBe(false)
    expect(operations.commit.disabled).toBe(false)
  })

  it('does not guard when the version document exists', () => {
    const operations = createOperationsAPI(
      createArgs({
        idPair: PAIR_WITH_VERSION,
        snapshots: {
          draft: null,
          published: doc(PUBLISHED_ID),
          version: doc(PAIR_WITH_VERSION.versionId!),
        },
      }),
    )

    expect(operations.patch.disabled).toBe(false)
    expect(operations.publish.disabled).toBe(false)
  })

  it('does not guard the base draft/published pair (no version requested)', () => {
    const operations = createOperationsAPI(
      createArgs({
        idPair: PAIR_WITHOUT_VERSION,
        snapshots: {draft: doc(PAIR_WITHOUT_VERSION.draftId), published: null},
      }),
    )

    expect(operations.patch.disabled).toBe(false)
    expect(operations.publish.disabled).toBe(false)
  })

  describe('declared creatable variant target (allowCreate)', () => {
    const CREATABLE_TARGET: DocumentPairTarget = {
      kind: 'variant',
      scopeId: 'rel',
      variantId: '_.variants.alpha',
      allowCreate: true,
    }

    it('keeps patch and commit enabled when the version is missing for an existing document', () => {
      const operations = createOperationsAPI(
        createArgs({
          idPair: PAIR_WITH_VERSION,
          snapshots: {draft: null, published: doc(PUBLISHED_ID), version: null},
          target: CREATABLE_TARGET,
        }),
      )

      // Typing must create the variant document at the server-advertised id.
      expect(operations.patch.disabled).toBe(false)
      expect(operations.commit.disabled).toBe(false)

      // The document still doesn't exist: everything that operates on it stays disabled.
      for (const opName of ['publish', 'unpublish', 'discardChanges'] as const) {
        expect(operations[opName].disabled, opName).toBe('TARGET_NOT_FOUND')
      }
    })

    it('keeps all mutating operations guarded for a variant target without allowCreate', () => {
      const operations = createOperationsAPI(
        createArgs({
          idPair: PAIR_WITH_VERSION,
          snapshots: {draft: null, published: doc(PUBLISHED_ID), version: null},
          target: {kind: 'variant', scopeId: 'rel', variantId: '_.variants.alpha'},
        }),
      )

      for (const opName of GUARDED_OPS) {
        expect(operations[opName].disabled, opName).toBe('TARGET_NOT_FOUND')
      }
    })

    it('does not alter operations once the version document exists', () => {
      const operations = createOperationsAPI(
        createArgs({
          idPair: PAIR_WITH_VERSION,
          snapshots: {
            draft: null,
            published: doc(PUBLISHED_ID),
            version: doc(PAIR_WITH_VERSION.versionId!),
          },
          target: CREATABLE_TARGET,
        }),
      )

      expect(operations.patch.disabled).toBe(false)
      expect(operations.publish.disabled).toBe(false)
    })
  })
})
