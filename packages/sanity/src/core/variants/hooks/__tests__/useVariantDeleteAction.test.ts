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

const variantPermissionsMock = vi.hoisted(() => ({
  checkWithPermissionGuard: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  push: vi.fn(),
}))

vi.mock('@sanity/ui/toast', async (importOriginal) => ({
  ...(await importOriginal()),
  useToast: vi.fn(() => toastMock),
}))

vi.mock('../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

vi.mock('../../store/useVariantPermissions', () => ({
  useVariantPermissions: vi.fn(() => variantPermissionsMock),
}))

/** The `details` shape `@sanity/client` attaches to a refused action. */
function actionError(itemError: Record<string, unknown>) {
  return Object.assign(new Error('action failed'), {
    details: {
      type: 'mutationError',
      description: 'action failed',
      items: [{index: 0, error: itemError}],
    },
  })
}

describe('useVariantDeleteAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
    variantPermissionsMock.checkWithPermissionGuard.mockResolvedValue(true)
  })

  const renderDeleteAction = async (options?: Parameters<typeof useVariantDeleteAction>[1]) => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })

    let rendered!: ReturnType<typeof renderHook<ReturnType<typeof useVariantDeleteAction>, never>>
    // The permission dry run starts on mount and resolves asynchronously; mounting inside an
    // async act lets that first emission flush without React warning about un-acted updates.
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- see above
    await act(async () => {
      rendered = renderHook(() => useVariantDeleteAction(variantAlphaAudience._id, options), {
        wrapper,
      })
    })

    return rendered
  }

  it('checks delete permission with a dry run of the delete action', async () => {
    await renderDeleteAction({documentCount: 0})

    expect(variantPermissionsMock.checkWithPermissionGuard).toHaveBeenCalledWith(
      variantOperationsMock.deleteVariant,
      variantAlphaAudience._id,
    )
  })

  it('deletes the variant when it has no documents', async () => {
    const onDeleted = vi.fn()
    const {result} = await renderDeleteAction({
      documentCount: 0,
      onDeleted,
      variantTitle: 'Alpha audience',
    })

    await waitFor(() => {
      expect(result.current.deleteDisabled).toBe(false)
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

  it('disables delete until the permission check has answered', async () => {
    let resolvePermission!: (allowed: boolean) => void
    variantPermissionsMock.checkWithPermissionGuard.mockReturnValue(
      new Promise<boolean>((resolve) => {
        resolvePermission = resolve
      }),
    )

    const {result} = await renderDeleteAction({documentCount: 0})

    expect(result.current.deleteDisabled).toBe(true)
    expect(result.current.deleteDisabledTooltip).toBeUndefined()

    act(() => {
      result.current.handleDelete()
    })
    expect(result.current.isDeleteDialogOpen).toBe(false)

    await act(async () => {
      resolvePermission(true)
    })

    await waitFor(() => {
      expect(result.current.deleteDisabled).toBe(false)
    })
  })

  it('disables delete and explains when the user lacks permission', async () => {
    variantPermissionsMock.checkWithPermissionGuard.mockResolvedValue(false)

    const {result} = await renderDeleteAction({documentCount: 0})

    await waitFor(() => {
      expect(result.current.deleteDisabledTooltip).toBe(
        'You do not have permission to delete this variant definition',
      )
    })
    expect(result.current.deleteDisabled).toBe(true)

    act(() => {
      result.current.handleDelete()
    })
    expect(result.current.isDeleteDialogOpen).toBe(false)

    await act(async () => {
      await result.current.handleConfirmDelete()
    })
    expect(variantOperationsMock.deleteVariant).not.toHaveBeenCalled()
  })

  it('prefers the permission explanation over the document count when both apply', async () => {
    variantPermissionsMock.checkWithPermissionGuard.mockResolvedValue(false)

    const {result} = await renderDeleteAction({documentCount: 3})

    await waitFor(() => {
      expect(result.current.deleteDisabledTooltip).toBe(
        'You do not have permission to delete this variant definition',
      )
    })
  })

  it('disables delete while documents are loading', async () => {
    const {result} = await renderDeleteAction({
      documentCount: 0,
      documentsLoading: true,
    })

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

  describe('when deletion fails', () => {
    const confirmDelete = async (error: unknown) => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      variantOperationsMock.deleteVariant.mockRejectedValue(error)

      const {result} = await renderDeleteAction({documentCount: 0})

      await waitFor(() => {
        expect(result.current.deleteDisabled).toBe(false)
      })

      act(() => {
        result.current.handleDelete()
      })

      await act(async () => {
        await result.current.handleConfirmDelete()
      })

      await waitFor(() => {
        expect(toastMock.push).toHaveBeenCalledTimes(1)
      })
      expect(consoleError).toHaveBeenCalledWith(error)
      consoleError.mockRestore()

      return toastMock.push.mock.calls[0][0]
    }

    it('shows a generic toast', async () => {
      const toast = await confirmDelete(new Error('delete failed'))

      expect(toast).toEqual(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to delete variant definition',
          description: undefined,
        }),
      )
    })

    it('explains that the definition still contains documents when the server refuses for that reason', async () => {
      // The client-side count said 0 (it trails the server); the server knows better.
      const toast = await confirmDelete(
        actionError({
          type: 'documentHasExistingReferencesError',
          id: variantAlphaAudience._id,
          referencingIDs: [
            'versions.scopeA.article-1',
            'versions.scopeA.article-1',
            'versions.scopeB.article-2',
          ],
        }),
      )

      expect(toast).toEqual(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to delete variant definition',
          description:
            "This variant definition contains 2 documents in it, it can't be removed until the documents have been removed.",
        }),
      )
    })

    it('uses the singular copy for a single referencing document', async () => {
      const toast = await confirmDelete(
        actionError({
          type: 'documentHasExistingReferencesError',
          id: variantAlphaAudience._id,
          referencingIDs: ['versions.scopeA.article-1'],
        }),
      )

      expect(toast.description).toBe(
        "This variant definition contains 1 document in it, it can't be removed until the documents have been removed.",
      )
    })

    it('explains a permission refusal', async () => {
      const toast = await confirmDelete(
        actionError({type: 'insufficientPermissionsError', permission: 'delete'}),
      )

      expect(toast.description).toBe('You do not have permission to delete this variant definition')
    })
  })
})
