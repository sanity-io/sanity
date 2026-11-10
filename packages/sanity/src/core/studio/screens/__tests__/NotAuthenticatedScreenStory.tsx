import {type CurrentUser} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {useMemo} from 'react'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'

import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {createMockSanityClientAsClient} from '../../../../../test/mocks/mockSanityClient'
import {createMockAuthStore} from '../../../store/auth/mock/createMockAuthStore'
import {type ActiveWorkspaceMatcherContextValue} from '../../activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'
import {useWorkspace} from '../../workspace'
import {createWorkspaceSummary} from '../../workspaces/__tests__/createWorkspaceSummary'
import {NotAuthenticatedScreen} from '../NotAuthenticatedScreen'

const CURRENT_USER: CurrentUser = {
  id: 'user-fixture-01',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  provider: 'google',
  // oxlint-disable-next-line no-deprecated -- `role` is still a required field on CurrentUser
  role: 'viewer',
  roles: [{name: 'viewer', title: 'Viewer'}],
}

const AUTH = createMockAuthStore({
  client: createMockSanityClientAsClient(),
  currentUser: CURRENT_USER,
})

function NotAuthenticatedScreenInWorkspace() {
  const workspace = useWorkspace()
  const value = useMemo<ActiveWorkspaceMatcherContextValue>(
    () => ({
      activeWorkspace: createWorkspaceSummary(workspace, {
        name: 'default',
        title: 'Default',
        basePath: '/default',
        auth: AUTH,
      }),
      setActiveWorkspace: noop,
    }),
    [workspace],
  )
  return (
    <ActiveWorkspaceMatcherContext.Provider value={value}>
      <NotAuthenticatedScreen />
    </ActiveWorkspaceMatcherContext.Provider>
  )
}

/**
 * Chromatic sentinel for the "Not authorized" dialog shown when a signed-in
 * user has no access to the project. The active workspace is a fixture whose
 * auth store emits a settled `google` user, so the "signed in as … through
 * Google" sentence renders without a request. Harness for the co-located
 * Storybook CSF file.
 */
export function NotAuthenticatedScreenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <NotAuthenticatedScreenInWorkspace />
    </TestWrapper>
  )
}
