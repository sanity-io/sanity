import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {type SanityDocument} from '@sanity/client'
import {act, fireEvent, render, screen} from '@testing-library/react'
import {ColorSchemeProvider, getPublishedId, UserColorManagerProvider} from 'sanity'

import {queryByDataUi} from '../../../../../../test/setup/customQueries'
import {createWrapper} from '../../../../bundles'
import {useObserveDocument} from '../../../../preview/useObserveDocument'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {useDocumentPreviewValues} from '../documentTable/useDocumentPreviewValues'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {ReleaseReview} from '../ReleaseReview'

const DOCUMENTS_MOCKS = {
  doc1: {
    baseDocument: {
      name: 'William Faulkner',
      role: 'developer',
      _id: 'doc1',
      _rev: 'FvEfB9CaLlljeKWNkRBaf5',
      _type: 'author',
      _createdAt: '',
      _updatedAt: '',
    },
    previewValues: {
      _id: 'differences.doc1',
      _type: 'author',
      _createdAt: '2024-07-10T12:10:38Z',
      _updatedAt: '2024-07-15T10:46:02Z',
      _version: {},
      title: 'William Faulkner added',
      subtitle: 'Designer',
    },
  },
  doc2: {
    baseDocument: {
      name: 'Virginia Woolf',
      role: 'developer',
      _id: 'doc2',
      _rev: 'FvEfB9CaLlljeKWNkRBaf5',
      _type: 'author',
      _createdAt: '',
      _updatedAt: '',
    },
    previewValues: {
      _id: 'differences.doc2',
      _type: 'author',
      _createdAt: '2024-07-10T12:10:38Z',
      _updatedAt: '2024-07-15T10:46:02Z',
      _version: {},
      title: 'Virginia Woolf test',
      subtitle: 'Developer',
    },
  },
} as const

const MOCKED_PROPS = {
  documents: [
    {
      _rev: 'FvEfB9CaLlljeKWNkQgpz9',
      _type: 'author',
      role: 'designer',
      _createdAt: '2024-07-10T12:10:38Z',
      name: 'William Faulkner added',
      _id: 'differences.doc1',
      _updatedAt: '2024-07-15T10:46:02Z',
    },
    {
      _rev: 'FvEfB9CaLlljeKWNkQg1232',
      _type: 'author',
      role: 'developer',
      _createdAt: '2024-07-10T12:10:38Z',
      name: 'Virginia Woolf test',
      _id: 'differences.doc2',
      _updatedAt: '2024-07-15T10:46:02Z',
    },
  ],
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
  documentsHistory: new Map<string, DocumentHistory>([
    [
      'differences.doc1',
      {
        history: [],
        createdBy: 'p8xDvUMxC',
        lastEditedBy: 'p8xDvUMxC',
        editors: ['p8xDvUMxC'],
      },
    ],
    [
      'differences.doc2',
      {
        history: [],
        createdBy: 'p8xDvUMxC',
        lastEditedBy: 'p8xDvUMxC',
        editors: ['p8xDvUMxC'],
      },
    ],
  ]),
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

jest.mock('../documentTable/useDocumentPreviewValues', () => {
  return {
    useDocumentPreviewValues: jest.fn(),
  }
})

const mockedUseObserveDocument = useObserveDocument as jest.Mock<typeof useObserveDocument>
const mockedUseDocumentPreviewValues = useDocumentPreviewValues as jest.Mock<
  typeof useDocumentPreviewValues
>

describe('ReleaseReview', () => {
  describe('when loading baseDocument', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({
        document: null,
        loading: true,
      })
      mockedUseDocumentPreviewValues.mockReturnValue({
        previewValues: DOCUMENTS_MOCKS.doc1.previewValues,
        isLoading: false,
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
      mockedUseDocumentPreviewValues.mockReturnValue({
        previewValues: DOCUMENTS_MOCKS.doc1.previewValues,
        isLoading: false,
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
        document: MOCKED_PROPS.documents[0],
        loading: false,
      })
      mockedUseDocumentPreviewValues.mockReturnValue({
        previewValues: DOCUMENTS_MOCKS.doc1.previewValues,
        isLoading: false,
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
          document: DOCUMENTS_MOCKS[docId].baseDocument,
          loading: false,
        }
      })
      mockedUseDocumentPreviewValues.mockImplementation(
        ({document}: {document: SanityDocument}) => {
          return {
            // @ts-expect-error - key is valid, ts won't infer it
            previewValues: DOCUMENTS_MOCKS[getPublishedId(document._id, true)].previewValues,
            isLoading: false,
          }
        },
      )
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
  })
  describe('filtering documents', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({document: null, loading: false})

      mockedUseDocumentPreviewValues.mockImplementation(
        ({document}: {document: SanityDocument}) => {
          return {
            // @ts-expect-error - key is valid, ts won't infer it
            previewValues: DOCUMENTS_MOCKS[getPublishedId(document._id, true)].previewValues,
            isLoading: false,
          }
        },
      )
      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} />, {wrapper})
    })

    it('should show all the documents when no filter is applied', () => {
      expect(screen.queryByText(DOCUMENTS_MOCKS.doc1.previewValues.title)).toBeInTheDocument()
      expect(screen.queryByText(DOCUMENTS_MOCKS.doc2.previewValues.title)).toBeInTheDocument()
    })
    it('should show support filtering by title', () => {
      const searchInput = screen.getByPlaceholderText('Search documents')
      act(() => {
        fireEvent.change(searchInput, {target: {value: 'Virginia'}})
      })

      expect(screen.queryByText(DOCUMENTS_MOCKS.doc1.previewValues.title)).not.toBeInTheDocument()
      expect(screen.queryByText(DOCUMENTS_MOCKS.doc2.previewValues.title)).toBeInTheDocument()

      act(() => {
        fireEvent.change(searchInput, {target: {value: ''}})
      })
      expect(screen.queryByText(DOCUMENTS_MOCKS.doc1.previewValues.title)).toBeInTheDocument()
      expect(screen.queryByText(DOCUMENTS_MOCKS.doc2.previewValues.title)).toBeInTheDocument()
    })
  })
})
