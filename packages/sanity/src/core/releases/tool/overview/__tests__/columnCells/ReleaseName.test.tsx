import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  activeCardinalityOneRelease,
} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {type InjectedTableProps} from '../../../components/Table/types'
import {ReleaseNameCell} from '../../columnCells/ReleaseName'
import {type TableRelease} from '../../ReleasesOverview'

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

const onNavigate = vi.fn()
const intentRouter = route.create('/', [route.intents('/intent')])

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

  render(
    <RouterProvider onNavigate={onNavigate} router={intentRouter} state={{}}>
      <ReleaseNameCell cellProps={{} as InjectedTableProps} datum={release} sorting={false} />
    </RouterProvider>,
    {wrapper},
  )

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

  it('links the release title to its detail page', async () => {
    await renderTest(activeASAPRelease)

    expect(screen.getByRole('link', {name: 'active asap Release'})).toHaveAttribute(
      'href',
      '/intent/release/id=rASAP/',
    )
  })

  it('navigates to the release detail page on click', async () => {
    await renderTest(activeASAPRelease)

    await userEvent.click(screen.getByRole('link', {name: 'active asap Release'}))

    expect(onNavigate).toHaveBeenCalledWith({
      path: '/intent/release/id=rASAP/',
      replace: false,
    })
  })

  it('does not link a deleted release', async () => {
    await renderTest({...activeASAPRelease, isDeleted: true})

    expect(screen.getAllByText('active asap Release').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', {name: 'active asap Release'})).not.toBeInTheDocument()
  })

  it('links a single-document row to its release detail page', async () => {
    await renderTest(activeCardinalityOneRelease as TableRelease)

    expect(screen.getByRole('link', {name: /Cardinality one doc title/})).toHaveAttribute(
      'href',
      '/intent/release/id=rCardinalityOne/',
    )
  })
})
