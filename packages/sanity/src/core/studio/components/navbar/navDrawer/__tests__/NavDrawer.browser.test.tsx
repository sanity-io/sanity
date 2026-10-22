import {DashboardIcon} from '@sanity/icons/Dashboard'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import noop from 'lodash-es/noop.js'
import {FreeTrialContext, WorkspacesContext} from 'sanity/_singletons'
import {RouterProvider} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type Tool} from '../../../../../config/types'
import {LocaleProvider} from '../../../../../i18n/components/LocaleProvider'
import {createRouter} from '../../../../router/router'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {type FreeTrialContextProps} from '../../free-trial/FreeTrialContext'
import {NavDrawer} from '../NavDrawer'

// Grants come from `/projects/<id>/grants`; answer the invite check statically.
vi.mock('../../useCanInviteMembers', () => ({
  useCanInviteProjectMembers: () => true,
}))

function NullTool() {
  return null
}

const TOOLS: Tool[] = [
  {name: 'structure', title: 'Structure', icon: MasterDetailIcon, component: NullTool},
  {name: 'vision', title: 'Vision', icon: EyeOpenIcon, component: NullTool},
  {name: 'dashboard', title: 'Dashboard', icon: DashboardIcon, component: NullTool},
]

// ToolLink resolves per-tool router state to an href; the shared mock-studio
// router only defines intents.
const router = createRouter({tools: TOOLS})

// A single workspace keeps the home / workspace switcher row out of the header.
const WORKSPACES = createWorkspaceSummaries([
  {name: 'default', title: 'Test Studio', projectId: 'test', dataset: 'test'},
])

// No trial: the free-trial row stays out of the manage menu (its states are
// covered by the free-trial stories).
const NO_FREE_TRIAL: FreeTrialContextProps = {
  data: null,
  showDialog: false,
  showOnLoad: false,
  toggleShowContent: noop,
}

function NavDrawerHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={router} state={{tool: 'structure'}} onNavigate={noop}>
        <LocaleProvider>
          <WorkspacesContext.Provider value={WORKSPACES}>
            <FreeTrialContext.Provider value={NO_FREE_TRIAL}>
              <NavDrawer activeToolName="structure" isOpen onClose={noop} tools={TOOLS} />
            </FreeTrialContext.Provider>
          </WorkspacesContext.Provider>
        </LocaleProvider>
      </RouterProvider>
    </TestWrapper>
  )
}

// The backdrop and the sliding card both carry `data-open`; the card is the
// one that slides, rendered after the backdrop.
function drawerLeft() {
  const motionNodes = document.querySelectorAll<HTMLElement>('[data-open="true"]')
  const card = motionNodes[motionNodes.length - 1]
  return card ? Math.round(card.getBoundingClientRect().left) : null
}

/**
 * Visual coverage for the open mobile navigation drawer: the backdrop, the
 * slide-in card with the current user header and close button, the vertical
 * tool menu with the active tool selected, the appearance menu and the manage
 * menu with the manage-project and invite links. The workspace list has one
 * entry, so the home / workspace switcher row is absent. The drawer animates
 * in with a spring, so the test waits for the card to stop moving.
 */
describe('NavDrawer', () => {
  test('renders the open drawer with user, tools, appearance and manage menus', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<NavDrawerHarness />)

    await expect.element(page.getByText('Doug')).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Structure'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Use system appearance'})).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Manage project'})).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Invite members'})).toBeVisible()

    // The spring transition ends with the card flush against the left edge.
    await expectStable(drawerLeft)
    expect(drawerLeft()).toBe(0)

    await settleChromaticEndState()
  })
})
