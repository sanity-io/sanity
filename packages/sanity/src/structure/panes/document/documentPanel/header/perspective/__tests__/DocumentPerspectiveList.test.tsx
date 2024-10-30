import {render, screen} from '@testing-library/react'
import {type HTMLProps} from 'react'
import {type ReleaseDocument, usePerspective, useReleases} from 'sanity'
import {type IntentLinkProps} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPerspectiveList} from '../DocumentPerspectiveList'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  usePerspective: vi.fn().mockReturnValue({
    currentGlobalBundle: {},
    setPerspective: vi.fn(),
  }),
  useReleases: vi.fn().mockReturnValue({data: [], loading: false}),
  versionDocumentExists: vi.fn().mockReturnValue(true),
  Translate: vi.fn(),
  /**
   * @todo
   * is there no better way of mocking this??  */
  useTranslation: vi.fn().mockReturnValue({
    t: vi.fn().mockImplementation((key: string) => {
      const translations: Record<string, string> = {
        'release.chip.published': 'Published',
        'release.chip.draft': 'Draft',
      }
      return translations[key]
    }),
  }),
}))

vi.mock('sanity/router', () => {
  return {
    useRouter: vi.fn().mockReturnValue({
      stickyParams: {},
      perspectiveState: {},
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

const mockUsePerspective = usePerspective as Mock<typeof usePerspective>
const mockUseReleases = useReleases as Mock<typeof useReleases>

describe('DocumentPerspectiveList', () => {
  const mockCurrent: ReleaseDocument = {
    _updatedAt: '2024-07-12T10:39:32Z',
    createdBy: 'pzAhBTkNX',
    _id: '_.releases.spring-drop',
    _type: 'system.release',
    metadata: {
      description: 'What a spring drop, allergies galore 🌸',
      releaseType: 'asap',
      title: 'Spring Drop',
    },
    _createdAt: '2024-07-02T11:37:51Z',
    name: 'spring-drop',
    state: 'scheduled',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUsePerspective.mockReturnValue({
      currentGlobalBundle: mockCurrent,
      setPerspective: vi.fn(),
    })

    mockUseDocumentPane.mockReturnValue({
      documentVersions: [],
    })
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
      data: [
        {
          _id: '_.releases.spring-drop',
          _type: 'system.release',
          createdBy: '',
          state: 'active',
          name: 'spring-drop',
          _createdAt: '',
          _updatedAt: '',
          metadata: {
            releaseType: 'asap',
            title: 'Spring Drop',
          },
        },
      ],
    })
    mockUseDocumentPane.mockReturnValue({
      documentVersions: [
        {
          _id: '_.releases.spring-drop',
          _type: 'system.release',
          createdBy: '',
          state: 'active',
          name: 'spring-drop',
          _createdAt: '',
          _updatedAt: '',
          metadata: {
            releaseType: 'asap',
            title: 'Spring Drop',
          },
        },
      ],
      displayed: {
        _id: 'versions.spring-drop.KJAiOpAH5r6P3dWt1df9ql',
      },
    })

    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveList />, {wrapper})

    expect(screen.getByRole('button', {name: 'Spring Drop'})).toBeInTheDocument()
  })
})
