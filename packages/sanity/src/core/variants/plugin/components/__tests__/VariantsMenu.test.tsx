import {render, screen} from '@testing-library/react'
import {userEvent} from '@testing-library/user-event'
import {route, RouterProvider} from 'sanity/router'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {flushMicrotasksThisIsACodeSmell} from '../../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../../test/testUtils/TestProvider'
import {type SingleWorkspace, type Tool} from '../../../../config/types'
import {MENU_PINNED_BLOCK_HEIGHT_VAR} from '../../../../perspective/styles'
import {createRouter} from '../../../../studio/router/router'
import {variantAlphaAudience, variantNorwegianMarket} from '../../../__fixtures__/variants.fixture'
import {variantsUsEnglishLocaleBundle} from '../../../i18n'
import {type SystemVariant} from '../../../types'
import {VARIANT_FILTER_THRESHOLD} from '../../../util/rankVariantsForSearch'
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

/** `count` distinct variants, cloned from the two fixtures so each carries a real shape. */
function manyVariants(count: number): SystemVariant[] {
  const templates = [variantAlphaAudience, variantNorwegianMarket]

  return Array.from({length: count}, (_unused, index) => {
    const template = templates[index % templates.length]

    return {
      ...template,
      _id: `_.variants.bulk${index}`,
      metadata: {...template.metadata, title: `Bulk variant ${index}`},
    }
  })
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

  it('withholds the filter below the threshold', async () => {
    variantsMock.data = manyVariants(VARIANT_FILTER_THRESHOLD - 1)

    await renderMenu()

    // A short list is readable at a glance, and the input would cost a row for nothing.
    expect(screen.queryByTestId('variant-menu-filter')).not.toBeInTheDocument()
  })

  it('offers the filter at the threshold', async () => {
    variantsMock.data = manyVariants(VARIANT_FILTER_THRESHOLD)

    await renderMenu()

    expect(screen.getByTestId('variant-menu-filter')).toBeInTheDocument()
  })

  it('publishes the pinned filter block height for the section headings to pin below', async () => {
    variantsMock.data = manyVariants(VARIANT_FILTER_THRESHOLD)

    await renderMenu()

    // Opened first: the popover keeps its content mounted while closed, but inside a hidden
    // `<Activity>`, and React does not run effects in a hidden tree. Closed is therefore the wrong
    // state to assert this in - nothing is on screen to pin under anything.
    await userEvent.click(screen.getByTestId('trigger'))
    await flushMicrotasksThisIsACodeSmell()

    // The headings resolve their sticky offset from this property. jsdom has no layout, so the
    // value is 0px; what is under test is that it is published at all - unset means the effect
    // bailed, and the headings then pin at 0px, which is where the filter block itself sits.
    const root = screen.getByTestId('variants-nav-menu')

    expect(root.style.getPropertyValue(MENU_PINNED_BLOCK_HEIGHT_VAR)).toBe('0px')
  })

  it('drops the action block while filtering', async () => {
    variantsMock.data = manyVariants(VARIANT_FILTER_THRESHOLD)

    await renderMenu()

    // Asserted after the whole term lands, never mid-word: a per-keystroke assertion races the
    // re-render and reads as flaky.
    await userEvent.type(screen.getByTestId('variant-menu-filter'), 'Bulk variant 1')

    expect(screen.queryByTestId('view-variants-menu-item')).not.toBeInTheDocument()
  })

  it('restores the action block when the filter is cleared', async () => {
    variantsMock.data = manyVariants(VARIANT_FILTER_THRESHOLD)

    await renderMenu()

    const filter = screen.getByTestId('variant-menu-filter')
    await userEvent.type(filter, 'Bulk')
    await userEvent.clear(filter)

    expect(screen.getByTestId('view-variants-menu-item')).toBeInTheDocument()
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
