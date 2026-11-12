import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {scheduledRelease} from '../../../releases/__fixtures__/release.fixture'
import {ReleasesMenuItem} from '../releases/ReleasesMenuItem'

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
    expect(link.element().querySelector('[data-sanity-icon="arrow-top-right"]')).not.toBeNull()
  })
})
