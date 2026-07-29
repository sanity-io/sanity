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

vi.mock('@sanity/ui', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

const emptyVariant: TableVariant = {...variantAlphaAudience, documentCount: 0}
const variantWithDocs: TableVariant = {...variantNorwegianMarket, documentCount: 2}

describe('VariantBulkDeleteDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
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
})
