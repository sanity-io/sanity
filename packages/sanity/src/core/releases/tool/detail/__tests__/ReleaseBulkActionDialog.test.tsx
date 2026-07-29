import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ReleaseBulkActionDialog} from '../ReleaseBulkActionDialog'
import {type DocumentInRelease} from '../types'

const mockUnpublishVersion = vi.fn().mockResolvedValue({})
const mockDiscardVersion = vi.fn().mockResolvedValue({})
const mockGetDocumentPairPermissions = vi.fn()
const mockToastPush = vi.fn()

vi.mock('../../../hooks/useVersionOperations', () => ({
  useVersionOperations: vi.fn(() => ({
    discardVersion: mockDiscardVersion,
    unpublishVersion: mockUnpublishVersion,
  })),
}))

vi.mock('../../../../store/grants/documentPairPermissions', () => ({
  getDocumentPairPermissions: (...args: unknown[]) => mockGetDocumentPairPermissions(...args),
}))

vi.mock('../../../../hooks/useClient', () => ({
  useClient: vi.fn(() => ({})),
}))

vi.mock('../../../../hooks/useSchema', () => ({
  useSchema: vi.fn(() => ({})),
}))

vi.mock('../../../../store/datastores', () => ({
  useGrantsStore: vi.fn(() => ({})),
}))

vi.mock('../../../../store/user/hooks', () => ({
  useCurrentUser: vi.fn(() => ({id: 'user-1'})),
}))

vi.mock('../../../../i18n/hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string, values?: {count?: number}) => {
      if (key === 'dashboard.details.bulk.unpublish-dialog.confirm') return 'Unpublish'
      if (key === 'dashboard.details.bulk.unpublish-dialog.header') return 'Unpublish documents'
      if (key === 'dashboard.details.bulk.unpublish-dialog.description') {
        return `Unpublish ${values?.count ?? 0} documents`
      }
      if (key === 'dashboard.details.bulk.discard-dialog.confirm') return 'Discard'
      if (key === 'dashboard.details.bulk.discard-dialog.header') return 'Discard versions'
      if (key === 'dashboard.details.bulk.discard-dialog.description') {
        return `Discard ${values?.count ?? 0} versions`
      }
      return key
    },
  })),
}))

vi.mock('../../../../../ui-components/dialog/Dialog', () => ({
  Dialog: ({
    footer,
    children,
  }: {
    footer: {
      confirmButton: {text: string; onClick: () => void}
    }
    children: ReactNode
  }) => (
    <div>
      {children}
      <button type="button" onClick={footer.confirmButton.onClick}>
        {footer.confirmButton.text}
      </button>
    </div>
  ),
}))

vi.mock('@sanity/ui', () => ({
  useToast: vi.fn(() => ({push: mockToastPush})),
  Box: ({children}: {children: ReactNode}) => <div>{children}</div>,
  Text: ({children}: {children: ReactNode}) => <span>{children}</span>,
}))

function createRow(
  id: string,
  overrides: Partial<{publishedDocumentExists: boolean; systemDelete: boolean}> = {},
): DocumentInRelease {
  const {publishedDocumentExists = true, systemDelete = false} = overrides
  return {
    memoKey: id,
    isPending: false,
    document: {
      _id: id,
      _type: 'testDoc',
      _rev: 'rev',
      _createdAt: '2024-01-01T00:00:00.000Z',
      _updatedAt: '2024-01-01T00:00:00.000Z',
      publishedDocumentExists,
      _system: systemDelete ? {delete: true} : undefined,
    },
    validation: {hasError: false, isValidating: false, validation: []},
  }
}

describe('ReleaseBulkActionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetDocumentPairPermissions.mockReturnValue(of({granted: true, reason: ''}))
  })

  it('only unpublishes documents the user has permission for', async () => {
    const permitted = createRow('versions.rTest.doc-permitted')
    const denied = createRow('versions.rTest.doc-denied')

    mockGetDocumentPairPermissions.mockImplementation((options: {id: string}) => {
      if (options.id === 'doc-permitted') {
        return of({granted: true, reason: ''})
      }
      return of({granted: false, reason: 'denied'})
    })

    render(
      <ReleaseBulkActionDialog
        action="unpublish"
        documents={[permitted, denied]}
        releaseId="rTest"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    await userEvent.click(await screen.findByText('Unpublish'))

    await waitFor(() => {
      expect(mockUnpublishVersion).toHaveBeenCalledTimes(1)
    })
    expect(mockUnpublishVersion).toHaveBeenCalledWith('versions.rTest.doc-permitted')
  })

  it('does not call unpublish when no documents are permitted', async () => {
    mockGetDocumentPairPermissions.mockReturnValue(of({granted: false, reason: 'denied'}))

    const onClose = vi.fn()
    render(
      <ReleaseBulkActionDialog
        action="unpublish"
        documents={[createRow('versions.rTest.doc-one')]}
        releaseId="rTest"
        onClose={onClose}
        onSuccess={vi.fn()}
      />,
    )

    await userEvent.click(await screen.findByText('Unpublish'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    expect(mockUnpublishVersion).not.toHaveBeenCalled()
  })

  it('only discards documents the user has permission for', async () => {
    const permitted = createRow('versions.rTest.doc-permitted')
    const denied = createRow('versions.rTest.doc-denied')

    mockGetDocumentPairPermissions.mockImplementation(
      (options: {id: string; permission: string}) => {
        if (options.permission !== 'discardVersion') {
          return of({granted: true, reason: ''})
        }
        if (options.id === 'doc-permitted') {
          return of({granted: true, reason: ''})
        }
        return of({granted: false, reason: 'denied'})
      },
    )

    render(
      <ReleaseBulkActionDialog
        action="discard"
        documents={[permitted, denied]}
        releaseId="rTest"
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />,
    )

    await userEvent.click(await screen.findByText('Discard'))

    await waitFor(() => {
      expect(mockDiscardVersion).toHaveBeenCalledTimes(1)
    })
    expect(mockDiscardVersion).toHaveBeenCalledWith('rTest', 'versions.rTest.doc-permitted')
  })

  it('does not call discard when no documents are permitted', async () => {
    mockGetDocumentPairPermissions.mockImplementation((options: {permission: string}) => {
      if (options.permission === 'discardVersion') {
        return of({granted: false, reason: 'denied'})
      }
      return of({granted: true, reason: ''})
    })

    const onClose = vi.fn()
    render(
      <ReleaseBulkActionDialog
        action="discard"
        documents={[createRow('versions.rTest.doc-one')]}
        releaseId="rTest"
        onClose={onClose}
        onSuccess={vi.fn()}
      />,
    )

    await userEvent.click(await screen.findByText('Discard'))

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled()
    })
    expect(mockDiscardVersion).not.toHaveBeenCalled()
  })
})
