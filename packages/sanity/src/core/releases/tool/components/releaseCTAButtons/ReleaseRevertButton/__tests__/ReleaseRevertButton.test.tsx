import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, type Mock, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../../test/testUtils/TestProvider'
import {publishedASAPRelease} from '../../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../../i18n'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../../../store/__tests__/__mocks/useReleasePermissions.mock'
import {type DocumentInRelease} from '../../../../detail/types'
import {ReleaseRevertButton} from '../ReleaseRevertButton'
import {type DocumentRevertStates, useDocumentRevertStates} from '../useDocumentRevertStates'
import {usePostPublishTransactions} from '../usePostPublishTransactions'

vi.mock('../../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

// The fallback upsell context never invokes the guarded callback, so the dialog would never open
vi.mock('../../../../../contexts/upsell/useReleasesUpsell', () => ({
  useReleasesUpsell: () => ({
    guardWithReleaseLimitUpsell: async (callback: () => void) => callback(),
  }),
}))

vi.mock('../useDocumentRevertStates', () => ({
  useDocumentRevertStates: vi.fn(),
}))

vi.mock('../usePostPublishTransactions', () => ({
  usePostPublishTransactions: vi.fn(() => false),
}))

const mockUseDocumentRevertStates = useDocumentRevertStates as Mock<typeof useDocumentRevertStates>
const mockUsePostPublishTransactions = usePostPublishTransactions as Mock<
  typeof usePostPublishTransactions
>

const documents = ['doc1', 'doc2', 'doc3'].map((id): DocumentInRelease => ({
  memoKey: id,
  document: {
    _id: id,
    _type: 'test-document',
    _createdAt: '2023-10-01T08:00:00Z',
    _updatedAt: '2023-10-01T09:00:00Z',
    _rev: 'publishRev',
    publishedDocumentExists: true,
  },
  validation: {isValidating: false, hasError: false, validation: []},
}))

const resolvedStates: DocumentRevertStates = {
  states: [
    {documentId: 'doc1', type: 'revert', document: {_id: 'doc1'} as never},
    {documentId: 'doc2', type: 'revert', document: {_id: 'doc2'} as never},
    {documentId: 'doc3', type: 'unpublish', document: {_id: 'doc3'} as never},
  ],
  revertDocuments: [{_id: 'doc1'}, {_id: 'doc2'}, {_id: 'doc3'}] as never,
  revertCount: 2,
  unpublishCount: 1,
  unresolvedDocumentIds: [],
}

const unresolvedStates: DocumentRevertStates = {
  states: [
    {documentId: 'doc1', type: 'revert', document: {_id: 'doc1'} as never},
    {documentId: 'doc2', type: 'unresolved', reason: 'request-failed'},
    {documentId: 'doc3', type: 'unresolved', reason: 'request-failed'},
  ],
  revertDocuments: [{_id: 'doc1'}] as never,
  revertCount: 1,
  unpublishCount: 0,
  unresolvedDocumentIds: ['doc2', 'doc3'],
}

const historyUnavailableStates: DocumentRevertStates = {
  ...unresolvedStates,
  states: [
    unresolvedStates.states[0],
    {documentId: 'doc2', type: 'unresolved', reason: 'history-unavailable'},
    {documentId: 'doc3', type: 'unresolved', reason: 'request-failed'},
  ],
}

async function openConfirmRevertDialog() {
  const wrapper = await createTestProvider({resources: [releasesUsEnglishLocaleBundle]})
  render(<ReleaseRevertButton release={publishedASAPRelease} documents={documents} />, {wrapper})

  await waitFor(() => expect(screen.getByTestId('revert-button')).not.toBeDisabled())
  await userEvent.click(screen.getByTestId('revert-button'))
  await screen.findByTestId('confirm-button')
}

describe('ReleaseRevertButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    mockUseReleaseOperations.mockReturnValue(useReleaseOperationsMockReturn)
    useReleaseOperationsMockReturn.revertRelease.mockResolvedValue(undefined)
    mockUsePostPublishTransactions.mockReturnValue(false)
  })

  test('keeps confirm disabled while revert states are resolving', async () => {
    mockUseDocumentRevertStates.mockReturnValue(null)
    await openConfirmRevertDialog()

    expect(screen.getByTestId('revert-resolving')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-button')).toBeDisabled()
  })

  test('summarises restores and unpublishes, then reverts with the resolved documents', async () => {
    mockUseDocumentRevertStates.mockReturnValue(resolvedStates)
    await openConfirmRevertDialog()

    expect(screen.getByTestId('revert-summary-restore')).toHaveTextContent(
      '2 documents will be restored to their last published revision from before this release.',
    )
    expect(screen.getByTestId('revert-summary-unpublish')).toHaveTextContent(
      '1 document will be unpublished because it was not published before this release.',
    )
    expect(screen.queryByTestId('revert-unresolved-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('confirm-button')).not.toBeDisabled()

    await userEvent.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(useReleaseOperationsMockReturn.revertRelease).toHaveBeenCalledWith(
        expect.any(String),
        resolvedStates.revertDocuments,
        expect.objectContaining({releaseType: 'asap'}),
        'staged',
      )
    })
  })

  test('refuses to revert while any document is unresolved', async () => {
    mockUseDocumentRevertStates.mockReturnValue(unresolvedStates)
    await openConfirmRevertDialog()

    expect(screen.getByTestId('revert-unresolved-card')).toHaveTextContent(
      'The previous state of 2 documents could not be determined, so the release cannot be reverted.',
    )
    expect(screen.queryByTestId('revert-history-unavailable-card')).not.toBeInTheDocument()
    expect(screen.getByTestId('confirm-button')).toBeDisabled()
    expect(useReleaseOperationsMockReturn.revertRelease).not.toHaveBeenCalled()
  })

  test('separates documents whose history is gone from documents whose request failed', async () => {
    mockUseDocumentRevertStates.mockReturnValue(historyUnavailableStates)
    await openConfirmRevertDialog()

    expect(screen.getByTestId('revert-history-unavailable-card')).toHaveTextContent(
      'The previous state of 1 document is no longer available in the document history, so the release cannot be reverted.',
    )
    expect(screen.getByTestId('revert-unresolved-card')).toHaveTextContent(
      'The previous state of 1 document could not be determined, so the release cannot be reverted.',
    )
    expect(screen.getByTestId('confirm-button')).toBeDisabled()
  })
})
