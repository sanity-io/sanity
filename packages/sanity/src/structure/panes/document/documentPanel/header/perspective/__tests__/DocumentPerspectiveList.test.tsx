import {render, screen} from '@testing-library/react'
import {type HTMLProps} from 'react'
import {useReleases} from 'sanity'
import {type IntentLinkProps} from 'sanity/router'
import {beforeEach, describe, expect, it, type Mock, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../../../../../core/releases/__fixtures__/release.fixture'
import {useReleasesMockReturn} from '../../../../../../../core/releases/store/__tests__/__mocks/useReleases.mock'
import {type DocumentPaneContextValue} from '../../../../DocumentPaneContext'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DocumentPerspectiveList} from '../DocumentPerspectiveList'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  useReleases: vi.fn(() => useReleasesMockReturn),
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

describe('DocumentPerspectiveList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleases.mockReturnValue(useReleasesMockReturn)

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
      ...useReleasesMockReturn,
      data: [activeASAPRelease],
      archivedReleases: [],
    })
    mockUseDocumentPane.mockReturnValue({
      documentVersions: [activeASAPRelease],
      displayed: {
        _id: activeASAPRelease._id,
      },
    })

    const wrapper = await createTestProvider()
    render(<DocumentPerspectiveList />, {wrapper})

    expect(screen.getByRole('button', {name: activeASAPRelease.metadata.title})).toBeInTheDocument()
  })

  describe('disabled chips', () => {
    it('should disable the "Published" chip when there is no published document', async () => {
      mockUseDocumentPane.mockReturnValue({
        documentVersions: [activeASAPRelease],
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
      })

      const wrapper = await createTestProvider()
      render(<DocumentPerspectiveList />, {wrapper})

      expect(screen.getByRole('button', {name: 'Published'})).toBeDisabled()
    })
  })
})
