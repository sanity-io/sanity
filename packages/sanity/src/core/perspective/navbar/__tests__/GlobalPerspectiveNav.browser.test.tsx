import {configure} from '@chromatic-com/vitest'
import {BoundaryElementProvider} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, it} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {GlobalPerspectiveNav} from '../GlobalPerspectiveNav'

// The nav links to the releases tool (`{tool: 'releases', releases: {}}`), so the router needs tool routes.
const router = route.create('/', [
  route.intents('/intent'),
  route.create('/:tool', [route.scope('releases', '/*')]),
])

// The open menu is a measurement, not a visual state worth archiving.
configure({disableAutoSnapshot: true})

/**
 * The open popover of the releases menu: `@sanity/ui` keeps closed menus mounted and hidden,
 * so the open one is picked by visibility.
 */
async function openReleasesMenu(): Promise<HTMLElement> {
  const trigger = page.getByTestId('global-perspective-menu-button')
  await expect.element(trigger).toBeVisible()
  await trigger.click()
  let popover: HTMLElement | undefined
  await expect
    .poll(() => {
      popover = [...document.querySelectorAll<HTMLElement>('[data-ui="MenuButton__popover"]')].find(
        (element) => element.checkVisibility(),
      )
      return popover
    })
    .toBeDefined()
  if (!popover) throw new Error('open releases menu not found')
  return popover
}

describe('GlobalPerspectiveNav', () => {
  // In the studio the navbar sits outside every `BoundaryElementProvider` (structure panes provide
  // their own, which is why the test wrapper's pane is reset here). Without one, the menus'
  // size middleware measured against the chip's clipping ancestors (`overflow: hidden`) and
  // the menus opened 0px tall. `fullWidth` is the mobile nav drawer's layout of the same nav.
  // Releases only: in the studio its trigger has no clipping ancestor, but here the test pane
  // clips it, so the case checks that the nav brings its own boundary whatever it is rendered in.
  it.each([
    {name: 'with variants', betaFeatures: {variants: {enabled: true}}, fullWidth: false},
    {
      name: 'with variants, in the nav drawer',
      betaFeatures: {variants: {enabled: true}},
      fullWidth: true,
    },
    {name: 'with releases only', betaFeatures: undefined, fullWidth: false},
  ])('opens the releases menu with room for its items $name', async ({betaFeatures, fullWidth}) => {
    void render(
      <TestWrapper schemaTypes={[]} betaFeatures={betaFeatures}>
        <RouterProvider router={router} state={{}} onNavigate={noop}>
          <BoundaryElementProvider element={null}>
            <div style={{display: 'flex', flexDirection: fullWidth ? 'column' : 'row', gap: 4}}>
              <GlobalPerspectiveNav fullWidth={fullWidth} />
            </div>
          </BoundaryElementProvider>
        </RouterProvider>
      </TestWrapper>,
    )

    const popover = await openReleasesMenu()
    await expect.poll(() => popover.getBoundingClientRect().height).toBeGreaterThan(100)
    expect(parseFloat(popover.style.maxHeight || 'Infinity')).toBeGreaterThan(100)
    const drafts = [...popover.querySelectorAll('[role="menuitem"]')].find((item) =>
      item.textContent?.includes('Drafts'),
    )
    if (!drafts) throw new Error('Drafts menu item not found')
    expect(drafts.getBoundingClientRect().height).toBeGreaterThan(0)
  })
})
