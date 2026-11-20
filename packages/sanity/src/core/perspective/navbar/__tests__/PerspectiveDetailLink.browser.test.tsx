import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {variantAlphaAudience} from '../../../variants/__fixtures__/variants.fixture'
import {getVariantId} from '../../../variants/tool/util'
import {ReleasesMenuItem} from '../releases/ReleasesMenuItem'
import {VariantsMenuStory} from '../variants/__tests__/VariantsMenuStory'

/** The space between the link's box and the end of its row: 8px, as the row sits in the menu. */
function linkGapToRowEnd(link: Element): number {
  const row = link.closest('[data-detail-link-row]')
  if (!row) throw new Error('row not found')
  return row.getBoundingClientRect().right - link.getBoundingClientRect().right
}

describe('PerspectiveDetailLink', () => {
  it('centres the link on a two-line row and reserves exactly its width', async () => {
    void render(
      <TestWrapper schemaTypes={[]}>
        <div style={{width: 320}}>
          <Menu>
            <ReleasesMenuItem
              onNavigateToRelease={noop}
              rangePosition={undefined}
              release={scheduledRelease}
            />
          </Menu>
        </div>
      </TestWrapper>,
    )

    const link = page.getByTestId('release-detail-link-rScheduled')
    await expect.element(link).toBeInTheDocument()
    const row = link.element().closest('[data-detail-link-row]')
    const item = row?.querySelector('[data-ui="MenuItem"]')
    if (!item) throw new Error('menu item not found')
    const space = item.querySelector('[data-testid="perspective-detail-link-space"]')
    if (!space) throw new Error('reserved space not found')

    const geometry = () => {
      const linkBox = link.element().getBoundingClientRect()
      const itemBox = item.getBoundingClientRect()
      return {
        linkCentre: linkBox.top + linkBox.height / 2,
        itemCentre: itemBox.top + itemBox.height / 2,
        itemHeight: itemBox.height,
        linkWidth: linkBox.width,
        spaceWidth: space.getBoundingClientRect().width,
      }
    }
    await expectStable(() => JSON.stringify(geometry()))

    const {linkCentre, itemCentre, itemHeight, linkWidth, spaceWidth} = geometry()
    // Title and publish date: two lines, so centring differs from top alignment
    expect(itemHeight).toBeGreaterThan(40)
    expect(Math.abs(linkCentre - itemCentre)).toBeLessThanOrEqual(1)
    expect(spaceWidth).toBe(linkWidth)
    // The link covers the space the item reserves for it, 8px from the row's end
    expect(Math.abs(linkGapToRowEnd(link.element()) - 8)).toBeLessThanOrEqual(1)
    expect(
      Math.abs(space.getBoundingClientRect().right - link.element().getBoundingClientRect().right),
    ).toBeLessThanOrEqual(1)
    expect(link.element().querySelector('[data-sanity-icon="arrow-top-right"]')).not.toBeNull()
  })

  it('keeps the view variant link 8px from the end of its row', async () => {
    void render(<VariantsMenuStory />)
    await page.getByTestId('variants-nav-menu-button').click()
    await expect.element(page.getByTestId('variants-nav-menu')).toBeVisible()
    const link = page.getByTestId(`variant-detail-link-${getVariantId(variantAlphaAudience._id)}`)
    await expectStable(() => String(linkGapToRowEnd(link.element())))
    expect(Math.abs(linkGapToRowEnd(link.element()) - 8)).toBeLessThanOrEqual(1)
  })
})
