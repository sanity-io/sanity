import {render, screen, waitFor, within} from '@testing-library/react'
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
// @ts-expect-error -- pre-existing, fix later
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

    test('lists the drafts that would be discarded, and describes the option to screen readers', async () => {
      await openConfirmPublishDialog(documents)

      expect(
        within(screen.getByTestId('update-drafts-list')).getAllByRole('listitem'),
      ).toHaveLength(2)
      const descriptionId = screen
        .getByTestId('update-drafts-checkbox')
        .getAttribute('aria-describedby')
      expect(descriptionId).toBeTruthy()
      expect(document.getElementById(descriptionId!)).toHaveTextContent(
        "2 documents have draft changes that aren't in this release.",
      )
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

    test('counts the unpublished document apart from the published one', async () => {
      await openConfirmPublishDialog(documents)

      const dialog = screen.getByTestId('confirm-publish-dialog')
      expect(dialog).toHaveTextContent('One document in this release will be published.')
      expect(dialog).toHaveTextContent(
        'One document will be unpublished. Its content is kept as a draft.',
      )
    })
  })
  describe('the preview of what running the release does', () => {
    test('groups the documents by effect: new, updated, unpublished', async () => {
      await openConfirmPublishDialog([
        createDocumentInRelease('versions.rASAP.new1', {publishedDocumentExists: false}),
        createDocumentInRelease('versions.rASAP.upd1'),
        createDocumentInRelease('versions.rASAP.upd2'),
        createDocumentInRelease('versions.rASAP.gone1', {_system: {delete: true}}),
      ])

      const preview = screen.getByTestId('run-release-preview')
      const groups = within(preview).getAllByTestId(/^run-preview-group-/)
      expect(groups.map((group) => group.dataset.testid)).toEqual([
        'run-preview-group-add',
        'run-preview-group-update',
        'run-preview-group-unpublish',
      ])
      expect(
        within(screen.getByTestId('run-preview-group-update')).getByRole('list', {
          name: '2 updated',
        }),
      ).toBeInTheDocument()
      expect(
        within(screen.getByTestId('run-preview-group-add')).getAllByRole('listitem'),
      ).toHaveLength(1)
      expect(
        within(screen.getByTestId('run-preview-group-unpublish')).getAllByRole('listitem'),
      ).toHaveLength(1)
    })

    test('links each document to the release perspective in a new tab', async () => {
      await openConfirmPublishDialog([createDocumentInRelease('versions.rASAP.doc1')])

      const link = within(screen.getByTestId('run-preview-group-update')).getByRole('link')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('href')).toContain('perspective=rASAP')
    })

    test('collapses a group beyond five documents behind a "Show all" button', async () => {
      await openConfirmPublishDialog(
        Array.from({length: 7}, (_, index) =>
          createDocumentInRelease(`versions.rASAP.doc${index}`),
        ),
      )

      const group = screen.getByTestId('run-preview-group-update')
      expect(within(group).getAllByRole('listitem')).toHaveLength(5)

      const toggle = within(group).getByRole('button', {name: 'Show all 7'})
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      await userEvent.click(toggle)

      expect(within(group).getAllByRole('listitem')).toHaveLength(7)
      expect(within(group).getByRole('button', {name: 'Show fewer'})).toHaveAttribute(
        'aria-expanded',
        'true',
      )
    })

    test('does not show a toggle for short groups', async () => {
      await openConfirmPublishDialog([createDocumentInRelease('versions.rASAP.doc1')])

      expect(screen.queryByTestId('run-preview-toggle')).not.toBeInTheDocument()
    })
  })
})
