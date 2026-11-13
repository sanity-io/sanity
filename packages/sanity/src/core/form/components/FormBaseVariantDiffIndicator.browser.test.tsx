import {BaseVariantComparisonContext} from 'sanity/_singletons'
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {setSnapshot} from '../../studio/colorSchemeStore'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'

const LABEL = 'Differs from'

/** Shrinks the glyph below the target, as a smaller mark would, so the button's own minimum is what is measured. */
function SmallGlyph() {
  return <style>{'[data-testid="base-variant-diff-mark"] > * { width: 8px; height: 8px; }'}</style>
}

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

  it('has a hit area of at least 24x24 pixels, even with an 8px glyph', async () => {
    void render(
      <>
        <SmallGlyph />
        <Fixture changedFromBaseVariant />
      </>,
    )

    const mark = page.getByRole('button', {name: 'Differs from Default Draft'})
    await expect.element(mark).toBeVisible()
    const glyph = mark.element().firstElementChild?.getBoundingClientRect()
    expect(glyph?.width).toBeLessThanOrEqual(8)
    const {width, height} = mark.element().getBoundingClientRect()
    expect(width).toBeGreaterThanOrEqual(24)
    expect(height).toBeGreaterThanOrEqual(24)
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

      // The slot chip's glyph sits on the chip's centre line, not raised above it.
      const glyph = chips[1].querySelector('[aria-hidden]')?.getBoundingClientRect()
      if (!glyph) throw new Error('The slot chip has no glyph')
      expect(Math.abs(centre(glyph) - centre(slot))).toBeLessThanOrEqual(0.5)

      // Both chips have the same padding.
      const [basePadding, slotPadding] = chips.map((chip) => getComputedStyle(chip).padding)
      expect(slotPadding).toBe(basePadding)
    },
  )
})
