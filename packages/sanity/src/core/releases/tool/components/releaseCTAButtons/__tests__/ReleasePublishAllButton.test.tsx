import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, test, vi} from 'vitest'

import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {activeASAPRelease} from '../../../../__fixtures__/release.fixture'
import {releasesUsEnglishLocaleBundle} from '../../../../i18n'
import {
  mockUseReleaseOperations,
  useReleaseOperationsMockReturn,
} from '../../../../store/__tests__/__mocks/useReleaseOperations.mock'
import {
  mockUseReleasePermissions,
  useReleasePermissionsMockReturn,
  useReleasesPermissionsMockReturnTrue,
} from '../../../../store/__tests__/__mocks/useReleasePermissions.mock'
// @ts-expect-error -- pre-existing; now gated by oxlint options.typeCheck
import {type DocumentInRelease} from '../../../detail/useBundleDocuments'
import {ReleasePublishAllButton} from '../ReleasePublishAllButton'

vi.mock('../../../../store/useReleaseOperations', () => ({
  useReleaseOperations: vi.fn(() => useReleaseOperationsMockReturn),
}))

vi.mock('../../../../store/useReleasePermissions', () => ({
  useReleasePermissions: vi.fn(() => useReleasePermissionsMockReturn),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn().mockReturnValue({state: {}, navigate: vi.fn()}),
}))

const createDocumentInRelease = (
  documentId: string,
  documentOverrides: Partial<DocumentInRelease['document']> = {},
): DocumentInRelease => ({
  memoKey: documentId,
  document: {
    _id: documentId,
    _type: 'test-document',
    _createdAt: '2023-10-01T08:00:00Z',
    _updatedAt: '2023-10-01T09:00:00Z',
    _rev: 'some-rev',
    publishedDocumentExists: true,
    draftDocumentExists: false,
    ...documentOverrides,
  },
  validation: {
    isValidating: false,
    hasError: false,
    validation: [],
  },
})

const renderTest = async (documents: DocumentInRelease[]) => {
  const wrapper = await createTestProvider({
    resources: [releasesUsEnglishLocaleBundle],
  })
  return render(<ReleasePublishAllButton release={activeASAPRelease} documents={documents} />, {
    wrapper,
  })
}

const openConfirmPublishDialog = async (documents: DocumentInRelease[]) => {
  await renderTest(documents)

  await waitFor(() => {
    expect(screen.getByTestId('publish-all-button')).not.toBeDisabled()
  })

  await userEvent.click(screen.getByTestId('publish-all-button'))

  screen.getByTestId('confirm-publish-dialog')
}

describe('ReleasePublishAllButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseReleasePermissions.mockReturnValue(useReleasesPermissionsMockReturnTrue)
    mockUseReleaseOperations.mockReturnValue(useReleaseOperationsMockReturn)
    useReleaseOperationsMockReturn.publishRelease.mockResolvedValue({transactionId: 'transaction'})
    useReleaseOperationsMockReturn.discardDrafts.mockResolvedValue({transactionId: 'transaction'})
  })

  describe('when no document in the release has an existing draft', () => {
    const documents = [createDocumentInRelease('versions.rASAP.doc1')]

    test('does not show the update drafts option', async () => {
      await openConfirmPublishDialog(documents)

      expect(screen.queryByTestId('update-drafts-checkbox')).not.toBeInTheDocument()
    })

    test('publishes the release without discarding drafts', async () => {
      await openConfirmPublishDialog(documents)

      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
          activeASAPRelease._id,
        )
      })
      expect(useReleaseOperationsMockReturn.discardDrafts).not.toHaveBeenCalled()
    })
  })

  describe('when documents in the release have existing drafts', () => {
    const documents = [
      createDocumentInRelease('versions.rASAP.doc1', {draftDocumentExists: true}),
      createDocumentInRelease('versions.rASAP.doc2'),
      createDocumentInRelease('versions.rASAP.doc3', {draftDocumentExists: true}),
    ]

    test('shows the update drafts option, unchecked by default', async () => {
      await openConfirmPublishDialog(documents)

      expect(screen.getByTestId('update-drafts-checkbox')).not.toBeChecked()
    })

    test('publishes the release without discarding drafts when the option is left unchecked', async () => {
      await openConfirmPublishDialog(documents)

      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
          activeASAPRelease._id,
        )
      })
      expect(useReleaseOperationsMockReturn.discardDrafts).not.toHaveBeenCalled()
    })

    test('discards the existing drafts after publishing when the option is checked', async () => {
      await openConfirmPublishDialog(documents)

      await userEvent.click(screen.getByTestId('update-drafts-checkbox'))
      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(useReleaseOperationsMockReturn.discardDrafts).toHaveBeenCalledWith([
          'versions.rASAP.doc1',
          'versions.rASAP.doc3',
        ])
      })
      expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
        activeASAPRelease._id,
      )
    })

    test('completes the publish even when discarding the drafts fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const discardError = new Error('Failed to discard drafts')
      useReleaseOperationsMockReturn.discardDrafts.mockRejectedValueOnce(discardError)

      await openConfirmPublishDialog(documents)

      await userEvent.click(screen.getByTestId('update-drafts-checkbox'))
      await userEvent.click(screen.getByTestId('confirm-button'))

      await waitFor(() => {
        expect(screen.queryByTestId('confirm-publish-dialog')).not.toBeInTheDocument()
      })
      expect(useReleaseOperationsMockReturn.publishRelease).toHaveBeenCalledWith(
        activeASAPRelease._id,
      )
      expect(console.error).toHaveBeenCalledWith(discardError)
    })
  })

  describe('when the only document with an existing draft is set to be unpublished', () => {
    const documents = [
      createDocumentInRelease('versions.rASAP.doc1', {
        draftDocumentExists: true,
        _system: {delete: true},
      }),
      createDocumentInRelease('versions.rASAP.doc2'),
    ]

    test('does not show the update drafts option', async () => {
      await openConfirmPublishDialog(documents)

      expect(screen.queryByTestId('update-drafts-checkbox')).not.toBeInTheDocument()
    })
  })
})
