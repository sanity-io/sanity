import {act, renderHook, waitFor} from '@testing-library/react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {useVariantDeleteAction} from '../useVariantDeleteAction'

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

vi.mock('../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

describe('useVariantDeleteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
  })

  const renderDeleteAction = async (options?: Parameters<typeof useVariantDeleteAction>[1]) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })

    return renderHook(() => useVariantDeleteAction(variantAlphaAudience._id, options), {wrapper})
  }

  it('deletes the variant when it has no documents', async () => {
    const onDeleted = vi.fn()
    const {result} = await renderDeleteAction({
      documentCount: 0,
      onDeleted,
      variantTitle: 'Alpha audience',
    })

    await waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    act(() => {
      result.current.handleDelete()
    })

    expect(result.current.isDeleteDialogOpen).toBe(true)
    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
      expect(onDeleted).toHaveBeenCalledTimes(1)
      expect(result.current.isDeleteDialogOpen).toBe(false)
    })
  })

  it('disables delete while documents are loading', async () => {
    const {result} = await renderDeleteAction({documentCount: 0, documentsLoading: true})

    expect(result.current.deleteDisabled).toBe(true)
    expect(result.current.deleteDisabledTooltip).toBeUndefined()
  })

  it('disables delete while the document count is unknown', async () => {
    const {result} = await renderDeleteAction({documentCount: undefined})

    expect(result.current.deleteDisabled).toBe(true)
    expect(result.current.deleteDisabledTooltip).toBeUndefined()
  })

  it('disables delete and exposes a singular tooltip when the variant has one document', async () => {
    const {result} = await renderDeleteAction({documentCount: 1})

    expect(result.current.deleteDisabled).toBe(true)
    expect(result.current.deleteDisabledTooltip).toBe(
      "This variant definition contains 1 document in it, it can't be removed until the documents have been removed.",
    )

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })

  it('disables delete and exposes a plural tooltip when the variant has multiple documents', async () => {
    const {result} = await renderDeleteAction({documentCount: 2})

    expect(result.current.deleteDisabled).toBe(true)
    expect(result.current.deleteDisabledTooltip).toBe(
      "This variant definition contains 2 documents in it, it can't be removed until the documents have been removed.",
    )
  })

  it('shows a toast when deletion fails', async () => {
    const error = new Error('delete failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.deleteVariant.mockRejectedValue(error)

    const {result} = await renderDeleteAction({documentCount: 0})

    act(() => {
      result.current.handleDelete()
    })

    await act(async () => {
      await result.current.handleConfirmDelete()
    })

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to delete variant definition',
        }),
      )
    })
    expect(consoleError).toHaveBeenCalledWith(error)

    consoleError.mockRestore()
  })
})
