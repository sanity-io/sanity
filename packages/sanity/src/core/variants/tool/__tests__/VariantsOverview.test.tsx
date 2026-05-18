import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {setupVirtualListEnv} from '../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience, variantNorwegianMarket} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {type SystemVariant} from '../../types'
import {VariantsOverview} from '../overview/VariantsOverview'

const mockNavigate = vi.fn()

const routerState = vi.hoisted(() => ({
  variantId: undefined as string | undefined,
}))

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
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
    loading: variantsMock.loading,
    error: variantsMock.error,
  })),
}))

setupVirtualListEnv()

describe('VariantsOverview', () => {
  beforeEach(() => {
    variantsMock.data = []
    variantsMock.loading = false
    variantsMock.error = undefined
    routerState.variantId = undefined
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderOverview = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<VariantsOverview />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()
    return result
  }

  it('renders title, description, create action, and search', async () => {
    variantsMock.data = [variantAlphaAudience]

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
    variantsMock.data = [variantAlphaAudience, variantNorwegianMarket]

    await renderOverview()

    await waitFor(() => {
      expect(screen.getAllByTestId('table-row')).toHaveLength(2)
    })

    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
    expect(screen.getByText('Norwegian market')).toBeInTheDocument()
    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('filters variants when searching by title or condition', async () => {
    variantsMock.data = [variantAlphaAudience, variantNorwegianMarket]
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
    variantsMock.data = [variantAlphaAudience]
    const user = userEvent.setup()

    await renderOverview()

    await waitFor(() => expect(screen.getAllByTestId('table-row')).toHaveLength(1))

    await user.click(screen.getByText('Alpha audience'))

    expect(mockNavigate).toHaveBeenCalledWith({
      variantId: encodeURIComponent(variantAlphaAudience._id),
    })
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
