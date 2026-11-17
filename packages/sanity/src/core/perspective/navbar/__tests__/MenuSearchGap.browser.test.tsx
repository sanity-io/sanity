import {configure} from '@chromatic-com/vitest'
import {BoundaryElementProvider} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {GlobalPerspectiveNav} from '../GlobalPerspectiveNav'
import {VariantsMenuStory} from '../variants/__tests__/VariantsMenuStory'

// The nav links to the releases tool, so the router needs tool routes.
const router = route.create('/', [
  route.intents('/intent'),
  route.create('/:tool', [route.scope('releases', '/*')]),
])

// The open menu is a measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

/** The search field's visible box: the text input's root, not the bare `input` inside it. */
function fieldOf(menu: HTMLElement): HTMLElement {
  const input = menu.querySelector<HTMLInputElement>('input')
  if (!input) throw new Error('search field not found')
  return input.closest<HTMLElement>('[data-ui="TextInput"]') ?? input
}

function firstRowOf(menu: HTMLElement): HTMLElement {
  const row = [...menu.querySelectorAll<HTMLElement>('[data-ui="MenuItem"]')].find((item) =>
    item.checkVisibility(),
  )
  if (!row) throw new Error('first row not found')
  return row
}

const gapBetween = (above: HTMLElement, below: HTMLElement) =>
  below.getBoundingClientRect().top - above.getBoundingClientRect().bottom

async function expectGap(above: () => HTMLElement, below: () => HTMLElement) {
  await expectStable(() => String(gapBetween(above(), below())))
  // 8px (space 2), the inset used for everything inside the menu. The perspective menu draws a
  // 1px rule under the field, inside the gap.
  expect(Math.abs(gapBetween(above(), below()) - 8)).toBeLessThanOrEqual(1)
}

async function openReleasesMenu(): Promise<HTMLElement> {
  await page.getByTestId('global-perspective-menu-button').click()
  let popover: HTMLElement | undefined
  await expect
    .poll(() => {
      popover = [...document.querySelectorAll<HTMLElement>('[data-ui="MenuButton__popover"]')].find(
        (element) => element.checkVisibility(),
      )
      return popover
    })
    .toBeDefined()
  if (!popover) throw new Error('open releases menu not found')
  return popover
}

describe('navbar menus: gap below the search field', () => {
  it('is 8px to the first variant row and to the no-matches message', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    const menu = page.getByTestId('variants-nav-menu')
    await expect.element(menu).toBeVisible()
    const menuElement = () => menu.element() as HTMLElement

    await expectGap(
      () => fieldOf(menuElement()),
      () => firstRowOf(menuElement()),
    )

    await userEvent.type(menuElement().querySelector('input')!, 'zzz-no-such-variant')
    const noMatches = page.getByTestId('perspective-filter-no-matches')
    await expect.element(noMatches).toBeVisible()
    await expectGap(
      () => fieldOf(menuElement()),
      () => noMatches.element() as HTMLElement,
    )
  })

  it('is 8px to the first perspective row and to the no-matches message', async () => {
    void render(
      <TestWrapper schemaTypes={[]} betaFeatures={{variants: {enabled: true}}}>
        <RouterProvider router={router} state={{}} onNavigate={noop}>
          <BoundaryElementProvider element={null}>
            <GlobalPerspectiveNav />
          </BoundaryElementProvider>
        </RouterProvider>
      </TestWrapper>,
    )

    const popover = await openReleasesMenu()
    await expect.poll(() => popover.querySelector('[data-ui="MenuItem"]')).toBeTruthy()

    await expectGap(
      () => fieldOf(popover),
      () => firstRowOf(popover),
    )

    await userEvent.type(popover.querySelector('input')!, 'zzz-no-such-release')
    const noMatches = page.getByTestId('perspective-filter-no-matches')
    await expect.element(noMatches).toBeVisible()
    await expectGap(
      () => fieldOf(popover),
      () => noMatches.element() as HTMLElement,
    )
  })
})
