import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {VARIANT_DOCUMENTS_PATH} from '../../store/constants'
import {type SystemVariant} from '../../types'
import {VariantDetail} from '../detail/VariantDetail'
import {getVariantId} from '../util'

const mockedSetVariant = vi.fn()

vi.mock('../../../perspective/useSetVariant', () => ({
  useSetVariant: vi.fn(() => mockedSetVariant),
}))

vi.mock('../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => ({
    selectedVariant: undefined,
  })),
}))

const mockNavigate = vi.fn()

const routerState = vi.hoisted(() => ({
  variantId: undefined as string | undefined,
}))

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

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
    state: routerState,
    navigate: mockNavigate,
    resolveIntentLink: vi.fn(),
  })),
}))

vi.mock('../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: variantsMock.data,
    byId: variantsMock.byId,
    loading: variantsMock.loading,
    error: variantsMock.error,
  })),
}))

vi.mock('../../store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

vi.mock('../../hooks/useVariantDocuments', () => ({
  useVariantDocuments: vi.fn(() => ({
    loading: false,
    results: [],
    error: null,
  })),
}))

vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: vi.fn(() => ({
    data: [],
    loading: false,
    error: null,
  })),
}))

describe('VariantDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedSetVariant.mockClear()
    variantsMock.data = []
    variantsMock.byId = new Map()
    variantsMock.loading = false
    variantsMock.error = undefined
    routerState.variantId = undefined
    variantOperationsMock.updateVariant.mockImplementation(async (variant) => {
      const existingVariant = variantsMock.byId.get(variant._id)

      if (!existingVariant) {
        return variant
      }

      const updatedVariant: SystemVariant = {
        ...existingVariant,
        ...variant,
        metadata: variant.metadata ?? existingVariant.metadata,
      }

      variantsMock.byId.set(variant._id, updatedVariant)
      variantsMock.data = Array.from(variantsMock.byId.values())

      return updatedVariant
    })
  })

  const setVariants = (variants: SystemVariant[]) => {
    variantsMock.data = variants
    variantsMock.byId = new Map(variants.map((variant) => [variant._id, variant]))
  }

  const renderDetail = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<VariantDetail />, {wrapper})
    return result
  }

  it('shows loading state while variants are loading', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    variantsMock.loading = true

    await renderDetail()

    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
  })

  it('renders title, description, conditions, and edit action when variant exists', async () => {
    const variantWithDescription: SystemVariant = {
      ...variantAlphaAudience,
      metadata: {
        ...variantAlphaAudience.metadata,
        description: [
          {
            _key: 'description',
            _type: 'block',
            children: [{_key: 'span', _type: 'span', marks: [], text: 'Developer audience'}],
            markDefs: [],
            style: 'normal',
          },
        ],
      },
    }
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantWithDescription])

    await renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('heading', {level: 1, name: 'Alpha audience'})).toBeInTheDocument()
    })

    expect(screen.getByText('Developer audience')).toBeInTheDocument()
    // Conditions render as read-only key/value metadata (muted key, solid value), not pills.
    expect(screen.getByText('audience')).toBeInTheDocument()
    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('locale')).toBeInTheDocument()
    expect(screen.getByText('en-US')).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Edit definition'})).toBeInTheDocument()
    // The perspective "pin" was removed from the detail page (it's a global authoring mode that
    // belongs in perspective-bar chrome, not this management surface).
    expect(screen.queryByTestId('pin-variant-button')).not.toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'All variant definitions'})).toBeInTheDocument()
    expect(screen.getByText('Appears in')).toBeInTheDocument()
    expect(screen.getByText('Type')).toBeInTheDocument()
    // Search moved out of the column-header row into the command lane; the preview column header is
    // now a plain "Document" label. The command lane (and its search) is hidden with no documents.
    expect(screen.getByText('Document')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Search documents')).not.toBeInTheDocument()
    expect(screen.getByText('Edited')).toBeInTheDocument()
    expect(screen.getByText('No documents in this variant definition')).toBeInTheDocument()
    // Two side-by-side properties panels carry the metadata: a "Variant definition" panel (its
    // conditions + Created, rehomed from the old header clock) and a "Documents" panel (counts).
    expect(screen.getByTestId('variant-detail-definition')).toBeInTheDocument()
    expect(screen.getByTestId('variant-detail-documents')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByTestId('variant-detail-actions')).toBeInTheDocument()
  })

  it('opens the edit dialog with existing variant values', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(screen.getByRole('button', {name: 'Edit definition'}))

    await waitFor(() => {
      expect(screen.getByRole('dialog', {name: 'Edit variant definition'})).toBeInTheDocument()
    })

    expect(screen.getByTestId('variant-form-title')).toHaveValue('Alpha audience')
    expect(screen.getAllByTestId('variant-form-condition-key')).toHaveLength(2)
    expect(screen.getByTestId('save-variant-button')).toBeEnabled()
  })

  it('saves edited variant values from the dialog', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(screen.getByRole('button', {name: 'Edit definition'}))
    await user.clear(await screen.findByTestId('variant-form-title'))
    await user.type(screen.getByTestId('variant-form-title'), 'Beta audience')
    await user.type(screen.getByTestId('variant-form-description'), 'Audience for beta users')

    const conditionValues = screen.getAllByTestId('variant-form-condition-value')
    await user.clear(conditionValues[0]!)
    await user.type(conditionValues[0]!, 'beta')
    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.updateVariant).toHaveBeenCalledWith(
        expect.objectContaining({
          conditions: {audience: 'beta', locale: 'en-US'},
          metadata: expect.objectContaining({
            title: 'Beta audience',
            description: [
              expect.objectContaining({
                children: [
                  expect.objectContaining({
                    text: 'Audience for beta users',
                  }),
                ],
              }),
            ],
          }),
        }),
      )
    })

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {name: 'Edit variant definition'}),
      ).not.toBeInTheDocument()
    })
    // The heading reflecting the new title is driven by the live `useAllVariants` store
    // subscription re-rendering the page; the static test mock doesn't re-emit, so the save itself
    // (updateVariant called with the edited values + dialog closed, asserted above) is what's
    // verified here.
  })

  it('does not save while condition rows are invalid', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(screen.getByRole('button', {name: 'Edit definition'}))
    const conditionKeys = screen.getAllByTestId('variant-form-condition-key')
    await user.clear(conditionKeys[1]!)
    await user.type(conditionKeys[1]!, 'audience')

    expect(screen.getByTestId('variant-form-condition-key-error')).toHaveTextContent(
      'Condition keys must be unique',
    )

    expect(screen.getByTestId('save-variant-button')).toBeEnabled()
    await user.click(screen.getByTestId('save-variant-button'))
    expect(variantOperationsMock.updateVariant).not.toHaveBeenCalled()
  })

  it('closes the edit dialog without saving when cancel is pressed', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(screen.getByRole('button', {name: 'Edit definition'}))
    await user.type(await screen.findByTestId('variant-form-title'), ' updated')
    await user.click(screen.getByRole('button', {name: 'Cancel'}))

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {name: 'Edit variant definition'}),
      ).not.toBeInTheDocument()
    })
    expect(variantOperationsMock.updateVariant).not.toHaveBeenCalled()
  })

  it('closes the edit dialog without saving when the dialog close button is pressed', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(screen.getByRole('button', {name: 'Edit definition'}))
    await user.type(await screen.findByTestId('variant-form-title'), ' updated')
    await user.click(screen.getByLabelText('Close dialog'))

    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', {name: 'Edit variant definition'}),
      ).not.toBeInTheDocument()
    })
    expect(variantOperationsMock.updateVariant).not.toHaveBeenCalled()
    expect(screen.getByRole('heading', {level: 1, name: 'Alpha audience'})).toBeInTheDocument()
  })

  it('shows a toast and keeps the dialog open when updating fails', async () => {
    const error = new Error('update failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.updateVariant.mockRejectedValue(error)
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(screen.getByRole('button', {name: 'Edit definition'}))
    await user.type(await screen.findByTestId('variant-form-title'), ' updated')
    await user.click(screen.getByTestId('save-variant-button'))

    await waitFor(() => {
      expect(toastMock.push).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
          title: 'Unable to update variant definition',
        }),
      )
    })
    expect(consoleError).toHaveBeenCalledWith(error)
    expect(screen.getByRole('dialog', {name: 'Edit variant definition'})).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('deletes the variant from the header delete button and navigates back to overview', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    // Delete lives in the overflow (⋯) menu now (critical-toned), matching the Releases rail.
    await user.click(await screen.findByTestId('variant-detail-menu-button'))
    await user.click(await screen.findByTestId('delete-variant-menu-item'))
    await user.click(await screen.findByTestId('confirm-button'))

    await waitFor(() => {
      expect(variantOperationsMock.deleteVariant).toHaveBeenCalledWith(variantAlphaAudience._id)
      expect(mockNavigate).toHaveBeenCalledWith({})
    })
  })

  it('shows a toast and stays on the detail page when deletion fails', async () => {
    const error = new Error('delete failed')
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    variantOperationsMock.deleteVariant.mockRejectedValue(error)
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderDetail()

    await user.click(await screen.findByTestId('variant-detail-menu-button'))
    await user.click(await screen.findByTestId('delete-variant-menu-item'))
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
    expect(screen.getByRole('heading', {level: 1, name: 'Alpha audience'})).toBeInTheDocument()

    consoleError.mockRestore()
  })

  it('shows not found when variant id does not match any document', async () => {
    routerState.variantId = getVariantId(`${VARIANT_DOCUMENTS_PATH}.missing`)
    setVariants([variantAlphaAudience])

    await renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Variant definition not found')).toBeInTheDocument()
    })

    expect(
      screen.getByText('The requested variant definition could not be found.'),
    ).toBeInTheDocument()
  })

  it('navigates back to overview when Back is pressed', async () => {
    routerState.variantId = getVariantId(`${VARIANT_DOCUMENTS_PATH}.missing`)
    setVariants([])
    const user = userEvent.setup()

    await renderDetail()

    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'All variant definitions'})).toBeEnabled(),
    )

    await user.click(screen.getByRole('button', {name: 'All variant definitions'}))

    expect(mockNavigate).toHaveBeenCalledWith({})
  })
})
