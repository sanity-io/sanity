import {render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ReleaseBulkSelectionActions} from '../ReleaseBulkSelectionActions'
import {type DocumentInReleaseDetail} from '../ReleaseSummary'

const mockUseAllDocumentsInReleaseHavePairPermission = vi.fn()

vi.mock('../releaseBulkDocumentPermissions', () => ({
  useAllDocumentsInReleaseHavePairPermission: (...args: unknown[]) =>
    mockUseAllDocumentsInReleaseHavePairPermission(...args),
}))

vi.mock('../../../i18n/hooks/useTranslation', () => ({
  useTranslation: vi.fn(() => ({
    t: (key: string) => key,
  })),
}))

vi.mock('../../../../../ui-components/menuButton/MenuButton', () => ({
  MenuButton: () => null,
}))

vi.mock('../../../../../ui-components/menuItem/MenuItem', () => ({
  MenuItem: () => null,
}))

vi.mock('@sanity/ui', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    Flex: ({children}: {children: ReactNode}) => <div>{children}</div>,
  }
})

vi.mock('../../../../../ui-components/button/Button', () => ({
  Button: ({disabled, 'data-testid': testId}: {'disabled'?: boolean; 'data-testid'?: string}) => (
    <button data-testid={testId} disabled={disabled} type="button" />
  ),
}))

function createRow(
  id: string,
  overrides: Partial<{publishedDocumentExists: boolean}> = {},
): DocumentInReleaseDetail {
  const {publishedDocumentExists = true} = overrides
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
    },
    validation: {hasError: false, isValidating: false, validation: []},
  }
}

describe('ReleaseBulkSelectionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAllDocumentsInReleaseHavePairPermission.mockImplementation(
      (_documents: unknown, permission: string) => ({
        granted: true,
        isLoading: false,
        permission,
      }),
    )
  })

  it('disables bulk discard when the user lacks discardVersion on the selection', async () => {
    mockUseAllDocumentsInReleaseHavePairPermission.mockImplementation(
      (_documents: unknown, permission: string) => ({
        granted: permission !== 'discardVersion',
        isLoading: false,
      }),
    )

    render(
      <ReleaseBulkSelectionActions
        compact={false}
        filterTabRows={[createRow('versions.rTest.doc-one')]}
        onDiscard={vi.fn()}
        onUnpublish={vi.fn()}
        selectedKeys={['versions.rTest.doc-one']}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('release-bulk-discard')).toBeDisabled()
    })
  })

  it('disables bulk discard while permissions are loading', async () => {
    mockUseAllDocumentsInReleaseHavePairPermission.mockImplementation(
      (_documents: unknown, permission: string) => ({
        granted: true,
        isLoading: permission === 'discardVersion',
      }),
    )

    render(
      <ReleaseBulkSelectionActions
        compact={false}
        filterTabRows={[createRow('versions.rTest.doc-one')]}
        onDiscard={vi.fn()}
        onUnpublish={vi.fn()}
        selectedKeys={['versions.rTest.doc-one']}
      />,
    )

    expect(screen.getByTestId('release-bulk-discard')).toBeDisabled()
  })

  it('disables bulk unpublish when the user lacks unpublish on the selection', async () => {
    mockUseAllDocumentsInReleaseHavePairPermission.mockImplementation(
      (_documents: unknown, permission: string) => ({
        granted: permission !== 'unpublish',
        isLoading: false,
      }),
    )

    render(
      <ReleaseBulkSelectionActions
        compact={false}
        filterTabRows={[createRow('versions.rTest.doc-one')]}
        onDiscard={vi.fn()}
        onUnpublish={vi.fn()}
        selectedKeys={['versions.rTest.doc-one']}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('release-bulk-unpublish')).toBeDisabled()
    })
  })

  it('disables bulk unpublish while permissions are loading', async () => {
    mockUseAllDocumentsInReleaseHavePairPermission.mockImplementation(
      (_documents: unknown, permission: string) => ({
        granted: true,
        isLoading: permission === 'unpublish',
      }),
    )

    render(
      <ReleaseBulkSelectionActions
        compact={false}
        filterTabRows={[createRow('versions.rTest.doc-one')]}
        onDiscard={vi.fn()}
        onUnpublish={vi.fn()}
        selectedKeys={['versions.rTest.doc-one']}
      />,
    )

    expect(screen.getByTestId('release-bulk-unpublish')).toBeDisabled()
  })

  it('disables bulk unpublish when not every selected document can be unpublished', async () => {
    render(
      <ReleaseBulkSelectionActions
        compact={false}
        filterTabRows={[
          createRow('versions.rTest.doc-published'),
          createRow('versions.rTest.doc-draft-only', {publishedDocumentExists: false}),
        ]}
        onDiscard={vi.fn()}
        onUnpublish={vi.fn()}
        selectedKeys={['versions.rTest.doc-published', 'versions.rTest.doc-draft-only']}
      />,
    )

    await waitFor(() => {
      expect(screen.getByTestId('release-bulk-unpublish')).toBeDisabled()
    })
  })
})
