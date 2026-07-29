import {render, screen, waitFor} from '@testing-library/react'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {ReleaseBulkSelectionActions} from '../ReleaseBulkSelectionActions'
import {type DocumentInReleaseDetail} from '../ReleaseSummary'

const mockUseAnyDocumentInReleaseHasPairPermission = vi.fn()

vi.mock('../releaseBulkDocumentPermissions', () => ({
  useAnyDocumentInReleaseHasPairPermission: (...args: unknown[]) =>
    mockUseAnyDocumentInReleaseHasPairPermission(...args),
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

function createRow(id: string): DocumentInReleaseDetail {
  return {
    memoKey: id,
    isPending: false,
    document: {
      _id: id,
      _type: 'testDoc',
      _rev: 'rev',
      _createdAt: '2024-01-01T00:00:00.000Z',
      _updatedAt: '2024-01-01T00:00:00.000Z',
      publishedDocumentExists: true,
    },
    validation: {hasError: false, isValidating: false, validation: []},
  }
}

describe('ReleaseBulkSelectionActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseAnyDocumentInReleaseHasPairPermission.mockReturnValue({
      granted: true,
      isLoading: false,
    })
  })

  it('disables bulk discard when the user lacks discardVersion on the selection', async () => {
    mockUseAnyDocumentInReleaseHasPairPermission.mockReturnValue({
      granted: false,
      isLoading: false,
    })

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
    mockUseAnyDocumentInReleaseHasPairPermission.mockReturnValue({
      granted: false,
      isLoading: true,
    })

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
})
