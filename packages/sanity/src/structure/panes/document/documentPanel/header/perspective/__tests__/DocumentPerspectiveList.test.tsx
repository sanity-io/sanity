import {render, screen} from '@testing-library/react'
import {type HTMLProps} from 'react'
import {type ReleaseDocument, useArchivedReleases, useReleases} from 'sanity'
import {type IntentLinkProps} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPerspectiveList} from '../DocumentPerspectiveList'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useReleases: vi.fn().mockReturnValue({data: [], loading: false}),
  useAllReleases: vi.fn().mockReturnValue({data: []}),
  useArchivedReleases: vi.fn().mockReturnValue({archivedReleases: []}),
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
const mockUseReleases = useReleases as Mock<typeof useReleases>
const mockUseArchivedReleases = useArchivedReleases as Mock<typeof useArchivedReleases>
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

describe('DocumentPerspectiveList', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    /** @todo create a useDocumentPane fixture */
    mockUseDocumentPane.mockReturnValue({
      documentVersions: [],
    })

    global.HTMLElement.prototype.scrollIntoView = vi.fn()
  })

  it('should render "Published" and "Draft" chips when it has no other version', async () => {
    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveList />, {wrapper})
    expect(screen.getByRole('button', {name: 'Published'})).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Draft'})).toBeInTheDocument()
  })

  it('should render the release chip when it has a release version', async () => {
    mockUseReleases.mockReturnValue({
      loading: false,
      data: [mockCurrent],
      dispatch: vi.fn(),
    })
    mockUseArchivedReleases.mockReturnValue({
      archivedReleases: [],
    })
    mockUseDocumentPane.mockReturnValue({
      documentVersions: [mockCurrent],
      displayed: {
        _id: 'versions.spring-drop.KJAiOpAH5r6P3dWt1df9ql',
      },
    })

    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveList />, {wrapper})

    expect(screen.getByRole('button', {name: 'Spring Drop'})).toBeInTheDocument()
  })

  describe('disabled chips', () => {
    const mockUsePane = {
      documentVersions: [mockCurrent],
      editState: {
        id: 'document-id',
        type: 'document-type',
        transactionSyncLock: {enabled: false},
        draft: null,
        published: null, // make sure that there is no published doc in the mock
        liveEdit: false,
        ready: true,
        version: {
          _id: 'versions.release.document-id',
          _type: 'document-type',
          _createdAt: '2023-01-01T00:00:00Z',
          _updatedAt: '2023-01-01T00:00:00Z',
          _rev: '1',
        },
        liveEditSchemaType: false,
      },
    }

    it('should disable the "Published" chip when there is no published document and not live edit', async () => {
      mockUseDocumentPane.mockReturnValue(mockUsePane)

      const wrapper = await createTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).toBeDisabled()
    })

    it('should enable the "Published" chip when there is no published document and IS live edit', async () => {
      mockUseDocumentPane.mockReturnValue({
        ...mockUsePane,
        editState: {...mockUsePane.editState, liveEdit: true},
      })

      const wrapper = await createTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).not.toBeDisabled()
    })

    it('should enable the "Published" chip when the document is "liveEdit"', async () => {
      mockUseDocumentPane.mockReturnValue({
        ...mockUsePane,
        editState: {
          ...mockUsePane.editState,
          published: {
            _id: 'published-document-id',
            _type: 'document-type',
            _createdAt: '2023-01-01T00:00:00Z',
            _updatedAt: '2023-01-01T00:00:00Z',
            _rev: '1',
          },
        },
      })

      const wrapper = await createTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).toBeEnabled()
    })
  })

  describe('selected chips', () => {
    it.todo('the draft is selected when the document displayed is a draft')
    it.todo('the draft is selected when the perspective is null')
    it.todo(
      'the draft is selected when when the document is not published and the displayed version is draft,',
    )
    it.todo('when there is no draft (new document)')
  })
})
