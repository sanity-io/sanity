import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {createMockVariant} from '../../../__fixtures__/createMockVariant'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VariantBulkDeleteDialog} from '../VariantBulkDeleteDialog'
import {type TableVariant} from '../VariantsOverviewColumnDefs'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

// The dialog re-fetches authoritative document counts at confirm (interim guard, SAPT-48). Mock the
// client so tests control that fresh count; default is an empty map, i.e. every deletable definition
// re-checks as still empty (matches the pre-guard behavior).
const clientMock = vi.hoisted(() => ({
  fetch: vi.fn(),
}))

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

vi.mock('../../../../hooks/useClient', () => ({
  useClient: vi.fn(() => clientMock),
}))

const emptyVariant: TableVariant = {...variantAlphaAudience, documentCount: 0}
const variantWithDocs: TableVariant = {...variantNorwegianMarket, documentCount: 2}

describe('VariantBulkDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
    // Default: the confirm-time re-check finds every definition still empty.
    clientMock.fetch.mockResolvedValue({})
  })

  const renderDialog = async (
    variants: TableVariant[],
    callbacks?: {onClose?: () => void; onDeleted?: () => void},
  ) => {
    const onClose = callbacks?.onClose ?? vi.fn()
    const onDeleted = callbacks?.onDeleted ?? vi.fn()
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })

    render(
      <VariantBulkDeleteDialog onClose={onClose} onDeleted={onDeleted} variants={variants} />,
      {
        wrapper,
      },
    )

    await screen.findByTestId('variant-bulk-delete-dialog')

    return {onClose, onDeleted}
  }

  it('calls onDeleted and onClose when all deletions succeed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    const onDeleted = vi.fn()
    await renderDialog([emptyVariant], {onClose, onDeleted})

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('does not call onDeleted or onClose when every deletion fails', async () => {
    const user = userEvent.setup()
    variantOperationsMock.deleteVariant.mockRejectedValue(new Error('delete failed'))
    const onClose = vi.fn()
    const onDeleted = vi.fn()
    await renderDialog([emptyVariant], {onClose, onDeleted})

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Some variant definitions could not be deleted',
        }),
      )
    })
    expect(onDeleted).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByTestId('variant-bulk-delete-dialog')).toBeInTheDocument()
  })

  it('calls onDeleted and onClose when at least one deletion succeeds', async () => {
    const user = userEvent.setup()
    const secondEmpty: TableVariant = {
      ...createMockVariant('second-empty', 3),
      documentCount: 0,
    }
    variantOperationsMock.deleteVariant.mockImplementation((id: string) => {
      if (id === emptyVariant._id) return Promise.resolve(undefined)
      return Promise.reject(new Error('delete failed'))
    })
    const onClose = vi.fn()
    const onDeleted = vi.fn()
    await renderDialog([emptyVariant, secondEmpty], {onClose, onDeleted})

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledTimes(1)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('only attempts to delete variants with no documents', async () => {
    const user = userEvent.setup()
    await renderDialog([emptyVariant, variantWithDocs])

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledTimes(1)
    })
    expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(emptyVariant._id)
  })

  it('skips a definition whose confirm-time re-check finds it now has documents', async () => {
    const user = userEvent.setup()
    // Shown as empty at render, but the authoritative re-check at confirm reports it now holds
    // documents (listener lag). It must be skipped, not deleted, and the user warned.
    clientMock.fetch.mockResolvedValue({[emptyVariant._id]: 3})
    const onClose = vi.fn()
    const onDeleted = vi.fn()
    await renderDialog([emptyVariant], {onClose, onDeleted})

    await user.click(screen.getByTestId('confirm-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(expect.objectContaining({status: 'warning'}))
    })
    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
    expect(onDeleted).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not claim unresolved document counts contain documents', async () => {
    const loadingVariant: TableVariant = {...variantAlphaAudience, documentCount: undefined}
    const failedCountVariant: TableVariant = {...variantNorwegianMarket, documentCount: null}

    await renderDialog([loadingVariant, failedCountVariant])

    expect(
      screen.getByText(
        'Document counts are still loading or unavailable for the selected definitions, so none can be deleted yet.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/contain documents/)).not.toBeInTheDocument()
    expect(screen.getByTestId('confirm-button')).toBeDisabled()
  })

  it('shows separate notes for definitions with documents and unknown counts', async () => {
    const loadingVariant: TableVariant = {...variantAlphaAudience, documentCount: undefined}

    await renderDialog([emptyVariant, variantWithDocs, loadingVariant])

    expect(
      screen.getByText('You are about to delete 1 variant definition. This cannot be undone.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('1 selected definition contains documents and will be kept.'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('1 selected definition has an unknown document count and will be kept.'),
    ).toBeInTheDocument()
  })
})
