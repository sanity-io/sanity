import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {
  cloneElement,
  type FC,
  type PropsWithChildren,
  type ReactElement,
  type RefObject,
  useState,
} from 'react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getByDataUi} from '../../../../../../test/setup/customQueries'
import {setupVirtualListEnv} from '../../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {
  activeASAPRelease,
  archivedScheduledRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseSummary, type ReleaseSummaryProps} from '../ReleaseSummary'
import {
  documentsInRelease,
  useBundleDocumentsMockReturnWithResults,
} from './__mocks__/useBundleDocuments.mock'

vi.mock('../../../index', () => ({
  useDocumentPresence: vi.fn().mockReturnValue({
    user: '',
    path: '',
    sessionId: '',
    lastActiveAt: '',
  }),
  useDocumentPreviewStore: vi.fn().mockReturnValue({
    unstable_observeDocumentIdSet: vi.fn(() => ({
      pipe: vi.fn(),
    })),
  }),
}))

vi.mock('../useBundleDocuments', () => ({
  useBundleDocuments: vi.fn(() => useBundleDocumentsMockReturnWithResults),
}))

vi.mock('../../../../preview/components/SanityDefaultPreview', () => ({
  SanityDefaultPreview: vi.fn(({isPlaceholder, title, subtitle, status}) => (
    <div data-ui={isPlaceholder ? 'Placeholder' : 'Preview'}>
      {!isPlaceholder && title && <div>{title}</div>}
      {!isPlaceholder && subtitle && <div>{subtitle}</div>}
      {status}
    </div>
  )),
}))

vi.mock('../../components/ReleaseDocumentPreview', () => ({
  ReleaseDocumentPreview: vi.fn(({documentId}) => {
    let title = 'Untitled'

    if (documentId === '123') {
      title = 'First document'
    } else if (documentId === '456') {
      title = 'Second document'
    }

    return <div data-testid={`document-preview-${documentId}`}>{title}</div>
  }),
}))

vi.mock('../../../../studio/components/navbar/search/components/SearchPopover')

const releaseDocuments = [
  {
    ...documentsInRelease,
    memoKey: '123',
    history: undefined,
    document: {
      ...documentsInRelease.document,
      title: 'First document',
      _id: '123',
      _rev: 'abc',
      _type: 'document',
    },
  },
  {
    ...documentsInRelease,
    memoKey: '456',
    history: undefined,
    document: {
      ...documentsInRelease.document,
      _updatedAt: new Date().toISOString(),
      _id: '456',
      _rev: 'abc',
      title: 'Second document',
      _type: 'document',
    },
  },
]

const ScrollContainer: FC<PropsWithChildren> = ({children}) => {
  const [ref, setRef] = useState<HTMLDivElement | null>(null)

  return (
    <div style={{height: '400px'}} ref={setRef}>
      {cloneElement(
        children as ReactElement<{scrollContainerRef: RefObject<HTMLDivElement | null>}>,
        {scrollContainerRef: {current: ref}},
      )}
    </div>
  )
}

const renderTest = async (props: Partial<ReleaseSummaryProps>) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })

  return render(
    <RouterProvider
      state={{
        releaseId: 'activeASAPRelease',
      }}
      onNavigate={vi.fn()}
      router={route.create('/', [route.create('/:releaseId'), route.intents('/intents')])}
    >
      <ScrollContainer>
        <ReleaseSummary
          scrollContainerRef={{current: null}}
          documents={releaseDocuments}
          release={activeASAPRelease}
          {...props}
        />
      </ScrollContainer>
    </RouterProvider>,
    {
      wrapper,
    },
  )
}

describe('ReleaseSummary', () => {
  setupVirtualListEnv()

  describe('for an active release', () => {
    beforeEach(async () => {
      await renderTest({})
      await vi.waitFor(() => screen.getByTestId('document-table-card'), {
        timeout: 5000,
        interval: 500,
      })
    })

    it('shows list of all documents in release', async () => {
      const documents = screen.getAllByTestId('table-row')

      expect(documents).toHaveLength(2)
    })

    it('allows for document to be discarded', () => {
      const [firstDocumentRow] = screen.getAllByTestId('table-row')

      fireEvent.click(getByDataUi(firstDocumentRow, 'MenuButton'))
      fireEvent.click(screen.getByText('Discard version'))
    })

    it('allows for sorting of documents', () => {
      const [initialFirstDocument, initialSecondDocument] = screen.getAllByTestId('table-row')

      within(initialFirstDocument).getByText('First document')
      within(initialSecondDocument).getByText('Second document')

      fireEvent.click(within(screen.getByRole('table')).getByText('Edited'))

      const [sortedCreatedAscFirstDocument, sortedCreatedAscSecondDocument] =
        screen.getAllByTestId('table-row')

      within(sortedCreatedAscFirstDocument).getByText('Second document')
      within(sortedCreatedAscSecondDocument).getByText('First document')

      fireEvent.click(within(screen.getByRole('table')).getByText('Edited'))

      const [sortedEditedDescFirstDocument, sortedEditedDescSecondDocument] =
        screen.getAllByTestId('table-row')

      within(sortedEditedDescFirstDocument).getByText('First document')
      within(sortedEditedDescSecondDocument).getByText('Second document')
    })

    it('allows for searching documents', async () => {
      await act(() => {
        fireEvent.change(screen.getByPlaceholderText('Search documents'), {
          target: {value: 'Second'},
        })
      })

      const [searchedFirstDocument] = screen.getAllByTestId('table-row')

      within(searchedFirstDocument).getByText('Second document')
    })

    it('Allows for adding a document to an active release', () => {
      screen.getByText('Add document')
    })
  })

  describe('for an archived release', () => {
    beforeEach(async () => {
      await renderTest({release: archivedScheduledRelease})
      await vi.waitFor(() => screen.getByTestId('document-table-card'))
    })

    it('does not allow for adding documents', () => {
      expect(screen.queryByText('Add document')).toBeNull()
    })
  })

  describe('for a scheduled release', () => {
    beforeEach(async () => {
      await renderTest({release: scheduledRelease})
      await vi.waitFor(() => screen.getByTestId('document-table-card'))
    })

    it('does not allow for adding documents', () => {
      expect(screen.queryByText('Add document')).toBeNull()
    })
  })

  describe('Release Badges in the Table component', () => {
    beforeEach(async () => {
      vi.clearAllMocks()
    })

    it('should show `unpublish` if a document is scheduled for unpublishing', async () => {
      await renderTest({
        release: scheduledRelease,
        documents: [
          {
            ...releaseDocuments[0],
            document: {...releaseDocuments[0].document, willBeUnpublished: true},
          },
        ],
      })
      await vi.waitFor(() => screen.getByTestId('document-table-card'))
    })

    it('should show `change` if a document is published', async () => {
      await renderTest({
        release: scheduledRelease,
        documents: [
          {
            ...releaseDocuments[0],
            document: {
              ...releaseDocuments[0].document,
              publishedDocumentExists: true,
            },
          },
        ],
      })
      await vi.waitFor(() => screen.getByTestId('document-table-card'))

      const [firstDocumentRow] = screen.getAllByTestId('table-row')

      expect(within(firstDocumentRow).getByTestId('changed-badge-123')).toBeInTheDocument()
    })

    it('should show `add` if a document is not published and is not scheduled for unpublishing', async () => {
      await renderTest({
        release: scheduledRelease,
        documents: [
          {
            ...releaseDocuments[0],
            document: {
              ...releaseDocuments[0].document,
              publishedDocumentExists: false, // enforce these as false for the test purpose
              willBeUnpublished: false, // enforce these as false for the test purpose
            },
          },
        ],
      })
      await vi.waitFor(() => screen.getByTestId('document-table-card'))

      const [firstDocumentRow] = screen.getAllByTestId('table-row')

      expect(within(firstDocumentRow).getByTestId('added-badge-123')).toBeInTheDocument()
    })
  })
})
