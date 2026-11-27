import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import {render, screen, waitForElementToBeRemoved} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {FreeTrialContext, WorkspacesContext} from 'sanity/_singletons'
import {RouterProvider} from 'sanity/router'
import {describe, expect, test, vi} from 'vitest'

import {stubViewTransitions} from '../../../../../../../test/testUtils/stubViewTransitions'
import {createTestProvider} from '../../../../../../../test/testUtils/TestProvider'
import {type Tool} from '../../../../../config/types'
import {UserColorManagerProvider} from '../../../../../user-color/provider'
import {ColorSchemeProvider} from '../../../../colorScheme'
import {createRouter} from '../../../../router/router'
import {createWorkspaceSummaries} from '../../__tests__/workspaceSummaryFixtures'
import {type FreeTrialContextProps} from '../../free-trial/FreeTrialContext'
import {NavDrawer} from '../NavDrawer'

vi.mock('../../useCanInviteMembers', () => ({
  useCanInviteProjectMembers: () => true,
}))

function NullTool() {
  return null
}

const TOOLS: Tool[] = [
  {name: 'structure', title: 'Structure', icon: MasterDetailIcon, component: NullTool},
]
const router = createRouter({tools: TOOLS})
const WORKSPACES = createWorkspaceSummaries([
  {name: 'default', title: 'Test Studio', projectId: 'test', dataset: 'test'},
])
const NO_FREE_TRIAL: FreeTrialContextProps = {
  data: null,
  showDialog: false,
  showOnLoad: false,
  toggleShowContent: noop,
}

function Drawer(props: {isOpen: boolean}) {
  return (
    <RouterProvider router={router} state={{tool: 'structure'}} onNavigate={noop}>
      <ColorSchemeProvider>
        <UserColorManagerProvider>
          <WorkspacesContext.Provider value={WORKSPACES}>
            <FreeTrialContext.Provider value={NO_FREE_TRIAL}>
              <NavDrawer
                activeToolName="structure"
                isOpen={props.isOpen}
                onClose={noop}
                tools={TOOLS}
              />
            </FreeTrialContext.Provider>
          </WorkspacesContext.Provider>
        </UserColorManagerProvider>
      </ColorSchemeProvider>
    </RouterProvider>
  )
}

describe('NavDrawer', () => {
  test('slides in and out in transitions of its own type, the backdrop and the drawer each on their own', async () => {
    const pictured = stubViewTransitions()
    const wrapper = await createTestProvider()
    const {rerender} = render(<Drawer isOpen />, {wrapper})

    expect(await screen.findByRole('link', {name: 'Manage project'})).toBeInTheDocument()
    expect(pictured).toEqual([
      {types: ['sanity-nav-drawer'], old: [], new: ['nav-drawer', 'nav-drawer-backdrop']},
    ])

    rerender(<Drawer isOpen={false} />)

    await waitForElementToBeRemoved(() => screen.queryByRole('link', {name: 'Manage project'}))
    expect(pictured.at(-1)).toEqual({
      types: ['sanity-nav-drawer'],
      old: ['nav-drawer', 'nav-drawer-backdrop'],
      new: [],
    })
  })
})
