import {render} from '@testing-library/react'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type VersionInfoDocumentStub} from '../../../releases/store/types'
import {useActiveReleases} from '../../../releases/store/useActiveReleases'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {DocumentVersionIcons} from '../DocumentVersionIcons'

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    byId: new Map(),
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

const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseAllVariants = useAllVariants as Mock<typeof useAllVariants>

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

async function renderIcons({
  version,
  variantsEnabled = false,
}: {
  version: VersionInfoDocumentStub
  variantsEnabled?: boolean
}) {
  mockUseAllVariants.mockReturnValue({
    data: [variantAlphaAudience],
    byId: new Map([[variantAlphaAudience._id, variantAlphaAudience]]),
    loading: false,
    error: undefined,
  })

  const wrapper = await createTestProvider({
    ...(variantsEnabled ? {config: {beta: {variants: {enabled: true}}}} : undefined),
  })

  return render(<DocumentVersionIcons version={version} />, {wrapper})
}

describe('DocumentVersionIcons', () => {
  beforeEach(() => {
    mockUseActiveReleases.mockReset()
    mockUseAllVariants.mockReset()
    mockUseActiveReleases.mockReturnValue({
      data: [],
      byId: new Map(),
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
  })

  it('renders the draft release avatar without a variant rhombus', async () => {
    await renderIcons({version: createVersion({id: `drafts.${GROUP_ID}`, bundleId: 'drafts'})})

    expect(document.querySelector('[data-testid="release-avatar-caution"]')).toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon="rhombus"]')).not.toBeInTheDocument()
  })

  it('renders the variant rhombus when variants are enabled and the stub belongs to a variant', async () => {
    await renderIcons({
      version: createVersion({
        id: `drafts.alpha.${GROUP_ID}`,
        bundleId: 'drafts',
        variantRef: variantAlphaAudience._id,
      }),
      variantsEnabled: true,
    })

    expect(document.querySelector('[data-testid="release-avatar-caution"]')).toBeInTheDocument()
    expect(document.querySelector('[data-sanity-icon="rhombus"]')).toBeInTheDocument()
  })

  it('does not render the variant rhombus when variants are disabled', async () => {
    await renderIcons({
      version: createVersion({
        id: `drafts.alpha.${GROUP_ID}`,
        bundleId: 'drafts',
        variantRef: variantAlphaAudience._id,
      }),
    })

    expect(document.querySelector('[data-sanity-icon="rhombus"]')).not.toBeInTheDocument()
  })
})
