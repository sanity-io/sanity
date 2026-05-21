import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {usePerspectiveMockReturn} from '../../../../perspective/__mocks__/usePerspective.mock'
import {activeASAPRelease} from '../../../../releases/__fixtures__/release.fixture'
import {variantAlphaAudience} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantId} from '../../../tool/util'
import {type SystemVariant} from '../../../types'
import {VariantsStudioNavbar} from '../VariantsStudioNavbar'

const mockNavigate = vi.fn()

const routerMock = vi.hoisted(() => ({
  stickyParams: {} as Record<string, string | undefined>,
}))

const variantsMock = vi.hoisted(() => ({
  byId: new Map<string, SystemVariant>(),
}))

vi.mock('sanity/router', async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: vi.fn(() => ({
    stickyParams: routerMock.stickyParams,
    navigate: mockNavigate,
  })),
}))

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    byId: variantsMock.byId,
  })),
}))

vi.mock('../../../../perspective/usePerspective', () => ({
  usePerspective: vi.fn(() => usePerspectiveMockReturn),
}))

vi.mock('../../../../perspective/navbar/ReleasesNav', () => ({
  ReleasesNav: () => <div data-testid="releases-nav" />,
}))

vi.mock('../VariantsNav', () => ({
  VariantsNav: () => <div data-testid="variants-nav" />,
}))

describe('VariantsStudioNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routerMock.stickyParams = {}
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
    usePerspectiveMockReturn.selectedPerspective = 'drafts'
  })

  const renderNavbar = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const view = render(<VariantsStudioNavbar renderDefault={() => null} />, {wrapper})
    await flushMicrotasksThisIsACodeSmell()
    return view
  }

  it('does not show clear when version and variant are at default', async () => {
    await renderNavbar()

    expect(screen.queryByTestId('view-as-clear-button')).not.toBeInTheDocument()
  })

  it('shows clear when a non-default perspective is selected', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeASAPRelease

    await renderNavbar()

    expect(screen.getByTestId('view-as-clear-button')).toBeInTheDocument()
  })

  it('shows clear when a variant is selected', async () => {
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNavbar()

    expect(screen.getByTestId('view-as-clear-button')).toBeInTheDocument()
  })

  it('clears version and variant when clear is clicked', async () => {
    usePerspectiveMockReturn.selectedPerspective = activeASAPRelease
    routerMock.stickyParams = {variant: getVariantId(variantAlphaAudience._id)}

    await renderNavbar()

    const user = userEvent.setup()
    await user.click(screen.getByTestId('view-as-clear-button'))

    expect(mockNavigate).toHaveBeenCalledWith({
      stickyParams: {
        excludedPerspectives: null,
        perspective: '',
        variant: null,
      },
    })
  })
})
