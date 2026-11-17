import {BoundaryElementProvider} from '@sanity/ui'
import {describe, expect, test} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {LocaleProvider} from '../../../../../i18n/components/LocaleProvider'
import {UserMenu} from '../UserMenu'

// `LocaleMenu` reads `LocaleContext`, which the shared mock studio does not
// provide; the real provider works from the mock source's i18n setup.
// The navbar has no pane above it, so its menus measure `constrainSize`
// against the viewport in the studio. The wrapper's pane is only as tall as
// its content (one button) and would clamp the open menu to a few pixels.
function UserMenuHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <BoundaryElementProvider element={window.document.body}>
        <LocaleProvider>
          <UserMenu />
        </LocaleProvider>
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the navbar user menu: the avatar trigger and the open
 * menu with the current user card (avatar, name, email) and the appearance
 * menu. The mock workspace's user has no login provider and its auth store has
 * no `logout`, so the provider logo and the sign-out row are absent by
 * construction, not by chance; the language menu is disabled in production
 * code for now.
 */
describe('UserMenu', () => {
  test('opens the menu with the current user card and the appearance menu', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<UserMenuHarness />)

    const trigger = page.getByRole('button', {name: 'Doug'})
    await expect.element(trigger).toBeVisible()
    await userEvent.click(trigger)

    const menu = page.getByTestId('user-menu')
    await expect.element(menu).toBeVisible()
    await expect.element(menu.getByText('doug@sanity.io')).toBeVisible()
    await expect.element(menu.getByRole('menuitem', {name: 'Use system appearance'})).toBeVisible()
    await expect.element(menu.getByRole('menuitem', {name: 'Use dark appearance'})).toBeVisible()
    // `toBeVisible` passes for a menu clamped to a few pixels by `constrainSize`.
    await expect.poll(() => menu.element().getBoundingClientRect().height).toBeGreaterThan(100)

    await settleChromaticEndState()
  })
})
