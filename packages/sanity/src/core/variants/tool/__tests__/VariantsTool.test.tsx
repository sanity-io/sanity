import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act, type HTMLProps} from 'react'
import {VariantsModePromiseContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {setupVirtualListEnv} from '../../../../../test/testUtils/setupVirtualListEnv'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {useUpsellData} from '../../../hooks/useUpsellData'
import {variantAlphaAudience} from '../../__fixtures__/variants.fixture'
import {variantsUpsellData$} from '../../__fixtures__/variantsUpsellData'
import {type VariantsMode} from '../../contexts/mode/types'
import {VariantsUpsellProvider} from '../../contexts/upsell/VariantsUpsellProvider'
import {variantsUsEnglishLocaleBundle} from '../../i18n'
import {type SystemVariant} from '../../types'
import {getVariantId} from '../util'
import VariantsTool from '../VariantsTool'

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
  StateLink: function MockStateLink({
    ref,
    state,
    ...rest
  }: {state?: {variantId?: string}} & HTMLProps<HTMLAnchorElement>) {
    return (
      <a
        {...rest}
        ref={ref}
        href={state?.variantId ? `/variants/${state.variantId}` : '/variants'}
      />
    )
  },
}))

vi.mock('../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: variantsMock.data,
    byId: variantsMock.byId,
    loading: variantsMock.loading,
    error: variantsMock.error,
  })),
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

setupVirtualListEnv()

// `createTestProvider` mocks `useUpsellData` with no content. These tests render the panel and
// dialog, so they answer with the journey document the endpoint publishes.
const useUpsellDataMock = vi.mocked(useUpsellData)

const telemetryLogs = {
  dialogViewed: vi.fn(),
  dialogDismissed: vi.fn(),
  dialogPrimaryClicked: vi.fn(),
  dialogSecondaryClicked: vi.fn(),
  panelViewed: vi.fn(),
  panelDismissed: vi.fn(),
  panelPrimaryClicked: vi.fn(),
  panelSecondaryClicked: vi.fn(),
}

/** A mode promise that has already settled, which `use()` reads without suspending */
function settledMode(mode: VariantsMode): Promise<VariantsMode> {
  return Object.assign(Promise.resolve(mode), {status: 'fulfilled' as const, value: mode})
}

function setVariants(variants: SystemVariant[]) {
  variantsMock.data = variants
  variantsMock.byId = new Map(variants.map((variant) => [variant._id, variant]))
}

describe('VariantsTool', () => {
  beforeEach(() => {
    useUpsellDataMock.mockReturnValue({upsellData$: variantsUpsellData$, telemetryLogs})
  })

  const renderTool = async (mode: VariantsMode = 'default') => {
    const wrapper = await createTestProvider({
      resources: [variantsUsEnglishLocaleBundle],
    })
    // The overview reads the mode with `use()`; a sync `render` act drops the commit's passive
    // effects once a render has called `use()` on a thenable, so mount inside an awaited act
    // oxlint-disable-next-line testing-library/no-unnecessary-act -- see above
    await act(async () => {
      render(
        <VariantsModePromiseContext value={settledMode(mode)}>
          <VariantsUpsellProvider>
            <VariantsTool />
          </VariantsUpsellProvider>
        </VariantsModePromiseContext>,
        {wrapper},
      )
    })
  }

  it('renders overview when router has no variantId', async () => {
    routerState.variantId = undefined
    variantsMock.data = [variantAlphaAudience]
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
    variantsMock.loading = false

    await renderTool()

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {level: 1, name: 'Variant definitions'}),
      ).toBeInTheDocument()
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

  describe('when the plan lacks content variants', () => {
    it('shows the upsell panel and keeps the create button when there are no definitions', async () => {
      routerState.variantId = undefined
      setVariants([])

      await renderTool('upsell')

      expect(await screen.findByTestId('variants-upsell-panel')).toBeInTheDocument()
      expect(
        screen.getByRole('heading', {level: 2, name: 'Upgrade to create variant definitions'}),
      ).toBeInTheDocument()
      expect(screen.getByRole('link', {name: 'Talk to sales'})).toHaveAttribute(
        'href',
        'https://www.sanity.io/contact/sales?ref=content-variants-studio-upsell',
      )
      expect(
        screen.getByRole('heading', {level: 1, name: 'Variant definitions'}),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', {name: 'New variant definition'})).toBeInTheDocument()
      expect(screen.queryByTestId('variants-empty-state')).not.toBeInTheDocument()
    })

    it('keeps listing the definitions that already exist', async () => {
      routerState.variantId = undefined
      setVariants([variantAlphaAudience])

      await renderTool('upsell')

      expect(await screen.findByText('Alpha audience')).toBeInTheDocument()
      expect(screen.queryByTestId('variants-upsell-panel')).not.toBeInTheDocument()
    })

    it('renders the detail page of a definition that already exists', async () => {
      routerState.variantId = getVariantId(variantAlphaAudience._id)
      setVariants([variantAlphaAudience])

      await renderTool('upsell')

      expect(
        await screen.findByRole('heading', {level: 1, name: 'Alpha audience'}),
      ).toBeInTheDocument()
      expect(screen.getByTestId('edit-variant-button')).toBeEnabled()
      expect(screen.queryByTestId('variants-upsell-panel')).not.toBeInTheDocument()
    })

    it('opens the upsell dialog instead of the create dialog from the create button', async () => {
      routerState.variantId = undefined
      setVariants([variantAlphaAudience])
      const user = userEvent.setup()

      await renderTool('upsell')

      await user.click(await screen.findByRole('button', {name: 'New variant definition'}))

      expect(
        await screen.findByRole('heading', {
          level: 2,
          name: 'Upgrade to create variant definitions',
        }),
      ).toBeInTheDocument()
      expect(
        screen.queryByRole('dialog', {name: 'Create variant definition'}),
      ).not.toBeInTheDocument()
    })
  })

  describe('when the feature check failed', () => {
    it('shows the unavailable notice when there are no definitions', async () => {
      routerState.variantId = undefined
      setVariants([])

      await renderTool(null)

      expect(await screen.findByTestId('variants-unavailable')).toHaveTextContent(
        'Variants are unavailable right now. Try again later.',
      )
      expect(screen.queryByTestId('variants-upsell-panel')).not.toBeInTheDocument()
    })

    it('keeps listing existing definitions and blocks creation with an error toast', async () => {
      routerState.variantId = undefined
      setVariants([variantAlphaAudience])
      const user = userEvent.setup()

      await renderTool(null)

      expect(await screen.findByText('Alpha audience')).toBeInTheDocument()

      await user.click(screen.getByRole('button', {name: 'New variant definition'}))

      expect(await screen.findByText('Unable to perform this action')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
