import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {type ReactNode} from 'react'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import * as variantConditions from '../../../hooks/useVariantConditions'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantId} from '../../../tool/util'
import {VariantsStudioNavbarLayout} from '../VariantsStudioNavbarLayout'

const mockNavigate = vi.fn()

const routerMock = vi.hoisted(() => ({
  stickyParams: {} as Record<string, string | undefined>,
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    stickyParams: routerMock.stickyParams,
    navigate: mockNavigate,
  })),
}))

vi.mock('../VariantsMenu', () => ({
  VariantsMenu: ({trigger}: {trigger: ReactNode}) => (
    <div data-testid="variants-menu">{trigger}</div>
  ),
}))

// The layout lazy-loads the filters behind a Suspense fallback, so wait for them to appear.
async function renderNavbar() {
  const wrapper = await createTestProvider({
    resources: [variantsUsEnglishLocaleBundle],
  })
  const view = render(<VariantsStudioNavbarLayout />, {wrapper})
  await screen.findByTestId('variants-nav-menu-button')
  await flushMicrotasksThisIsACodeSmell()
  return view
}

describe('VariantsStudioNavbarLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMock.stickyParams = {}
  })

  it('hides the remove control when the variant is at the default', async () => {
    await renderNavbar()

    expect(screen.queryByTestId('global-perspective-button-clear')).not.toBeInTheDocument()
  })

  it('shows the remove control when a variant is selected', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNavbar()

    expect(screen.getByRole('button', {name: 'Clear selection'})).toBeInTheDocument()
  })

  it('shows the remove control when the sticky variant is set but not resolved in the store', async () => {
    routerMock.stickyParams = {variant: 'missing-variant'}

    await renderNavbar()

    expect(screen.getByRole('button', {name: 'Clear selection'})).toBeInTheDocument()
  })

  it('renders one menu per resolved variant type', async () => {
    const spy = vi.spyOn(variantConditions, 'useVariantTypes').mockReturnValue({
      status: 'ready',
      types: [
        {key: 'variant', label: 'Variant', conditions: {mode: 'freeform'}},
        {key: 'language', label: 'Language', conditions: {mode: 'freeform'}},
      ],
    })

    await renderNavbar()

    expect(screen.getByTestId('variants-nav-menu-button')).toBeInTheDocument()
    expect(screen.getByTestId('variants-nav-menu-button-language')).toBeInTheDocument()
    expect(screen.getAllByTestId('variants-menu')).toHaveLength(2)
    spy.mockRestore()
  })

  it('clears the variant when the remove control is clicked', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNavbar()

    const user = userEvent.setup()
    await user.click(screen.getByTestId('global-perspective-button-clear'))

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        variant: null,
      },
    })
  })
})
