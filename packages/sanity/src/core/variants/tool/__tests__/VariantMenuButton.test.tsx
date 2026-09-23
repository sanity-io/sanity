import {act, render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {VariantMenuButton} from '../overview/VariantMenuButton'

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

const variantPermissionsMock = vi.hoisted(() => ({
  checkWithPermissionGuard: vi.fn(),
}))

vi.mock('../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

vi.mock('../../store/useVariantPermissions', () => ({
  useVariantPermissions: vi.fn(() => variantPermissionsMock),
}))

function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return {promise, resolve, reject}
}

describe('VariantMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
    variantPermissionsMock.checkWithPermissionGuard.mockResolvedValue(true)
  })

  const renderMenuButton = async (options?: {documentCount?: number | null}) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    let result!: ReturnType<typeof render>
    // The delete permission dry run starts on mount and resolves asynchronously; mounting inside
    // an async act lets that first update flush without React warning about un-acted updates.
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- see above
    await act(async () => {
      result = render(
        <VariantMenuButton documentCount={options?.documentCount} variant={variantAlphaAudience} />,
        {wrapper},
      )
    })
    await screen.findByRole('button')
    return result
  }

  it('opens the edit dialog when edit is selected', async () => {
    const user = userEvent.setup()

    await renderMenuButton({documentCount: 0})

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Edit variant definition'))

    expect(await screen.findByTestId('save-variant-button')).toBeInTheDocument()
    expect(variantOperationsMock.updateVariant).not.toHaveBeenCalled()
  })

  it('updates the variant when the edit dialog is submitted', async () => {
    const user = userEvent.setup()
    variantOperationsMock.updateVariant.mockResolvedValue(undefined)

    await renderMenuButton({documentCount: 0})

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Edit variant definition'))
    await user.click(await screen.findByTestId('save-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.updateVariant).toHaveBeenCalled()
    })
  })

  it('deletes the variant when delete is selected', async () => {
    const user = userEvent.setup()

    await renderMenuButton({documentCount: 0})

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant definition'))
    await user.click(await screen.findByTestId('confirm-button'))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
    })
  })

  it('does not delete the variant when the confirmation dialog is cancelled', async () => {
    const user = userEvent.setup()

    await renderMenuButton({documentCount: 0})

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant definition'))
    await user.click(await screen.findByTestId('cancel-button'))

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
    expect(screen.queryByTestId('delete-variant-dialog')).not.toBeInTheDocument()
  })

  it('shows a loading state on the menu button while deleting', async () => {
    const user = userEvent.setup()
    const deleteDeferred = createDeferred()
    variantOperationsMock.deleteVariant.mockReturnValue(deleteDeferred.promise)

    await renderMenuButton({documentCount: 0})

    const menuButton = screen.getByRole('button')

    await user.click(menuButton)
    await user.click(await screen.findByText('Delete variant definition'))
    await user.click(await screen.findByTestId('confirm-button'))

    await waitFor(() => {
      expect(menuButton).toBeDisabled()
    })

    deleteDeferred.resolve()

    await waitFor(() => {
      expect(menuButton).toBeEnabled()
    })
  })

  it('disables delete when the variant has documents', async () => {
    const user = userEvent.setup()

    await renderMenuButton({documentCount: 1})

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant definition'))

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })

  it('disables delete while the document count is loading', async () => {
    const user = userEvent.setup()

    await renderMenuButton()

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant definition'))

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })

  it('checks delete permission with a dry run of the delete action', async () => {
    await renderMenuButton({documentCount: 0})

    await waitFor(() => {
      expect(variantPermissionsMock.checkWithPermissionGuard).toHaveBeenCalledWith(
        variantOperationsMock.deleteVariant,
        variantAlphaAudience._id,
      )
    })
  })

  it('disables delete and explains why when the user lacks permission', async () => {
    variantPermissionsMock.checkWithPermissionGuard.mockResolvedValue(false)
    const user = userEvent.setup()

    await renderMenuButton({documentCount: 0})

    await user.click(screen.getByRole('button'))
    const deleteItem = await screen.findByText('Delete variant definition')
    await user.click(deleteItem)

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
    expect(screen.queryByTestId('delete-variant-dialog')).not.toBeInTheDocument()

    await user.hover(deleteItem)
    expect(
      await screen.findByText('You do not have permission to delete this variant definition'),
    ).toBeInTheDocument()
  })
})
