import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {act} from 'react'
import {VariantsModePromiseContext} from 'sanity/_singletons'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type SingleWorkspace} from '../../../../config/types'
import {useUpsellData} from '../../../../hooks/useUpsellData'
import {perspectiveContextValueMock} from '../../../../perspective/__mocks__/usePerspective.mock'
import {variantAlphaAudience} from '../../../../variants/__fixtures__/variants.fixture'
import {variantsUpsellData$} from '../../../../variants/__fixtures__/variantsUpsellData'
import {type VariantsMode} from '../../../../variants/contexts/mode/types'
import {VariantsUpsellProvider} from '../../../../variants/contexts/upsell/VariantsUpsellProvider'
import {variantsUsEnglishLocaleBundle} from '../../../../variants/i18n'
import {VARIANTS_INTENT} from '../../../../variants/plugin'
import {getVariantId} from '../../../../variants/tool/util'
import {type SystemVariant} from '../../../../variants/types'
import {DEFAULT_VARIANT_TYPE_KEY} from '../../../../variants/util/variantType'
import {VariantsMenu} from '../VariantsMenu'

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

const setVariant = vi.fn()

const variantOperationsMock = vi.hoisted(() => ({
  createVariant: vi.fn(),
  updateVariant: vi.fn(),
  deleteVariant: vi.fn(),
}))

vi.mock('../../../../perspective/useSetVariant', () => ({
  useSetVariant: vi.fn(() => setVariant),
}))

vi.mock('../../../../variants/store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => variantsMock),
}))

vi.mock('../../../../variants/store/useVariantOperations', () => ({
  useVariantOperations: vi.fn(() => variantOperationsMock),
}))

// `createTestProvider` mocks `useUpsellData` with no content. The upsell-mode test renders the
// dialog, so it answers with the journey document the endpoint publishes.
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

async function renderMenuInMode(mode: VariantsMode) {
  const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
  const settledMode = Object.assign(Promise.resolve(mode), {
    status: 'fulfilled' as const,
    value: mode,
  })
  // The new audience item reads the mode with `use()`; a sync `render` act drops the commit's
  // passive effects once a render has called `use()` on a thenable, so mount inside an awaited act
  // oxlint-disable-next-line testing-library/no-unnecessary-act -- see above
  await act(async () => {
    render(
      <VariantsModePromiseContext value={settledMode}>
        <VariantsUpsellProvider>
          <VariantsMenu trigger={<button type="button">Open variants</button>} />
        </VariantsUpsellProvider>
      </VariantsModePromiseContext>,
      {wrapper},
    )
  })
  await userEvent.setup().click(await screen.findByRole('button', {name: 'Open variants'}))
  await screen.findByTestId('variants-nav-menu')
}

describe('VariantsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useUpsellDataMock.mockReturnValue({upsellData$: variantsUpsellData$, telemetryLogs})
    variantOperationsMock.createVariant.mockResolvedValue(undefined)
    variantsMock.data = [variantAlphaAudience]
    variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
    perspectiveContextValueMock.selectedVariants = []
    perspectiveContextValueMock.selectedVariantNames = []
  })

  const renderMenu = async (config?: Partial<SingleWorkspace>, typeKey?: string) => {
    const wrapper = await createTestProvider({
      config,
      resources: [variantsUsEnglishLocaleBundle],
    })
    const view = render(
      <VariantsMenu trigger={<button type="button">Open variants</button>} typeKey={typeKey} />,
      {wrapper},
    )
    await userEvent.setup().click(await screen.findByRole('button', {name: 'Open variants'}))
    await screen.findByTestId(
      !typeKey || typeKey === DEFAULT_VARIANT_TYPE_KEY
        ? 'variants-nav-menu'
        : `variants-nav-menu-${typeKey}`,
    )
    return view
  }

  it('marks the variant selected by the perspective provider', async () => {
    perspectiveContextValueMock.selectedVariants = [variantAlphaAudience]
    perspectiveContextValueMock.selectedVariantNames = [getVariantId(variantAlphaAudience._id)]

    await renderMenu()

    expect(screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)).toHaveAttribute(
      'data-selected',
    )
    expect(screen.getByTestId('variant-default')).not.toHaveAttribute('data-selected')
  })

  it('links view all to the variants tool overview', async () => {
    await renderMenu()

    expect(screen.getByTestId('view-all')).toHaveAttribute('href', `/intent/${VARIANTS_INTENT}`)
  })

  it('names the unselected option Default', async () => {
    await renderMenu()

    expect(screen.getByTestId('variant-default')).toHaveTextContent('Default')
  })

  it('filters the default option with the rest of the list', async () => {
    const user = userEvent.setup()

    await renderMenu()

    await user.type(screen.getByPlaceholderText('Find audience'), 'alpha')

    expect(screen.queryByTestId('variant-default')).not.toBeInTheDocument()
    expect(
      screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`),
    ).toBeInTheDocument()
  })

  it('keeps the default option when the query matches its label', async () => {
    const user = userEvent.setup()

    await renderMenu()

    await user.type(screen.getByPlaceholderText('Find audience'), 'default')

    expect(screen.getByTestId('variant-default')).toBeInTheDocument()
    expect(
      screen.queryByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('perspective-filter-no-matches')).not.toBeInTheDocument()
  })

  it('shows a message when the filter matches nothing', async () => {
    const user = userEvent.setup()

    await renderMenu()

    await user.type(screen.getByPlaceholderText('Find audience'), 'zzz')

    expect(screen.getByTestId('perspective-filter-no-matches')).toHaveTextContent(
      'Nothing matches "zzz"',
    )
    expect(screen.queryByTestId('variant-default')).not.toBeInTheDocument()
    expect(
      screen.queryByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`),
    ).not.toBeInTheDocument()
  })

  it('shows a mismatch error when a stored condition is not in the configured list', async () => {
    await renderMenu({
      beta: {
        variants: {
          enabled: true,
          types: {variant: {conditions: [{name: 'locale', values: ['en-US']}]}},
        },
      },
    })

    expect(screen.getByTestId('variant-condition-mismatch')).toBeInTheDocument()
  })

  it('does not show a mismatch error in freeform mode', async () => {
    await renderMenu()

    expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()
  })

  it('does not show a mismatch error while configured conditions are loading', async () => {
    await renderMenu({
      beta: {
        variants: {
          enabled: true,
          types: {variant: {conditions: () => new Promise(() => undefined)}},
        },
      },
    })

    await waitFor(() => {
      expect(
        screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`),
      ).toBeInTheDocument()
    })

    expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()
  })

  it('opens the create form for the menu type and selects the created variant', async () => {
    const user = userEvent.setup()

    await renderMenu(undefined, 'language')

    await user.click(screen.getByTestId('new-audience'))

    expect(
      await screen.findByRole('dialog', {name: 'Create variant definition'}),
    ).toBeInTheDocument()

    await user.type(screen.getByTestId('variant-form-title'), 'Spanish readers')
    await user.type(screen.getByTestId('variant-form-condition-key'), 'locale')
    await user.type(screen.getByTestId('variant-form-condition-value'), 'es')
    await user.click(screen.getByTestId('submit-variant-button'))

    await waitFor(() => {
      expect(variantOperationsMock.createVariant).toHaveBeenCalledTimes(1)
    })

    const createdVariant = variantOperationsMock.createVariant.mock.calls[0]![0]

    expect(createdVariant.metadata.type).toBe('language')
    expect(setVariant).toHaveBeenCalledWith({
      type: 'language',
      variantId: createdVariant._id,
    })
    expect(
      screen.queryByRole('dialog', {name: 'Create variant definition'}),
    ).not.toBeInTheDocument()
  })

  describe('gated on the content variants feature', () => {
    it('opens the upsell dialog instead of the create form when the plan lacks variants', async () => {
      const user = userEvent.setup()

      await renderMenuInMode('upsell')
      await user.click(screen.getByTestId('new-audience'))

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

    it('opens the create form when the plan has variants', async () => {
      const user = userEvent.setup()

      await renderMenuInMode('default')
      await user.click(screen.getByTestId('new-audience'))

      expect(
        await screen.findByRole('dialog', {name: 'Create variant definition'}),
      ).toBeInTheDocument()
    })

    it('leaves out the new audience item when the feature check failed', async () => {
      await renderMenuInMode(null)

      expect(screen.getByTestId('view-all')).toBeInTheDocument()
      expect(screen.queryByTestId('new-audience')).not.toBeInTheDocument()
    })
  })

  it('leaves out the new audience item when creating is not allowed', async () => {
    const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
    render(
      <VariantsMenu allowCreate={false} trigger={<button type="button">Open variants</button>} />,
      {wrapper},
    )
    await userEvent.setup().click(await screen.findByRole('button', {name: 'Open variants'}))
    await screen.findByTestId('variants-nav-menu')

    expect(screen.getByTestId('view-all')).toBeInTheDocument()
    expect(screen.queryByTestId('new-audience')).not.toBeInTheDocument()
  })

  it('does not show a mismatch error when configured conditions resolve empty', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await renderMenu({
      beta: {
        variants: {
          enabled: true,
          types: {variant: {conditions: []}},
        },
      },
    })

    expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()

    consoleError.mockRestore()
  })
})
