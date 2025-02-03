import {type ReleaseId} from '@sanity/client'
import {render, screen} from '@testing-library/react'
import {type HTMLProps} from 'react'
import {
  getDraftId,
  getVersionId,
  type ReleaseDocument,
  useActiveReleases,
  useDocumentVersions,
  usePerspective,
} from 'sanity'
import {type IntentLinkProps} from 'sanity/router'
import {
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  type Mocked,
  type MockedFunction,
  vi,
} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPerspectiveList} from '../DocumentPerspectiveList'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentVersions: vi.fn(),
  usePerspective: vi.fn(),
  useActiveReleases: vi.fn().mockReturnValue({data: [], loading: false}),
  useArchivedReleases: vi.fn().mockReturnValue({data: [], loading: false}),
  SANITY_VERSION: '0.0.0',
}))

vi.mock('sanity/router', () => {
  return {
    useRouter: vi.fn().mockReturnValue({
      stickyParams: {},
    }),
    route: {
      create: vi.fn(),
      intents: vi.fn(),
    },
    IntentLink(props: IntentLinkProps & HTMLProps<HTMLAnchorElement>) {
      const {params = {}, intent, ...rest} = props
      const stringParams = params
        ? Object.entries(params)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')
        : ''

      return <a {...rest} href={`/intent/${intent}/${stringParams}`} />
    },
  }
})

vi.mock('../../../../useDocumentPane')

const mockUseDocumentPane = useDocumentPane as MockedFunction<
  () => Partial<DocumentPaneContextValue>
>
const mockUseActiveReleases = useActiveReleases as Mock<typeof useActiveReleases>
const mockUseDocumentVersions = useDocumentVersions as Mock<typeof useDocumentVersions>
const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockCurrent: ReleaseDocument = {
  _updatedAt: '2024-07-12T10:39:32Z',
  _id: '_.releases.rSpringDrop',
  _type: 'system.release',
  _rev: 'r123',
  metadata: {
    description: 'What a spring drop, allergies galore 🌸',
    releaseType: 'asap',
    title: 'Spring Drop',
  },
  _createdAt: '2024-07-02T11:37:51Z',
  state: 'scheduled',
}

const getTestProvider = async ({liveEdit}: {liveEdit?: boolean} = {}) => {
  const wrapper = await createTestProvider({
    config: {
      schema: {
        types: [
          {
            type: 'document',
            name: 'testAuthor',
            liveEdit,
            fields: [{name: 'title', type: 'string'}],
          },
        ],
      },
    },
  })
  return wrapper
}

const usePerspectiveMockValue: Mocked<ReturnType<typeof usePerspective>> = {
  selectedPerspectiveName: undefined,
  selectedReleaseId: undefined,
  setPerspective: vi.fn(),
  selectedPerspective: 'drafts',
  toggleExcludedPerspective: vi.fn(),
  isPerspectiveExcluded: vi.fn(),
  perspectiveStack: [],
} as const

const getPaneMock = ({
  isCreatingDocument,
  displayedVersion = 'draft',
  editStateDocuments,
}: {
  isCreatingDocument?: boolean
  displayedVersion?: ReleaseId | 'published' | 'draft'
  editStateDocuments?: Array<'draft' | 'published' | 'version'>
} = {}) => {
  const publishedId = 'foo'
  const editStateDocument = {
    _id: publishedId,
    _type: 'testAuthor',
    _createdAt: '2023-01-01T00:00:00Z',
    _updatedAt: '2023-01-01T00:00:00Z',
    _rev: 'r1',
    name: 'John Doe',
  }
  return {
    documentType: 'testAuthor',
    documentId: publishedId,
    editState: {
      id: publishedId,
      type: 'testAuthor',
      transactionSyncLock: {enabled: false},
      liveEdit: false,
      ready: true,

      published: editStateDocuments?.includes('published') ? editStateDocument : null,
      draft: editStateDocuments?.includes('draft') ? editStateDocument : null,
      version: editStateDocuments?.includes('version') ? editStateDocument : null,

      liveEditSchemaType: false,
      release: displayedVersion.startsWith('r') ? displayedVersion : undefined,
    },
    displayed: {
      _id:
        // eslint-disable-next-line no-nested-ternary
        displayedVersion === 'published'
          ? publishedId
          : displayedVersion === 'draft'
            ? getDraftId(publishedId)
            : getVersionId(publishedId, displayedVersion),
      _type: 'testAuthor',
      _createdAt: isCreatingDocument ? undefined : '2023-01-01T00:00:00Z',
    },
  }
}

describe('DocumentPerspectiveList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePerspective.mockReturnValue(usePerspectiveMockValue)
    mockUseActiveReleases.mockReturnValue({
      loading: false,
      data: [mockCurrent],
      dispatch: vi.fn(),
    })
    mockUseDocumentVersions.mockReturnValue({
      data: ['versions.rSpringDrop.KJAiOpAH5r6P3dWt1df9ql'],
      loading: false,
      error: null,
    })

    global.HTMLElement.prototype.scrollIntoView = vi.fn()
  })
  describe('enabled chips', () => {
    it('should render "Published" and "Draft" chips when it has no other version', async () => {
      mockUseDocumentPane.mockReturnValue(getPaneMock())
      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})
      expect(screen.getByRole('button', {name: 'Published'})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Draft'})).toBeInTheDocument()
    })

    it('should render the release chip when it has a release version', async () => {
      mockUseDocumentPane.mockReturnValue(getPaneMock())

      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})
      expect(screen.getByRole('button', {name: 'Published'})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Draft'})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Spring Drop'})).toBeInTheDocument()
    })
    it('should render the release chip when it is creating a release version and user is in that release', async () => {
      mockUseDocumentPane.mockReturnValue(
        getPaneMock({isCreatingDocument: true, displayedVersion: 'rSpringDrop'}),
      )
      // no document versions are available, but the user is creating this document, so we want to show the chip anyways.
      mockUseDocumentVersions.mockReturnValue({data: [], loading: false, error: null})
      // the selected perspective is the release perspective
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockValue,
        selectedReleaseId: 'rSpringDrop',
        selectedPerspectiveName: 'rSpringDrop',
      })

      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})
      expect(screen.getByRole('button', {name: 'Published'})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Draft'})).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'Spring Drop'})).toBeInTheDocument()
    })
  })

  describe('disabled chips', () => {
    it('should disable the "Published" chip when there is no published document and not live edit, draft should be enabled', async () => {
      mockUseDocumentPane.mockReturnValue(getPaneMock())

      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).toBeDisabled()
      expect(screen.getByRole('button', {name: 'Draft'})).not.toBeDisabled()
    })

    it('should enable the "Published" chip when there is no published document and IS live edit, draft should be disabled', async () => {
      mockUseDocumentPane.mockReturnValue(
        getPaneMock({
          displayedVersion: 'published',
          editStateDocuments: ['published'],
        }),
      )
      mockUsePerspective.mockReturnValue({
        ...usePerspectiveMockValue,
        selectedPerspectiveName: 'published',
      })
      const wrapper = await getTestProvider({liveEdit: true})

      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).not.toBeDisabled()
      expect(screen.getByRole('button', {name: 'Draft'})).toBeDisabled()
    })

    it('should enable the "Published" chip when the document is "liveEdit" and published exists', async () => {
      mockUseDocumentPane.mockReturnValue(getPaneMock({editStateDocuments: ['published']}))
      const wrapper = await getTestProvider({liveEdit: true})
      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
    })
  })

  describe('selected chips', () => {
    it('the draft is selected when the document displayed is a draft', async () => {
      mockUseDocumentPane.mockReturnValue(
        getPaneMock({editStateDocuments: ['draft'], displayedVersion: 'draft'}),
      )
      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})
      expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
      expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
    })

    it('the draft is selected when the perspective is null, even if draft is missing', async () => {
      mockUseDocumentPane.mockReturnValue(
        getPaneMock({editStateDocuments: ['published'], displayedVersion: 'published'}),
      )
      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})
      expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
      // Publish is enabled, users should be able to navigate to the published document
      expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
    })
    it('when there is no draft (new document)', async () => {
      mockUseDocumentPane.mockReturnValue(
        getPaneMock({editStateDocuments: [], displayedVersion: 'published'}),
      )
      const wrapper = await getTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})
      expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
      expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
    })
  })

  describe('editState and perspectives permutations', () => {
    describe('liveEditDocument', () => {
      it('no draft and no published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: [],
            displayedVersion: 'published',
            isCreatingDocument: true,
          }),
        )
        const wrapper = await getTestProvider({liveEdit: true})
        render(<DocumentPerspectiveList />, {wrapper})
        const draftChip = screen.getByRole('button', {name: 'Draft'})
        const publishedChip = screen.getByRole('button', {name: 'Published'})
        // draft is not selected and disabled, the document is live edit and draft doesn't exist.
        expect(draftChip).not.toHaveAttribute('data-selected')
        expect(draftChip).toBeDisabled()
        // Published is selected because the user is creating a live edit document
        expect(publishedChip).not.toBeDisabled()
        expect(publishedChip).toHaveAttribute('data-selected')
      })
      it('no draft and no published - perspective is published', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: [],
            displayedVersion: 'published',
            isCreatingDocument: true,
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'published',
        })
        const wrapper = await getTestProvider({liveEdit: true})
        render(<DocumentPerspectiveList />, {wrapper})
        const draftChip = screen.getByRole('button', {name: 'Draft'})
        const publishedChip = screen.getByRole('button', {name: 'Published'})
        // draft is not selected and disabled, the document is live edit and draft doesn't exist.
        expect(draftChip).not.toHaveAttribute('data-selected')
        expect(draftChip).toBeDisabled()
        // Published is selected because the user is creating a live edit document
        expect(publishedChip).not.toBeDisabled()
        expect(publishedChip).toHaveAttribute('data-selected')
      })
      it('no draft and no published - perspective is version', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: [],
            displayedVersion: 'rSpringDrop',
            isCreatingDocument: true,
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'rSpringDrop',
          selectedReleaseId: 'rSpringDrop',
        })
        const wrapper = await getTestProvider({liveEdit: true})
        render(<DocumentPerspectiveList />, {wrapper})
        // Perspective is published and the user is creating a live edit document, so the draft chip should be disabled
        expect(screen.getByRole('button', {name: 'Draft'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Spring Drop'})).toHaveAttribute('data-selected')
      })
      it('draft and no published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(getPaneMock({editStateDocuments: ['draft']}))
        const wrapper = await getTestProvider({liveEdit: true})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
        expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
      })
      it('draft and published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({editStateDocuments: ['draft', 'published']}),
        )
        const wrapper = await getTestProvider({liveEdit: true})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
        expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
      })
    })
    describe('not liveEditDocument', () => {
      it('no draft and no published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: [],
            displayedVersion: 'published',
            isCreatingDocument: true,
          }),
        )
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
        expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
      })
      it('draft and no published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['draft'],
            displayedVersion: 'draft',
          }),
        )
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
        expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
      })
      it('no draft and published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['published'],
            displayedVersion: 'published',
          }),
        )
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
        expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
      })
      it('draft and published - perspective is undefined', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['published', 'draft'],
            displayedVersion: 'published',
          }),
        )
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toHaveAttribute('data-selected')
        expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
      })
      it('no draft, no published and no version - perspective is version', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: [],
            displayedVersion: 'rSpringDrop',
            isCreatingDocument: true,
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'rSpringDrop',
          selectedReleaseId: 'rSpringDrop',
        })
        mockUseDocumentVersions.mockReturnValue({data: [], loading: false, error: null})
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Spring Drop'})).toHaveAttribute('data-selected')
      })
      it('draft, no published and no version - perspective is version', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['draft'],
            displayedVersion: 'rSpringDrop',
            isCreatingDocument: true,
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'rSpringDrop',
          selectedReleaseId: 'rSpringDrop',
        })
        mockUseDocumentVersions.mockReturnValue({data: [], loading: false, error: null})
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toBeEnabled()
        expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Spring Drop'})).toHaveAttribute('data-selected')
      })
      it('no draft, published and no version - perspective is version', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['published'],
            displayedVersion: 'rSpringDrop',
            isCreatingDocument: true,
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'rSpringDrop',
          selectedReleaseId: 'rSpringDrop',
        })
        mockUseDocumentVersions.mockReturnValue({data: [], loading: false, error: null})
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
        expect(screen.getByRole('button', {name: 'Spring Drop'})).toHaveAttribute('data-selected')
      })
      it('no draft, published and version - perspective is version', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['published', 'version'],
            displayedVersion: 'rSpringDrop',
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'rSpringDrop',
          selectedReleaseId: 'rSpringDrop',
        })
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toBeEnabled()
        expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
        expect(screen.getByRole('button', {name: 'Spring Drop'})).toHaveAttribute('data-selected')
      })
      it('draft, no published and version - perspective is version', async () => {
        mockUseDocumentPane.mockReturnValue(
          getPaneMock({
            editStateDocuments: ['draft', 'version'],
            displayedVersion: 'rSpringDrop',
          }),
        )
        mockUsePerspective.mockReturnValue({
          ...usePerspectiveMockValue,
          selectedPerspectiveName: 'rSpringDrop',
          selectedReleaseId: 'rSpringDrop',
        })
        const wrapper = await getTestProvider({liveEdit: false})
        render(<DocumentPerspectiveList />, {wrapper})
        expect(screen.getByRole('button', {name: 'Draft'})).toBeEnabled()
        expect(screen.getByRole('button', {name: 'Published'})).not.toBeEnabled()
        expect(screen.getByRole('button', {name: 'Spring Drop'})).toHaveAttribute('data-selected')
      })
    })
  })
})
