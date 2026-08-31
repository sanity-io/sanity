import {type ObjectSchemaType, type SanityDocument} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {usePerspective, useSetPerspective} from 'sanity'
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

const publishedDocument: SanityDocument = {
  _id: 'author-1',
  _rev: 'rev-1',
  _type: 'author',
  _createdAt: '2025-06-23T00:00:00Z',
  _updatedAt: '2025-06-23T00:00:00Z',
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

function mockPublishedOnlyDocument({liveEdit = false}: {liveEdit?: boolean} = {}) {
  mockUseDocumentPane.mockReturnValue({
    editState: {
      ready: true,
      draft: null,
      published: publishedDocument,
      version: null,
    },
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
    mockPublishedOnlyDocument()
    usePaneRouter.mockReturnValue({
      params: {},
      setParams: vi.fn(),
    } as unknown as ReturnType<typeof usePaneRouter>)
  })

  it('renders the see-draft banner for a published-only document in the published perspective', async () => {
    await renderBanner()

    await waitFor(() => {
      expect(screen.getByTestId('see-draft-banner')).toBeInTheDocument()
    })
    expect(
      screen.getByText('This is a published document. Switch to drafts to edit it.'),
    ).toBeInTheDocument()
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
    mockPublishedOnlyDocument({liveEdit: true})

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', {name: 'See draft'})).not.toBeInTheDocument()
  })

  it('does not render in the drafts perspective', async () => {
    mockUsePerspective.mockReturnValue(draftsPerspective())

    await renderBanner()

    expect(screen.queryByTestId('see-draft-banner')).not.toBeInTheDocument()
  })

  it('does not render when a draft already exists', async () => {
    mockUseDocumentPane.mockReturnValue({
      editState: {
        ready: true,
        draft: {...publishedDocument, _id: 'drafts.author-1'},
        published: publishedDocument,
        version: null,
      },
      schemaType: {name: 'author', liveEdit: false} as ObjectSchemaType,
    } as unknown as ReturnType<typeof useDocumentPane>)

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
