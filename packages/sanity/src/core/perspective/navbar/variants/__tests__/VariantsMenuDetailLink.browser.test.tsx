import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {
  variantAlphaAudience,
  variantNorwegianMarket,
} from '../../../../variants/__fixtures__/variants.fixture'
import {getVariantId} from '../../../../variants/tool/util'
import {VariantsMenuStory} from './VariantsMenuStory'

/** What the eye sees of the link: its own opacity times that of every ancestor up to the row. */
function visibleOpacity(link: Element): number {
  const row = link.closest('[data-detail-link-row]')
  let opacity = 1
  for (let el: Element | null = link; el && el !== row; el = el.parentElement) {
    opacity *= Number(getComputedStyle(el).opacity)
  }
  return opacity
}

/** The "View audience" tooltips on screen: a closed tooltip leaves a node with no size behind. */
const openTooltips = () =>
  [...document.querySelectorAll('body *')].filter(
    (el) =>
      el.children.length === 0 &&
      el.textContent === 'View audience' &&
      el.getBoundingClientRect().width > 0,
  ).length

describe('VariantsMenu row action', () => {
  it('shows the view action on one row only, the one under the pointer', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()

    const alpha = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    const norwegian = page.getByTestId(
      `variant-detail-link-${getVariantId(variantNorwegianMarket._id)}`,
    )
    const alphaRow = page.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)
    const norwegianRow = page.getByTestId(`variant-${getVariantId(variantNorwegianMarket._id)}`)

    // Hover the first row's action, then move to the second row
    await alphaRow.hover()
    await alpha.hover()
    await expectStable(() => String(visibleOpacity(alpha.element())))
    expect(visibleOpacity(alpha.element())).toBe(1)

    await norwegianRow.hover()
    await expectStable(() => `${visibleOpacity(alpha.element())}`)
    expect(visibleOpacity(alpha.element())).toBe(0)
    expect(visibleOpacity(norwegian.element())).toBe(1)

    // Moving on to the second row's own action keeps it, and the first stays hidden
    await norwegian.hover()
    await expectStable(() => `${visibleOpacity(norwegian.element())}`)
    expect(visibleOpacity(norwegian.element())).toBe(1)
    expect(visibleOpacity(alpha.element())).toBe(0)
  })

  it('hides the first row action when the pointer moves on after the first one had keyboard focus and an open tooltip', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()

    const alpha = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    const alphaRow = page.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)
    const norwegianRow = page.getByTestId(`variant-${getVariantId(variantNorwegianMarket._id)}`)

    await alphaRow.hover()
    // What the right arrow key does: focus moves from the row's item to its link
    ;(alpha.element() as HTMLElement).focus()
    await expect.element(alpha).toHaveFocus()
    await alpha.hover()
    // The tooltip opens after a short delay
    await expect.poll(openTooltips).toBeGreaterThan(0)

    await norwegianRow.hover()
    await expectStable(() => `${visibleOpacity(alpha.element())}`)
    expect(visibleOpacity(alpha.element())).toBe(0)
    await expect.poll(openTooltips).toBe(0)
  })

  it('hides the first row action while focus stays on it and the pointer is on the next row', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()

    const alpha = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    const norwegian = page.getByTestId(
      `variant-detail-link-${getVariantId(variantNorwegianMarket._id)}`,
    )
    const alphaRow = page.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)
    const norwegianRow = page.getByTestId(`variant-${getVariantId(variantNorwegianMarket._id)}`)

    await alphaRow.hover()
    await norwegianRow.hover()
    // Let the menu finish moving its own focus to the row the pointer is on
    await expect.element(norwegianRow).toHaveFocus()
    // The menu does not always move focus with the pointer (it does not while the filter field
    // has it), so focus can stay on a link the pointer has left
    ;(alpha.element() as HTMLElement).focus()
    await expect.element(alpha).toHaveFocus()

    await expectStable(() => `${visibleOpacity(alpha.element())}`)
    expect(visibleOpacity(alpha.element())).toBe(0)
    expect(visibleOpacity(norwegian.element())).toBe(1)
    expect(openTooltips()).toBe(0)
  })
})
