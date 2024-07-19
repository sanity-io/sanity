import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {
  BundleBadge,
  type BundleDocument,
  getBundleSlug,
  useBundles,
  useClient,
  useDocumentPerspective,
  usePerspective,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {DocumentPerspectiveMenu} from '../../src/structure/panes/document/documentPanel/header/perspective/DocumentPerspectiveMenu'
import {createWrapper} from '../testUtils/createWrapper'

type getBundleSlugType = (documentId: string) => string

jest.mock('sanity', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = jest.requireActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    useClient: jest.fn(),
    usePerspective: jest.fn().mockReturnValue({
      currentGlobalBundle: {},
      setPerspective: jest.fn(),
    }),
    BundleBadge: jest.fn(),
    useBundles: jest.fn(),
    getBundleSlug: jest.fn(() => ''),
    useDocumentPerspective: jest.fn(),
  }
})

jest.mock('sanity/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    navigateIntent: jest.fn(),
  }),
  route: {
    create: jest.fn(),
  },
  IntentLink: jest.fn(),
}))

const mockUseClient = useClient as jest.Mock
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const navigateIntent = mockUseRouter().navigateIntent as jest.Mock

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUsePerspective = usePerspective as jest.Mock
const mockGetBundleSlug = getBundleSlug as jest.MockedFunction<getBundleSlugType>
const mockUseDocumentPerspective = useDocumentPerspective as jest.MockedFunction<
  typeof useDocumentPerspective
>

const mockBundleBadge = BundleBadge as jest.Mock

describe('DocumentPerspectiveMenu', () => {
  const mockCurrent: BundleDocument = {
    description: 'What a spring drop, allergies galore 🌸',
    _updatedAt: '2024-07-12T10:39:32Z',
    _rev: 'HdJONGqRccLIid3oECLjYZ',
    authorId: 'pzAhBTkNX',
    title: 'Spring Drop',
    icon: 'heart-filled',
    _id: 'db76c50e-358b-445c-a57c-8344c588a5d5',
    _type: 'bundle',
    slug: 'spring-drop',
    hue: 'magenta',
    _createdAt: '2024-07-02T11:37:51Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseClient.mockReturnValue({})

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore

    mockBundleBadge.mockImplementation(() => <div>"test"</div>)

    // Mock the data returned by useBundles hook
    const mockData: BundleDocument[] = [mockCurrent]

    mockUseBundles.mockReturnValue({
      data: mockData,
      loading: false,
      dispatch: jest.fn(),
    })

    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: mockCurrent,
      setPerspective: jest.fn(),
    })

    mockUseDocumentPerspective.mockImplementationOnce(() => ({
      data: [],
    }))
  })

  it('should render the bundle badge if the document exists in the global bundle', async () => {
    // Dummy Getters
    mockGetBundleSlug.mockReturnValue('spring-drop')

    mockUseDocumentPerspective.mockImplementationOnce(() => ({
      data: [
        {
          slug: 'spring-drop',
          title: 'Spring Drop',
          hue: 'magenta',
          icon: 'heart-filled',
          _type: 'bundle',
          authorId: '',
          _id: '',
          _createdAt: '',
          _updatedAt: '',
          _rev: '',
        },
      ],
    }))

    const wrapper = await createWrapper()
    render(<DocumentPerspectiveMenu documentId="spring-drop.document-id" />, {wrapper})

    expect(screen.getByTestId('button-document-release')).toBeInTheDocument()
  })

  it('should not render the bundle badge if the document does not exist in the bundle', async () => {
    // Dummy Getters
    mockGetBundleSlug.mockReturnValue('no-bundle')

    const wrapper = await createWrapper()
    render(<DocumentPerspectiveMenu documentId="document-id" />, {wrapper})

    expect(screen.queryByTestId('button-document-release')).toBeNull()
  })

  it('should navigate to the release intent when the bundle badge is clicked', async () => {
    // Dummy Getters
    mockGetBundleSlug.mockReturnValue('spring-drop')

    mockUseDocumentPerspective.mockImplementationOnce(() => ({
      data: [
        {
          slug: 'spring-drop',
          title: 'Spring Drop',
          hue: 'magenta',
          icon: 'heart-filled',
          _type: 'bundle',
          authorId: '',
          _id: '',
          _createdAt: '',
          _updatedAt: '',
          _rev: '',
        },
      ],
    }))

    const wrapper = await createWrapper()
    render(<DocumentPerspectiveMenu documentId="spring-drop.document-1" />, {wrapper})

    expect(screen.queryByTestId('button-document-release')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('button-document-release'))

    expect(navigateIntent).toHaveBeenCalledTimes(1)
    expect(navigateIntent).toHaveBeenCalledWith('release', {slug: 'spring-drop'})
  })
})
