import {type SanityClient} from '@sanity/client'
import {defineField, defineType, type SanityDocumentLike} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {defineConfig} from '../config/defineConfig'
import {type TargetDocumentState} from '../hooks/useTargetDocumentState'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {administrator} from '../store/grants/debug/exampleGrants'
import {variantAlphaAudience} from '../variants/__fixtures__/variants.fixture'
import {useDocumentForm} from './useDocumentForm'

vi.mock('../hooks/useTargetDocumentState', async () => {
  const actual = await vi.importActual('../hooks/useTargetDocumentState')
  return {...actual, useTargetDocumentState: vi.fn()}
})

vi.mock('../store/grants/documentValuePermissions', async () => {
  const actual = await vi.importActual('../store/grants/documentValuePermissions')
  return {...actual, useDocumentValuePermissions: vi.fn()}
})

const {useTargetDocumentState} = vi.mocked(await import('../hooks/useTargetDocumentState'))
const {useDocumentValuePermissions} = vi.mocked(
  await import('../store/grants/documentValuePermissions'),
)

const PUBLISHED_ID = 'article-1'
const DRAFT_VARIANT_ID = `versions.draftScopeHash.${PUBLISHED_ID}`
const CREATABLE_DRAFT_VARIANT_ID = `versions.advertisedScopeHash.${PUBLISHED_ID}`
const PUBLISHED_VARIANT_ID = `versions.publishedScopeHash.${PUBLISHED_ID}`

const groupRef = {_ref: PUBLISHED_ID, _weak: true} as const
const variantRef = {_ref: variantAlphaAudience._id, _weak: true} as const

function versionStub(
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub {
  return {_rev: 'rev', _createdAt: '', _updatedAt: '', ...stub}
}

const draftVariant = versionStub({
  _id: DRAFT_VARIANT_ID,
  _system: {bundleId: 'drafts', variant: variantRef, group: groupRef, scopeId: 'draftScopeHash'},
})

const publishedVariant = versionStub({
  _id: PUBLISHED_VARIANT_ID,
  _system: {variant: variantRef, group: groupRef, scopeId: 'publishedScopeHash'},
})

const schemaTypes = [
  defineType({
    name: 'article',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

/**
 * Renders the form against a fixed target state and returns the `_id` the form last asked the
 * grants engine about.
 */
async function resolvePermissionTargetId(
  targetDocumentState: TargetDocumentState,
  options?: {initialValue?: SanityDocumentLike},
): Promise<string | undefined> {
  useTargetDocumentState.mockReturnValue(targetDocumentState)

  const client = createMockSanityClient({
    requests: {'/acl': administrator},
  }) as unknown as SanityClient
  const wrapper = await createTestProvider({
    client,
    config: defineConfig({projectId: 'test', dataset: 'test', schema: {types: schemaTypes}}),
  })

  const {result} = renderHook(
    () =>
      useDocumentForm({
        documentId: PUBLISHED_ID,
        documentType: 'article',
        initialValue: options?.initialValue
          ? {loading: false, error: null, value: options.initialValue}
          : undefined,
      }),
    {wrapper},
  )

  await waitFor(() => expect(result.current.formState).not.toBeNull())

  const calls = useDocumentValuePermissions.mock.calls
  return calls.at(-1)?.[0].document._id as string | undefined
}

beforeEach(() => {
  vi.clearAllMocks()
  useDocumentValuePermissions.mockReturnValue([{granted: true, reason: ''}, false])
})

describe('useDocumentForm permission target', () => {
  it('checks edit access against the variant document, not the base draft', async () => {
    const permissionId = await resolvePermissionTargetId({
      status: 'ready',
      targetDocument: draftVariant,
      scopeId: 'draftScopeHash',
      variant: variantAlphaAudience,
      publishedSibling: publishedVariant,
    })

    expect(permissionId).toBe(DRAFT_VARIANT_ID)
  })

  it('checks edit access against the variant-of-published, not the base published document', async () => {
    const permissionId = await resolvePermissionTargetId({
      status: 'ready',
      targetDocument: publishedVariant,
      scopeId: 'publishedScopeHash',
      variant: variantAlphaAudience,
      publishedSibling: publishedVariant,
    })

    expect(permissionId).toBe(PUBLISHED_VARIANT_ID)
  })

  it('checks a creatable draft variant against its server-advertised id', async () => {
    const permissionId = await resolvePermissionTargetId(
      {
        status: 'variant-missing',
        variant: variantAlphaAudience,
        bundle: 'drafts',
        publishedSibling: publishedVariant,
        creatableTarget: {
          id: CREATABLE_DRAFT_VARIANT_ID,
          scopeId: 'advertisedScopeHash',
        },
      },
      {initialValue: {_id: CREATABLE_DRAFT_VARIANT_ID, _type: 'article'}},
    )

    // The document doesn't exist yet, but its id is advertised by the published sibling, so the
    // check addresses the variant being created rather than a bundle-derived base id.
    expect(permissionId).toBe(CREATABLE_DRAFT_VARIANT_ID)
  })

  it('checks the base draft when no variant is selected', async () => {
    const permissionId = await resolvePermissionTargetId({
      status: 'ready',
      targetDocument: undefined,
      scopeId: undefined,
      variant: undefined,
      publishedSibling: undefined,
    })

    expect(permissionId).toBe(`drafts.${PUBLISHED_ID}`)
  })
})
