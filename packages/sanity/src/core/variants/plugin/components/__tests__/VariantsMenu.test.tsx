import {render, screen, waitFor} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type SingleWorkspace, type Tool} from '../../../../config/types'
import {createRouter} from '../../../../studio/router/router'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {getVariantId} from '../../../tool/util'
import {type SystemVariant} from '../../../types'
import {VARIANTS_TOOL_NAME} from '../../index'
import {VariantsMenu} from '../VariantsMenu'

const variantsMock = vi.hoisted(() => ({
  data: [] as SystemVariant[],
  byId: new Map<string, SystemVariant>(),
  loading: false,
  error: undefined as Error | undefined,
}))

const setVariant = vi.fn()

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => variantsMock),
}))

vi.mock('../../../../perspective/useSetVariant', () => ({
  useSetVariant: vi.fn(() => setVariant),
}))

// Only the tool's name matters for the link under test; its inner routing is
// exercised by the tool's own tests.
const variantsTool = {
  name: VARIANTS_TOOL_NAME,
  title: 'Variants',
  component: () => null,
  router: route.create('/', [route.create('/:variantId')]),
} as unknown as Tool

const studioRouter = createRouter({tools: [variantsTool]})

async function renderMenu(config?: Partial<SingleWorkspace>) {
  const wrapper = await createTestProvider({config, resources: [variantsUsEnglishLocaleBundle]})
  const view = render(
    <RouterProvider router={studioRouter} state={{}} onNavigate={vi.fn()}>
      <VariantsMenu trigger={<button type="button" data-testid="trigger" />} />
    </RouterProvider>,
    {wrapper},
  )
  // The locale bundle resolves asynchronously; without this the assertions run
  // against raw i18n keys.
  await flushMicrotasksThisIsACodeSmell()
  return view
}

describe('VariantsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    variantsMock.data = [variantAlphaAudience, variantNorwegianMarket]
    variantsMock.byId = new Map([
      [variantAlphaAudience._id, variantAlphaAudience],
      [variantNorwegianMarket._id, variantNorwegianMarket],
    ])
  })

  it('points "View variants" at the variants tool', async () => {
    await renderMenu()

    // @sanity/ui keeps closed popover content mounted, so the item is queryable
    // without opening the menu.
    const item = screen.getByTestId('view-variants-menu-item')

    expect(item).toHaveAttribute('href', `/${VARIANTS_TOOL_NAME}`)
  })

  it('does not route "View variants" through the variant intent', async () => {
    await renderMenu()

    const href = screen.getByTestId('view-variants-menu-item').getAttribute('href')

    // The `variant` intent opens one specific variant. With no id its params
    // segment is empty, producing `/intent/variant//`, which decodes without a
    // `params` key and makes `resolveIntentState` throw.
    expect(href).not.toContain('/intent/')
    expect(href).not.toContain('//')
    expect(studioRouter.isNotFound(href!)).toBe(false)
  })

  describe('condition mismatch', () => {
    beforeEach(() => {
      variantsMock.data = [variantAlphaAudience]
      variantsMock.byId = new Map([[variantAlphaAudience._id, variantAlphaAudience]])
    })

    it('shows a mismatch error when a stored condition is not in the configured list', async () => {
      await renderMenu({
        beta: {
          variants: {
            enabled: true,
            conditions: [{name: 'locale', values: ['en-US']}],
          },
        },
      })

      await userEvent.setup().click(screen.getByTestId('trigger'))
      await screen.findByTestId('variants-nav-menu')

      expect(screen.getByTestId('variant-condition-mismatch')).toBeInTheDocument()
    })

    it('does not show a mismatch error in freeform mode', async () => {
      await renderMenu()

      await userEvent.setup().click(screen.getByTestId('trigger'))
      await screen.findByTestId('variants-nav-menu')

      expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()
    })

    it('does not show a mismatch error while configured conditions are loading', async () => {
      await renderMenu({
        beta: {
          variants: {
            enabled: true,
            conditions: () => new Promise(() => undefined),
          },
        },
      })

      await userEvent.setup().click(screen.getByTestId('trigger'))
      await screen.findByTestId('variants-nav-menu')

      await waitFor(() => {
        expect(
          screen.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`),
        ).toBeInTheDocument()
      })

      expect(screen.queryByTestId('variant-condition-mismatch')).not.toBeInTheDocument()
    })
  })
})
