import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {FormBaseVariantDiffIndicator} from './FormBaseVariantDiffIndicator'

/**
 * Browser mode rather than jsdom, because the two things worth asserting about this
 * indicator are both invisible to jsdom:
 *
 * - Its tooltip is a `@sanity/ui` overlay, and from v4 those keep their content mounted
 *   while closed (hidden via `<Activity>`). In jsdom, where runtime styles are disabled,
 *   a `getByText` on the label passes without ever hovering — the assertion would be
 *   vacuous. Here `checkVisibility()` is meaningful, so "hidden until hover" can actually
 *   be pinned down.
 * - Mount and unmount are mediated by `AnimatePresence`, so removal is deferred until the
 *   exit animation finishes.
 */

// The resolved `changes.from-base-variant.label` studio string. Asserting on the rendered
// text rather than the key also confirms the label is wired through i18n at all.
const LABEL = 'Changed from base variant'

function Fixture({changedFromBaseVariant}: {changedFromBaseVariant: boolean}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <FormBaseVariantDiffIndicator changedFromBaseVariant={changedFromBaseVariant} />
    </TestWrapper>
  )
}

/**
 * Tolerates the label being absent *or* mounted-but-hidden, which is the distinction the
 * `<Activity>` behaviour turns on: both mean "the user cannot read it".
 */
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

    // Deferred until the AnimatePresence exit animation completes.
    await expect.element(page.getByTestId('base-variant-diff-indicator')).not.toBeInTheDocument()
  })
})
