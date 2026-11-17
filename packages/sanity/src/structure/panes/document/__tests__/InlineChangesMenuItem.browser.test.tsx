import {configure} from '@chromatic-com/vitest'
import {Menu} from '@sanity/ui/menu'
import {type TFunction} from 'sanity'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {PaneMenuButtonItem} from '../../../components/pane/PaneMenuButtonItem'
import {resolveMenuNodes} from '../../../menuNodes'
import {type StructureToolFeatures} from '../../../types'
import {getMenuItems} from '../menuItems'

// A measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

const t = ((key: string) => key) as unknown as TFunction

/** The document pane's ⋯ menu as `getMenuItems` builds it, without inspectors. */
function PaneMenuHarness({displayInlineChanges}: {displayInlineChanges: boolean}) {
  const nodes = resolveMenuNodes({
    actionHandler: () => undefined,
    menuItems: getMenuItems({
      displayInlineChanges,
      features: {} as StructureToolFeatures,
      hasValue: true,
      inspectorMenuItems: [],
      inspectors: [],
      t,
    }),
    menuItemGroups: [{id: 'inspectors'}],
  })
  return (
    <TestWrapper schemaTypes={[]}>
      <Menu data-testid="pane-menu">
        {nodes.map((node) => (
          <PaneMenuButtonItem isAfterGroup={false} key={node.key} node={node} />
        ))}
      </Menu>
    </TestWrapper>
  )
}

function rowGeometry(title: string) {
  const row = page.getByTestId(`action-${title.toLowerCase().replace(/\s/g, '')}`).element()
  const text = [...row.querySelectorAll('*')].findLast((element) => element.textContent === title)
  if (!text) throw new Error(`"${title}" text not found`)
  const box = row.getBoundingClientRect()
  return {
    height: box.height,
    textLeft: text.getBoundingClientRect().left - box.left,
    icons: [...row.querySelectorAll('svg')].filter((svg) => svg.checkVisibility()).length,
    pressed: row.getAttribute('aria-pressed') ?? row.getAttribute('data-pressed'),
  }
}

const INLINE = 'toggle-inline-changes.menu-item.title'
const COMPARE = 'compare-versions.menu-item.title'

describe('document pane menu: Inline changes row', () => {
  it.each([
    {name: 'off', displayInlineChanges: false, icons: 1},
    {name: 'on', displayInlineChanges: true, icons: 2},
  ])(
    'is a standard row with its icon, like its neighbours, when $name',
    async ({displayInlineChanges, icons}) => {
      void render(<PaneMenuHarness displayInlineChanges={displayInlineChanges} />)
      await expect.element(page.getByTestId('pane-menu')).toBeVisible()

      const geometry = () => ({compare: rowGeometry(COMPARE), inline: rowGeometry(INLINE)})
      await expectStable(() => JSON.stringify(geometry()))

      const {compare, inline} = geometry()
      expect(Math.abs(compare.height - 33.5)).toBeLessThanOrEqual(1)
      expect(Math.abs(inline.height - compare.height)).toBeLessThanOrEqual(1)
      expect(Math.abs(inline.textLeft - compare.textLeft)).toBeLessThanOrEqual(1)
      // The highlight icon, plus a checkmark at the row's end while inline changes are on
      expect(inline.icons).toBe(icons)
    },
  )
})
