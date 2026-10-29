import {render, screen} from '@testing-library/react'
import noop from 'lodash-es/noop.js'
import {VisibleWorkspacesContext, WorkspacesContext} from 'sanity/_singletons'
import {RouterProvider} from 'sanity/router'
import {afterEach, describe, expect, it} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {flushMicrotasksThisIsACodeSmell} from '../../../../../test/testUtils/flushMicrotasks'
import {createTestProvider} from '../../../../../test/testUtils/TestProvider'
import {type Tool} from '../../../config/types'
import {perspectiveContextValueMock} from '../../../perspective/__mocks__/usePerspective.mock'
import {type TargetPerspective} from '../../../perspective/types'
import {activeASAPRelease} from '../../../releases/__fixtures__/release.fixture'
import {PUBLISHED} from '../../../releases/util/const'
import {ColorSchemeProvider} from '../../colorScheme'
import {createRouter} from '../../router/router'
import {StudioNavbar} from './StudioNavbar'

function NoopTool() {
  return null
}

const RELEASES_TOOL: Tool = {
  name: 'releases',
  title: 'Releases',
  component: NoopTool,
}

const router = createRouter({tools: [RELEASES_TOOL]})

const DRAFTS_PERSPECTIVE = perspectiveContextValueMock.selectedPerspective

const EMPTY_WORKSPACE_LIST: [] = []

const EMPTY_WORKSPACES = {
  visibleWorkspaces: EMPTY_WORKSPACE_LIST,
  workspaceAuthStates: {},
}

afterEach(() => {
  perspectiveContextValueMock.selectedPerspective = DRAFTS_PERSPECTIVE
})

async function renderNavbar(perspective: TargetPerspective) {
  perspectiveContextValueMock.selectedPerspective = perspective
  const TestProvider = await createTestProvider({
    client: createMockSanityClientAsClient({requests: {'/acl': []}}),
  })

  render(
    <TestProvider>
      <RouterProvider router={router} state={{}} onNavigate={noop}>
        <ColorSchemeProvider scheme="light">
          <WorkspacesContext.Provider value={EMPTY_WORKSPACE_LIST}>
            <VisibleWorkspacesContext.Provider value={EMPTY_WORKSPACES}>
              <StudioNavbar />
            </VisibleWorkspacesContext.Provider>
          </WorkspacesContext.Provider>
        </ColorSchemeProvider>
      </RouterProvider>
    </TestProvider>,
  )

  await flushMicrotasksThisIsACodeSmell()

  return screen.getByTestId('studio-navbar')
}

describe('StudioNavbar', () => {
  it('keeps the default tone when drafts are selected', async () => {
    expect(await renderNavbar('drafts')).toHaveAttribute('data-tone', 'default')
  })

  it('keeps the default tone when published is selected', async () => {
    expect(await renderNavbar(PUBLISHED)).toHaveAttribute('data-tone', 'default')
  })

  it('keeps the default tone when a release is selected', async () => {
    expect(await renderNavbar(activeASAPRelease)).toHaveAttribute('data-tone', 'default')
  })
})
