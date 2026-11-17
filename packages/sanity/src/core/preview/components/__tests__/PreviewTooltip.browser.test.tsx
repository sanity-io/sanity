import {ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {PreviewTooltip, PreviewTooltipAnchor, type PreviewTooltipPlacement} from '../PreviewTooltip'

const theme = buildTheme()

const ROW_COUNT = 20

function renderScrollableList() {
  return render(
    <ThemeProvider theme={theme}>
      <div data-testid="scroll-container" style={{height: 150, overflow: 'auto'}}>
        {Array.from({length: ROW_COUNT}, (_, index) => (
          <PreviewTooltip content={`Status for row ${index}`} key={index}>
            <div data-testid={`row-${index}`} style={{height: 40}}>
              Row {index}
            </div>
          </PreviewTooltip>
        ))}
      </div>
    </ThemeProvider>,
  )
}

/**
 * A row in a narrow scroll container, with its status anchor at the right edge. The offset is
 * padding, not margin: a margin would collapse into the body, the popover's boundary.
 */
function renderAnchoredRow(placement?: PreviewTooltipPlacement) {
  return render(
    <ThemeProvider theme={theme}>
      <div style={{padding: 100}}>
        <div
          data-testid="scroll-container"
          style={{overflow: 'auto', paddingBottom: 40, width: 300}}
        >
          <PreviewTooltip content="Versions" placement={placement}>
            <div style={{display: 'flex', height: 40, justifyContent: 'space-between'}}>
              <span data-testid="row-title">Title</span>
              <PreviewTooltipAnchor>
                <span data-testid="row-status">Status</span>
              </PreviewTooltipAnchor>
            </div>
          </PreviewTooltip>
        </div>
      </div>
      <div data-testid="outside" style={{height: 40}} />
    </ThemeProvider>,
  )
}

/**
 * Whether a tooltip with the given text is shown. A closed tooltip is either
 * not rendered (while disabled) or rendered hidden: browsers that fire
 * mouseout on the row scrolled away from the pointer (Firefox, WebKit) end the
 * suppression, which re-enables the closed tooltip.
 */
function isTooltipVisible(text: string) {
  return page
    .getByText(text, {exact: true})
    .elements()
    .some((element) => element.checkVisibility())
}

async function openVersionsPopover() {
  await userEvent.hover(page.getByTestId('row-title'))
  await expect.element(page.getByText('Versions', {exact: true})).toBeVisible()
  const popover = page.getByText('Versions', {exact: true}).element().closest('[data-ui="Popover"]')
  if (!(popover instanceof HTMLElement)) throw new Error('No popover around the tooltip content')
  const anchor = page.getByTestId('row-status').element().closest('[data-preview-tooltip-anchor]')
  if (!anchor) throw new Error('No anchor around the row status')
  return {
    anchor: anchor.getBoundingClientRect(),
    element: popover,
    popover: popover.getBoundingClientRect(),
  }
}

describe('PreviewTooltip', () => {
  it('shows the tooltip on hover and closes it when the list scrolls underneath', async () => {
    void renderScrollableList()

    // Hover a row and wait for its tooltip to open (it has an open delay)
    await userEvent.hover(page.getByTestId('row-1'))
    await expect.element(page.getByText('Status for row 1', {exact: true})).toBeVisible()

    // Scroll the list without moving the pointer. Scrolling fires no
    // mouseleave, so without the scroll guard the tooltip would stay open,
    // detached from the row it was anchored to (SAPP-2645).
    const container = page.getByTestId('scroll-container').element()
    container.scrollTop = 80

    await expect.poll(() => isTooltipVisible('Status for row 1')).toBe(false)

    // The tooltip must not come back on its own while the pointer rests on
    // the row (longer than the tooltip open delay).
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(isTooltipVisible('Status for row 1')).toBe(false)

    // Hovering another row must show its tooltip again: the suppression only
    // lasts until the pointer leaves the row that was scrolled under it.
    await userEvent.hover(page.getByTestId('row-4'))
    await expect.element(page.getByText('Status for row 4', {exact: true})).toBeVisible()
  })

  it('opens from anywhere on the row, below the anchor by default', async () => {
    void renderAnchoredRow()

    const {popover, anchor} = await openVersionsPopover()

    expect(popover.top).toBeGreaterThanOrEqual(anchor.bottom)
    expect(Math.abs(popover.right - anchor.right)).toBeLessThan(2)
  })

  it('opens beside the anchor, outside the scroll container, and lets the pointer through', async () => {
    void renderAnchoredRow('beside')

    const {popover, anchor, element} = await openVersionsPopover()
    const container = page.getByTestId('scroll-container').element()

    expect(popover.left).toBeGreaterThanOrEqual(anchor.right)
    expect(Math.abs(popover.top - anchor.top)).toBeLessThan(2)
    expect(container.contains(element)).toBe(false)
    expect(getComputedStyle(element).pointerEvents).toBe('none')
  })

  it('closes when the pointer leaves the row', async () => {
    void renderAnchoredRow()

    await openVersionsPopover()
    await userEvent.hover(page.getByTestId('outside'))

    await expect.poll(() => isTooltipVisible('Versions')).toBe(false)
  })
})
