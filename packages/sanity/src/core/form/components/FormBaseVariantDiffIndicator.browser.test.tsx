import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'

const LABEL = 'Differs from'

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

  it('has a hit area of at least 24x24 pixels', async () => {
    void render(<Fixture changedFromBaseVariant />)

    const mark = page.getByRole('button', {name: 'Differs from Default Draft'})
    await expect.element(mark).toBeVisible()
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
