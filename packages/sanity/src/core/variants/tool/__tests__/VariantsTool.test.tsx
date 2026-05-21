import {render, screen, waitFor} from '@testing-library/react'
import {forwardRef, type HTMLProps} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {setupVirtualListEnv} from '../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId} from '../util'
import {VariantsTool} from '../VariantsTool'

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
    navigate: vi.fn(),
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
      <a
        {...rest}
        ref={ref}
        href={state?.variantId ? `/variants/${state.variantId}` : '/variants'}
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

setupVirtualListEnv()

describe('VariantsTool', () => {
  const renderTool = async () => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    const result = render(<VariantsTool />, {wrapper})
    return result
  }

  it('renders overview when router has no variantId', async () => {
    routerState.variantId = undefined
    variantsMock.data = [variantAlphaAudience]
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
    variantsMock.loading = false

    await renderTool()

    await waitFor(() => {
      expect(screen.getByRole('heading', {level: 1, name: 'Variants'})).toBeInTheDocument()
    })
  })

  it('renders detail when router state includes variantId', async () => {
    routerState.variantId = getVariantId(variantAlphaAudience._id)
    variantsMock.data = [variantAlphaAudience]
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
    variantsMock.loading = false

    await renderTool()

    await waitFor(() => {
      expect(screen.getByRole('heading', {level: 1, name: 'Alpha audience'})).toBeInTheDocument()
    })

    expect(screen.queryByPlaceholderText('Search variant definitions…')).not.toBeInTheDocument()
  })
})
