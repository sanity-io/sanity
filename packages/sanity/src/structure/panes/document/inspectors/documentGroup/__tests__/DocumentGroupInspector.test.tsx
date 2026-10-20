import {render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentType} from 'react'
import {EMPTY} from 'rxjs'
import {DocumentGroupInventory, type DocumentGroupInventoryProps, type SanityDocument} from 'sanity'
import {test as baseTest, describe, expect, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useDocumentPerspectiveList} from '../../../../../hooks/useDocumentPerspectiveList'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInspector} from '../DocumentGroupInspector'

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal()),
  DocumentGroupInventory: vi.fn(() => <div data-testid="document-group-inventory" />),
}))

vi.mock('../../../useDocumentPane', () => ({
  useDocumentPane: vi.fn(),
}))

vi.mock('../../../../../hooks/useDocumentPerspectiveList', () => ({
  useDocumentPerspectiveList: vi.fn(() => ({})),
}))

vi.mock('../../../../../components/confirmDeleteDialog/useReferringDocuments', () => ({
  referringDocuments: vi.fn(() => EMPTY),
}))

const mockUseDocumentPane = useDocumentPane as MockedFunction<typeof useDocumentPane>
const mockUseDocumentPerspectiveList = useDocumentPerspectiveList as MockedFunction<
  typeof useDocumentPerspectiveList
>
const mockDocumentGroupInventory = DocumentGroupInventory as MockedFunction<
  ComponentType<DocumentGroupInventoryProps>
>

function buildDocumentPaneValue({
  displayed = {_id: 'drafts.doc-123', _type: 'author'},
  version,
}: {
  displayed?: DocumentPaneContextValue['displayed']
  version?: SanityDocument
} = {}): DocumentPaneContextValue {
  return {
    displayed,
    editState: {
      id: 'doc-123',
      type: 'author',
      transactionSyncLock: {enabled: false},
      liveEdit: false,
      ready: true,
      draft: {_id: 'drafts.doc-123', _type: 'author'},
      published: {_id: 'doc-123', _type: 'author'},
      version,
    },
  } as DocumentPaneContextValue
}

function lastInventoryProps(): DocumentGroupInventoryProps {
  const props = mockDocumentGroupInventory.mock.lastCall?.[0]

  if (typeof props === 'undefined') {
    throw new Error('Expected `DocumentGroupInventory` to have rendered')
  }

  return props
}

const test = baseTest
  .extend('TestProvider', {scope: 'file'}, () =>
    createTestProvider({
      resources: [structureUsEnglishLocaleBundle],
      config: {
        beta: {
          documentGroupInventory: {enabled: true},
        },
      },
    }),
  )
  .extend('documentPaneValue', () => buildDocumentPaneValue())
  .extend('renderInspector', ({TestProvider, documentPaneValue}) => {
    mockUseDocumentPane.mockReturnValue(documentPaneValue)
    mockUseDocumentPerspectiveList.mockReturnValue({} as never)

    // The test provider renders a spinner until the locale resources have loaded.
    return async () => {
      const onClose = vi.fn()

      render(
        <DocumentGroupInspector documentId="doc-123" documentType="author" onClose={onClose} />,
        {wrapper: TestProvider},
      )

      await screen.findByRole('heading', {name: 'Manage versions'})

      return {onClose}
    }
  })

describe('DocumentGroupInspector', () => {
  test('renders the inspector header and closes the inspector from it', async ({
    renderInspector,
  }) => {
    const {onClose} = await renderInspector()

    await userEvent.click(screen.getByRole('button', {name: 'Close panel'}))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('renders the inventory in manage mode for the displayed document', async ({
    renderInspector,
  }) => {
    await renderInspector()

    expect(screen.getByTestId('document-group-inventory')).toBeInTheDocument()
    expect(lastInventoryProps()).toMatchObject({
      mode: 'manage',
      documentId: 'drafts.doc-123',
      documentType: 'author',
    })
  })

  describe('when the displayed document is going to unpublish in a release', () => {
    test.override('documentPaneValue', () =>
      buildDocumentPaneValue({
        displayed: {_id: 'doc-123', _type: 'author'},
        version: {
          _id: 'versions.release-1.doc-123',
          _type: 'author',
          _createdAt: '2026-10-20T00:00:00Z',
          _updatedAt: '2026-10-20T00:00:00Z',
          _rev: 'rev-1',
          _system: {delete: true},
        },
      }),
    )

    test('targets the version that is going to unpublish rather than the displayed document', async ({
      renderInspector,
    }) => {
      await renderInspector()

      expect(lastInventoryProps().documentId).toBe('versions.release-1.doc-123')
    })
  })

  describe('when the displayed document is not known yet', () => {
    test.override('documentPaneValue', () => ({
      ...buildDocumentPaneValue(),
      displayed: null,
      editState: null,
    }))

    test('does not render the inventory until the displayed document is known', async ({
      renderInspector,
    }) => {
      await renderInspector()

      expect(screen.queryByTestId('document-group-inventory')).not.toBeInTheDocument()
    })
  })
})
