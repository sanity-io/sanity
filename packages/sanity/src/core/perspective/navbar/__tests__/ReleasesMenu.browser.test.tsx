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

  test('a full cycle of the down arrow visits every menu item once and never a detail link', async () => {
    await renderAndOpenWithKeyboard()
    const menu = page.getByTestId('release-menu').element()
    const itemCount = menu.querySelectorAll('[role="menuitem"]:not(:disabled)').length

    const visited: Array<Element | null> = []
    for (let i = 0; i < itemCount; i++) {
      const previous = window.document.activeElement
      await userEvent.keyboard('{ArrowDown}')
      await expect.poll(() => window.document.activeElement).not.toBe(previous)
      visited.push(window.document.activeElement)
    }

    expect(new Set(visited).size).toBe(itemCount)
    expect(visited.every((element) => element?.getAttribute('role') === 'menuitem')).toBe(true)
    expect(activeTestId()).toBe('release-drafts')
  })
})

const releaseIntentPath = (releaseId: string) => new RegExp(`^/intent/release/id=${releaseId}/?$`)

const detailLink = (releaseId: string) =>
  page.getByTestId(`release-detail-link-${releaseId}`).element() as HTMLAnchorElement

/** The link's container carries the show-on-hover opacity. */
const detailLinkOpacity = (releaseId: string) =>
  getComputedStyle(detailLink(releaseId).parentElement!).opacity

describe('ReleasesMenu release detail link', () => {
  test('is a link next to each release menu item, never inside its button', async () => {
    await renderAndOpenWithKeyboard()

    for (const releaseId of ['rASAP', 'rActive', 'rUndecided']) {
      const link = detailLink(releaseId)
      const menuItem = page.getByTestId(`release-${releaseId}`).element()

      expect(link.tagName).toBe('A')
      expect(link.getAttribute('href')).toMatch(releaseIntentPath(releaseId))
      expect(link.getAttribute('aria-label')).toMatch(/^View release /)
      expect(link.closest('button')).toBeNull()
      expect(menuItem.contains(link)).toBe(false)
      expect(link.parentElement?.previousElementSibling).toBe(menuItem)
    }

    for (const perspective of ['published', 'drafts']) {
      const row = page.getByTestId(`release-${perspective}`).element().parentElement!
      expect(row.querySelector('a')).toBeNull()
    }
  })

  test('shows on hover, over the space its release reserves for it', async () => {
    await renderAndOpenWithKeyboard()
    const menuItem = page.getByTestId('release-rASAP')

    expect(detailLinkOpacity('rASAP')).toBe('0')

    await userEvent.hover(menuItem)
    await expect.poll(() => detailLinkOpacity('rASAP')).toBe('1')

    const space = menuItem.element().querySelector('[data-testid="detail-link-space"]')!
    const spaceRect = space.getBoundingClientRect()
    const linkRect = detailLink('rASAP').getBoundingClientRect()
    expect(linkRect.width).toBeGreaterThan(0)
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      expect(Math.abs(linkRect[side] - spaceRect[side])).toBeLessThan(1)
    }

    // The pointer leaves the menu item for the link, which keeps the row highlighted
    await userEvent.hover(page.getByTestId('release-detail-link-rASAP'))
    await expect.poll(() => menuItem.element().hasAttribute('data-hovered')).toBe(true)
    expect(detailLinkOpacity('rASAP')).toBe('1')

    await userEvent.hover(page.getByTestId('release-rUndecided'))
    await expect.poll(() => detailLinkOpacity('rASAP')).toBe('0')
    expect(menuItem.element().hasAttribute('data-hovered')).toBe(false)
    expect(detailLinkOpacity('rUndecided')).toBe('1')
  })

  test('clicking it opens the release and closes the menu without changing the perspective', async () => {
    const {onNavigate, trigger} = await renderAndOpenWithKeyboard()

    await userEvent.hover(page.getByTestId('release-rActive'))
    await userEvent.click(page.getByTestId('release-detail-link-rActive'))

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0].path).toMatch(releaseIntentPath('rActive'))
    await expect.poll(isMenuOpen).toBe(false)
    await expect.poll(() => window.document.activeElement).toBe(trigger.element())
  })

  test('the right arrow key moves to it and the left arrow key back, and the arrows move on from its release', async () => {
    await renderAndOpenWithKeyboard()

    // Published and Drafts have no link, so the right arrow key leaves them focused
    await userEvent.keyboard('{ArrowRight}')
    expect(activeTestId()).toBe('release-drafts')

    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(activeTestId).toBe('release-detail-link-rASAP')
    expect(detailLinkOpacity('rASAP')).toBe('1')
    expect(page.getByTestId('release-rASAP').element().hasAttribute('data-selected')).toBe(true)

    await userEvent.keyboard('{ArrowLeft}')
    await expect.poll(activeTestId).toBe('release-rASAP')

    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(activeTestId).toBe('release-detail-link-rASAP')
    await userEvent.keyboard('{ArrowDown}')
    await expect.poll(activeTestId).toBe('release-rActive')

    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(activeTestId).toBe('release-detail-link-rActive')
    await userEvent.keyboard('{ArrowUp}')
    await expect.poll(activeTestId).toBe('release-rASAP')
  })

  test.for([
    ['Enter', '{Enter}'],
    ['Space', ' '],
  ])('%s on it opens the release and closes the menu', async ([, key]) => {
    const {onNavigate, trigger} = await renderAndOpenWithKeyboard()

    await userEvent.keyboard('{ArrowDown}')
    // The menu moves focus on the next frame
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(activeTestId).toBe('release-detail-link-rASAP')
    await userEvent.keyboard(key)

    expect(onNavigate).toHaveBeenCalledTimes(1)
    expect(onNavigate.mock.calls[0][0].path).toMatch(releaseIntentPath('rASAP'))
    await expect.poll(isMenuOpen).toBe(false)
    await expect.poll(() => window.document.activeElement).toBe(trigger.element())
  })

  test.for([
    ['Escape', '{Escape}'],
    ['Tab', '{Tab}'],
  ])('%s on it closes the menu like on a menu item', async ([, key]) => {
    const {onNavigate} = await renderAndOpenWithKeyboard()

    await userEvent.keyboard('{ArrowDown}')
    // The menu moves focus on the next frame
    await expect.poll(activeTestId).toBe('release-rASAP')
    await userEvent.keyboard('{ArrowRight}')
    await expect.poll(activeTestId).toBe('release-detail-link-rASAP')
    await userEvent.keyboard(key)

    await expect.poll(isMenuOpen).toBe(false)
    expect(onNavigate).not.toHaveBeenCalled()
  })
})
