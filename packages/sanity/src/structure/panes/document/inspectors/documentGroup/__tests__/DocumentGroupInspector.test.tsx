import {act, render, screen} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {type ComponentType, type RefAttributes, useImperativeHandle} from 'react'
import {EMPTY} from 'rxjs'
import {type SanityDocument} from 'sanity'
import {test as baseTest, describe, expect, type MockedFunction, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {useTestDocumentGroupInventoryHandle} from '../../../../../../../test/testUtils/useTestDocumentGroupInventoryHandle'
import {
  DocumentGroupInventory,
  type DocumentGroupInventoryHandle,
  type DocumentGroupInventoryProps,
} from '../../../../../../core/documentGroupInventory/components/DocumentGroupInventory'
import {useDocumentPerspectiveList} from '../../../../../hooks/useDocumentPerspectiveList'
import {structureUsEnglishLocaleBundle} from '../../../../../i18n'
import {type DocumentPaneContextValue} from '../../../DocumentPaneContext'
import {useDocumentPane} from '../../../useDocumentPane'
import {DocumentGroupInspector} from '../DocumentGroupInspector'

// The inspector imports the inventory relatively (it is an internal), so the source module is mocked
vi.mock(
  '../../../../../../core/documentGroupInventory/components/DocumentGroupInventory',
  async (importOriginal) => ({
    ...(await importOriginal()),
    DocumentGroupInventory: vi.fn(() => <div data-testid="document-group-inventory" />),
  }),
)

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
type InventoryProps = DocumentGroupInventoryProps &
  RefAttributes<DocumentGroupInventoryHandle | null>

const mockDocumentGroupInventory = DocumentGroupInventory as MockedFunction<
  ComponentType<InventoryProps>
>

// Stands in for the inventory: runs the real inventory machine and exposes it through the handle,
// without rendering the inventory itself.
function FakeDocumentGroupInventory(
  props: InventoryProps & {onHandle: (handle: DocumentGroupInventoryHandle) => void},
) {
  const {ref, onHandle} = props
  const handle = useTestDocumentGroupInventoryHandle()

  useImperativeHandle(ref, () => {
    onHandle(handle)
    return handle
  }, [handle, onHandle])

  return <div data-testid="document-group-inventory" />
}

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
    const onInventoryHandle = vi.fn<(handle: DocumentGroupInventoryHandle) => void>()

    mockUseDocumentPane.mockReturnValue(documentPaneValue)
    mockUseDocumentPerspectiveList.mockReturnValue({} as never)
    mockDocumentGroupInventory.mockImplementation(function MockDocumentGroupInventory(
      props: InventoryProps,
    ) {
      return <FakeDocumentGroupInventory {...props} onHandle={onInventoryHandle} />
    })

    function lastInventoryHandle(): DocumentGroupInventoryHandle {
      const handle = onInventoryHandle.mock.lastCall?.[0]

      if (typeof handle === 'undefined') {
        throw new Error('Expected `DocumentGroupInventory` to have exposed its handle')
      }

      return handle
    }

    // The test provider renders a spinner until the locale resources have loaded.
    return async () => {
      const onClose = vi.fn()

      render(
        <DocumentGroupInspector documentId="doc-123" documentType="author" onClose={onClose} />,
        {wrapper: TestProvider},
      )

      await screen.findByRole('heading', {name: 'Manage versions'})

      return {onClose, lastInventoryHandle}
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

  test('renders the feedback action before the close button', async ({renderInspector}) => {
    await renderInspector()

    const feedbackButton = await screen.findByRole('button', {name: 'Send feedback'})
    const closeButton = screen.getByRole('button', {name: 'Close panel'})

    expect(
      feedbackButton.compareDocumentPosition(closeButton) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  test('begins feedback in the inventory when the feedback action is pressed', async ({
    renderInspector,
  }) => {
    const {lastInventoryHandle} = await renderInspector()

    await userEvent.click(await screen.findByRole('button', {name: 'Send feedback'}))

    expect(lastInventoryHandle().inventory.getSnapshot().matches('feedback')).toBe(true)
    expect(screen.getByRole('button', {name: 'Send feedback'})).toBeDisabled()

    act(() => lastInventoryHandle().inventory.send({type: 'feedback.end'}))

    expect(screen.getByRole('button', {name: 'Send feedback'})).toBeEnabled()
  })

  test('disables the feedback action while the inventory refuses to begin feedback', async ({
    renderInspector,
  }) => {
    const {lastInventoryHandle} = await renderInspector()

    const feedbackButton = await screen.findByRole('button', {name: 'Send feedback'})
    expect(feedbackButton).toBeEnabled()

    const {inventory} = lastInventoryHandle()

    act(() =>
      inventory.getSnapshot().context.variantCreationRef.send({type: 'createVariant.request'}),
    )

    expect(inventory.getSnapshot().matches('creatingVariant')).toBe(true)
    expect(feedbackButton).toBeDisabled()
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
      expect(screen.queryByRole('button', {name: 'Send feedback'})).not.toBeInTheDocument()
    })
  })
})
