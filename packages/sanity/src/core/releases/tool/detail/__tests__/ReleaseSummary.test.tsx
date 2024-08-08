import {beforeEach, describe, expect, it, jest} from '@jest/globals'
import {fireEvent, render, screen, within} from '@testing-library/react'
import {type BundleDocument, defineType} from 'sanity'
import {route, RouterProvider} from 'sanity/router'

import {getAllByDataUi, getByDataUi} from '../../../../../../test/setup/customQueries'
import {createWrapper} from '../../../../../../test/testUtils/createWrapper'
import {type DocumentHistory} from '../documentTable/useReleaseHistory'
import {ReleaseSummary, type ReleaseSummaryProps} from '../ReleaseSummary'
import {type DocumentInBundleResult} from '../useBundleDocuments'

jest.mock('../../../../studio/addonDataset/useAddonDataset', () => ({
  useAddonDataset: jest.fn().mockReturnValue({client: {}}),
}))

jest.mock('../../../../store', () => ({
  ...(jest.requireActual('../../../../store') || {}),
  useUser: jest.fn().mockReturnValue([{}]),
}))

jest.mock('../../../../user-color', () => ({
  useUserColor: jest.fn().mockReturnValue('red'),
}))

const timeNow = new Date()

const releaseDocuments: DocumentInBundleResult[] = [
  {
    document: {
      _id: '123',
      _type: 'document',
      // 3 days ago
      _createdAt: new Date(timeNow.getTime() - 24 * 60 * 60 * 1000 * 3).toISOString(),
      // 2 days ago
      _updatedAt: new Date(timeNow.getTime() - 24 * 60 * 60 * 1000 * 2).toISOString(),
      _version: {},
      _rev: 'abc',
      title: 'First document',
    },
    previewValues: {
      values: {
        title: 'First document',
      },
      isLoading: false,
    },
    validation: {
      hasError: false,
      isValidating: true,
      validation: [],
    },
  },
  {
    document: {
      _id: '456',
      _type: 'document',
      // 24 hrs ago
      _createdAt: new Date(timeNow.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      // 12 hrs ago
      _updatedAt: new Date(timeNow.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      _version: {},
      _rev: 'abc',
      title: 'Second document',
    },
    previewValues: {
      values: {
        title: 'Second document',
      },
      isLoading: false,
    },
    validation: {
      hasError: false,
      isValidating: true,
      validation: [],
    },
  },
]

const renderTest = async (props: Partial<ReleaseSummaryProps>) => {
  const wrapper = await createWrapper({
    config: {
      projectId: 'test',
      dataset: 'test',
      name: 'default',
      schema: {
        types: [
          defineType({
            type: 'document' as const,
            name: 'test',
            title: 'Test',
            fields: [
              {
                type: 'string',
                name: 'title',
                title: 'Title',
              },
            ],
          }),
        ],
      },
    },
  })

  return render(
    <RouterProvider
      state={{}}
      onNavigate={jest.fn()}
      router={route.create('/test', [route.intents('/intent')])}
    >
      <ReleaseSummary
        scrollContainerRef={{current: null}}
        documents={releaseDocuments}
        documentsHistory={{
          '123': {
            createdBy: 'created-author-id-1',
            lastEditedBy: 'edited-author-id-1',
          } as DocumentHistory,
          '456': {
            createdBy: 'created-author-id-2',
            editors: ['edited-author-id-1', 'edited-author-id-2'],
          } as DocumentHistory,
        }}
        collaborators={['author-id', 'collaborator-id']}
        release={
          {
            title: 'Release title',
            description: 'Release description',
            _createdAt: timeNow.toISOString(),
            authorId: 'author-id',
          } as BundleDocument
        }
        {...props}
      />
    </RouterProvider>,
    {
      wrapper,
    },
  )
}

describe('ReleaseSummary', () => {
  beforeEach(async () => {
    jest.clearAllMocks()

    await renderTest({})
  })

  it('lists the release title and description', () => {
    screen.getByText('Release title')
    screen.getByText('Release description')
  })

  it('shows the number of documents in release', () => {
    screen.getByText('2 documents')
  })

  it('shows the creator and date of release', () => {
    within(screen.getByTestId('summary')).getByText('just now')
  })

  it('shows whether release has been published', () => {
    screen.getByText('Not published')
  })

  it('shows a list of collaborators on release', () => {
    const collaborators = getByDataUi(screen.getByTestId('summary'), 'AvatarStack')
    expect(collaborators.childNodes).toHaveLength(2)
  })

  describe('documents table', () => {
    it('shows list of all documents in release', () => {
      const documents = screen.getAllByTestId('table-row')

      expect(documents).toHaveLength(2)

      const [firstDocument, secondDocument] = documents

      // first document
      const [previewCellFirst, createdCellFirst, editedCellFirst] =
        within(firstDocument).getAllByRole('cell')
      within(previewCellFirst).getByText('First document')
      within(createdCellFirst).getByText('3 days ago')
      getByDataUi(createdCellFirst, 'Avatar')
      within(editedCellFirst).getByText('2 days ago')
      getByDataUi(editedCellFirst, 'Avatar')

      // second document
      const [
        previewCellSecond,
        createdCellSecond,
        editedCellSecond,
        publishedCellSecond,
        collaboratorsCellSecond,
      ] = within(secondDocument).getAllByRole('cell')
      within(previewCellSecond).getByText('Second document')
      within(createdCellSecond).getByText('yesterday')
      within(editedCellSecond).getByText('12 hr. ago')
      const collaborators = getByDataUi(collaboratorsCellSecond, 'AvatarStack')
      expect(getAllByDataUi(collaborators, 'Avatar')).toHaveLength(2)
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

      fireEvent.click(within(screen.getByRole('table')).getByText('Created'))

      const [sortedCreatedAscFirstDocument, sortedCreatedAscSecondDocument] =
        screen.getAllByTestId('table-row')

      within(sortedCreatedAscFirstDocument).getByText('Second document')
      within(sortedCreatedAscSecondDocument).getByText('First document')

      fireEvent.click(within(screen.getByRole('table')).getByText('Edited'))
      fireEvent.click(within(screen.getByRole('table')).getByText('Edited'))

      const [sortedEditedDescFirstDocument, sortedEditedDescSecondDocument] =
        screen.getAllByTestId('table-row')

      within(sortedEditedDescFirstDocument).getByText('First document')
      within(sortedEditedDescSecondDocument).getByText('Second document')
    })

    it('allows for searching documents', () => {
      fireEvent.change(screen.getByPlaceholderText('Search documents'), {target: {value: 'Second'}})

      const [searchedFirstDocument] = screen.getAllByTestId('table-row')

      within(searchedFirstDocument).getByText('Second document')
    })
  })
})
