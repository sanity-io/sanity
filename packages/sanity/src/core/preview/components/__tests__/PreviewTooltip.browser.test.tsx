import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  PreviewPopover,
  PreviewTooltip,
  PreviewTooltipAnchor,
  type PreviewTooltipPlacement,
} from '../PreviewTooltip'
import {SanityDefaultPreview} from '../SanityDefaultPreview'

const ROW_COUNT = 20

const VARIANTS_ENABLED = {variants: {enabled: true}}

/** `TestWrapper`'s pane already uses `scroll-container` for its own scroll container. */
const LIST_TEST_ID = 'row-list'

function renderScrollableList({variantsEnabled}: {variantsEnabled: boolean}) {
  return render(
    <TestWrapper schemaTypes={[]} betaFeatures={variantsEnabled ? VARIANTS_ENABLED : undefined}>
      <div data-testid={LIST_TEST_ID} style={{height: 150, overflow: 'auto'}}>
        {Array.from({length: ROW_COUNT}, (_, index) => (
          <PreviewTooltip content={`Status for row ${index}`} key={index}>
            <div data-testid={`row-${index}`} style={{height: 40}}>
              Row {index}
            </div>
          </PreviewTooltip>
        ))}
      </div>
    </TestWrapper>,
  )
}

/**
 * A row in a narrow scroll container, with its status anchor at the right edge. The offset is
 * padding, not margin: a margin would collapse into the body, the popover's boundary.
 */
function renderAnchoredRow(placement?: PreviewTooltipPlacement) {
  return render(
    <TestWrapper schemaTypes={[]} betaFeatures={VARIANTS_ENABLED}>
      <div style={{padding: 100}}>
        <div data-testid={LIST_TEST_ID} style={{overflow: 'auto', paddingBottom: 40, width: 300}}>
          <PreviewPopover content="Versions" placement={placement}>
            <div style={{display: 'flex', height: 40, justifyContent: 'space-between'}}>
              <span data-testid="row-title">Title</span>
              <PreviewTooltipAnchor>
                <span data-testid="row-status">Status</span>
              </PreviewTooltipAnchor>
            </div>
          </PreviewPopover>
        </div>
      </div>
      <div data-testid="outside" style={{height: 40}} />
    </TestWrapper>,
  )
}

/** A document preview row with a status and a versions tooltip, as the document list renders it. */
function renderPreviewRow({variantsEnabled}: {variantsEnabled: boolean}) {
  return render(
    <TestWrapper schemaTypes={[]} betaFeatures={variantsEnabled ? VARIANTS_ENABLED : undefined}>
      <div data-testid="row" style={{width: 300}}>
        <SanityDefaultPreview
          status={<span data-testid="row-status">Status</span>}
          title="Title"
          tooltip="Versions"
        />
      </div>
    </TestWrapper>,
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

async function getVisibleTooltipRect(text: string) {
  await expect.poll(() => isTooltipVisible(text)).toBe(true)
  const element = page
    .getByText(text, {exact: true})
    .elements()
    .find((candidate) => candidate.checkVisibility())
  if (!element) throw new Error(`No visible tooltip with the text "${text}"`)
  return element.getBoundingClientRect()
}

async function openVersionsPopover(hoverTestId = 'row-title') {
  await userEvent.hover(page.getByTestId(hoverTestId))
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
  it.each([
    {flag: 'disabled', variantsEnabled: false},
    {flag: 'enabled', variantsEnabled: true},
  ])(
    'shows on hover and closes when the list scrolls underneath, with variants $flag',
    async ({variantsEnabled}) => {
      void renderScrollableList({variantsEnabled})

      // Hover a row and wait for its tooltip to open (it has an open delay)
      await userEvent.hover(page.getByTestId('row-1'))
      await expect.element(page.getByText('Status for row 1', {exact: true})).toBeVisible()

      // Scroll the list without moving the pointer. Scrolling fires no
      // mouseleave, so without the scroll guard the tooltip would stay open,
      // detached from the row it was anchored to (SAPP-2645).
      const container = page.getByTestId(LIST_TEST_ID).element()
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
    },
  )

  it('opens to the right of the row when variants are disabled', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div style={{width: 300}}>
          <PreviewTooltip content="Versions">
            <div data-testid="row" style={{height: 40}}>
              Title
            </div>
          </PreviewTooltip>
        </div>
      </TestWrapper>,
    )

    await userEvent.hover(page.getByTestId('row'))
    const tooltip = await getVisibleTooltipRect('Versions')
    const row = page.getByTestId('row').element().getBoundingClientRect()

    expect(tooltip.left).toBeGreaterThanOrEqual(row.right)
    expect(Math.abs(tooltip.top + tooltip.height / 2 - (row.top + row.height / 2))).toBeLessThan(4)
  })
})

describe('PreviewPopover', () => {
  it('opens from anywhere on the row, below the anchor by default', async () => {
    void renderAnchoredRow()

    const {popover, anchor} = await openVersionsPopover()

    expect(popover.top).toBeGreaterThanOrEqual(anchor.bottom)
    expect(Math.abs(popover.right - anchor.right)).toBeLessThan(2)
  })

  it('opens beside the anchor, outside the scroll container, and lets the pointer through', async () => {
    void renderAnchoredRow('beside')

    const {popover, anchor, element} = await openVersionsPopover()
    const container = page.getByTestId(LIST_TEST_ID).element()

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

describe('SanityDefaultPreview tooltip', () => {
  it('shows the document status tooltip to the right of the row when variants are disabled', async () => {
    void renderPreviewRow({variantsEnabled: false})

    await expect.element(page.getByTestId('row-status')).toBeVisible()
    expect(document.querySelector('[data-preview-tooltip-anchor]')).toBeNull()

    await userEvent.hover(page.getByText('Title', {exact: true}))
    const tooltip = await getVisibleTooltipRect('Versions')
    const row = page.getByTestId('row').element().getBoundingClientRect()

    expect(tooltip.left).toBeGreaterThanOrEqual(row.right)
    expect(
      page.getByText('Versions', {exact: true}).element().closest('[data-ui="Popover"]'),
    ).toBeNull()
  })

  it('shows the versions popover below the row status when variants are enabled', async () => {
    void renderPreviewRow({variantsEnabled: true})

    await expect.element(page.getByTestId('row-status')).toBeVisible()

    const {popover, anchor} = await openVersionsPopover('row-status')

    expect(popover.top).toBeGreaterThanOrEqual(anchor.bottom)
    expect(Math.abs(popover.right - anchor.right)).toBeLessThan(2)
  })
})
