import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {
  BundleBadge,
  type BundleDocument,
  getAllVersionsOfDocument,
  type SanityClient,
  useClient,
  usePerspective,
} from 'sanity'
import {useRouter} from 'sanity/router'

import {createMockSanityClient} from '../../../../../../../test/mocks/mockSanityClient'
import {getVersionName} from '../../../../../../core/bundles/util/dummyGetters'
import {createWrapper} from '../../../../../../core/bundles/util/tests/createWrapper'
import {useBundles} from '../../../../../../core/store/bundles/useBundles'
import {DocumentPerspectiveMenu} from './DocumentPerspectiveMenu'

type GetVersionNameType = (documentId: string) => string
type GetAllVersionsOfDocumentType = (
  bundles: BundleDocument[] | null,
  client: SanityClient,
  documentId: string,
) => Promise<Partial<BundleDocument>[]>

jest.mock('sanity', () => ({
  useClient: jest.fn(),
  usePerspective: jest.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspective: jest.fn(),
  }),
  getAllVersionsOfDocument: jest.fn(() =>
    Promise.resolve([
      {
        name: 'spring-drop',
        title: 'Spring Drop',
        hue: 'magenta',
        icon: 'heart-filled',
      },
    ]),
  ),
  BundleBadge: jest.fn(),
}))

jest.mock('sanity/router', () => ({
  useRouter: jest.fn().mockReturnValue({
    navigateIntent: jest.fn(),
  }),
  route: {
    create: jest.fn(),
  },
  IntentLink: jest.fn(),
}))

jest.mock('../../../../../../core/store/bundles/useBundles', () => ({
  useBundles: jest.fn(),
}))

jest.mock('../../../../../../core/bundles/util/dummyGetters', () => ({
  getVersionName: jest.fn(() => ''),
}))

const mockUseClient = useClient as jest.Mock<typeof useClient>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const navigateIntent = mockUseRouter().navigateIntent as jest.Mock

const mockUseBundles = useBundles as jest.Mock<typeof useBundles>
const mockUsePerspective = usePerspective as jest.Mock
const mockGetVersionName = getVersionName as jest.MockedFunction<GetVersionNameType>
const mockGetAllVersionsOfDocument =
  getAllVersionsOfDocument as jest.MockedFunction<GetAllVersionsOfDocumentType>
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
    name: 'spring-drop',
    hue: 'magenta',
    _createdAt: '2024-07-02T11:37:51Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()

    const client = createMockSanityClient() as unknown as SanityClient
    mockUseClient.mockReturnValue(client)

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
  })

  it('should render the bundle badge if the document exists in the global bundle', async () => {
    // Dummy Getters
    mockGetVersionName.mockReturnValue('spring-drop')

    mockGetAllVersionsOfDocument.mockImplementationOnce(
      (): Promise<any> =>
        Promise.resolve([
          {
            name: 'spring-drop',
            title: 'Spring Drop',
            hue: 'magenta',
            icon: 'heart-filled',
          },
        ]),
    )

    const wrapper = await createWrapper()
    render(<DocumentPerspectiveMenu documentId="spring-drop.document-id" />, {wrapper})

    expect(screen.getByTestId('button-document-release')).toBeInTheDocument()
  })

  it('should not render the bundle badge if the document does not exist in the bundle', async () => {
    // Dummy Getters
    mockGetVersionName.mockReturnValue('no-bundle')

    const wrapper = await createWrapper()
    render(<DocumentPerspectiveMenu documentId="document-id" />, {wrapper})

    expect(screen.queryByTestId('button-document-release')).toBeNull()
  })

  it('should navigate to the release intent when the bundle badge is clicked', async () => {
    // Dummy Getters
    mockGetVersionName.mockReturnValue('spring-drop')

    mockGetAllVersionsOfDocument.mockImplementationOnce(
      (): Promise<any> =>
        Promise.resolve([
          {
            name: 'spring-drop',
            title: 'Spring Drop',
            hue: 'magenta',
            icon: 'heart-filled',
          },
        ]),
    )

    const wrapper = await createWrapper()
    render(<DocumentPerspectiveMenu documentId="spring-drop.document-1" />, {wrapper})

    expect(screen.queryByTestId('button-document-release')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('button-document-release'))

    expect(navigateIntent).toHaveBeenCalledTimes(1)
    expect(navigateIntent).toHaveBeenCalledWith('release', {name: 'spring-drop'})
  })
})
