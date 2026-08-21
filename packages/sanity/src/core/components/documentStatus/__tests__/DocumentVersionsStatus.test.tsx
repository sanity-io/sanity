import {render, screen} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useRelativeTime} from '../../../hooks/useRelativeTime'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {useAgentBundles} from '../../../store/agent/useAgentBundles'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {DocumentVersionsStatus} from '../DocumentVersionsStatus'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(() => ({
    data: [],
    versions: [],
    error: null,
    loading: false,
  })),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    error: undefined,
    loading: false,
    dispatch: vi.fn(),
  })),
}))

vi.mock('../../../variants/store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: [],
    byId: new Map(),
    loading: false,
    error: undefined,
  })),
}))

vi.mock('../../../hooks/useRelativeTime', () => ({
  useRelativeTime: vi.fn(() => '2d ago'),
}))

vi.mock('../../../store/agent/useAgentBundles', () => ({
  useAgentBundles: vi.fn(() => ({bundles: [], loading: false})),
}))

const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>
const mockUseRelativeTime = useRelativeTime as Mock<typeof useRelativeTime>
const mockUseAgentBundles = useAgentBundles as Mock<typeof useAgentBundles>

const GROUP_ID = 'article-1'

function createVersion({
  id,
  bundleId,
  variantRef,
}: {
  id: string
  bundleId?: string
  variantRef?: string
}): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: '2026-01-02T00:00:00.000Z',
    _system: {
      bundleId,
      group: {_ref: GROUP_ID, _weak: true},
      variant: variantRef ? {_ref: variantRef, _weak: true} : undefined,
    },
  }
}

const publishedDefault = createVersion({id: GROUP_ID})
const draftDefault = createVersion({id: `drafts.${GROUP_ID}`, bundleId: 'drafts'})
const publishedVariant = createVersion({
  id: `published.alpha.${GROUP_ID}`,
  variantRef: variantAlphaAudience._id,
})
const draftVariant = createVersion({
  id: `drafts.alpha.${GROUP_ID}`,
  bundleId: 'drafts',
  variantRef: variantAlphaAudience._id,
})

async function renderStatus({
  versions,
  variantsEnabled = false,
  variantsById = new Map(),
}: {
  versions: VersionInfoDocumentStub[]
  variantsEnabled?: boolean
  variantsById?: Map<string, typeof variantAlphaAudience>
}) {
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map((version) => version._id),
    versions,
    error: null,
    loading: false,
  })
  mockUseAllVariants.mockReturnValue({
    data: Array.from(variantsById.values()),
    byId: variantsById,
    loading: false,
    error: undefined,
  })

  const wrapper = await createTestProvider({
    ...(variantsEnabled ? {config: {beta: {variants: {enabled: true}}}} : undefined),
  })

  return render(<DocumentVersionsStatus documentGroupId={GROUP_ID} />, {wrapper})
}

describe('DocumentVersionsStatus', () => {
  beforeEach(() => {
    mockUseDocumentVersions.mockReset()
    mockUseActiveReleases.mockReset()
    mockUseAllVariants.mockReset()
    mockUseRelativeTime.mockReset()
    mockUseAgentBundles.mockReset()

    mockUseDocumentVersions.mockReturnValue({
      data: [],
      versions: [],
      error: null,
      loading: false,
    })
    mockUseActiveReleases.mockReturnValue({
      data: [],
      error: undefined,
      loading: false,
      dispatch: vi.fn(),
    })
    mockUseAllVariants.mockReturnValue({
      data: [],
      byId: new Map(),
      loading: false,
      error: undefined,
    })
    mockUseRelativeTime.mockReturnValue('2d ago')
    mockUseAgentBundles.mockReturnValue({bundles: [], loading: false})
  })

  it('shows only perspective titles when variants are disabled', async () => {
    await renderStatus({versions: [publishedDefault, draftDefault]})

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByText(/All users/)).not.toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon="rhombus"]')).not.toBeInTheDocument()
  })

  it('prefixes the default variant title when variants are enabled', async () => {
    await renderStatus({
      versions: [publishedDefault, draftDefault],
      variantsEnabled: true,
    })

    expect(screen.getByText('All users (Default) · Published')).toBeInTheDocument()
    expect(screen.getByText('All users (Default) · Draft')).toBeInTheDocument()
    expect(screen.queryByText('Published', {exact: true})).not.toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon="rhombus"]')).not.toBeInTheDocument()
  })

  it('shows the named variant title and rhombus when variants are enabled', async () => {
    await renderStatus({
      versions: [publishedVariant, draftVariant],
      variantsEnabled: true,
      variantsById: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
    })

    expect(screen.getByText('Alpha audience · Published')).toBeInTheDocument()
    expect(screen.getByText('Alpha audience · Draft')).toBeInTheDocument()
    expect(screen.queryByText(/All users/)).not.toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon="rhombus"]')).toBeInTheDocument()
  })

  it('does not render variant documents when variants are disabled', async () => {
    await renderStatus({
      versions: [publishedDefault, draftDefault, publishedVariant, draftVariant],
      variantsById: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
    })

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByText(/Alpha audience/)).not.toBeInTheDocument()
    expect(screen.queryByText(/All users/)).not.toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon="rhombus"]')).not.toBeInTheDocument()
  })

  it('does not show agent versions in the tooltip', async () => {
    const ownAgentBundle = 'agent-mine'
    const otherAgentBundle = 'agent-other'
    const ownAgentVersion = createVersion({
      id: `versions.${ownAgentBundle}.${GROUP_ID}`,
      bundleId: ownAgentBundle,
    })
    const otherAgentVersion = createVersion({
      id: `versions.${otherAgentBundle}.${GROUP_ID}`,
      bundleId: otherAgentBundle,
    })

    mockUseAgentBundles.mockReturnValue({
      bundles: [{id: ownAgentBundle, applicationKey: 'app'}],
      loading: false,
    })

    await renderStatus({
      versions: [publishedDefault, draftDefault, ownAgentVersion, otherAgentVersion],
    })

    expect(screen.getByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.queryByText('Proposed changes')).not.toBeInTheDocument()
    expect(screen.queryByText('Agent changes')).not.toBeInTheDocument()
  })
})
