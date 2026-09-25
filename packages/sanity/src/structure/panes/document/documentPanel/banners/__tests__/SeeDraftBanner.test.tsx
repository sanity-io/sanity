import {type ObjectSchemaType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type TargetDocumentState, usePerspective, useSetPerspective} from 'sanity'
import {beforeEach, describe, expect, it, type Mock, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {useDocumentPane} from '../../../useDocumentPane'
import {SeeDraftBanner} from '../SeeDraftBanner'

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../../../components/paneRouter/usePaneRouter', () => ({
  usePaneRouter: vi.fn(() => ({
    params: {},
    setParams: vi.fn(),
  })),
}))

vi.mock('sanity', async () => {
  const sanity = await vi.importActual('sanity')
  return {
    ...sanity,
    usePerspective: vi.fn(),
    useSetPerspective: vi.fn(),
  }
})

const {usePaneRouter} = vi.mocked(
  await import('../../../../../components/paneRouter/usePaneRouter'),
)

const mockUseDocumentPane = useDocumentPane as Mock<typeof useDocumentPane>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseSetPerspective = useSetPerspective as Mock<typeof useSetPerspective>
const setPerspective = vi.fn()

const publishedSibling = {
  _id: 'author-1',
  _rev: 'rev-1',
  _type: 'author',
  _createdAt: '2025-06-23T00:00:00Z',
  _updatedAt: '2025-06-23T00:00:00Z',
  _system: {
    bundleId: 'published',
    group: {_ref: 'author-1', _weak: true},
  },
} as const

const draftSibling = {
  _id: 'drafts.author-1',
  _rev: 'rev-2',
  _type: 'author',
  _createdAt: '2025-06-23T00:00:00Z',
  _updatedAt: '2025-06-24T00:00:00Z',
  _system: {
    bundleId: 'drafts',
    group: {_ref: 'author-1', _weak: true},
  },
} as const

function readyState(
  siblings: Extract<TargetDocumentState, {status: 'ready'}>['siblings'],
): Extract<TargetDocumentState, {status: 'ready'}> {
  return {
    status: 'ready',
    targetDocument: siblings.published,
    scopeId: undefined,
    variant: undefined,
    siblings,
  }
}

function publishedPerspective() {
  return {
    selectedPerspective: 'published' as const,
    selectedPerspectiveName: 'published' as const,
    selectedReleaseId: undefined,
    perspectiveStack: ['published'] as ['published'],
    excludedPerspectives: [],
    selectedVariantName: undefined,
    selectedVariant: undefined,
    bundle: 'published' as const,
  }
}

function draftsPerspective() {
  return {
    selectedPerspective: 'drafts' as const,
    selectedPerspectiveName: undefined,
    selectedReleaseId: undefined,
    perspectiveStack: ['drafts'] as ['drafts'],
    excludedPerspectives: [],
    selectedVariantName: undefined,
    selectedVariant: undefined,
    bundle: 'drafts' as const,
  }
}

function mockDocumentPane({
  liveEdit = false,
  targetDocumentState = readyState({
    published: publishedSibling,
    draft: undefined,
    version: undefined,
  }),
}: {
  liveEdit?: boolean
  targetDocumentState?: TargetDocumentState
} = {}) {
  mockUseDocumentPane.mockReturnValue({
    targetDocumentState,
    schemaType: {name: 'author', liveEdit} as ObjectSchemaType,
  } as unknown as ReturnType<typeof useDocumentPane>)
}

async function renderBanner() {
  const wrapper = await createTestProvider({
    resources: [structureUsEnglishLocaleBundle],
  })

  return render(<SeeDraftBanner />, {wrapper})
}

describe('SeeDraftBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSetPerspective.mockReturnValue(setPerspective)
    mockUsePerspective.mockReturnValue(publishedPerspective())
    mockDocumentPane()
    usePaneRouter.mockReturnValue({
      params: {},
      setParams: vi.fn(),
    } as unknown as ReturnType<typeof usePaneRouter>)
  })

  it('renders the see-draft banner when a published sibling exists in the published perspective', async () => {
    await renderBanner()

    await waitFor(() => {
      expect(screen.getByTestId('see-draft-banner')).toBeInTheDocument()
    })
    expect(
      screen.getByText('This is a published document. Switch to drafts to edit it.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'See draft'})).toBeInTheDocument()
  })

  it('renders when a draft already exists so the user can switch into it', async () => {
    mockDocumentPane({
      targetDocumentState: readyState({
        published: publishedSibling,
        draft: draftSibling,
        version: undefined,
      }),
    })

    await renderBanner()

    await waitFor(() => {
      expect(screen.getByTestId('see-draft-banner')).toBeInTheDocument()
    })
    expect(screen.getByRole('button', {name: 'See draft'})).toBeInTheDocument()
  })

  it('switches to the drafts perspective without creating a document', async () => {
    await renderBanner()

    await waitFor(() => {
      expect(screen.getByRole('button', {name: 'See draft'})).toBeInTheDocument()
    })
    await userEvent.click(screen.getByRole('button', {name: 'See draft'}))

    expect(setPerspective).toHaveBeenCalledTimes(1)
    expect(setPerspective).toHaveBeenCalledWith('drafts')
  })

  it('does not render for live-edit documents', async () => {
    mockDocumentPane({liveEdit: true})

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'See draft'})).not.toBeInTheDocument()
  })

  it('does not render in the drafts perspective', async () => {
    mockUsePerspective.mockReturnValue(draftsPerspective())

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
  })

  it('does not render when there is no published sibling', async () => {
    mockDocumentPane({
      targetDocumentState: readyState({
        published: undefined,
        draft: draftSibling,
        version: undefined,
      }),
    })

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
  })

  it('does not render while the target is still resolving', async () => {
    mockDocumentPane({
      targetDocumentState: {status: 'resolving'},
    })

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
  })

  it('does not render when viewing a history revision', async () => {
    usePaneRouter.mockReturnValue({
      params: {rev: 'rev-old'},
      setParams: vi.fn(),
    } as unknown as ReturnType<typeof usePaneRouter>)

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
  })
})
