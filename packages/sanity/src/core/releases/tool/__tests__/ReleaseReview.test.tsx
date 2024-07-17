import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {render, screen} from '@testing-library/react'

import {queryByDataUi} from '../../../../../test/setup/customQueries'
import {createWrapper} from '../../../bundles/util/tests/createWrapper'
import {useObserveDocument} from '../../../preview/useObserveDocument'
import {ColorSchemeProvider} from '../../../studio/colorScheme'
import {UserColorManagerProvider} from '../../../user-color/provider'
import {releasesUsEnglishLocaleBundle} from '../../i18n'
import {useDocumentPreviewValues} from '../detail/documentTable/useDocumentPreviewValues'
import {type DocumentHistory} from '../detail/documentTable/useReleaseHistory'
import {ReleaseReview} from '../detail/ReleaseReview'

const baseDocument = {
  name: 'William Faulkner',
  role: 'developer',
  awards: ['first award', 'second award'],
  favoriteBooks: [
    {
      _ref: '0b229e82-48e4-4226-a36f-e6b3d874478a',
      _type: 'reference',
      _key: '23610d43d8e8',
    },
  ],
  _id: '1f8caa96-4174-4c91-bb40-cbc96a737fcf',
  _rev: 'FvEfB9CaLlljeKWNkRBaf5',
  _type: 'author',
  _createdAt: '',
  _updatedAt: '',
}

const MOCKED_PROPS = {
  documents: [
    {
      favoriteBooks: [
        {
          _ref: '0daffd51-59c3-4dca-a9ee-1c4db54db87e',
          _type: 'reference',
          _key: '0d3f45004da0',
        },
      ],
      _version: {},
      bestFriend: {
        _ref: '0c9d9135-0d20-44a1-9ec1-54ea41ce84d1',
        _type: 'reference',
      },
      _rev: 'FvEfB9CaLlljeKWNkQgpz9',
      _type: 'author',
      role: 'designer',
      _createdAt: '2024-07-10T12:10:38Z',
      name: 'William Faulkner added',
      _id: 'differences.1f8caa96-4174-4c91-bb40-cbc96a737fcf',
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
      'differences.1f8caa96-4174-4c91-bb40-cbc96a737fcf',
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

jest.mock('../../../preview/useObserveDocument', () => {
  return {
    useObserveDocument: jest.fn(),
  }
})

jest.mock('../detail/documentTable/useDocumentPreviewValues', () => {
  return {
    useDocumentPreviewValues: jest.fn(),
  }
})

const mockedUseObserveDocument = useObserveDocument as jest.Mock<typeof useObserveDocument>
const mockedUseDocumentPreviewValues = useDocumentPreviewValues as jest.Mock<
  typeof useDocumentPreviewValues
>

const previewValues = {
  _id: 'differences.1f8caa96-4174-4c91-bb40-cbc96a737fcf',
  _type: 'author',
  _createdAt: '2024-07-10T12:10:38Z',
  _updatedAt: '2024-07-15T10:46:02Z',
  _version: {},
  title: 'William Faulkner differences check 123 asklaks ',
  subtitle: 'Designer',
}

describe('ReleaseReview', () => {
  describe('when loading baseDocument', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({
        document: null,
        loading: true,
      })
      mockedUseDocumentPreviewValues.mockReturnValue({previewValues, isLoading: false})
      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} />, {wrapper})
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
      mockedUseDocumentPreviewValues.mockReturnValue({previewValues, isLoading: false})
      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} />, {wrapper})
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
      mockedUseDocumentPreviewValues.mockReturnValue({previewValues, isLoading: false})
      const wrapper = await createWrapper({
        resources: [releasesUsEnglishLocaleBundle],
      })
      render(<ReleaseReview {...MOCKED_PROPS} />, {wrapper})
    })
    it('should show that there are no changes', async () => {
      expect(screen.getByText('No changes')).toBeInTheDocument()
    })
  })

  describe('when the base document is loaded and has changes', () => {
    beforeEach(async () => {
      mockedUseObserveDocument.mockReturnValue({
        document: baseDocument,
        loading: false,
      })
      mockedUseDocumentPreviewValues.mockReturnValue({previewValues, isLoading: false})
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
      const element = screen.getByText((content, el) => {
        return el?.tagName.toLowerCase() === 'ins' && content === 'added'
      })

      expect(element).toBeInTheDocument()
    })
  })
})
