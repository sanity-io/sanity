import {type SanityClient} from '@sanity/client'
import {defineField, defineType} from '@sanity/types'
import {renderHook, waitFor} from '@testing-library/react'
import {of} from 'rxjs'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClient} from '../../../test/mocks/mockSanityClient'
import {createTestProvider} from '../../../test/testUtils/TestProvider'
import {defineConfig} from '../config/defineConfig'
import {type TargetDocumentState, useTargetDocumentState} from '../hooks/useTargetDocumentState'
import {usePresenceStore} from '../store/datastores'
import {administrator} from '../store/grants/debug/exampleGrants'
import {type PresenceStore} from '../store/presence/presence-store'
import {variantAlphaAudience} from '../variants/__fixtures__/variants.fixture'
import {useDocumentForm} from './useDocumentForm'

vi.mock('../store/datastores', async (importOriginal) => ({
  ...(await importOriginal()),
  usePresenceStore: vi.fn(),
}))

// Only the hook is mocked; the accessor deriving the presence id from the state stays real.
vi.mock('../hooks/useTargetDocumentState', async (importOriginal) => ({
  ...(await importOriginal()),
  useTargetDocumentState: vi.fn(),
}))

const DOCUMENT_ID = 'article-1'
const VARIANT_VERSION_ID = `versions.varscope.${DOCUMENT_ID}`
const CREATABLE_DRAFT_ID = `versions.varscopeDraft.${DOCUMENT_ID}`

const schemaTypes = [
  defineType({
    name: 'article',
    type: 'document',
    fields: [defineField({name: 'title', type: 'string'})],
  }),
]

function createMockPresenceStore(): PresenceStore {
  return {
    documentPresence: vi.fn(() => of([])),
    globalPresence$: of([]),
    reportLocations: vi.fn(() => of(undefined)),
    setLocation: vi.fn(),
    debugPresenceParam$: of([]),
  }
}

async function renderDocumentForm(targetDocumentState: TargetDocumentState) {
  const presenceStore = createMockPresenceStore()
  vi.mocked(usePresenceStore).mockReturnValue(presenceStore)
  vi.mocked(useTargetDocumentState).mockReturnValue(targetDocumentState)

  const client = createMockSanityClient({
    requests: {'/acl': administrator},
  }) as unknown as SanityClient
  const wrapper = await createTestProvider({
    client,
    config: defineConfig({
      projectId: 'test',
      dataset: 'test',
      schema: {types: schemaTypes},
    }),
  })

  renderHook(() => useDocumentForm({documentId: DOCUMENT_ID, documentType: 'article'}), {wrapper})

  // Presence is announced on the document root as soon as the form mounts.
  await waitFor(() => expect(presenceStore.setLocation).toHaveBeenCalled())

  return presenceStore
}

/**
 * The form's presence document id is derived from the resolved target, not from the displayed
 * value: the value falls back to the published group id whenever the variant-scoped version
 * hasn't loaded (or doesn't exist yet), which would place editors of different variants in the
 * same document.
 */
describe('useDocumentForm presence scoping', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('reports presence at the resolved variant-scoped version', async () => {
    const presenceStore = await renderDocumentForm({
      status: 'ready',
      targetDocument: {
        _id: VARIANT_VERSION_ID,
        _rev: 'rev',
        _createdAt: '',
        _updatedAt: '',
        _system: {
          bundleId: 'drafts',
          group: {_ref: DOCUMENT_ID, _weak: true},
          variant: {_ref: variantAlphaAudience._id, _weak: true},
          scopeId: 'varscope',
        },
      },
      scopeId: 'varscope',
      variant: variantAlphaAudience,
      publishedSibling: undefined,
    })

    expect(presenceStore.setLocation).toHaveBeenCalledWith([
      expect.objectContaining({documentId: VARIANT_VERSION_ID}),
    ])
    expect(presenceStore.documentPresence).toHaveBeenCalledWith(VARIANT_VERSION_ID, {
      excludeVersions: true,
    })
  })

  it('reports presence at the advertised id of a creatable draft variant', async () => {
    // The document does not exist until the first keystroke creates it, so the displayed value is
    // still the published group id at this point.
    const presenceStore = await renderDocumentForm({
      status: 'variant-missing',
      variant: variantAlphaAudience,
      bundle: 'drafts',
      publishedSibling: undefined,
      creatableTarget: {id: CREATABLE_DRAFT_ID, scopeId: 'varscopeDraft'},
    })

    expect(presenceStore.setLocation).toHaveBeenCalledWith([
      expect.objectContaining({documentId: CREATABLE_DRAFT_ID}),
    ])
    expect(presenceStore.documentPresence).toHaveBeenCalledWith(CREATABLE_DRAFT_ID, {
      excludeVersions: true,
    })
  })

  it('reports presence at the displayed document when no variant target applies', async () => {
    const presenceStore = await renderDocumentForm({
      status: 'ready',
      targetDocument: undefined,
      scopeId: undefined,
      variant: undefined,
      publishedSibling: undefined,
    })

    expect(presenceStore.setLocation).toHaveBeenCalledWith([
      expect.objectContaining({documentId: DOCUMENT_ID}),
    ])
  })
})
