import {type CurrentUser} from '@sanity/types'
import {of} from 'rxjs'

import {createMockSanityClientAsClient} from '../../../../../../test/mocks/mockSanityClient'
import {prepareConfig} from '../../../../config/prepareConfig'
import {type WorkspaceOptions, type WorkspaceSummary} from '../../../../config/types'
import {createMockAuthStore} from '../../../../store/auth/mock/createMockAuthStore'
import {type AuthStore} from '../../../../store/auth/types'

const MOCK_USER: CurrentUser = {
  id: 'doug',
  name: 'Doug',
  email: 'doug@sanity.io',
  // oxlint-disable-next-line no-deprecated -- `CurrentUser.role` is still required by the type
  role: 'admin',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

export interface WorkspaceSummaryFixture {
  name: string
  title: string
  projectId: string
  dataset: string
  subtitle?: string
  /** Whether the workspace's login status check answers signed in (default) or signed out. */
  signedIn?: boolean
}

/**
 * Settled, network-free auth store: `state` is the mock studio's authenticated
 * state and `currentUserId` answers the workspace menu's login status check
 * without a request.
 */
function createFixtureAuthStore(signedIn: boolean): AuthStore {
  return {
    ...createMockAuthStore({client: createMockSanityClientAsClient(), currentUser: MOCK_USER}),
    currentUserId: of(signedIn ? MOCK_USER.id : undefined),
  }
}

/**
 * Builds `WorkspaceSummary` values the way the studio does (`prepareConfig`),
 * for the navbar components that read `WorkspacesContext`. Each fixture gets
 * its own project id: workspaces sharing a project with different auth stores
 * would record a divergent-auth config warning in module state.
 */
export function createWorkspaceSummaries(fixtures: WorkspaceSummaryFixture[]): WorkspaceSummary[] {
  const workspaces: WorkspaceOptions[] = fixtures.map(
    ({name, title, projectId, dataset, subtitle, signedIn = true}) => ({
      name,
      title,
      subtitle,
      projectId,
      dataset,
      basePath: `/${name}`,
      auth: createFixtureAuthStore(signedIn),
      schema: {types: []},
    }),
  )
  return prepareConfig(workspaces).workspaces
}
