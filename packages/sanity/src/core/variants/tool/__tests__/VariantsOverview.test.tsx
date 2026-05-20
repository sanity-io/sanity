import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type Ref, forwardRef, type HTMLProps} from 'react'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {setupVirtualListEnv} from '../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience, variantNorwegianMarket} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {type EditableSystemVariant, type SystemVariant} from '../../types'
import {VariantsOverview} from '../overview/VariantsOverview'
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

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    state: routerState,
    navigate: mockNavigate,
    resolveIntentLink: vi.fn(),
    resolvePathFromState: vi.fn(({variantId}: {variantId?: string}) =>
      variantId ? `/variants/${variantId}` : '/variants',
    ),
  })),
  StateLink: forwardRef(function MockStateLink(
    {state, ...rest}: {state?: {variantId?: string}} & HTMLProps<HTMLAnchorElement>,
    ref,
  ) {
    return (
      // oxlint-disable-next-line jsx_a11y/anchor-has-content
      <a
        {...rest}
        ref={ref as Ref<HTMLAnchorElement>}
        href={state?.variantId ? `/variants/${state.variantId}` : '/variants'}
        onClick={(event) => {
          event.preventDefault()
          mockNavigate(state)
        }}
      />
    )
  }),
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

setupVirtualListEnv()

describe('VariantsOverview', () => {
  beforeEach(() => {
    variantsMock.data = []
    variantsMock.byId = new Map()
    variantsMock.loading = false
    variantsMock.error = undefined
    routerState.variantId = undefined
    mockNavigate.mockClear()
    variantOperationsMock.createVariant.mockReset()
    variantOperationsMock.deleteVariant.mockReset()
    variantOperationsMock.createVariant.mockImplementation(
      async (variant: EditableSystemVariant) => ({
        ...variant,
        _createdAt: '2025-01-01T00:00:00Z',
        _updatedAt: '2025-01-01T00:00:00Z',
        _rev: 'rev-1',
      }),
    )
    variantOperationsMock.deleteVariant.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderOverview = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const view = render(<VariantsOverview />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()
    return view
  }

  const setVariants = (variants: SystemVariant[]) => {
    variantsMock.data = variants
    variantsMock.byId = new Map(variants.map((variant) => [variant._id, variant]))
  }

  it('renders title, description, create action, and search', async () => {
    setVariants([variantAlphaAudience])

    await renderOverview()

    expect(screen.getByRole('heading', {level: 1, name: 'Variants'})).toBeInTheDocument()
    expect(
      screen.getByText(
        'Manage variant definitions that control how content is personalized for different audiences, locales, and segments.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Search variant definitions…')).toBeInTheDocument()
  })

  it('lists variants in the virtualized table', async () => {
    setVariants([variantAlphaAudience, variantNorwegianMarket])

    await renderOverview()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
    expect(screen.getByText('Norwegian market')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('filters variants when searching by title or condition', async () => {
    setVariants([variantAlphaAudience, variantNorwegianMarket])
    const user = userEvent.setup()

    await renderOverview()

    await waitFor(() => expect(screen.getAllByTestId('table-row')).toHaveLength(2))

    const search = screen.getByPlaceholderText('Search variant definitions…')
    await user.type(search, 'Norwegian')

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
    })

    expect(screen.getByText('Norwegian market')).toBeInTheDocument()
    expect(screen.queryByText('Alpha audience')).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'nb-no')

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(1)
    })

    within(screen.getAllByTestId('table-row')[0]!).getByText('Norwegian market')
  })

  it('navigates to variant detail when a row title is activated', async () => {
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderOverview()

    await waitFor(() => expect(screen.getAllByTestId('table-row')).toHaveLength(1))

    await user.click(screen.getByText('Alpha audience'))

    expect(mockNavigate).toHaveBeenCalledWith({
      variantId: getVariantId(variantAlphaAudience._id),
    })
  })

  it('deletes a variant from the row actions menu', async () => {
    setVariants([variantAlphaAudience])
    const user = userEvent.setup()

    await renderOverview()

    await waitFor(() => expect(screen.getAllByTestId('table-row')).toHaveLength(1))

    const menuButton = screen
      .getAllByRole('button')
      .find((button) => button.id === 'variant-actions-alpha-audience')

    if (!menuButton) throw new Error('Variant actions menu button not found')

    await user.click(menuButton)
    await user.click(await screen.findByText('Delete variant'))
  })

  it('shows empty state when there are no variants', async () => {
    variantsMock.data = []

    await renderOverview()

    await waitFor(() => {
      expect(screen.getByTestId('variants-empty-state')).toBeInTheDocument()
    })

    expect(screen.getByTestId('variant-illustration')).toBeInTheDocument()
    expect(screen.getByTestId('no-variants-info-text')).toHaveTextContent('Variants')
    const emptyState = screen.getByTestId('variants-empty-state')
    expect(within(emptyState).getByRole('button', {name: 'Create variant'})).toBeInTheDocument()
    expect(within(emptyState).getByRole('link', {name: 'Documentation'})).toHaveAttribute(
      'href',
      'https://www.sanity.io/docs/content-variants',
    )
  })

  it('shows loading skeleton rows while variants are loading', async () => {
    variantsMock.data = []
    variantsMock.loading = true

    await renderOverview()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row-skeleton')).toHaveLength(3)
    })
  })

  it('opens the create variant dialog and navigates after submit', async () => {
    const user = userEvent.setup()

    await renderOverview()

    await user.click(screen.getAllByRole('button', {name: 'Create variant'})[0]!)

    expect(screen.getByRole('dialog', {name: 'Create variant'})).toBeInTheDocument()

    await user.type(screen.getByTestId('variant-form-title'), 'Loyal customers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'audience')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'loyal-customers')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })

    const createdVariant = variantOperationsMock.createVariant.mock
      .calls[0]![0] as EditableSystemVariant

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({
        variantId: getVariantId(createdVariant._id),
      })
    })
  })

  it('shows error copy in the table empty state when load fails with no data', async () => {
    variantsMock.data = []
    variantsMock.loading = false
    variantsMock.error = new Error('network')

    await renderOverview()

    await waitFor(() => {
      expect(screen.getAllByText('Unable to load variants').length).toBeGreaterThanOrEqual(1)
    })
  })
})
