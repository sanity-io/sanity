import {Card} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import noop from 'lodash-es/noop.js'
import {preloadObservablePromise} from 'react-rx'
import {of} from 'rxjs'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'
import {describe, expect, test, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page} from 'vitest/browser'

import {testHelpers} from '../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {ManageMenu} from '../ManageMenu'

// Grants come from `/projects/<id>/grants`; answer the invite check statically.
vi.mock('../../useCanInviteMembers', () => ({
  useCanInviteProjectMembers: () => true,
}))

const [ACTIVE_WORKSPACE] = createWorkspaceSummaries([
  {name: 'default', title: 'Test Studio', projectId: 'test', dataset: 'test'},
])
const ACTIVE_WORKSPACE_MATCHER = {activeWorkspace: ACTIVE_WORKSPACE, setActiveWorkspace: noop}

// Settled before render, so the name row renders without its skeleton.
const PROJECT_NAME_PROMISE = preloadObservablePromise(of<string | null>('Sanity Studio Test Data'))

function ManageMenuHarness() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ActiveWorkspaceMatcherContext.Provider value={ACTIVE_WORKSPACE_MATCHER}>
        <Card style={{maxWidth: 350}}>
          <Menu padding={0}>
            <ManageMenu multipleWorkspaces={false} projectNamePromise={PROJECT_NAME_PROMISE} />
          </Menu>
        </Card>
      </ActiveWorkspaceMatcherContext.Provider>
    </TestWrapper>
  )
}

/**
 * Visual coverage for the head of the workspace menu: the workspace icon, the
 * project name above the workspace title, and the manage-project and
 * invite-members links.
 */
describe('ManageMenu', () => {
  test('renders the project name, workspace title and manage links', async () => {
    const {settleChromaticEndState} = testHelpers()

    await render(<ManageMenuHarness />)

    await expect.element(page.getByText('Sanity Studio Test Data')).toBeVisible()
    await expect.element(page.getByText('Test Studio')).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Manage project'})).toBeVisible()
    await expect.element(page.getByRole('link', {name: 'Invite members'})).toBeVisible()
    expect(document.querySelector('[data-ui="TextSkeleton"]')).toBeNull()

    await settleChromaticEndState()
  })
})
