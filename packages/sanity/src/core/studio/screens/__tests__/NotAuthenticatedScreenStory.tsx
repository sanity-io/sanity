import {type SanityClient} from '@sanity/client'
import {type CurrentUser} from '@sanity/types'
import noop from 'lodash-es/noop.js'
import {ActiveWorkspaceMatcherContext} from 'sanity/_singletons'

import {createMockSanityClient} from '../../../../../test/browser/createMockSanityClient'
import {TestWrapper} from '../../../../../test/browser/TestWrapper'
import {type WorkspaceSummary} from '../../../config/types'
import {createMockAuthStore} from '../../../store/authStore/createMockAuthStore'
import {type ActiveWorkspaceMatcherContextValue} from '../../activeWorkspaceMatcher/ActiveWorkspaceMatcherContext'
import {NotAuthenticatedScreen} from '../NotAuthenticatedScreen'

const CURRENT_USER: CurrentUser = {
  id: 'user-fixture',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  provider: 'google',
  // oxlint-disable-next-line no-deprecated -- CurrentUser still requires the legacy role field
  role: 'viewer',
  roles: [],
}

// The screen reads `auth.state` (current user + provider) and `auth.logout`
// off the active workspace; nothing else on the summary is touched.
const ACTIVE_WORKSPACE = {
  type: 'workspace-summary',
  name: 'default',
  title: 'Default',
  basePath: '/',
  projectId: 'ppsg7ml5',
  dataset: 'production',
  auth: {
    ...createMockAuthStore({
      client: createMockSanityClient() as unknown as SanityClient,
      currentUser: CURRENT_USER,
    }),
    logout: noop,
  },
} as unknown as WorkspaceSummary

const CONTEXT_VALUE: ActiveWorkspaceMatcherContextValue = {
  activeWorkspace: ACTIVE_WORKSPACE,
  setActiveWorkspace: noop,
}

/**
 * Chromatic sentinel for the "Not authorized" boot dialog after the ui5
 * VStack migration. Two paragraphs sit in a VStack inside the Dialog body
 * above a single "Sign out" footer button — the gap between them is what
 * this pins. The signed-in identity and provider ("through Google") are
 * fixtures from a mock auth store; no `/users/me` request. Harness for the
 * co-located Storybook CSF file, which waits for the dialog and blurs
 * auto-focus.
 */
export function NotAuthenticatedScreenStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <ActiveWorkspaceMatcherContext.Provider value={CONTEXT_VALUE}>
        <NotAuthenticatedScreen />
      </ActiveWorkspaceMatcherContext.Provider>
    </TestWrapper>
  )
}
