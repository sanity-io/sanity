import {render, screen} from '@testing-library/react'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type Tool} from '../../../../config/types'
import {createRouter} from '../../../../studio/router/router'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {VARIANTS_TOOL_NAME} from '../../index'
import {VariantsMenu} from '../VariantsMenu'

vi.mock('../../../store/useAllVariants', () => ({
  useAllVariants: vi.fn(() => ({
    data: [variantAlphaAudience, variantNorwegianMarket],
    byId: new Map(),
    loading: false,
    error: undefined,
  })),
}))

vi.mock('../../../../perspective/useSetVariant', () => ({
  useSetVariant: vi.fn(() => vi.fn()),
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

async function renderMenu() {
  const wrapper = await createTestProvider({resources: [variantsUsEnglishLocaleBundle]})
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
})
