import {describe, expect, it} from 'vitest'
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

  it('names the base variant and the slot in its tooltip, as chips', async () => {
    void render(<Fixture changedFromBaseVariant />)

    await userEvent.hover(page.getByTestId('base-variant-diff-indicator'))
    const tooltip = page.getByTestId('base-variant-diff-tooltip')
    await expect.element(tooltip).toBeVisible()
    await expect.element(tooltip.getByText(LABEL)).toBeVisible()
    await expect.element(tooltip.getByText('Default')).toBeVisible()
    await expect.element(tooltip.getByText('Draft')).toBeVisible()
  })

  it('removes the indicator once the field no longer differs', async () => {
    const {rerender} = await render(<Fixture changedFromBaseVariant />)

    await expect.element(page.getByTestId('base-variant-diff-indicator')).toBeVisible()

    await rerender(<Fixture changedFromBaseVariant={false} />)
    await expect.element(page.getByTestId('base-variant-diff-indicator')).not.toBeInTheDocument()
  })
})
