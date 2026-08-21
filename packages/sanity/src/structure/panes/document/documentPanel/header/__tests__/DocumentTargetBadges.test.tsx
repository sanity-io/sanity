import {type ObjectSchemaType} from '@sanity/types'
import {render, screen} from '@testing-library/react'
import {
  type SystemVariant,
  type TargetDocumentState,
  type TargetPerspective,
  type VersionInfoDocumentStub,
  usePerspective,
} from 'sanity'
import {beforeAll, beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentTargetBadges} from '../DocumentTargetBadges'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: vi.fn(),
}))

vi.mock('../../../useDocumentPane')

const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>

const groupRef = {_ref: 'doc-1', _weak: true as const}
const variantRef = {_ref: '_.variants.alpha-audience', _weak: true as const}

const versionStub = (
  stub: Pick<VersionInfoDocumentStub, '_id' | '_system'>,
): VersionInfoDocumentStub => ({
  _rev: '',
  _createdAt: '',
  _updatedAt: '',
  _type: 'article',
  ...stub,
})

const publishedDocument = versionStub({
  _id: 'doc-1',
  _system: {group: groupRef},
})

const draftDocument = versionStub({
  _id: 'drafts.doc-1',
  _system: {bundleId: 'drafts', group: groupRef},
})

const publishedVariant = versionStub({
  _id: 'versions.varscope.doc-1',
  _system: {
    variant: variantRef,
    group: groupRef,
    scopeId: 'varscope',
  },
})

const variantAlphaAudience = {
  _id: '_.variants.alpha-audience',
  _type: 'system.variant',
  _createdAt: '2025-01-01T00:00:00Z',
  _updatedAt: '2025-01-01T00:00:00Z',
  _rev: 'rev-alpha',
  conditions: {audience: 'alpha'},
  priority: 0,
  metadata: {title: 'Alpha audience', description: []},
} as SystemVariant

const releaseDocument = {
  _id: '_.releases.rSummer',
  _type: 'system.release',
  _rev: 'r1',
  _createdAt: '2024-01-01T00:00:00Z',
  _updatedAt: '2024-01-01T00:00:00Z',
  name: 'rSummer',
  state: 'active' as const,
  metadata: {title: 'Summer Drop', releaseType: 'asap' as const},
} as TargetPerspective

const readyState = (
  targetDocument: VersionInfoDocumentStub | undefined,
  variant?: SystemVariant,
): Extract<TargetDocumentState, {status: 'ready'}> => ({
  status: 'ready',
  targetDocument,
  scopeId: targetDocument?._system.scopeId,
  variant,
  publishedSibling: variant ? publishedVariant : undefined,
})

const DEFAULT_PERSPECTIVE = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  selectedPerspective: 'drafts' as const,
  perspectiveStack: ['drafts'],
  excludedPerspectives: [],
  selectedVariantName: undefined,
  selectedVariant: undefined,
  bundle: 'drafts' as const,
}

function schemaType(liveEdit: boolean): ObjectSchemaType {
  return {name: 'author', jsonType: 'object', liveEdit} as ObjectSchemaType
}

function mockPane({
  liveEdit,
  displayed,
  targetDocumentState,
}: {
  liveEdit: boolean
  displayed?: VersionInfoDocumentStub
  targetDocumentState: TargetDocumentState
}) {
  mockUseDocumentPane.mockReturnValue({
    displayed: displayed ?? publishedDocument,
    schemaType: schemaType(liveEdit),
    targetDocumentState,
  } as ReturnType<typeof useDocumentPane>)
}

let wrapper: React.ComponentType<{children: React.ReactNode}>

beforeAll(async () => {
  wrapper = await createTestProvider()
})

describe('DocumentTargetBadges', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePerspective.mockReturnValue(DEFAULT_PERSPECTIVE)
  })

  it('shows Drafts for non-live-edit documents in the drafts perspective', async () => {
    mockPane({
      liveEdit: false,
      displayed: draftDocument,
      targetDocumentState: readyState(draftDocument),
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Drafts')).toBeInTheDocument()
  })

  it('shows Published for non-live-edit documents in the published perspective', async () => {
    mockUsePerspective.mockReturnValue({
      ...DEFAULT_PERSPECTIVE,
      selectedPerspectiveName: 'published',
      selectedPerspective: 'published',
      perspectiveStack: ['published'],
      bundle: 'published',
    })
    mockPane({
      liveEdit: false,
      displayed: publishedDocument,
      targetDocumentState: readyState(publishedDocument),
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Published')).toBeInTheDocument()
  })

  it('shows Published for live-edit documents with published _system while drafts is selected', async () => {
    mockPane({
      liveEdit: true,
      displayed: publishedDocument,
      targetDocumentState: readyState(undefined),
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(screen.queryByText('Drafts')).not.toBeInTheDocument()
  })

  it('shows Drafts for live-edit documents whose _system.bundleId is drafts', async () => {
    mockPane({
      liveEdit: true,
      displayed: draftDocument,
      targetDocumentState: readyState(draftDocument),
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Drafts')).toBeInTheDocument()
  })

  it('keeps the release title for live-edit documents in a release perspective', async () => {
    mockUsePerspective.mockReturnValue({
      ...DEFAULT_PERSPECTIVE,
      selectedPerspectiveName: 'rSummer',
      selectedReleaseId: 'rSummer',
      selectedPerspective: releaseDocument,
      perspectiveStack: ['rSummer', 'drafts'],
      bundle: 'rSummer',
    })
    mockPane({
      liveEdit: true,
      displayed: publishedDocument,
      targetDocumentState: readyState(undefined),
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Summer Drop')).toBeInTheDocument()
  })

  it('shows Published and the variant badge for a published live-edit variant', async () => {
    mockUsePerspective.mockReturnValue({
      ...DEFAULT_PERSPECTIVE,
      selectedVariantName: 'alpha-audience',
      selectedVariant: variantAlphaAudience,
    })
    mockPane({
      liveEdit: true,
      displayed: publishedVariant,
      targetDocumentState: readyState(publishedVariant, variantAlphaAudience),
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
  })

  it('shows Published without dimming when a live-edit variant is missing but a published sibling exists', async () => {
    mockUsePerspective.mockReturnValue({
      ...DEFAULT_PERSPECTIVE,
      selectedVariantName: 'alpha-audience',
      selectedVariant: variantAlphaAudience,
    })
    mockPane({
      liveEdit: true,
      displayed: publishedDocument,
      targetDocumentState: {
        status: 'variant-missing',
        variant: variantAlphaAudience,
        bundle: 'drafts',
        publishedSibling: publishedVariant,
      },
    })

    render(<DocumentTargetBadges />, {wrapper})

    expect(await screen.findByText('Published')).toBeInTheDocument()
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
    expect(
      screen.queryByText("Document doesn't exist in the selected perspective yet."),
    ).not.toBeInTheDocument()
  })
})
