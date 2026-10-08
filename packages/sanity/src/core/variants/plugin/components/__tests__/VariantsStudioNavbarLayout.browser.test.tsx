import {configure} from '@chromatic-com/vitest'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../ui-components/button/Button'
import {PerspectiveFilter} from '../PerspectiveFilter'
import {VariantsStudioNavbarFallback} from '../VariantsStudioNavbarLayout'

// The bar's fallback reserves one row while the filters' chunk loads, so the filters replace it
// without moving the layout below. Styles decide that height, so it is measured here rather than
// in jsdom. The fallback is a loading state, which is not archived (see sanity-visual-regression).
configure({disableAutoSnapshot: true})

const heightOf = (element: Element) => Math.round(element.getBoundingClientRect().height)

describe('VariantsStudioNavbarLayout fallback', () => {
  it('reserves exactly the height of a settled filter pill', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div data-testid="fallback">
          <VariantsStudioNavbarFallback />
        </div>
        {/* A settled filter, as `VariantsStudioNavbar` renders it: a default-size trigger button
            inside the pill's bordered card */}
        <PerspectiveFilter prefix="Version" tone="default" label="Drafts">
          <Button
            data-testid="pill-trigger"
            iconRight={ChevronDownIcon}
            mode="bleed"
            text="Drafts"
          />
        </PerspectiveFilter>
      </TestWrapper>,
    )

    await expect.element(page.getByTestId('pill-trigger')).toBeVisible()
    const pill = page.getByTestId('pill-trigger').element().closest('[data-ui="PerspectiveFilter"]')
    if (!pill) throw new Error('PerspectiveFilter not found')
    const fallback = page.getByTestId('fallback').element().firstElementChild
    if (!fallback) throw new Error('fallback row not found')

    // One combined sample, held still over several re-reads: a single matching re-read could
    // agree before a font or ResizeObserver update moves either box on the next frame
    const heights = await expectStable(() => `${heightOf(fallback)},${heightOf(pill)}`)
    const [fallbackHeight, pillHeight] = heights.split(',').map(Number)
    expect(pillHeight).toBeGreaterThan(0)
    expect(fallbackHeight).toBe(pillHeight)
  })
})
