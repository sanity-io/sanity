import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {type SystemVariant} from '../../types'
import {VariantDetail} from '../detail/VariantDetail'
import {getVariantId} from '../util'

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

describe('VariantDetail', () => {
  beforeEach(() => {
    variantsMock.data = []
    variantsMock.byId = new Map()
    variantsMock.loading = false
    variantsMock.error = undefined
    routerState.variantId = undefined
    mockNavigate.mockClear()
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
    await flushMicrotasksThisIsACodeSmell()
    return result
  }

  it('shows loading state while variants are loading', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    variantsMock.loading = true

    await renderDetail()

    expect(screen.getByTestId('loading-block')).toBeInTheDocument()
  })

  it('renders title, description fallback, and placeholder when variant exists', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    setVariants([variantAlphaAudience])

    await renderDetail()

    await waitFor(() => {
      expect(screen.getByRole('heading', {level: 1, name: 'Alpha audience'})).toBeInTheDocument()
    })

    expect(screen.getByText('No description yet.')).toBeInTheDocument()
    expect(
      screen.getByText('Variant detail editing will be added in a future iteration.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Back to variants'})).toBeInTheDocument()
  })

  it('shows not found when variant id does not match any document', async () => {
    routerState.variantId = getVariantId('_.variants.missing')
    setVariants([variantAlphaAudience])

    await renderDetail()

    await waitFor(() => {
      expect(screen.getByText('Variant not found')).toBeInTheDocument()
    })

    expect(screen.getByText('The requested variant could not be found.')).toBeInTheDocument()
  })

  it('navigates back to overview when Back is pressed', async () => {
    routerState.variantId = getVariantId('_.variants.missing')
    setVariants([])
    const user = userEvent.setup()

    await renderDetail()

    await waitFor(() =>
      expect(screen.getByRole('button', {name: 'Back to variants'})).toBeEnabled(),
    )

    await user.click(screen.getByRole('button', {name: 'Back to variants'}))

    expect(mockNavigate).toHaveBeenCalledWith({})
  })
})
