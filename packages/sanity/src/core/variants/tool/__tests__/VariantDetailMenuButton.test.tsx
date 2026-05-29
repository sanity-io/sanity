import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {VariantDetailMenuButton} from '../detail/VariantDetailMenuButton'

const mockNavigate = vi.fn()

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

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    navigate: mockNavigate,
  })),
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

describe('VariantDetailMenuButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
  })

  const renderMenuButton = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<VariantDetailMenuButton variant={variantAlphaAudience} />, {wrapper})
    await screen.findByRole('button')
    return result
  }

  it('deletes the variant and navigates back to overview when delete is selected', async () => {
    const user = userEvent.setup()

    await renderMenuButton()

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant'))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
      expect(mockNavigate).toHaveBeenCalledWith({})
    })
  })

  it('shows a loading state on the menu button while deleting', async () => {
    const user = userEvent.setup()
    const deleteDeferred = createDeferred()
    variantOperationsMock.deleteVariant.mockReturnValue(deleteDeferred.promise)

    await renderMenuButton()

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

  it('shows a toast and stays on the detail page when deletion fails', async () => {
    const error = new Error('delete failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.deleteVariant.mockRejectedValue(error)
    const user = userEvent.setup()

    await renderMenuButton()

    await user.click(screen.getByRole('button'))
    await user.click(await screen.findByText('Delete variant'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to delete variant',
        }),
      )
    })
    expect(consoleError).toHaveBeenCalledWith(error)
    expect(mockNavigate).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })
})
