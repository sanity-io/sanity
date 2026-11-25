import {type ReleaseState} from '@sanity/client'
import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useScheduledDraftDocument} from '../../../../../singleDocRelease/hooks/useScheduledDraftDocument'
import {activeCardinalityOneRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {ScheduledDraftDocumentPreview} from '../../columnCells/ScheduledDraftDocumentPreview'
import {type TableRelease} from '../../ReleasesOverview'

const HISTORY_UNAVAILABLE_TOOLTIP =
  'The history of this document is not available anymore due to retention policy, the published document is not affected'

const publishedDocumentTypes = vi.hoisted(() => new Map<string, string>())

// The store is one object for the life of a studio, which the cell's memoized observables rely on
const documentPreviewStore = vi.hoisted(() => ({
  observeDocumentTypeFromId: (id: string) => of(publishedDocumentTypes.get(id)),
  observeForPreview: () => of({snapshot: {title: 'Published article'}}),
}))

vi.mock('../../../../../singleDocRelease/hooks/useScheduledDraftDocument', () => ({
  useScheduledDraftDocument: vi.fn(),
}))

vi.mock('../../../../../store/datastores', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentPreviewStore: () => documentPreviewStore,
}))

const mockUseScheduledDraftDocument = vi.mocked(useScheduledDraftDocument)

function mockDocumentsResult({
  loading = false,
  error = null,
}: {
  loading?: boolean
  error?: Error | null
}) {
  mockUseScheduledDraftDocument.mockReturnValue({
    firstDocument: undefined,
    firstDocumentPreview: undefined,
    firstDocumentValidation: undefined,
    documentsCount: 0,
    loading,
    error,
    previewLoading: false,
  })
}

function terminalScheduledDraft(state: ReleaseState): TableRelease {
  return {
    ...activeCardinalityOneRelease,
    state,
    finalDocumentStates: [{id: 'versions.rCardinalityOne.article-1'}],
  }
}

async function renderCell(release: TableRelease) {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
    config: {
      schema: {
        types: [
          defineType({
            name: 'article',
            type: 'document',
            fields: [{name: 'title', type: 'string'}],
          }),
        ],
      },
    },
  })
  return render(
    <ScheduledDraftDocumentPreview
      datum={release}
      cellProps={{id: 'documentPreview', style: {}}}
      sorting={false}
    />,
    {wrapper},
  )
}

describe('ScheduledDraftDocumentPreview', () => {
  beforeEach(() => {
    publishedDocumentTypes.clear()
  })

  it.each<ReleaseState>(['published', 'archived'])(
    'previews and links to the published document of a %s scheduled draft whose history has been removed',
    async (state) => {
      publishedDocumentTypes.set('article-1', 'article')
      mockDocumentsResult({})

      await renderCell(terminalScheduledDraft(state))

      const link = await screen.findByTestId('scheduled-draft-published-document-link')
      await waitFor(() => expect(link).toHaveTextContent('Published article'))
      expect(link).toHaveAttribute('href', expect.stringContaining('id=article-1;type=article'))
      expect(link).toHaveAttribute('href', expect.stringContaining('perspective=published'))
      expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    },
  )

  it('explains in a tooltip that the history has been removed by retention', async () => {
    publishedDocumentTypes.set('article-1', 'article')
    mockDocumentsResult({})

    await renderCell(terminalScheduledDraft('published'))

    await userEvent.hover(screen.getByTestId('scheduled-draft-history-unavailable'))
    await waitFor(() => expect(screen.getByText(HISTORY_UNAVAILABLE_TOOLTIP)).toBeVisible())
  })

  it('says there is no published document when there is none to preview', async () => {
    mockDocumentsResult({})

    await renderCell(terminalScheduledDraft('archived'))

    expect(await screen.findByText('No published document')).toBeInTheDocument()
    expect(screen.queryByTestId('scheduled-draft-published-document-link')).toBeNull()
    expect(screen.getByTestId('scheduled-draft-history-unavailable')).toBeInTheDocument()
  })

  it('keeps the skeleton while the document is still loading from history', async () => {
    publishedDocumentTypes.set('article-1', 'article')
    mockDocumentsResult({loading: true})

    await renderCell(terminalScheduledDraft('published'))

    expect(document.querySelector('[data-ui="Skeleton"]')).not.toBeNull()
    expect(screen.queryByTestId('scheduled-draft-history-unavailable')).toBeNull()
  })

  it('does not blame retention when reading the history failed', async () => {
    publishedDocumentTypes.set('article-1', 'article')
    mockDocumentsResult({error: new Error('Too many requests')})

    await renderCell(terminalScheduledDraft('published'))

    expect(document.querySelector('[data-ui="Skeleton"]')).not.toBeNull()
    expect(screen.queryByTestId('scheduled-draft-history-unavailable')).toBeNull()
  })
})
