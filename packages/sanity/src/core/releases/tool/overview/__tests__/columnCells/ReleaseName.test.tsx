import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {describe, expect, it, vi} from 'vitest'

import {mockUseRouterReturn} from '../../../../../../../test/mocks/useRouter.mock'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeCardinalityOneRelease,
} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type InjectedTableProps} from '../../../components/Table/types'
import {ReleaseNameCell} from '../../columnCells/ReleaseName'
import {type TableRelease} from '../../ReleasesOverview'

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => mockUseRouterReturn,
}))

const mockFirstDocument = {
  _id: 'versions.rCardinalityOne.doc123',
  _type: 'post',
  _rev: 'docRev',
  _createdAt: '2023-10-10T08:00:00Z',
  _updatedAt: '2023-10-10T09:00:00Z',
}

vi.mock('../../../../../singleDocRelease/hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: vi.fn(() => ({
    firstDocument: mockFirstDocument,
    firstDocumentValidation: [],
    loading: false,
  })),
}))

vi.mock('../../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(({title, isPlaceholder}) => (
    <div data-ui={isPlaceholder ? 'Placeholder' : 'Preview'}>{title || 'Document preview'}</div>
  )),
}))

vi.mock('../../../../../tasks/hooks/useDocumentPreviewValues', () => ({
  useDocumentPreviewValues: vi.fn(() => ({
    isLoading: false,
    value: {title: 'Cardinality one doc title'},
  })),
}))

vi.mock('../../../../../store/presence/useDocumentPresence', () => ({
  useDocumentPresence: vi.fn(() => []),
}))

const renderTest = async (release: TableRelease) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  render(<ReleaseNameCell cellProps={{} as InjectedTableProps} datum={release} sorting={false} />, {
    wrapper,
  })

  await waitFor(() => {
    expect(screen.queryByTestId('loading-block')).not.toBeInTheDocument()
  })
}

describe('ReleaseNameCell', () => {
  it('renders the release title correctly', async () => {
    await renderTest(activeASAPRelease)

    expect(screen.getByText('active asap Release')).toBeInTheDocument()
  })

  it('renders the placeholder title for an untitled release', async () => {
    const untitledRelease = {...activeASAPRelease, metadata: {title: ''}} as TableRelease
    await renderTest(untitledRelease)

    expect(screen.getByText('Untitled release')).toBeInTheDocument()
  })

  it('navigates to the release detail page on click', async () => {
    await renderTest(activeASAPRelease)

    await userEvent.click(screen.getByText('active asap Release'))

    expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({releaseId: 'rASAP'})
  })

  it('renders the release avatar and release title for a cardinality-many release', async () => {
    await renderTest(activeASAPRelease)

    expect(screen.getByText('active asap Release')).toBeInTheDocument()
    expect(screen.queryByText('Cardinality one doc title')).not.toBeInTheDocument()
  })

  it('renders the document thumbnail/title for a cardinality-one release', async () => {
    await renderTest(activeCardinalityOneRelease as TableRelease)

    expect(screen.getByText('Cardinality one doc title')).toBeInTheDocument()
    expect(screen.queryByText('Scheduled Draft')).not.toBeInTheDocument()
  })

  it('navigates to the (cardinality-one) release detail page when clicking a single-doc row', async () => {
    await renderTest(activeCardinalityOneRelease as TableRelease)

    await userEvent.click(screen.getByText('Cardinality one doc title'))

    expect(mockUseRouterReturn.navigate).toHaveBeenCalledWith({releaseId: 'rCardinalityOne'})
  })
})
