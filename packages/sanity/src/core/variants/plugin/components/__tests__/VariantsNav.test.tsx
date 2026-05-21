import {render, screen, waitFor, within} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {forwardRef, type HTMLProps} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantId} from '../../../tool/util'
import {type SystemVariant} from '../../../types'
import {VariantsNav} from '../VariantsNav'

const mockNavigate = vi.fn()

const routerMock = vi.hoisted(() => ({
  stickyParams: {} as Record<string, string | undefined>,
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
    stickyParams: routerMock.stickyParams,
    navigate: mockNavigate,
    resolvePathFromState: vi.fn(({tool, variantId}: {tool?: string; variantId?: string}) => {
      if (tool === 'variants' && variantId) {
        return `/variants/${variantId}`
      }
      return '/'
    }),
  })),
  StateLink: forwardRef(function MockStateLink(
    {state, ...rest}: {state?: {tool?: string; variantId?: string}} & HTMLProps<HTMLAnchorElement>,
    ref,
  ) {
    const href =
      state?.tool === 'variants' && state.variantId ? `/variants/${state.variantId}` : '/'
    return <a {...rest} ref={ref} href={href} />
  }),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: variantsMock.data,
    byId: variantsMock.byId,
    loading: variantsMock.loading,
    error: variantsMock.error,
  })),
}))

describe('VariantsNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMock.stickyParams = {}
    variantsMock.data = [variantAlphaAudience, variantNorwegianMarket]
    variantsMock.byId = new Map([
      [variantAlphaAudience._id, variantAlphaAudience],
      [variantNorwegianMarket._id, variantNorwegianMarket],
    ])
    variantsMock.loading = false
    variantsMock.error = undefined
  })

  const renderNav = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const view = render(<VariantsNav />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()
    return view
  }

  const openMenu = async () => {
    const user = userEvent.setup()
    await user.click(screen.getByTestId('variants-nav-menu-button'))
    await waitFor(() => {
      expect(screen.getByTestId('variants-nav-menu')).toBeInTheDocument()
    })
    return user
  }

  it('renders the default label when no variant is selected', async () => {
    await renderNav()

    expect(screen.getByTestId('variants-nav-label')).toHaveTextContent('All users (Default)')
    expect(screen.queryByTestId('variants-nav-label-link')).not.toBeInTheDocument()
  })

  it('shows default label until the selected variant is resolved', async () => {
    variantsMock.loading = true
    variantsMock.byId = new Map()
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNav()

    expect(screen.getByTestId('variants-nav-label')).toHaveTextContent('All users (Default)')
    expect(screen.queryByTestId('variants-nav-label-link')).not.toBeInTheDocument()
  })

  it('lists the default item and other variants in the menu', async () => {
    await renderNav()
    await openMenu()

    const menu = screen.getByTestId('variants-nav-menu')
    expect(within(menu).getByText('All users (Default)')).toBeInTheDocument()
    expect(within(menu).getByText('Other variants')).toBeInTheDocument()
    expect(within(menu).getByText('Alpha audience')).toBeInTheDocument()
    expect(within(menu).getByText('Norwegian market')).toBeInTheDocument()
  })

  it('selects a variant via sticky params', async () => {
    await renderNav()
    const user = await openMenu()

    await user.click(screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`))

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: getVariantId(variantAlphaAudience._id),
      },
    })
  })

  it('shows selected state in the navbar and menu when a variant is selected', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNav()
    const user = await openMenu()

    expect(screen.getByTestId('variants-nav-label-link')).toHaveTextContent('Alpha audience')

    const defaultItem = screen.getByTestId('variant-default')
    expect(defaultItem).not.toHaveAttribute('data-selected')

    const selectedItem = screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)
    expect(selectedItem).toHaveAttribute('data-selected')
  })

  it('links to the variant detail page when a variant is selected', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNav()

    expect(screen.getByTestId('variants-nav-label-link')).toHaveAttribute(
      'href',
      `/variants/${getVariantId(variantAlphaAudience._id)}`,
    )
  })

  it('clears selection when choosing the default option', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNav()
    const user = await openMenu()

    await user.click(screen.getByTestId('variant-default'))

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: null,
      },
    })
  })

  it('filters variants in the menu', async () => {
    await renderNav()
    const user = await openMenu()

    await user.type(screen.getByPlaceholderText('Filter variants…'), 'Norwegian')

    const menu = screen.getByTestId('variants-nav-menu')
    expect(within(menu).queryByText('Alpha audience')).not.toBeInTheDocument()
    expect(within(menu).getByText('Norwegian market')).toBeInTheDocument()
  })

  it('shows default as selected when sticky variant does not exist', async () => {
    routerMock.stickyParams = {variant: 'missing-variant'}

    await renderNav()
    await openMenu()

    expect(screen.getByTestId('variants-nav-label')).toHaveTextContent('All users (Default)')
    expect(screen.getByTestId('variant-default')).toHaveAttribute('data-selected')
  })

  it('clears the filter when the menu is closed without selecting', async () => {
    await renderNav()
    const user = await openMenu()

    const filterInput = screen.getByPlaceholderText('Filter variants…')
    await user.type(filterInput, 'Norwegian')
    expect(filterInput).toHaveValue('Norwegian')

    await user.click(screen.getByTestId('variants-nav-menu-button'))

    await waitFor(() => {
      expect(screen.getByTestId('variants-nav-menu-button')).toHaveAttribute(
        'aria-expanded',
        'false',
      )
    })

    await user.click(screen.getByTestId('variants-nav-menu-button'))
    await waitFor(() => {
      expect(screen.getByTestId('variants-nav-menu')).toBeInTheDocument()
    })

    expect(screen.getByPlaceholderText('Filter variants…')).toHaveValue('')
    expect(screen.getByText('Alpha audience')).toBeInTheDocument()
  })
})
