import {defineField, defineType} from '@sanity/types'
import {render, screen, within} from '@testing-library/react'
import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {createMockVariant} from '../../../variants/__fixtures__/createMockVariant'
import {
  variantAlphaAudience,
  variantNorwegianMarket,
} from '../../../variants/__fixtures__/variants.fixture'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {type SystemVariant} from '../../../variants/types'
import {DocumentVersionsStatus} from '../DocumentVersionsStatus'

vi.mock('../../../releases/hooks/useDocumentVersions', () => ({
  useDocumentVersions: vi.fn(),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(),
}))

vi.mock('../../../variants/store/useAllVariants', () => ({
  useAllVariants: vi.fn(),
}))

const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>

const GROUP_ID = 'article-1'
const NOW = new Date('2026-10-22T12:00:00Z')
const RELEASES = [activeASAPRelease, activeUndecidedRelease]

function hoursAgo(hours: number): string {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000).toISOString()
}

function createVersion({
  id,
  bundleId,
  releaseId,
  variantId,
  updatedAt = hoursAgo(1),
}: {
  id: string
  bundleId?: string
  releaseId?: string
  variantId?: string
  updatedAt?: string
}): VersionInfoDocumentStub {
  return {
    _id: id,
    _type: 'article',
    _rev: `${id}-rev`,
    _createdAt: '2026-01-01T00:00:00.000Z',
    _updatedAt: updatedAt,
    _system: {
      bundleId,
      group: {_ref: GROUP_ID, _weak: true},
      release: releaseId ? {_ref: releaseId, _weak: true} : undefined,
      variants: variantId ? [{_ref: variantId, _key: 'k-123'}] : undefined,
    },
  }
}

const published = (updatedAt?: string, variantId?: string) =>
  createVersion({
    id: variantId ? `published.${variantId}.${GROUP_ID}` : GROUP_ID,
    variantId,
    updatedAt,
  })
const draft = (updatedAt?: string, variantId?: string) =>
  createVersion({
    id: variantId ? `drafts.${variantId}.${GROUP_ID}` : `drafts.${GROUP_ID}`,
    bundleId: 'drafts',
    variantId,
    updatedAt,
  })
const inRelease = (release: (typeof RELEASES)[number], updatedAt?: string) =>
  createVersion({
    id: `versions.${release.name}.${GROUP_ID}`,
    bundleId: release.name,
    releaseId: release._id,
    updatedAt,
  })

async function renderStatus({
  versions,
  variants = [],
  variantsEnabled = false,
  liveEdit = false,
}: {
  versions: VersionInfoDocumentStub[]
  variants?: SystemVariant[]
  variantsEnabled?: boolean
  liveEdit?: boolean
}) {
  mockUseDocumentVersions.mockReturnValue({
    data: versions.map((version) => version._id),
    versions,
    error: null,
    loading: false,
  })
  mockUseAllVariants.mockReturnValue({
    data: variants,
    byId: new Map(variants.map((variant) => [variant._id, variant])),
    loading: false,
    error: undefined,
  })

  const wrapper = await createTestProvider({
    config: {
      ...(variantsEnabled ? {beta: {variants: {enabled: true}}} : undefined),
      schema: {
        types: [
          defineType({
            name: 'article',
            type: 'document',
            liveEdit,
            fields: [defineField({name: 'title', type: 'string'})],
          }),
        ],
      },
    },
  })

  return render(<DocumentVersionsStatus documentGroupId={GROUP_ID} />, {wrapper})
}

function getLines() {
  return screen.getAllByTestId('document-versions-status-line')
}

/** A line's status icons, left to right. */
function getIcons(line: HTMLElement): string[] {
  return Array.from(
    line.querySelectorAll(
      '[data-sanity-icon="ring"], [data-sanity-icon="circle-small"], [data-testid^="release-avatar-"]',
    ),
  ).map((icon) =>
    icon.matches('[data-testid^="release-avatar-"]')
      ? 'release'
      : icon.getAttribute('data-sanity-icon') === 'ring'
        ? 'draft'
        : 'published',
  )
}

describe('DocumentVersionsStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers({toFake: ['Date']})
    vi.setSystemTime(NOW)
    mockUseActiveReleases.mockReturnValue({
      data: RELEASES,
      byId: new Map(RELEASES.map((release) => [release._id, release])),
      error: undefined,
      loading: false,
      dispatch: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows one line with no name and no release names when variants are disabled', async () => {
    await renderStatus({
      versions: [
        published(hoursAgo(48)),
        draft(hoursAgo(3)),
        inRelease(activeASAPRelease, hoursAgo(5)),
        published(hoursAgo(1), variantAlphaAudience._id),
      ],
      variants: [variantAlphaAudience],
    })

    const [line] = getLines()
    expect(getLines()).toHaveLength(1)
    expect(within(line).getByText('Edited 3 hr ago')).toBeInTheDocument()
    expect(getIcons(line)).toEqual(['release', 'draft', 'published'])
    expect(screen.queryByText('Default')).not.toBeInTheDocument()
    expect(screen.queryByText(/Alpha audience/)).not.toBeInTheDocument()
    expect(screen.queryByText(activeASAPRelease.metadata.title)).not.toBeInTheDocument()
  })

  it('lists the default line first, then the audiences by their latest edit', async () => {
    await renderStatus({
      versions: [
        published(hoursAgo(120)),
        published(hoursAgo(48), variantNorwegianMarket._id),
        draft(hoursAgo(1), variantAlphaAudience._id),
      ],
      variants: [variantAlphaAudience, variantNorwegianMarket],
      variantsEnabled: true,
    })

    const lines = getLines()
    expect(lines.map((line) => line.textContent)).toEqual([
      'DefaultPublished 5 days ago',
      'Alpha audienceEdited 1 hr ago',
      'Norwegian marketPublished 2 days ago',
    ])
    expect(lines.map(getIcons)).toEqual([['published'], ['draft'], ['published']])
  })

  it('shows at most one release icon, before the draft and published ones', async () => {
    await renderStatus({
      versions: [
        published(hoursAgo(48)),
        draft(hoursAgo(24)),
        inRelease(activeASAPRelease),
        inRelease(activeUndecidedRelease),
      ],
    })

    expect(getIcons(getLines()[0])).toEqual(['release', 'draft', 'published'])
  })

  it('says Edited for the published version of a live-edit type', async () => {
    await renderStatus({versions: [published(hoursAgo(2))], liveEdit: true})

    expect(within(getLines()[0]).getByText('Edited 2 hr ago')).toBeInTheDocument()
  })

  it('shows seven lines, then counts the versions it leaves out', async () => {
    const audiences = Array.from({length: 8}, (_, index) => createMockVariant(`audience-${index}`))
    await renderStatus({
      versions: [
        published(hoursAgo(1)),
        ...audiences.map((variant, index) => published(hoursAgo(index + 2), variant._id)),
        draft(hoursAgo(20), audiences[7]._id),
      ],
      variants: audiences,
      variantsEnabled: true,
    })

    expect(getLines()).toHaveLength(7)
    expect(screen.getByTestId('document-versions-status-more')).toHaveTextContent(
      'and 3 more versions',
    )
  })

  it('does not show agent versions', async () => {
    await renderStatus({
      versions: [
        published(hoursAgo(48)),
        createVersion({id: `versions.agent-mine.${GROUP_ID}`, bundleId: 'agent-mine'}),
      ],
    })

    expect(getIcons(getLines()[0])).toEqual(['published'])
    expect(screen.getByText('Published 2 days ago')).toBeInTheDocument()
  })
})
