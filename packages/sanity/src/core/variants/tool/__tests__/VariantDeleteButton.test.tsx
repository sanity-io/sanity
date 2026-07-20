import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {VariantDeleteButton} from '../detail/VariantDeleteButton'

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

describe('VariantDeleteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
  })

  const renderDeleteButton = async ({
    documentCount = 0,
    documentsLoading = false,
  }: {
    documentCount?: number
    documentsLoading?: boolean
  } = {}) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(
      <VariantDeleteButton
        documentCount={documentCount}
        documentsLoading={documentsLoading}
        variant={variantAlphaAudience}
      />,
      {wrapper},
    )
    await screen.findByRole('button', {name: 'Delete variant definition'})
    return result
  }

  it('deletes the variant and navigates back to overview when confirmed', async () => {
    const user = userEvent.setup()

    await renderDeleteButton()

    // The delete icon button opens the confirm dialog directly (no overflow menu).
    await user.click(screen.getByRole('button', {name: 'Delete variant definition'}))
    await user.click(await screen.findByTestId('confirm-button'))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
      expect(mockNavigate).toHaveBeenCalledWith({})
    })
  })

  it('shows a loading state on the delete button while deleting', async () => {
    const user = userEvent.setup()
    const deleteDeferred = createDeferred()
    variantOperationsMock.deleteVariant.mockReturnValue(deleteDeferred.promise)

    await renderDeleteButton()

    const deleteButton = screen.getByRole('button', {name: 'Delete variant definition'})

    await user.click(deleteButton)
    await user.click(await screen.findByTestId('confirm-button'))

    await waitFor(() => {
      expect(deleteButton).toBeDisabled()
    })

    deleteDeferred.resolve()

    await waitFor(() => {
      expect(deleteButton).toBeEnabled()
    })
  })

  it('shows a toast and stays on the detail page when deletion fails', async () => {
    const error = new Error('delete failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.deleteVariant.mockRejectedValue(error)
    const user = userEvent.setup()

    await renderDeleteButton()

    await user.click(screen.getByRole('button', {name: 'Delete variant definition'}))
    await user.click(await screen.findByTestId('confirm-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to delete variant definition',
        }),
      )
    })
    expect(consoleError).toHaveBeenCalledWith(error)
    expect(mockNavigate).not.toHaveBeenCalled()

    consoleError.mockRestore()
  })

  it('disables delete when the variant has documents', async () => {
    await renderDeleteButton({documentCount: 1})

    expect(screen.getByRole('button', {name: 'Delete variant definition'})).toBeDisabled()
    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })

  it('disables delete while documents are loading', async () => {
    await renderDeleteButton({documentCount: 0, documentsLoading: true})

    expect(screen.getByRole('button', {name: 'Delete variant definition'})).toBeDisabled()
    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })
})
