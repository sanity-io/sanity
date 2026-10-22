import {BoundaryElementProvider, Flex} from '@sanity/ui'
import noop from 'lodash-es/noop.js'
import {of} from 'rxjs'
import {ActiveWorkspaceMatcherContext, VisibleWorkspacesContext} from 'sanity/_singletons'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {WorkspaceMenuButton} from '../WorkspaceMenuButton'

// The project name comes from `/projects/<id>`; answer it statically.
vi.mock('../../../../../store/datastores', async (importOriginal) => ({
  ...(await importOriginal()),
  useProjectStore: () => ({getProjectName: () => of('Sanity Studio Test Data')}),
}))
// Grants come from `/projects/<id>/grants`; answer the invite check statically.
vi.mock('../../useCanInviteMembers', () => ({
  useCanInviteProjectMembers: () => true,
}))

// Two workspaces, so the menu shows the switcher list below the manage menu;
// the second one is signed out so its badge renders too.
const WORKSPACES = createWorkspaceSummaries([
  {
    name: 'production',
    title: 'Production',
    subtitle: 'Live content',
    projectId: 'project-a',
    dataset: 'production',
  },
  {
    name: 'staging',
    title: 'Staging',
    subtitle: 'Editorial sandbox',
    projectId: 'project-b',
    dataset: 'staging',
    signedIn: false,
  },
])
const VISIBLE_WORKSPACES = {visibleWorkspaces: WORKSPACES, workspaceAuthStates: {}}
const ACTIVE_WORKSPACE_MATCHER = {activeWorkspace: WORKSPACES[0], setActiveWorkspace: noop}

// The navbar has no pane above it, so its menus measure `constrainSize`
// against the viewport in the studio. The wrapper's pane is only as tall as
// its content (one button) and would clamp the open menu to a few pixels.
// The `Flex` stands in for the navbar's own, so the button shrinks to its
// label and the `bottom-end` menu aligns under it instead of the viewport edge.
function WorkspaceMenuButtonHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <BoundaryElementProvider element={window.document.body}>
        <VisibleWorkspacesContext.Provider value={VISIBLE_WORKSPACES}>
          <ActiveWorkspaceMatcherContext.Provider value={ACTIVE_WORKSPACE_MATCHER}>
            <Flex>
              <WorkspaceMenuButton />
            </Flex>
          </ActiveWorkspaceMatcherContext.Provider>
        </VisibleWorkspacesContext.Provider>
      </BoundaryElementProvider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the open workspace switcher: the active workspace
 * button, the manage menu with the project name, and the workspace list with
 * the selected row checked and the signed-out row badged.
 */
describe('WorkspaceMenuButton', () => {
  test('opens the menu with the manage menu and the workspace list', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<WorkspaceMenuButtonHarness />)

    await userEvent.click(page.getByRole('button', {name: 'Production'}))

    const menu = page.getByRole('menu')
    await expect.element(menu).toBeVisible()
    await expect.element(menu.getByText('Sanity Studio Test Data')).toBeVisible()
    await expect.element(menu.getByText('Switch workspace')).toBeVisible()
    await expect.element(menu.getByRole('menuitem', {name: /Production/})).toBeVisible()
    await expect.element(menu.getByRole('menuitem', {name: /Staging/})).toBeVisible()
    await expect.element(menu.getByText('Signed out')).toBeVisible()
    // `toBeVisible` passes for a menu clamped to a few pixels by `constrainSize`.
    await expect.poll(() => menu.element().getBoundingClientRect().height).toBeGreaterThan(100)

    await settleChromaticEndState()
  })
})
