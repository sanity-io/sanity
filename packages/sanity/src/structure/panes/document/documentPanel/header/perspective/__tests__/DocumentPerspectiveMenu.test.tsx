import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react'
import {type BundleDocument, usePerspective} from 'sanity'
import {useRouter} from 'sanity/router'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPerspectiveMenu} from '../DocumentPerspectiveMenu'

jest.mock('sanity', () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = jest.requireActual<typeof import('sanity')>('sanity')

  return {
    ...actual,
    usePerspective: jest.fn().mockReturnValue({
      currentGlobalBundle: {},
      setPerspective: jest.fn(),
    }),
    useTranslation: jest.fn().mockReturnValue({t: jest.fn()}),
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

jest.mock('../../../../useDocumentPane')

const mockUseDocumentPane = useDocumentPane as jest.MockedFunction<
  () => Partial<DocumentPaneContextValue>
>
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const navigateIntent = mockUseRouter().navigateIntent as jest.Mock

const mockUsePerspective = usePerspective as jest.Mock

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
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: mockCurrent,
      setPerspective: jest.fn(),
    })

    mockUseDocumentPane.mockImplementationOnce(() => ({
      documentVersions: [],
    }))
  })

  it('should render the bundle badge if the document exists in the global bundle', async () => {
    mockUseDocumentPane.mockImplementationOnce(() => ({
      documentVersions: [
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

    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveMenu documentId="spring-drop.document-id" />, {wrapper})

    expect(screen.getByTestId('button-document-release')).toBeInTheDocument()
  })

  it('should not render the bundle badge if the document does not exist in the bundle', async () => {
    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveMenu documentId="document-id" />, {wrapper})

    expect(screen.queryByTestId('button-document-release')).toBeNull()
  })

  it('should navigate to the release intent when the bundle badge is clicked', async () => {
    mockUseDocumentPane.mockImplementationOnce(() => ({
      documentVersions: [
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

    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveMenu documentId="spring-drop.document-1" />, {wrapper})

    expect(screen.queryByTestId('button-document-release')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('button-document-release'))

    expect(navigateIntent).toHaveBeenCalledTimes(1)
    expect(navigateIntent).toHaveBeenCalledWith('release', {slug: 'spring-drop'})
  })
})
