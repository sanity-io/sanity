import {type SanityClient} from '@sanity/client'
import {defineField, defineType, type DocumentSystem, type SanityDocument} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {type PropsWithChildren} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {defineConfig} from '../config/defineConfig'
import {PerspectiveProvider} from '../perspective/PerspectiveProvider'
import type * as UseDocumentVersionsMod from '../releases/hooks/useDocumentVersions'
import {type DocumentPerspectiveState} from '../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../releases/store/types'
import {type EditStateFor} from '../store/document/document-pair/editState'
import {administrator} from '../store/grants/debug/exampleGrants'
import {getVersionId} from '../util/draftUtils'
import {useDocumentForm} from './useDocumentForm'

// The document store reads nothing from the mock client, so the documents of the group under test
// (their version stubs and their contents) are served at the hooks that read them.
const fixture = vi.hoisted(() => ({
  versions: {data: [], versions: [], loading: false, error: null} as DocumentPerspectiveState,
  documents: new Map<string, SanityDocument>(),
  editStates: new Map<string, EditStateFor>(),
}))

vi.mock('../releases/hooks/useDocumentVersions', async (importOriginal) => {
  const original = await importOriginal<typeof UseDocumentVersionsMod>()
  return {...original, useDocumentVersions: () => fixture.versions}
})

vi.mock('../hooks/useEditState', () => ({
  useEditState: (
    publishedId: string,
    type: string,
    _priority?: 'default' | 'low',
    version?: string,
  ): EditStateFor => {
    const key = `${publishedId}:${version ?? ''}`
    const cached = fixture.editStates.get(key)
    if (cached) return cached

    const liveEditSchemaType = type === LIVE_EDIT_TYPE
    const editState: EditStateFor = {
      id: publishedId,
      type,
      transactionSyncLock: null,
      draft: null,
      published: fixture.documents.get(publishedId) ?? null,
      version: version ? (fixture.documents.get(getVersionId(publishedId, version)) ?? null) : null,
      liveEdit: liveEditSchemaType || Boolean(version),
      liveEditSchemaType,
      ready: true,
      release: undefined,
      scopeId: version,
    }
    fixture.editStates.set(key, editState)
    return editState
  },
}))

const TYPE = 'book'
const LIVE_EDIT_TYPE = 'liveEditBook'
const GROUP_ID = 'book-1'
const PUBLISHED_VARIANT_SCOPE = 'publishedVariantScope'
const DRAFT_VARIANT_SCOPE = 'draftVariantScope'
const VARIANT_ID = '_.variants.audience-a'

const schemaTypes = [
  defineType({
    name: TYPE,
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
  defineType({
    name: LIVE_EDIT_TYPE,
    type: 'document',
    liveEdit: true,
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

interface GroupMember {
  document: SanityDocument
  stub: VersionInfoDocumentStub
}

function createMember(
  type: string,
  id: string,
  system: Omit<DocumentSystem, 'group'>,
): GroupMember {
  const stub: VersionInfoDocumentStub = {
    _id: id,
    _type: type,
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00Z',
    _updatedAt: '2026-01-01T00:00:00Z',
    _system: {...system, group: {_ref: GROUP_ID, _weak: true}},
  }
  return {stub, document: {...stub, title: id}}
}

/** The base published document and its published variant, plus the draft variant when asked. */
function createVariantGroup(
  type: string,
  {withDraftVariant}: {withDraftVariant: boolean},
): GroupMember[] {
  const variants = [{_ref: VARIANT_ID, _key: 'variant'}]
  const members = [
    createMember(type, GROUP_ID, {}),
    createMember(type, getVersionId(GROUP_ID, PUBLISHED_VARIANT_SCOPE), {
      // Content Lake reports the published lane of a variant without a `bundleId`.
      // @ts-expect-error -- `bundleId` is typed as optional, but the API sends `null`.
      bundleId: null,
      variants,
      scopeId: PUBLISHED_VARIANT_SCOPE,
      draft: {_ref: getVersionId(GROUP_ID, DRAFT_VARIANT_SCOPE), _weak: true},
    }),
  ]
  if (withDraftVariant) {
    members.push(
      createMember(type, getVersionId(GROUP_ID, DRAFT_VARIANT_SCOPE), {
        bundleId: 'drafts',
        variants,
        scopeId: DRAFT_VARIANT_SCOPE,
      }),
    )
  }
  return members
}

/**
 * Mounts `useDocumentForm` the way a diff view pane does for a variant version: the perspective
 * is pinned to the version's own scope, with no variant selected.
 */
async function mountVariantForm({
  type,
  scopeId,
  members,
}: {
  type: string
  scopeId: string
  members: GroupMember[]
}) {
  fixture.documents = new Map(members.map(({document}) => [document._id, document]))
  fixture.editStates = new Map()
  fixture.versions = {
    data: members.map(({stub}) => stub._id),
    versions: members.map(({stub}) => stub),
    loading: false,
    error: null,
  }

  const client = createMockSanityClient({
    requests: {
      // The permission checks behind the form's `readOnly` state read the dataset ACL.
      '/acl': administrator,
    },
  }) as unknown as SanityClient
  const TestProvider = await createTestProvider({
    client,
    config: defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {types: schemaTypes},
    }),
  })

  function Wrapper({children}: PropsWithChildren) {
    return (
      <TestProvider>
        <PerspectiveProvider selectedPerspectiveName={scopeId}>{children}</PerspectiveProvider>
      </TestProvider>
    )
  }

  const {result} = renderHook(
    () =>
      useDocumentForm({
        documentId: GROUP_ID,
        documentType: type,
        selectedPerspectiveName: scopeId,
        releaseId: scopeId,
      }),
    {wrapper: Wrapper},
  )

  await waitFor(() => expect(result.current.ready).toBe(true))
  expect(result.current.value._id).toBe(getVersionId(GROUP_ID, scopeId))

  return result
}

describe('useDocumentForm pinned to a variant version', () => {
  it('keeps the published variant of a type without live edit read-only', async () => {
    const form = await mountVariantForm({
      type: TYPE,
      scopeId: PUBLISHED_VARIANT_SCOPE,
      members: createVariantGroup(TYPE, {withDraftVariant: true}),
    })

    await waitFor(() => expect(form.current.formState?.readOnly).toBe(true))
  })

  it('lets a live-edit type edit its published variant', async () => {
    const form = await mountVariantForm({
      type: LIVE_EDIT_TYPE,
      scopeId: PUBLISHED_VARIANT_SCOPE,
      members: createVariantGroup(LIVE_EDIT_TYPE, {withDraftVariant: false}),
    })

    await waitFor(() => expect(form.current.formState).not.toBeNull())
    expect(form.current.formState?.readOnly).not.toBe(true)
  })

  it('keeps the draft variant editable', async () => {
    const form = await mountVariantForm({
      type: TYPE,
      scopeId: DRAFT_VARIANT_SCOPE,
      members: createVariantGroup(TYPE, {withDraftVariant: true}),
    })

    await waitFor(() => expect(form.current.formState).not.toBeNull())
    expect(form.current.formState?.readOnly).not.toBe(true)
  })
})
