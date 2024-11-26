import {act, fireEvent, render, screen, within} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {getByDataUi} from '../../../../../../test/setup/customQueries'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {DefaultPreview} from '../../../../components/previews/general/DefaultPreview'
import {
  activeASAPRelease,
  archivedScheduledRelease,
  scheduledRelease,
} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {ReleaseSummary, type ReleaseSummaryProps} from '../ReleaseSummary'
import {type DocumentInRelease} from '../useBundleDocuments'
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

vi.mock('../../../../studio/components/navbar/search/components/SearchPopover')

vi.mock('../../../../preview/components/_previewComponents', async () => {
  return {
    _previewComponents: {
      default: vi.fn((arg) => <DefaultPreview {...arg} />),
    },
  }
})

const releaseDocuments: DocumentInRelease[] = [
  {
    ...documentsInRelease,
    memoKey: '123',
    document: {
      ...documentsInRelease.document,
      title: 'First document',
      _id: '123',
      _rev: 'abc',
    },
    previewValues: {
      ...documentsInRelease.previewValues,
      values: {title: 'First document'},
    },
  },
  {
    ...documentsInRelease,
    memoKey: '456',
    document: {
      ...documentsInRelease.document,
      _updatedAt: new Date().toISOString(),
      _id: '456',
      _rev: 'abc',
      title: 'Second document',
    },
    previewValues: {
      ...documentsInRelease.previewValues,
      values: {title: 'Second document'},
    },
  },
]

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
      <ReleaseSummary
        scrollContainerRef={{current: null}}
        documents={releaseDocuments}
        documentsHistory={{
          '123': {
            createdBy: 'created-author-id-1',
            lastEditedBy: 'edited-author-id-1',
            editors: ['edited-author-id-1'],
            history: [
              {
                id: '123',
                timestamp: '2024-11-04T07:53:25Z',
                author: 'pJ61yWhkD',
                documentIDs: ['versions.abc.123'],
                effects: {
                  'versions.abc.123': {
                    apply: [
                      0,
                      {
                        _createdAt: '2024-11-04T07:53:25Z',
                        _id: 'versions.abc.123',
                        _type: 'book',
                        _updatedAt: '2024-11-04T07:53:25Z',
                        address: {
                          city: 'Stockholm',
                          country: 'Sweden',
                        },
                        publishedAt: '2020-02-03T21:36:34.980Z',
                        title: 'sdfsadfadsf sdf',
                        translations: {
                          no: '0',
                          se: '0',
                        },
                      },
                    ],
                    revert: [0, null],
                  },
                },
              },
            ],
          },
          '456': {
            createdBy: 'created-author-id-2',
            lastEditedBy: 'edited-author-id-2',
            editors: ['edited-author-id-1', 'edited-author-id-2'],
            history: [
              {
                id: '456',
                timestamp: '2024-11-04T07:53:25Z',
                author: 'pJ61yWhkD',
                documentIDs: ['versions.abc.456'],
                effects: {
                  'versions.abc.456': {
                    apply: [
                      0,
                      {
                        _createdAt: '2024-11-04T07:53:25Z',
                        _id: 'versions.abc.456',
                        _type: 'book',
                        _updatedAt: '2024-11-04T07:53:25Z',
                        address: {
                          city: 'Stockholm',
                          country: 'Sweden',
                        },
                        publishedAt: '2020-02-03T21:36:34.980Z',
                        title: 'sdfsadfadsf sdf',
                        translations: {
                          no: '0',
                          se: '0',
                        },
                      },
                    ],
                    revert: [0, null],
                  },
                },
              },
            ],
          },
        }}
        release={activeASAPRelease}
        {...props}
      />
    </RouterProvider>,
    {
      wrapper,
    },
  )
}

describe('ReleaseSummary', () => {
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
})
