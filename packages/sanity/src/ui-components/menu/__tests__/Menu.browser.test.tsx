import {type ComponentProps} from 'react'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../test/browser/TestWrapper'
import {Button} from '../../button/Button'
import {MenuButton} from '../../menuButton/MenuButton'
import {MenuItem} from '../../menuItem/MenuItem'
import {Menu} from '../Menu'

function MenuHarness(props: Pick<ComponentProps<typeof Menu>, 'padding' | 'paddingX'>) {
  return (
    <TestWrapper schemaTypes={[]}>
      <MenuButton
        button={<Button text="Open menu" />}
        id="menu-inset-test"
        menu={
          <Menu data-testid="menu-inset-menu" {...props}>
            <MenuItem text="Duplicate" />
            <MenuItem text="Delete" />
          </Menu>
        }
        popover={{placement: 'bottom-start', portal: true}}
      />
    </TestWrapper>
  )
}

async function openAndMeasure() {
  await userEvent.click(page.getByRole('button', {name: 'Open menu'}))
  const firstItem = page.getByRole('menuitem', {name: 'Duplicate'})
  await expect.element(firstItem).toBeVisible()

  const menu = page.getByTestId('menu-inset-menu').element().getBoundingClientRect()
  const row = firstItem.element().getBoundingClientRect()
  const lastRow = page.getByRole('menuitem', {name: 'Delete'}).element().getBoundingClientRect()
  return {
    left: row.left - menu.left,
    top: row.top - menu.top,
    right: menu.right - row.right,
    bottom: menu.bottom - lastRow.bottom,
  }
}

/**
 * The studio `Menu` applies the studio menu inset: 8px on every side.
 */
describe('Menu', () => {
  test('insets rows 8px on every side by default', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<MenuHarness />)

    const inset = await openAndMeasure()
    expect(Math.abs(inset.left - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(inset.right - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(inset.top - 8)).toBeLessThanOrEqual(1)
    expect(Math.abs(inset.bottom - 8)).toBeLessThanOrEqual(1)

    await settleChromaticEndState()
  })

  test('lets an explicit padding prop override the default inset', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<MenuHarness padding={0} />)

    const inset = await openAndMeasure()
    expect(Math.abs(inset.left)).toBeLessThanOrEqual(1)
    expect(Math.abs(inset.top)).toBeLessThanOrEqual(1)

    await settleChromaticEndState()
  })

  test('lets an explicit paddingX override the default inset on the sides only', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<MenuHarness paddingX={3} />)

    const inset = await openAndMeasure()
    expect(Math.abs(inset.left - 12)).toBeLessThanOrEqual(1)
    // Any explicit padding prop hands the whole inset to the caller, so the top falls back to
    // the `@sanity/ui` v4 default of 4px.
    expect(Math.abs(inset.top - 4)).toBeLessThanOrEqual(1)

    await settleChromaticEndState()
  })
})
