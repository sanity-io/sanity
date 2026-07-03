import {defineType} from '@sanity/types'
import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {defineConfig} from '../../../../config'
import {activeASAPRelease, scheduledRelease} from '../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../i18n'
import {DeleteDocumentDialog} from '../DeleteDocumentDialog'

const {
  deleteExecuteMock,
  useDocumentVersionsMock,
  useReferringDocumentsMock,
  useDocumentVersionTypeSortedListMock,
  operationEventsMock,
} = vi.hoisted(() => ({
  deleteExecuteMock: vi.fn(),
  useDocumentVersionsMock: vi.fn(),
  useReferringDocumentsMock: vi.fn(),
  useDocumentVersionTypeSortedListMock: vi.fn(),
  operationEventsMock: vi.fn(),
}))

vi.mock('../../../../preview', () => ({
  useValuePreview: vi.fn(() => ({isLoading: false, value: {title: 'Test doc'}})),
}))

vi.mock('../../../../preview/components/Preview', () => ({
  Preview: () => null,
}))

vi.mock('../../../../hooks/useDocumentOperation', () => ({
  useDocumentOperation: vi.fn(() => ({delete: {disabled: false, execute: deleteExecuteMock}})),
}))

vi.mock('../../../hooks/useDocumentVersions', () => ({
  useDocumentVersions: useDocumentVersionsMock,
}))

vi.mock('../../../../hooks/useReferringDocuments', () => ({
  useReferringDocuments: useReferringDocumentsMock,
}))

vi.mock('../../../hooks/useDocumentVersionTypeSortedList', () => ({
  useDocumentVersionTypeSortedList: useDocumentVersionTypeSortedListMock,
}))

vi.mock('../../../../store/datastores', async (importOriginal) => ({
  ...(await importOriginal()),
  useDocumentStore: vi.fn(() => ({pair: {operationEvents: operationEventsMock}})),
}))

const config = defineConfig({
  projectId: 'test',
  dataset: 'test',
  schema: {
    types: [
      defineType({
        name: 'testDoc',
        type: 'document',
        fields: [{name: 'title', type: 'string'}],
      }),
    ],
  },
})

async function renderDialog(props?: {onClose?: () => void}) {
  const wrapper = await createTestProvider({config, resources: [releasesUsEnglishLocaleBundle]})
  render(
    <DeleteDocumentDialog
      onClose={props?.onClose ?? vi.fn()}
      documentVersionId="versions.rActive.doc1"
      documentType="testDoc"
    />,
    {wrapper},
  )
  await screen.findByText('Are you sure you want to delete this document?')
}

describe('DeleteDocumentDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useDocumentVersionsMock.mockReturnValue({
      data: ['versions.rActive.doc1', 'drafts.doc1'],
      versions: [],
      loading: false,
    })
    useReferringDocumentsMock.mockReturnValue({referringDocuments: [], isLoading: false})
    useDocumentVersionTypeSortedListMock.mockReturnValue({sortedDocumentList: []})
    operationEventsMock.mockReturnValue(
      of({
        type: 'success',
        op: 'delete',
        id: 'doc1',
        idPair: {publishedId: 'doc1', draftId: 'drafts.doc1'},
      }),
    )
  })

  it('executes the delete operation with all document versions and closes', async () => {
    const onClose = vi.fn()
    await renderDialog({onClose})

    await userEvent.click(screen.getByText('Delete document'))

    await waitFor(() => {
      expect(deleteExecuteMock).toHaveBeenCalledWith(['versions.rActive.doc1', 'drafts.doc1'])
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('shows an error toast and closes when the delete operation fails', async () => {
    const onClose = vi.fn()
    operationEventsMock.mockReturnValue(
      of({
        type: 'error',
        op: 'delete',
        id: 'doc1',
        idPair: {publishedId: 'doc1', draftId: 'drafts.doc1'},
        error: new Error('delete failed'),
      }),
    )
    await renderDialog({onClose})

    await userEvent.click(screen.getByText('Delete document'))

    expect(await screen.findByText('Failed to delete document')).toBeInTheDocument()
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
  })

  it('warns when the document has versions in other releases', async () => {
    useDocumentVersionsMock.mockReturnValue({
      data: ['versions.rActive.doc1', 'versions.rOther.doc1', 'drafts.doc1'],
      versions: [],
      loading: false,
    })
    await renderDialog()

    expect(
      screen.getByText(
        'This document has a version in 1 other release, which will also be deleted.',
      ),
    ).toBeInTheDocument()
  })

  it('warns when other documents refer to the document', async () => {
    useReferringDocumentsMock.mockReturnValue({
      referringDocuments: [
        {_id: 'ref1', _type: 'testDoc'},
        {_id: 'ref2', _type: 'testDoc'},
      ],
      isLoading: false,
    })
    await renderDialog()

    expect(
      screen.getByText(
        '2 documents refer to this document. If you delete it, those references will break.',
      ),
    ).toBeInTheDocument()
  })

  it('blocks deletion while the document is part of a scheduled release', async () => {
    useDocumentVersionTypeSortedListMock.mockReturnValue({
      sortedDocumentList: [activeASAPRelease, scheduledRelease],
    })
    await renderDialog()

    expect(
      screen.getByText(
        'This document cannot be deleted because it is part of a scheduled release.',
      ),
    ).toBeInTheDocument()

    expect(screen.getByText('Delete document').closest('button')).toBeDisabled()
    expect(deleteExecuteMock).not.toHaveBeenCalled()
  })
})
