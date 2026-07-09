import {render, screen, waitFor} from '@testing-library/react'
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

vi.mock('../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
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
  })

  const renderMenuButton = async (options?: {documentCount?: number | null}) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(
      <VariantMenuButton documentCount={options?.documentCount} variant={variantAlphaAudience} />,
      {wrapper},
    )
    await screen.findByRole('button')
    return result
  }

  it('deletes the variant when delete is selected', async () => {
    const user = userEvent.setup()

    await renderMenuButton({documentCount: 0})

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant'))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
    })
  })

  it('shows a loading state on the menu button while deleting', async () => {
    const user = userEvent.setup()
    const deleteDeferred = createDeferred()
    variantOperationsMock.deleteVariant.mockReturnValue(deleteDeferred.promise)

    await renderMenuButton({documentCount: 0})

    const menuButton = screen.getByRole('button')

    await user.click(menuButton)
    await user.click(await screen.findByText('Delete variant'))

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
    await user.click(await screen.findByText('Delete variant'))

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })

  it('disables delete while the document count is loading', async () => {
    const user = userEvent.setup()

    await renderMenuButton()

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant'))

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })
})
