import {render, screen} from '@testing-library/react'
import {describe, expect, it, vi} from 'vitest'

import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {StudioNavbar} from './StudioNavbar'

// The clusters' view-transition names are set by StudioNavbar itself. These
// stand-ins keep the shell from pulling in workspace, color-scheme, and
// search providers the assertion does not depend on.
vi.mock('./workspace/WorkspaceMenuButton', () => ({WorkspaceMenuButton: () => null}))
vi.mock('./home/HomeButton', () => ({HomeButton: () => null}))
vi.mock('./new-document/NewDocumentButton', () => ({NewDocumentButton: () => null}))
vi.mock('./search/SearchButton', () => ({SearchButton: () => null}))
vi.mock('./search/SearchDialog', () => ({SearchDialog: () => null}))
vi.mock('./search/components/SearchPopover', () => ({SearchPopover: () => null}))
vi.mock('./search/contexts/search/SearchProvider', () => ({
  SearchProvider: (props: {children?: unknown}) => props.children ?? null,
}))
vi.mock('./free-trial/FreeTrialProvider', () => ({
  FreeTrialProvider: (props: {children?: unknown}) => props.children ?? null,
}))
vi.mock('./free-trial/FreeTrial', () => ({FreeTrial: () => null}))
vi.mock('./presence/PresenceMenu', () => ({PresenceMenu: () => null}))
vi.mock('./resources/ResourcesButton', () => ({ResourcesButton: () => null}))
vi.mock('./configIssues/ConfigIssuesButton', () => ({ConfigIssuesButton: () => null}))
vi.mock('./userMenu/UserMenu', () => ({UserMenu: () => null}))
vi.mock('./navDrawer/NavDrawer', () => ({NavDrawer: () => null}))
vi.mock('../../../perspective/navbar/ReleasesNav', () => ({ReleasesNav: () => null}))

describe('StudioNavbar view transitions', () => {
  it('gives the side clusters distinct CSS-safe view-transition names', async () => {
    const wrapper = await createTestProvider()
    render(<StudioNavbar />, {wrapper})

    const left = screen.getByTestId('studio-navbar-left')
    const right = screen.getByTestId('studio-navbar-right')
    const leftName = left.style.viewTransitionName
    const rightName = right.style.viewTransitionName

    expect(leftName).not.toBe('')
    expect(rightName).not.toBe('')
    expect(leftName).not.toBe(rightName)
    for (const name of [leftName, rightName]) {
      expect(name).not.toContain(':')
      expect(name.startsWith('\u00AB') || name.startsWith('_')).toBe(true)
    }
  })
})
