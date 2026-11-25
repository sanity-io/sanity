import {DashboardIcon} from '@sanity/icons/Dashboard'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import noop from 'lodash-es/noop.js'
import {useState} from 'react'
import {FreeTrialContext, WorkspacesContext} from 'sanity/_singletons'
import {RouterProvider} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {Button} from '../../../../../../ui-components/button/Button'
import {Dialog} from '../../../../../../ui-components/dialog/Dialog'
import {type NavbarAction} from '../../../../../config/studio/types'
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

// Stands in for the drawer's perspective pickers, whose create release dialog
// renders in the portal, outside the drawer's focus trap.
function OpenDialogAction() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button mode="bleed" onClick={() => setOpen(true)} text="Open dialog" />
      {open && (
        <Dialog
          header="Dialog from the drawer"
          id="nav-drawer-dialog"
          onClose={() => setOpen(false)}
        >
          <input aria-label="Dialog input" />
        </Dialog>
      )}
    </>
  )
}

const DIALOG_ACTION: NavbarAction[] = [
  {location: 'sidebar', name: 'open-dialog', render: () => <OpenDialogAction />},
]

function NavDrawerHarness({actions, isOpen}: {actions?: NavbarAction[]; isOpen: boolean}) {
  return (
    <TestWrapper schemaTypes={[]}>
      <RouterProvider router={router} state={{tool: 'structure'}} onNavigate={noop}>
        <LocaleProvider>
          <WorkspacesContext.Provider value={WORKSPACES}>
            <FreeTrialContext.Provider value={NO_FREE_TRIAL}>
              <NavDrawer
                __internal_actions={actions}
                activeToolName="structure"
                isOpen={isOpen}
                onClose={noop}
                tools={TOOLS}
              />
            </FreeTrialContext.Provider>
          </WorkspacesContext.Provider>
        </LocaleProvider>
      </RouterProvider>
    </TestWrapper>
  )
}

/**
 * Renders the drawer closed and opens it once the test pane has faded in. The drawer slides in
 * as a view transition, and Chromium 159 crashes a page that starts one in an iframe, which is
 * where Vitest runs the tests, while a CSS transition is running.
 */
async function renderOpenDrawer(actions?: NavbarAction[]) {
  const {rerender} = await render(<NavDrawerHarness actions={actions} isOpen={false} />)
  await expect.element(page.getByTestId('pane')).toBeVisible()
  await expect
    .poll(
      () =>
        document.querySelector('[data-ui="PaneLayout"][data-mounted]') !== null &&
        !document.getAnimations().some((animation) => animation instanceof CSSTransition),
    )
    .toBe(true)
  await rerender(<NavDrawerHarness actions={actions} isOpen />)
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
 * entry, so the home / workspace switcher row is absent. The test waits until the
 * card is flush with the left edge.
 */
describe('NavDrawer', () => {
  test('renders the open drawer with user, tools, appearance and manage menus', async () => {
    const {settleChromaticEndState} = testHelpers()

    await renderOpenDrawer()

    await expect.element(page.getByText('Doug')).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Structure'})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Use system appearance'})).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Manage project'})).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Invite members'})).toBeVisible()

    // The slide animates snapshots of the card, which sits flush against the left edge throughout.
    await expectStable(drawerLeft)
    expect(drawerLeft()).toBe(0)

    // The focus lock moves focus to Close on mount, and Close opens its tooltip on focus after
    // the tooltip delay. Wait for it, so the pointer park in `settleChromaticEndState` closes it
    // instead of the tooltip opening after the park.
    await expect.element(page.getByText('Close menu')).toBeVisible()

    await settleChromaticEndState()
  })

  test('lets a dialog opened from the drawer keep focus', async () => {
    const {settleChromaticEndState} = testHelpers()

    await renderOpenDrawer(DIALOG_ACTION)
    await expectStable(drawerLeft)

    await page.getByRole('button', {name: 'Open dialog'}).click()
    const input = page.getByRole('textbox', {name: 'Dialog input'})
    await input.click()
    await userEvent.keyboard('typed in the dialog')

    await expect.element(input).toHaveFocus()
    await expect.element(input).toHaveValue('typed in the dialog')

    const dialog = page.getByRole('dialog', {name: 'Dialog from the drawer'})
    await userEvent.keyboard('{Tab}')
    await expect.poll(() => dialog.element().contains(document.activeElement)).toBe(true)
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await expect.element(input).toHaveFocus()

    await settleChromaticEndState()
  })
})
