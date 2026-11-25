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
import {ScheduledDraftMetadataCell} from '../../columnCells/ScheduledDraftMetadataCell'
import {type TableRelease} from '../../ReleasesOverview'

const HISTORY_UNAVAILABLE_TOOLTIP =
  'The history of this document is not available anymore due to retention policy, the published document is not affected'

const publishedDocumentTypes = vi.hoisted(() => new Map<string, string>())

// The store is one object for the life of a studio, which the cells' memoized observables rely on
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

function scheduledDraft(
  state: ReleaseState,
  finalDocumentIds: string[] | null = ['versions.rCardinalityOne.article-1'],
): TableRelease {
  return {
    ...activeCardinalityOneRelease,
    state,
    ...(finalDocumentIds ? {finalDocumentStates: finalDocumentIds.map((id) => ({id}))} : {}),
  }
}

async function getWrapper() {
  return createTestProvider({
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
}

async function renderDocumentCell(release: TableRelease) {
  return render(
    <ScheduledDraftDocumentPreview
      datum={release}
      cellProps={{id: 'documentPreview', style: {}}}
      sorting={false}
    />,
    {wrapper: await getWrapper()},
  )
}

async function renderMetadataCell(release: TableRelease) {
  return render(
    <ScheduledDraftMetadataCell
      datum={release}
      cellProps={{id: 'publishAt', style: {}}}
      sorting={false}
    />,
    {wrapper: await getWrapper()},
  )
}

describe('scheduled draft rows without a document', () => {
  beforeEach(() => {
    publishedDocumentTypes.clear()
  })

  describe('document column', () => {
    it.each<ReleaseState>(['published', 'archived'])(
      'previews and links to the published document of a %s scheduled draft whose history has been removed',
      async (state) => {
        publishedDocumentTypes.set('article-1', 'article')
        mockDocumentsResult({})

        await renderDocumentCell(scheduledDraft(state))

        const link = await screen.findByTestId('scheduled-draft-published-document-link')
        await waitFor(() => expect(link).toHaveTextContent('Published article'))
        expect(link).toHaveAttribute('href', expect.stringContaining('id=article-1;type=article'))
        expect(link).toHaveAttribute('href', expect.stringContaining('perspective=published'))
        expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
        expect(screen.queryByTestId('scheduled-draft-history-unavailable')).toBeNull()
      },
    )

    it('shows the id of the document when there is no published document to preview', async () => {
      mockDocumentsResult({})

      await renderDocumentCell(scheduledDraft('archived'))

      expect(await screen.findByText('No published document')).toBeInTheDocument()
      expect(screen.getByText('article-1')).toBeInTheDocument()
      expect(screen.queryByTestId('scheduled-draft-published-document-link')).toBeNull()
    })

    it('says there is no document when an active scheduled draft has none', async () => {
      mockDocumentsResult({})

      await renderDocumentCell(scheduledDraft('active', null))

      expect(await screen.findByText('No document in this release')).toBeInTheDocument()
      expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    })

    it('says the document could not be loaded when reading it failed', async () => {
      publishedDocumentTypes.set('article-1', 'article')
      mockDocumentsResult({error: new Error('Too many requests')})

      await renderDocumentCell(scheduledDraft('published'))

      expect(await screen.findByText('The document could not be loaded')).toBeInTheDocument()
      expect(screen.getByText('article-1')).toBeInTheDocument()
      expect(document.querySelector('[data-ui="Skeleton"]')).toBeNull()
    })

    it('keeps the skeleton while the document is still loading', async () => {
      publishedDocumentTypes.set('article-1', 'article')
      mockDocumentsResult({loading: true})

      await renderDocumentCell(scheduledDraft('published'))

      expect(document.querySelector('[data-ui="Skeleton"]')).not.toBeNull()
      expect(screen.queryByTestId('scheduled-draft-published-document-link')).toBeNull()
    })
  })

  describe('publish date column', () => {
    it('explains in place of the avatar that the history has been removed by retention', async () => {
      mockDocumentsResult({})

      await renderMetadataCell(scheduledDraft('published'))

      const infoIcon = await screen.findByTestId('scheduled-draft-history-unavailable')
      await userEvent.hover(infoIcon)
      await waitFor(() => expect(screen.getByText(HISTORY_UNAVAILABLE_TOOLTIP)).toBeVisible())
    })

    it.each([
      ['has no document', scheduledDraft('active', null), null],
      ['could not be loaded', scheduledDraft('published'), new Error('Too many requests')],
      ['is still loading', scheduledDraft('published'), null, true],
    ])('shows no info icon when the document %s', async (_, release, error, loading = false) => {
      mockDocumentsResult({error, loading})

      await renderMetadataCell(release)

      await waitFor(() => expect(document.querySelector('[data-ui="AvatarSkeleton"]')).toBeNull())
      expect(screen.queryByTestId('scheduled-draft-history-unavailable')).toBeNull()
    })
  })
})
