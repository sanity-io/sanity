import {configure} from '@chromatic-com/vitest'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {TransferIcon} from '@sanity/icons/Transfer'
import {Menu} from '@sanity/ui/menu'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable} from '../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../test/browser/TestWrapper'
import {PaneMenuButtonItem} from '../../../../components/pane/PaneMenuButtonItem'
import {type _PaneMenuItem} from '../../../../components/pane/types'
import {HiddenCheckmarkIcon} from '../HiddenCheckmarkIcon'

// A measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

function item(key: string, title: string, icon: _PaneMenuItem['icon']): _PaneMenuItem {
  return {type: 'item', key, title, icon, renderAsButton: false, onAction: () => undefined}
}

/** The document pane's ⋯ menu rows around "Inline changes", as `getMenuItems` builds them. */
function PaneMenuHarness({inlineChanges}: {inlineChanges: boolean}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <Menu data-testid="pane-menu">
        <PaneMenuButtonItem
          isAfterGroup={false}
          node={item('compare', 'Compare versions', TransferIcon)}
        />
        <PaneMenuButtonItem
          isAfterGroup={false}
          node={item(
            'inline',
            'Inline changes',
            inlineChanges ? CheckmarkIcon : HiddenCheckmarkIcon,
          )}
        />
      </Menu>
    </TestWrapper>
  )
}

function rowGeometry(title: string) {
  const row = page.getByTestId(`action-${title.toLowerCase().replace(/\s/g, '')}`).element()
  const text = [...row.querySelectorAll('*')].findLast((element) => element.textContent === title)
  if (!text) throw new Error(`"${title}" text not found`)
  const box = row.getBoundingClientRect()
  return {height: box.height, textLeft: text.getBoundingClientRect().left - box.left}
}

describe('document pane menu: Inline changes row', () => {
  it.each([
    {name: 'off (hidden checkmark)', inlineChanges: false},
    {name: 'on (checkmark)', inlineChanges: true},
  ])('is a standard row with the icon slot reserved when $name', async ({inlineChanges}) => {
    void render(<PaneMenuHarness inlineChanges={inlineChanges} />)
    await expect.element(page.getByTestId('pane-menu')).toBeVisible()

    const geometry = () => ({
      compare: rowGeometry('Compare versions'),
      inline: rowGeometry('Inline changes'),
    })
    await expectStable(() => JSON.stringify(geometry()))

    const {compare, inline} = geometry()
    expect(Math.abs(compare.height - 33.5)).toBeLessThanOrEqual(1)
    expect(Math.abs(inline.height - compare.height)).toBeLessThanOrEqual(1)
    expect(Math.abs(inline.textLeft - compare.textLeft)).toBeLessThanOrEqual(1)
  })
})
