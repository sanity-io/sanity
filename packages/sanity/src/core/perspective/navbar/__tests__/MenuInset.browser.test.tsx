import {configure} from '@chromatic-com/vitest'
import {BoundaryElementProvider} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {getVariantId} from '../../../variants/tool/util'
import {GlobalPerspectiveNav} from '../GlobalPerspectiveNav'
import {VariantsMenuStory} from '../variants/__tests__/VariantsMenuStory'

// The nav links to the releases tool, so the router needs tool routes.
const router = route.create('/', [
  route.intents('/intent'),
  route.create('/:tool', [route.scope('releases', '/*')]),
])

// The open menu is a measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

const INSET = 8
const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected), `${actual} ≈ ${expected}`).toBeLessThanOrEqual(1)

const rect = (element: Element) => element.getBoundingClientRect()

function visible<T extends HTMLElement>(root: HTMLElement, selector: string): T[] {
  return [...root.querySelectorAll<T>(selector)].filter((element) => element.checkVisibility())
}

/** The field, rows and rules of a menu, top to bottom. */
function items(menu: HTMLElement): HTMLElement[] {
  return visible(
    menu,
    '[data-ui="TextInput"], [data-ui="MenuItem"], [data-ui="MenuSectionDivider"], [data-testid="perspective-filter-no-matches"]',
  ).toSorted((a, b) => rect(a).top - rect(b).top)
}

/** 8px on every side between the menu's edge and its content. */
function expectBoxInset(menu: HTMLElement) {
  const box = rect(menu)
  const content = items(menu).filter((item) => item.dataset.ui !== 'MenuSectionDivider')
  near(rect(content[0]).top - box.top, INSET)
  near(box.bottom - rect(content.at(-1)!).bottom, INSET)
  for (const item of content) {
    if (item.dataset.testid === 'perspective-filter-no-matches') continue
    near(rect(item).left - box.left, INSET)
    near(box.right - rect(item).right, INSET)
  }
}

/** Every rule is inset 8px from the menu's sides, with 4px to the content above and below it. */
function expectDividers(menu: HTMLElement, expectedCount: number) {
  const box = rect(menu)
  const list = items(menu)
  const dividers = list.filter((item) => item.dataset.ui === 'MenuSectionDivider')
  expect(dividers).toHaveLength(expectedCount)
  for (const divider of dividers) {
    const index = list.indexOf(divider)
    near(rect(divider).height, 1)
    near(rect(divider).left - box.left, INSET)
    near(box.right - rect(divider).right, INSET)
    near(rect(divider).top - rect(list[index - 1]).bottom, 4)
    near(rect(list[index + 1]).top - rect(divider).bottom, 4)
  }
}

async function openVariantsMenu(): Promise<HTMLElement> {
  void render(<VariantsMenuStory />)
  await page.getByTestId('variants-nav-menu-button').click()
  const menu = page.getByTestId('variants-nav-menu')
  await expect.element(menu).toBeVisible()
  const element = menu.element() as HTMLElement
  await expectStable(() => JSON.stringify(rect(element)))
  return element
}

async function openPerspectiveMenu(): Promise<HTMLElement> {
  void render(
    <TestWrapper schemaTypes={[]} betaFeatures={{variants: {enabled: true}}}>
      <RouterProvider router={router} state={{}} onNavigate={noop}>
        <BoundaryElementProvider element={null}>
          <GlobalPerspectiveNav />
        </BoundaryElementProvider>
      </RouterProvider>
    </TestWrapper>,
  )
  await page.getByTestId('global-perspective-menu-button').click()
  const menu = page.getByTestId('release-menu')
  await expect.element(menu).toBeVisible()
  const element = menu.element() as HTMLElement
  await expect.poll(() => element.querySelector('[data-ui="MenuItem"]')).toBeTruthy()
  await expectStable(() => JSON.stringify(rect(element)))
  return element
}

describe('navbar menus: 8px inset', () => {
  it('insets the variant menu 8px on every side, with an inset rule above the footer', async () => {
    const menu = await openVariantsMenu()
    expectBoxInset(menu)
    expectDividers(menu, 1)
  })

  it('keeps the variant menu 8px from the bottom while a filter hides the footer', async () => {
    const menu = await openVariantsMenu()
    await userEvent.type(menu.querySelector('input')!, 'alpha')
    await expect.poll(() => visible(menu, '[data-ui="MenuItem"]').length).toBe(1)
    expectBoxInset(menu)
    expectDividers(menu, 0)
  })

  it('insets the perspective menu 8px on every side, with inset rules between its groups', async () => {
    const menu = await openPerspectiveMenu()
    expectBoxInset(menu)
    // Under the field, and between the pinned perspectives and the pinned footer
    expectDividers(menu, 2)
  })

  it('keeps the perspective menu 8px from the bottom while a filter hides the footer', async () => {
    const menu = await openPerspectiveMenu()
    await userEvent.type(menu.querySelector('input')!, 'published')
    await expect.poll(() => visible(menu, '[data-ui="MenuItem"]').length).toBe(1)
    expectBoxInset(menu)
    // Only the rule under the field: no rule follows the last group
    expectDividers(menu, 1)
  })
})

describe('navbar menus: a scrolling list', () => {
  async function overflowVariantList(menu: HTMLElement, options: {trackWidth?: number} = {}) {
    const scroller = visible(menu, '*').find(
      (element) => getComputedStyle(element).overflowY === 'auto',
    )!
    if (options.trackWidth) {
      // Headless Chromium hides scrollbars, so no track ever takes room here. Stand in for the
      // track the studio's `GlobalStyle` draws by reporting it in the width `useMenuOverflow` reads.
      const trackWidth = options.trackWidth
      Object.defineProperty(scroller, 'clientWidth', {
        configurable: true,
        get: () => scroller.offsetWidth - trackWidth,
      })
    }
    scroller.style.maxHeight = '60px'
    await expect.poll(() => scroller.hasAttribute('data-overflowing')).toBe(true)
    return scroller
  }

  function rowAndAction(menu: HTMLElement) {
    const id = getVariantId(variantAlphaAudience._id)
    return {
      row: menu.querySelector<HTMLElement>(`[data-testid="variant-${id}"]`)!,
      action: menu.querySelector<HTMLElement>(`[data-testid="variant-detail-link-${id}"]`)!,
    }
  }

  it('runs the rows into the scrollbar track and keeps the row action 8px from the row end', async () => {
    const menu = await openVariantsMenu()
    const before = rowAndAction(menu)
    near(rect(before.row).right - rect(before.action).right, INSET)

    const scroller = await overflowVariantList(menu, {trackWidth: 12})
    expect(scroller.style.getPropertyValue('--menu-scrollbar-width')).toBe('12px')
    await expectStable(() => String(rect(before.row).right))

    // The rows grow by the 8px inset at most, which puts their end on the 12px track's edge
    const after = rowAndAction(menu)
    near(rect(after.row).left - rect(menu).left, INSET)
    near(rect(menu).right - rect(after.row).right, 0)
    near(rect(after.row).right - rect(after.action).right, INSET)
  })

  it('keeps the 8px inset under an overlay scrollbar, which takes no room', async () => {
    const menu = await openVariantsMenu()
    const scroller = await overflowVariantList(menu)
    near(scroller.offsetWidth - scroller.clientWidth, 0)
    const {row, action} = rowAndAction(menu)
    near(rect(menu).right - rect(row).right, INSET)
    near(rect(row).right - rect(action).right, INSET)
  })
})
