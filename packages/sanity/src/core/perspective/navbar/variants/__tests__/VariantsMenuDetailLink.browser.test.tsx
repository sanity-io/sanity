import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {
  variantAlphaAudience,
  variantNorwegianMarket,
} from '../../../../variants/__fixtures__/variants.fixture'
import {getVariantId} from '../../../../variants/tool/util'
import {VariantsMenuStory} from './VariantsMenuStory'

function luminance(color: string): number {
  const [r, g, b] = (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

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

  it('keeps the action showing and focused when the right arrow key moves focus onto it', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()

    const alpha = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    const alphaRow = page.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)

    await alphaRow.hover()
    await expect.element(alphaRow).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(alpha).toHaveFocus()

    await expectStable(() => `${visibleOpacity(alpha.element())}`)
    // Still focused, and showing, and the menu is still open
    expect(document.activeElement).toBe(alpha.element())
    expect(visibleOpacity(alpha.element())).toBe(1)
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()
  })

  it('exposes the action as a menu item, so the menu has only valid children', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()

    const alpha = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    await expect.element(alpha).toHaveAttribute('role', 'menuitem')
    // Named by its label, so a screen reader announces what it opens
    await expect
      .element(page.getByRole('menuitem', {name: 'View audience Alpha audience'}))
      .toBeInTheDocument()
  })

  it('draws a focus ring on a selected row that stands out from the row fill', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()

    const alpha = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    const alphaRow = page.getByTestId(`variant-${getVariantId(variantAlphaAudience._id)}`)
    await alphaRow.hover()
    await expect.element(alphaRow).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(alpha).toHaveFocus()
    await expect.element(alphaRow).toHaveAttribute('data-selected')

    const ring = () => getComputedStyle(alpha.element()).outlineColor
    const fill = () => getComputedStyle(alphaRow.element()).backgroundColor
    await expectStable(() => `${ring()}|${fill()}`)
    // WCAG 1.4.11: a focus indicator needs 3:1 against the colour next to it
    expect(contrast(ring(), fill())).toBeGreaterThanOrEqual(3)
  })
})
