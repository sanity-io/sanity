import {BaseVariantComparisonContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {setSnapshot} from '../../studio/colorSchemeStore'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'

const LABEL = 'Differs from'

/** Shrinks the glyph below the target, as a smaller mark would, so the button's own minimum is what is measured. */
function Fixture({changedFromBaseVariant}: {changedFromBaseVariant: boolean}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <FormBaseVariantDiffIndicator changedFromBaseVariant={changedFromBaseVariant} />
    </TestWrapper>
  )
}

function labelIsVisible(): boolean {
  return page
    .getByText(LABEL)
    .elements()
    .some((element) => element.checkVisibility())
}

describe('FormBaseVariantDiffIndicator', () => {
  it('renders nothing when the field matches its base variant', async () => {
    void render(<Fixture changedFromBaseVariant={false} />)

    await expect.element(page.getByTestId('base-variant-diff-indicator')).not.toBeInTheDocument()
    expect(labelIsVisible()).toBe(false)
  })

  it('renders the indicator when the field differs from its base variant', async () => {
    void render(<Fixture changedFromBaseVariant />)

    await expect.element(page.getByTestId('base-variant-diff-indicator')).toBeVisible()
  })

  it('removes the indicator once the field no longer differs', async () => {
    const {rerender} = await render(<Fixture changedFromBaseVariant />)

    await expect.element(page.getByTestId('base-variant-diff-indicator')).toBeVisible()

    await rerender(<Fixture changedFromBaseVariant={false} />)
    await expect.element(page.getByTestId('base-variant-diff-indicator')).not.toBeInTheDocument()
  })

  it('is a focusable button named by the full sentence', async () => {
    void render(<Fixture changedFromBaseVariant />)

    const mark = page.getByRole('button', {name: 'Differs from Default Draft'})
    await expect.element(mark).toBeVisible()

    const button = mark.element()
    await userEvent.tab()
    expect(document.activeElement).toBe(button)
  })

  it('takes the pointer anywhere in a 32x32 area around its centre', async () => {
    void render(<Fixture changedFromBaseVariant />)

    const mark = page.getByRole('button', {name: 'Differs from Default Draft'})
    await expect.element(mark).toBeVisible()
    const button = mark.element()
    const rect = button.getBoundingClientRect()
    const centreX = rect.left + rect.width / 2
    const centreY = rect.top + rect.height / 2
    // 15px from the centre on each side lands inside a 32x32 target, outside the 24x24 box
    for (const [x, y] of [
      [centreX - 15, centreY],
      [centreX + 15, centreY],
      [centreX, centreY - 15],
      [centreX, centreY + 15],
    ]) {
      expect(button.contains(document.elementFromPoint(x, y))).toBe(true)
    }
    // The layout box stays 24x24, so the field title row keeps its height
    expect(rect.height).toBe(24)
    // The glyph is the row size, a step up from the inline size
    expect(button.querySelector('[data-size]')?.getAttribute('data-size')).toBe('row')
  })

  it('shows the tooltip on hover as well as focus', async () => {
    void render(<Fixture changedFromBaseVariant />)

    await userEvent.hover(page.getByRole('button', {name: 'Differs from Default Draft'}))
    await vi.waitFor(() => expect(labelIsVisible()).toBe(true), {timeout: 3000})
  })

  it('shows the tooltip when the mark takes keyboard focus', async () => {
    void render(<Fixture changedFromBaseVariant />)

    const mark = page.getByRole('button', {name: 'Differs from Default Draft'})
    await expect.element(mark).toBeVisible()
    await userEvent.tab()
    expect(document.activeElement).toBe(mark.element())
    // The tooltip opens after its delay, so wait for the sentence to be on screen.
    await vi.waitFor(() => expect(labelIsVisible()).toBe(true), {timeout: 3000})
  })
})

// 9.3-F1: the Draft and Published chips sat about 2px higher than the plain Default chip. An inline
// flex chip took its baseline from its first item, which in those two is a glyph with no text.
describe.each(['light', 'dark'] as const)('the tooltip chips in %s mode', (scheme) => {
  beforeEach(() => setSnapshot(scheme))
  afterEach(() => setSnapshot('system'))

  it.each(['drafts', 'published'] as const)(
    'share one height and one centre line when comparing %s',
    async (compared) => {
      void render(
        <BaseVariantComparisonContext.Provider value={compared}>
          <Fixture changedFromBaseVariant />
        </BaseVariantComparisonContext.Provider>,
      )

      await userEvent.hover(page.getByRole('button', {name: /^Differs from Default/}))
      const tooltip = page.getByTestId('base-variant-diff-tooltip')
      await expect.element(tooltip).toBeVisible()

      const chips = [...tooltip.element().querySelectorAll(':scope > * > span')]
      expect(chips).toHaveLength(2)
      const [base, slot] = chips.map((chip) => chip.getBoundingClientRect())
      const centre = (rect: DOMRect) => rect.top + rect.height / 2
      expect(Math.abs(slot.height - base.height)).toBeLessThanOrEqual(0.5)
      expect(Math.abs(centre(slot) - centre(base))).toBeLessThanOrEqual(0.5)

      // The slot chip's glyph is the chip's icon, not part of its name, and the drawn glyph (not
      // only its box) sits on the chip's centre line. A glyph passed inside the name rode up with
      // the name's text box while its wrapper still measured centred.
      expect(chips[1].querySelector('[data-inline-chip-name] svg')).toBeNull()
      const glyph = chips[1].querySelector('[data-inline-chip-icon] svg')?.getBoundingClientRect()
      if (!glyph) throw new Error('The slot chip has no glyph in its icon slot')
      expect(Math.abs(centre(glyph) - centre(slot))).toBeLessThanOrEqual(0.5)

      // Both chips have the same padding.
      const [basePadding, slotPadding] = chips.map((chip) => getComputedStyle(chip).padding)
      expect(slotPadding).toBe(basePadding)
    },
  )
})
