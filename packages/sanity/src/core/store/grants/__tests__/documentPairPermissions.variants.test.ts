import {type SanityClient} from '@sanity/client'
import {type SanityDocument} from '@sanity/types'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../../../test/mocks/mockSanityClient'
import {createSchema} from '../../../schema/createSchema'
import {snapshotPair} from '../../document/document-pair/snapshotPair'
import {
  type DocumentPairPermissionsOptions,
  getDocumentPairPermissions,
} from '../documentPairPermissions'
import {type GrantsStore} from '../types'

vi.mock('../../document/document-pair/snapshotPair', () => ({snapshotPair: vi.fn()}))

const mockedSnapshotPair = vi.mocked(snapshotPair)

const schema = createSchema({
  name: 'default',
  types: [
    {name: 'book', type: 'document', fields: [{name: 'title', type: 'string'}]},
    {
      name: 'liveBook',
      type: 'document',
      liveEdit: true,
      fields: [{name: 'title', type: 'string'}],
    },
  ],
})

const client = createMockSanityClient() as unknown as SanityClient

const GROUP_ID = 'book-1'
const BASE_DRAFT_ID = `drafts.${GROUP_ID}`
const DRAFT_VARIANT_SCOPE = 'draftScopeHash'
const DRAFT_VARIANT_ID = `versions.${DRAFT_VARIANT_SCOPE}.${GROUP_ID}`
const PUBLISHED_VARIANT_SCOPE = 'publishedScopeHash'
const PUBLISHED_VARIANT_ID = `versions.${PUBLISHED_VARIANT_SCOPE}.${GROUP_ID}`
const RELEASE_VARIANT_ID = `versions.releaseScopeHash.${GROUP_ID}`

const variantRef = {_ref: '_.variants.french', _weak: true} as const
const groupRef = {_ref: GROUP_ID, _weak: true} as const

function doc(_id: string, _system?: SanityDocument['_system']): SanityDocument {
  return {
    _id,
    _type: 'book',
    _rev: 'rev',
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    ...(_system === undefined ? {} : {_system}),
  }
}

const baseDraft = doc(BASE_DRAFT_ID)
const basePublished = doc(GROUP_ID)

const draftVariant = doc(DRAFT_VARIANT_ID, {
  group: groupRef,
  variant: variantRef,
  bundleId: 'drafts',
  scopeId: DRAFT_VARIANT_SCOPE,
})

/** The variant-of-published sibling advertises the id its drafts sibling occupies. */
const publishedVariant = doc(PUBLISHED_VARIANT_ID, {
  group: groupRef,
  variant: variantRef,
  scopeId: PUBLISHED_VARIANT_SCOPE,
  draft: {_ref: DRAFT_VARIANT_ID, _weak: true},
})

const releaseVariant = doc(RELEASE_VARIANT_ID, {
  group: groupRef,
  variant: variantRef,
  bundleId: 'summer-drop',
  scopeId: 'releaseScopeHash',
  release: {_ref: '_.releases.summer-drop', _weak: true},
})

/**
 * Runs the permission chain against a fixed set of pair snapshots and returns every
 * `(permission, documentId)` pair the grants engine was asked to evaluate.
 */
function collectGrantChecks(
  options: Omit<DocumentPairPermissionsOptions, 'client' | 'schema' | 'grantsStore'>,
  snapshots: {
    draft?: SanityDocument | null
    published?: SanityDocument | null
    version?: SanityDocument | null
  },
): {checks: Array<[string, string | null]>; documents: Array<SanityDocument | null>} {
  mockedSnapshotPair.mockImplementation(
    () =>
      of({
        draft: {snapshots$: of(snapshots.draft ?? null)},
        published: {snapshots$: of(snapshots.published ?? null)},
        version: {snapshots$: of(snapshots.version ?? null)},
      }) as unknown as ReturnType<typeof snapshotPair>,
  )

  const checkDocumentPermission = vi.fn().mockReturnValue(of({granted: true, reason: ''}))
  const grantsStore: GrantsStore = {checkDocumentPermission}

  getDocumentPairPermissions({
    client,
    schema,
    grantsStore,
    ...options,
    // Dodge the module-level memo cache shared with every other test in the process.
    id: `${options.id}-${Math.random().toString(36).slice(2)}`,
  })
    .subscribe()
    .unsubscribe()

  const calls = checkDocumentPermission.mock.calls as Array<[string, SanityDocument | null]>

  return {
    checks: calls.map(([permission, document]) => [permission, document?._id ?? null]),
    documents: calls.map(([, document]) => document),
  }
}

/** Ids of the base document pair — a variant operation must never be judged by these. */
const BASE_IDS = [GROUP_ID, BASE_DRAFT_ID]

beforeEach(() => {
  mockedSnapshotPair.mockReset()
})

describe('getDocumentPairPermissions with a variant target', () => {
  it('checks a variant publish against the variant documents, not the base pair', () => {
    const {checks} = collectGrantChecks(
      {
        id: GROUP_ID,
        type: 'book',
        permission: 'publish',
        version: DRAFT_VARIANT_SCOPE,
        publishedVariantId: PUBLISHED_VARIANT_ID,
      },
      {draft: baseDraft, published: basePublished, version: draftVariant},
    )

    expect(checks).toEqual([
      ['update', PUBLISHED_VARIANT_ID],
      ['update', DRAFT_VARIANT_ID],
      ['create', PUBLISHED_VARIANT_ID],
    ])
    expect(checks.map(([, id]) => id)).not.toContain(GROUP_ID)
    expect(checks.map(([, id]) => id)).not.toContain(BASE_DRAFT_ID)
  })

  it('rewrites the synthesized published variant to describe the published bundle', () => {
    const {documents} = collectGrantChecks(
      {
        id: GROUP_ID,
        type: 'book',
        permission: 'publish',
        version: DRAFT_VARIANT_SCOPE,
        publishedVariantId: PUBLISHED_VARIANT_ID,
      },
      {draft: baseDraft, published: basePublished, version: draftVariant},
    )

    // The document handed to the `create` post-condition stands in for the variant-of-published,
    // which carries no `bundleId` and its own scope id.
    const created = documents.at(-1)
    expect(created?._system).toEqual({
      group: groupRef,
      variant: variantRef,
      bundleId: undefined,
      scopeId: PUBLISHED_VARIANT_SCOPE,
    })
  })

  it('checks a first-time variant publish against a variant id rather than the base published id', () => {
    const {checks} = collectGrantChecks(
      {
        id: GROUP_ID,
        type: 'book',
        permission: 'publish',
        version: DRAFT_VARIANT_SCOPE,
        // The variant has never been published, so no sibling id exists to resolve.
        publishedVariantId: undefined,
      },
      {draft: baseDraft, published: basePublished, version: draftVariant},
    )

    expect(checks).toEqual([
      // Nothing published to update yet.
      ['update', null],
      ['update', DRAFT_VARIANT_ID],
      // The sibling's scope id is server-generated and unknowable here, so the variant's own id
      // stands in — still a variant-scoped id, never the base published id.
      ['create', DRAFT_VARIANT_ID],
    ])
  })

  it('checks a variant unpublish against the published variant and its advertised draft', () => {
    const {checks} = collectGrantChecks(
      {
        id: GROUP_ID,
        type: 'book',
        permission: 'unpublish',
        version: PUBLISHED_VARIANT_SCOPE,
      },
      {draft: baseDraft, published: basePublished, version: publishedVariant},
    )

    expect(checks).toEqual([
      ['create', DRAFT_VARIANT_ID],
      ['update', PUBLISHED_VARIANT_ID],
      ['create', DRAFT_VARIANT_ID],
    ])
    expect(checks.map(([, id]) => id).filter((id) => id && BASE_IDS.includes(id))).toEqual([])
  })

  it('checks a release-scoped variant unpublish against the release variant alone', () => {
    const {checks} = collectGrantChecks(
      {
        id: GROUP_ID,
        type: 'book',
        permission: 'unpublish',
        version: 'releaseScopeHash',
      },
      {draft: baseDraft, published: basePublished, version: releaseVariant},
    )

    // A release-scoped unpublish only writes the `_system.delete` marker on the variant itself.
    expect(checks).toEqual([['update', RELEASE_VARIANT_ID]])
  })

  it.each(['discardDraft', 'discardVersion'] as const)(
    'checks a variant %s against the variant document, not the base draft',
    (permission) => {
      const {checks} = collectGrantChecks(
        {id: GROUP_ID, type: 'book', permission, version: DRAFT_VARIANT_SCOPE},
        {draft: baseDraft, published: basePublished, version: draftVariant},
      )

      expect(checks).toEqual([['update', DRAFT_VARIANT_ID]])
    },
  )

  it('checks a variant update against the variant document even for a live-edit type', () => {
    const {checks} = collectGrantChecks(
      {id: GROUP_ID, type: 'liveBook', permission: 'update', version: DRAFT_VARIANT_SCOPE},
      {draft: baseDraft, published: basePublished, version: draftVariant},
    )

    // The live-edit branch of the base templates checks the base published document.
    expect(checks).toEqual([['update', DRAFT_VARIANT_ID]])
  })

  it('keeps delete group-level, since it destroys the base pair as well', () => {
    const {checks} = collectGrantChecks(
      {id: GROUP_ID, type: 'book', permission: 'delete', version: DRAFT_VARIANT_SCOPE},
      {draft: baseDraft, published: basePublished, version: draftVariant},
    )

    expect(checks).toEqual([
      ['update', BASE_DRAFT_ID],
      ['update', GROUP_ID],
    ])
  })
})

describe('getDocumentPairPermissions without a variant target', () => {
  it('checks a base publish against the base pair', () => {
    const {checks} = collectGrantChecks(
      {id: GROUP_ID, type: 'book', permission: 'publish'},
      {draft: baseDraft, published: basePublished},
    )

    expect(checks).toEqual([
      ['update', GROUP_ID],
      ['update', BASE_DRAFT_ID],
      ['create', GROUP_ID],
    ])
  })

  it('checks a release version discard against the release version', () => {
    const releaseVersion = doc(`versions.summer-drop.${GROUP_ID}`)

    const {checks} = collectGrantChecks(
      {id: GROUP_ID, type: 'book', permission: 'discardVersion', version: 'summer-drop'},
      {draft: baseDraft, published: basePublished, version: releaseVersion},
    )

    expect(checks).toEqual([['update', `versions.summer-drop.${GROUP_ID}`]])
  })
})
