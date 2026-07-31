import {type SanityClient} from '@sanity/client'
import {act, renderHook} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useClient} from '../../../hooks/useClient'
import {type VersionInfoDocumentStub} from '../../store/types'
import {useCopyToDrafts} from '../useCopyToDrafts'
import {useDocumentVersions} from '../useDocumentVersions'

vi.mock('../../../hooks/useClient', () => ({
  useClient: vi.fn(),
}))

vi.mock('../useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

const publishedId = 'article-123'

const publishedVersion: VersionInfoDocumentStub = {
  _id: publishedId,
  _rev: 'published-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-02T00:00:00Z',
  _system: {
    group: {_ref: publishedId, _weak: true},
  },
}

const draftVersion: VersionInfoDocumentStub = {
  _id: 'drafts.article-123',
  _rev: 'draft-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-03T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    group: {_ref: publishedId, _weak: true},
  },
}

const releaseVersion: VersionInfoDocumentStub = {
  _id: 'versions.release1.article-123',
  _rev: 'release-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-04T00:00:00Z',
  _system: {
    bundleId: 'release1',
    release: {_ref: '_.releases.release1', _weak: true},
    group: {_ref: publishedId, _weak: true},
    scopeId: 'release1',
  },
}

const opaqueAgentVersion: VersionInfoDocumentStub = {
  _id: 'opaque-agent-doc-id',
  _rev: 'agent-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-05T00:00:00Z',
  _system: {
    bundleId: 'agent.user-123',
    group: {_ref: publishedId, _weak: true},
    scopeId: 'opaque-scope-abc',
  },
}

const variantVersion: VersionInfoDocumentStub = {
  _id: 'opaque-variant-doc-id',
  _rev: 'variant-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-06T00:00:00Z',
  _system: {
    bundleId: 'release1',
    release: {_ref: '_.releases.release1', _weak: true},
    variant: {_ref: '_.variants.test', _weak: true},
    group: {_ref: publishedId, _weak: true},
    scopeId: 'opaque-variant-scope',
  },
}

const variantDraftVersion: VersionInfoDocumentStub = {
  _id: 'opaque-variant-draft-doc-id',
  _rev: 'variant-draft-rev',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-07T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    variant: {_ref: '_.variants.test', _weak: true},
    group: {_ref: publishedId, _weak: true},
    scopeId: 'opaque-variant-draft-scope',
  },
}

describe('useCopyToDrafts', () => {
  const mockAction = vi.fn()
  const mockClient = {
    action: mockAction,
  } as unknown as SanityClient

  const mockUseClient = useClient as unknown as Mock<typeof useClient>
  const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>

  const onNavigate = vi.fn()
  const onConfirmationRequest = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseClient.mockReturnValue(mockClient)
    mockAction.mockResolvedValue(undefined)
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, releaseVersion, opaqueAgentVersion],
      error: null,
      loading: false,
    })
  })

  async function renderCopyToDrafts(fromBundle: string, fromVariant?: string) {
    const wrapper = await createTestProvider()
    return renderHook(
      () =>
        useCopyToDrafts({
          documentId: publishedId,
          fromBundle,
          fromVariant,
          onNavigate,
          onConfirmationRequest,
        }),
      {wrapper},
    )
  }

  it('copies a published document to drafts without discarding', async () => {
    const {result} = await renderCopyToDrafts('published')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(onConfirmationRequest).not.toHaveBeenCalled()
    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.version.create',
          versionId: 'drafts.article-123',
          baseId: publishedId,
          ifBaseRevisionId: 'published-rev',
          publishedId,
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('copies a release version to drafts by matching its bundle', async () => {
    const {result} = await renderCopyToDrafts('release1')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.version.create',
          versionId: 'drafts.article-123',
          baseId: releaseVersion._id,
          ifBaseRevisionId: 'release-rev',
          publishedId,
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('copies an agent version to drafts by matching its bundle, not its opaque id', async () => {
    const {result} = await renderCopyToDrafts('agent.user-123')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.version.create',
          versionId: 'drafts.article-123',
          baseId: opaqueAgentVersion._id,
          ifBaseRevisionId: 'agent-rev',
          publishedId,
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('requests confirmation when a draft exists and shouldConfirmDraftDiscard is true', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, draftVersion, releaseVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('release1')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(onConfirmationRequest).toHaveBeenCalledTimes(1)
    expect(mockAction).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('discards the existing draft then copies when shouldConfirmDraftDiscard is false', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, draftVersion, releaseVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('release1')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: false})
    })

    expect(onConfirmationRequest).not.toHaveBeenCalled()
    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.discard',
          draftId: 'drafts.article-123',
        },
        {
          actionType: 'sanity.action.document.version.create',
          versionId: 'drafts.article-123',
          baseId: releaseVersion._id,
          ifBaseRevisionId: 'release-rev',
          publishedId,
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast when the source version is not found', async () => {
    const {result} = await renderCopyToDrafts('missing-bundle')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(mockAction).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        description: `Source document with id: ${publishedId} and bundle: missing-bundle not found`,
      }),
    )
  })

  it('copies the base version when the same bundle also holds a variant version', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, releaseVersion, variantVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('release1')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.version.create',
          versionId: 'drafts.article-123',
          baseId: releaseVersion._id,
          ifBaseRevisionId: 'release-rev',
          publishedId,
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
  })

  it('copies a variant version to the variant draft, ignoring the base draft', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, draftVersion, releaseVersion, variantVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('release1', '_.variants.test')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(onConfirmationRequest).not.toHaveBeenCalled()
    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.variant.create',
          bundleId: 'drafts',
          publishedId,
          variantId: 'test',
          baseId: variantVersion._id,
          ifBaseRevisionId: 'variant-rev',
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('requests confirmation when the variant draft exists', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, variantVersion, variantDraftVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('release1', '_.variants.test')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(onConfirmationRequest).toHaveBeenCalledTimes(1)
    expect(mockAction).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
  })

  it('deletes the existing variant draft then copies when shouldConfirmDraftDiscard is false', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, variantVersion, variantDraftVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('release1', '_.variants.test')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: false})
    })

    expect(mockAction).toHaveBeenCalledWith(
      [
        {
          actionType: 'sanity.action.document.variant.delete',
          bundleId: 'drafts',
          publishedId,
          variantId: 'test',
        },
        {
          actionType: 'sanity.action.document.variant.create',
          bundleId: 'drafts',
          publishedId,
          variantId: 'test',
          baseId: variantVersion._id,
          ifBaseRevisionId: 'variant-rev',
        },
      ],
      {tag: 'document.copy-to-drafts'},
    )
    expect(onNavigate).toHaveBeenCalledTimes(1)
  })

  it('refuses to copy drafts onto themselves', async () => {
    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [publishedVersion, draftVersion],
      error: null,
      loading: false,
    })

    const {result} = await renderCopyToDrafts('drafts')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: false})
    })

    expect(mockAction).not.toHaveBeenCalled()
    expect(onNavigate).not.toHaveBeenCalled()
    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        description: `Source document with id: ${publishedId} and bundle: drafts not found`,
      }),
    )
  })

  it('shows an error toast when the client action fails', async () => {
    mockAction.mockRejectedValue(new Error('action failed'))

    const {result} = await renderCopyToDrafts('published')

    await act(async () => {
      await result.current.handleCopyToDrafts({shouldConfirmDraftDiscard: true})
    })

    expect(onNavigate).not.toHaveBeenCalled()
    expect(toastMock.push).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        description: 'action failed',
      }),
    )
  })
})
