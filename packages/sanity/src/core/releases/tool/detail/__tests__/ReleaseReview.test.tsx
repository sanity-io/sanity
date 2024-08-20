import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {ColorSchemeProvider, UserColorManagerProvider} from 'sanity'

import {queryByDataUi} from '../../../../../../test/setup/customQueries'
import {createWrapper} from '../../../../../../test/testUtils/createWrapper'
import {useObserveDocument} from '../../../../preview/useObserveDocument'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseReview} from '../ReleaseReview'
import {type DocumentInBundleResult} from '../useBundleDocuments'

const BASE_DOCUMENTS_MOCKS = {
  doc1: {
    name: 'William Faulkner',
    role: 'developer',
    _id: 'doc1',
    _rev: 'FvEfB9CaLlljeKWNkRBaf5',
    _type: 'author',
    _createdAt: '',
    _updatedAt: '',
  },
  doc2: {
    name: 'Virginia Woolf',
    role: 'developer',
    _id: 'doc2',
    _rev: 'FvEfB9CaLlljeKWNkRBaf5',
    _type: 'author',
    _createdAt: '',
    _updatedAt: '',
  },
} as const

const MOCKED_DOCUMENTS: DocumentInBundleResult[] = [
  {
    document: {
      _rev: 'FvEfB9CaLlljeKWNkQgpz9',
      _type: 'author',
      role: 'designer',
      _createdAt: '2024-07-10T12:10:38Z',
      name: 'William Faulkner added',
      _id: 'differences.doc1',
      _updatedAt: '2024-07-15T10:46:02Z',
    },
    previewValues: {
      isLoading: false,
      values: {
        _createdAt: '2024-07-10T12:10:38Z',
        _updatedAt: '2024-07-15T10:46:02Z',
        _version: {},
        title: 'William Faulkner added',
        subtitle: 'Designer',
      },
    },
    validation: {
      isValidating: false,
      validation: [],
      revision: 'FvEfB9CaLlljeKWNk8Mh0N',
      hasError: false,
    },
  },
  {
    document: {
      _rev: 'FvEfB9CaLlljeKWNkQg1232',
      _type: 'author',
      role: 'developer',
      _createdAt: '2024-07-10T12:10:38Z',
      name: 'Virginia Woolf test',
      _id: 'differences.doc2',
      _updatedAt: '2024-07-15T10:46:02Z',
    },
    previewValues: {
      isLoading: false,
      values: {
        _createdAt: '2024-07-10T12:10:38Z',
        _updatedAt: '2024-07-15T10:46:02Z',
        _version: {},
        title: 'Virginia Woolf test',
        subtitle: 'Developer',
      },
    },
    validation: {
      isValidating: false,
      validation: [],
      revision: 'FvEfB9CaLlljeKWNk8Mh0N',
      hasError: false,
    },
  },
]
const MOCKED_PROPS = {
  scrollContainerRef: {current: null},
  documents: MOCKED_DOCUMENTS,
  release: {
    _updatedAt: '2024-07-12T10:39:32Z',
    authorId: 'p8xDvUMxC',
    _type: 'bundle',
    description: 'To test differences in documents',
    hue: 'gray',
    title: 'Differences',
    _createdAt: '2024-07-10T12:09:56Z',
    icon: 'cube',
    slug: 'differences',
    _id: 'd3137faf-ece6-44b5-a2b1-1090967f868e',
    _rev: 'j9BPWHem9m3oUugvhMXEGV',
  } as const,
  documentsHistory: {
    'differences.doc1': {
      history: [],
      createdBy: 'p8xDvUMxC',
      lastEditedBy: 'p8xDvUMxC',
      editors: ['p8xDvUMxC'],
    },

    'differences.doc2': {
      history: [],
      createdBy: 'p8xDvUMxC',
      lastEditedBy: 'p8xDvUMxC',
      editors: ['p8xDvUMxC'],
    },
  },
}

jest.mock('sanity/router', () => ({
  ...(jest.requireActual('sanity/router') || {}),
  IntentLink: jest.fn().mockImplementation((props: any) => <a> {props.children}</a>),
  useRouter: jest.fn().mockReturnValue({
    state: {bundleSlug: 'differences'},
    navigate: jest.fn(),
  }),
}))

jest.mock('../../../../preview/useObserveDocument', () => {
  return {
    useObserveDocument: jest.fn(),
  }
})

const mockedUseObserveDocument = useObserveDocument as jest.Mock<typeof useObserveDocument>

describe('ReleaseReview', () => {
  describe('when loading baseDocument', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({
        document: null,
        loading: true,
      })
      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} documents={MOCKED_PROPS.documents.slice(0, 1)} />, {
        wrapper,
      })
    })
    it("should show the loader when the base document hasn't loaded", () => {
      queryByDataUi(document.body, 'Spinner')
    })
  })
  describe('when there is no base document', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({
        document: null,
        loading: false,
      })
      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} documents={MOCKED_PROPS.documents.slice(0, 1)} />, {
        wrapper,
      })
    })
    it('should render the new document ui', async () => {
      expect(screen.getByText('New document')).toBeInTheDocument()
    })
  })

  describe('when the base document is loaded and there are no changes', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({
        document: MOCKED_DOCUMENTS[0].document,
        loading: false,
      })

      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} documents={MOCKED_PROPS.documents.slice(0, 1)} />, {
        wrapper,
      })
    })
    it('should show that there are no changes', async () => {
      expect(screen.getByText('No changes')).toBeInTheDocument()
    })
  })

  describe('when the base document is loaded and has changes', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockImplementation((docId: string) => {
        return {
          // @ts-expect-error - key is valid, ts won't infer it
          document: BASE_DOCUMENTS_MOCKS[docId],
          loading: false,
        }
      })

      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(
        <ColorSchemeProvider>
          <UserColorManagerProvider>
            <ReleaseReview {...MOCKED_PROPS} />
          </UserColorManagerProvider>
        </ColorSchemeProvider>,
        {wrapper},
      )
    })
    it('should should show the changes', async () => {
      // Find an ins tag with the text "added"
      const firstDocumentChange = screen.getByText((content, el) => {
        return el?.tagName.toLowerCase() === 'ins' && content === 'added'
      })

      expect(firstDocumentChange).toBeInTheDocument()

      const secondDocumentChange = screen.getByText((content, el) => {
        return el?.tagName.toLowerCase() === 'ins' && content === 'test'
      })

      expect(secondDocumentChange).toBeInTheDocument()
    })
    it('should collapse documents', () => {
      const firstDocumentDiff = screen.getByTestId(
        `doc-differences-${MOCKED_DOCUMENTS[0].document._id}`,
      )
      const secondDocumentDiff = screen.getByTestId(
        `doc-differences-${MOCKED_DOCUMENTS[1].document._id}`,
      )
      expect(within(firstDocumentDiff).getByText('added')).toBeInTheDocument()
      expect(within(secondDocumentDiff).getByText('test')).toBeInTheDocument()
      // get the toggle button with id 'document-review-header-toggle' inside the first document diff
      const firstDocToggle = within(firstDocumentDiff).getByTestId('document-review-header-toggle')
      act(() => {
        fireEvent.click(firstDocToggle)
      })
      expect(within(firstDocumentDiff).queryByText('added')).not.toBeInTheDocument()
      expect(within(secondDocumentDiff).getByText('test')).toBeInTheDocument()
      act(() => {
        fireEvent.click(firstDocToggle)
      })
      expect(within(firstDocumentDiff).getByText('added')).toBeInTheDocument()
      expect(within(secondDocumentDiff).getByText('test')).toBeInTheDocument()

      const secondDocToggle = within(secondDocumentDiff).getByTestId(
        'document-review-header-toggle',
      )
      act(() => {
        fireEvent.click(secondDocToggle)
      })
      expect(within(firstDocumentDiff).getByText('added')).toBeInTheDocument()
      expect(within(secondDocumentDiff).queryByText('test')).not.toBeInTheDocument()
    })
  })
  describe('filtering documents', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({document: null, loading: false})

      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} />, {wrapper})
    })

    it('should show all the documents when no filter is applied', () => {
      expect(
        screen.queryByText(MOCKED_DOCUMENTS[0].previewValues.values.title as string),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(MOCKED_DOCUMENTS[1].previewValues.values.title as string),
      ).toBeInTheDocument()
    })
    it('should show support filtering by title', () => {
      const searchInput = screen.getByPlaceholderText('Search documents')
      act(() => {
        fireEvent.change(searchInput, {target: {value: 'Virginia'}})
      })

      expect(
        screen.queryByText(MOCKED_DOCUMENTS[0].previewValues.values.title as string),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText(MOCKED_DOCUMENTS[1].previewValues.values.title as string),
      ).toBeInTheDocument()

      act(() => {
        fireEvent.change(searchInput, {target: {value: ''}})
      })
      expect(
        screen.queryByText(MOCKED_DOCUMENTS[0].previewValues.values.title as string),
      ).toBeInTheDocument()
      expect(
        screen.queryByText(MOCKED_DOCUMENTS[1].previewValues.values.title as string),
      ).toBeInTheDocument()
    })
  })
})
