import {configure} from '@chromatic-com/vitest'
import {BoundaryElementProvider} from '@sanity/ui'
import {route, RouterProvider} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {
  activeASAPRelease,
  activeScheduledRelease,
  activeUndecidedRelease,
} from '../../../releases/__fixtures__/release.fixture'
import {ReleasesMenu} from '../releases/ReleasesMenu'

// These tests drive focus and pointer interactions; their end states are a closed menu.
configure({disableAutoSnapshot: true})

const ACTIVE_RELEASES = {
  data: [activeASAPRelease, activeScheduledRelease, activeUndecidedRelease],
  byId: new Map(),
  error: undefined,
  loading: false,
  dispatch: () => undefined,
}

// The releases store needs a listening client; the hook is mocked at the module seam instead.
vi.mock('../../../releases/store/useActiveReleases', () => ({
  useActiveReleases: () => ACTIVE_RELEASES,
}))

const router = route.create('/', [route.intents('/intent')])

function ReleasesMenuHarness(props: {onNavigate: (opts: {path: string}) => void}) {
  return (
    <TestWrapper schemaTypes={[]}>
      {/* The navbar measures `constrainSize` against the viewport, not the wrapper's pane. */}
      <BoundaryElementProvider element={window.document.body}>
        <RouterProvider router={router} state={{}} onNavigate={props.onNavigate}>
          <ReleasesMenu selectedPerspectiveName={undefined} areReleasesEnabled />
        </RouterProvider>
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

const activeTestId = () => window.document.activeElement?.getAttribute('data-testid')

async function renderAndOpenWithKeyboard() {
  const onNavigate = vi.fn()
  await render(<ReleasesMenuHarness onNavigate={onNavigate} />)

  const trigger = page.getByTestId('global-perspective-menu-button')
  await expect.element(trigger).toBeVisible()
  trigger.element().focus()
  await userEvent.keyboard('{ArrowDown}')

  // The menu focuses the selected perspective when it opens.
  await expect.poll(activeTestId).toBe('release-drafts')

  return {onNavigate, trigger}
}

// A closed menu stays mounted under a hidden `<Activity>`, so read the trigger's state instead.
const isMenuOpen = () =>
  window.document
    .querySelector('[data-testid="global-perspective-menu-button"]')
    ?.getAttribute('aria-expanded') === 'true'

describe('ReleasesMenu keyboard navigation', () => {
  test('arrow keys move through the perspectives and releases in order', async () => {
    await renderAndOpenWithKeyboard()

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rActive')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rUndecided')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(activeTestId).toBe('release-rActive')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(activeTestId).toBe('release-rASAP')
  })

  test('Home and End jump to the first and last menu items, and the arrows wrap', async () => {
    await renderAndOpenWithKeyboard()
    const menu = page.getByTestId('release-menu').element()
    const enabledMenuItems = () =>
      Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not(:disabled)'))

    await userEvent.keyboard('{End}')
    await expect.poll(() => window.document.activeElement).toBe(enabledMenuItems().at(-1))
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-published')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(() => window.document.activeElement).toBe(enabledMenuItems().at(-1))
    await userEvent.keyboard('{Home}')
    await expect.poll(activeTestId).toBe('release-published')
  })

  test('Enter on a release selects it as the perspective and closes the menu', async () => {
    const {onNavigate, trigger} = await renderAndOpenWithKeyboard()

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{Enter}')

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0].path).toContain('perspective=rASAP')
    await expect.poll(isMenuOpen).toBe(false)
    await expect.poll(() => window.document.activeElement).toBe(trigger.element())
  })

  test('Escape closes the menu and returns focus to the trigger', async () => {
    const {onNavigate, trigger} = await renderAndOpenWithKeyboard()

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{Escape}')

    await expect.poll(isMenuOpen).toBe(false)
    await expect.poll(() => window.document.activeElement).toBe(trigger.element())
    expect(onNavigate).not.toHaveBeenCalled()
  })

  test('Tab leaves and closes the menu', async () => {
    const {onNavigate} = await renderAndOpenWithKeyboard()

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{Tab}')

    await expect.poll(isMenuOpen).toBe(false)
    expect(onNavigate).not.toHaveBeenCalled()
  })

  test('clicking a release selects it as the perspective', async () => {
    const {onNavigate} = await renderAndOpenWithKeyboard()

    await userEvent.click(page.getByTestId('release-rActive'))

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0].path).toContain('perspective=rActive')
    await expect.poll(isMenuOpen).toBe(false)
  })
})
