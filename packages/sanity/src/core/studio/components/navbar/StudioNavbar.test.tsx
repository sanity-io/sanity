import {render} from '@testing-library/react'
import {type ReactNode} from 'react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {StudioNavbar} from './StudioNavbar'

vi.mock('./home/HomeButton', () => ({HomeButton: () => null}))
vi.mock('./workspace/WorkspaceMenuButton', () => ({WorkspaceMenuButton: () => null}))
vi.mock('./new-document/NewDocumentButton', () => ({NewDocumentButton: () => null}))
vi.mock('./search/SearchButton', () => ({SearchButton: () => null}))
vi.mock('./search/SearchDialog', () => ({SearchDialog: () => null}))
vi.mock('./search/components/SearchPopover', () => ({SearchPopover: () => null}))
vi.mock('./search/contexts/search/SearchProvider', () => ({
  SearchProvider: ({children}: {children?: ReactNode}) => children,
}))
vi.mock('./presence/PresenceMenu', () => ({PresenceMenu: () => null}))
vi.mock('./resources/ResourcesButton', () => ({ResourcesButton: () => null}))
vi.mock('./userMenu/UserMenu', () => ({UserMenu: () => null}))
vi.mock('./free-trial/FreeTrial', () => ({FreeTrial: () => null}))
vi.mock('./free-trial/FreeTrialProvider', () => ({
  FreeTrialProvider: ({children}: {children?: ReactNode}) => children,
}))
vi.mock('./configIssues/ConfigIssuesButton', () => ({ConfigIssuesButton: () => null}))
vi.mock('./navDrawer/NavDrawer', () => ({NavDrawer: () => null}))
vi.mock('../../../perspective/navbar/ReleasesNav', () => ({ReleasesNav: () => null}))

// view-transition-name is a CSS custom-ident: no whitespace or colon, and not a
// CSS-wide keyword. React's `:r1:` useId is rewritten to that shape.
const CSS_CUSTOM_IDENT = /^(?!(?:none|inherit|initial|unset|revert|revert-layer)$)[^\s:;,{}()]+$/

function clusterNames(navbar: HTMLElement): {left: string; right: string} {
  const grid = navbar.querySelector<HTMLElement>('[data-ui="Grid"]')
  if (!grid) throw new Error('navbar grid not rendered')
  const [left, center, right] = Array.from(grid.children) as HTMLElement[]
  // The tools column stays unnamed; only the side clusters participate.
  expect(center?.style.viewTransitionName ?? '').toBe('')
  return {
    left: left.style.viewTransitionName,
    right: right.style.viewTransitionName,
  }
}

describe('StudioNavbar view transitions', () => {
  it('gives each side cluster a stable, css-safe name that does not collide across studios', async () => {
    const TestProvider = await createTestProvider()
    const ui = (
      <TestProvider>
        <StudioNavbar />
        <StudioNavbar />
      </TestProvider>
    )
    const {rerender} = render(ui)

    const navbars = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="studio-navbar"]'),
    )
    expect(navbars).toHaveLength(2)

    const first = clusterNames(navbars[0])
    const second = clusterNames(navbars[1])
    const names = [first.left, first.right, second.left, second.right]

    expect(new Set(names).size).toBe(names.length)
    for (const name of names) {
      expect(name).toMatch(CSS_CUSTOM_IDENT)
    }

    rerender(ui)

    const after = Array.from(
      document.querySelectorAll<HTMLElement>('[data-testid="studio-navbar"]'),
    )
    expect(clusterNames(after[0])).toEqual(first)
    expect(clusterNames(after[1])).toEqual(second)
  })
})
