import {of} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {createMockSanityClientAsClient} from '../../../../test/mocks/mockSanityClient'
import {definePlugin} from '../../config/definePlugin'
import {prepareConfig} from '../../config/prepareConfig'
import {type WorkspaceOptions} from '../../config/types'
import {cachedUsedScheduledPublishing} from '../../scheduledPublishing/tool/contexts/useHasUsedScheduledPublishing'
import {createMockAuthStore} from '../../store/auth/mock/createMockAuthStore'
import {type AuthStore} from '../../store/auth/types'
import {preloadNavbarData} from '../preloadNavbarData'

const SCHEDULES_PROBE = '/schedules/mock-project-id/mock-data-set?limit=1'

const requestCallback = vi.fn()
let client: ReturnType<typeof createMockSanityClientAsClient>

beforeEach(() => {
  cachedUsedScheduledPublishing.clear()
  client = createMockSanityClientAsClient({requestCallback})
})

function prepareWorkspace(overrides: Partial<WorkspaceOptions> = {}) {
  const [workspace] = prepareConfig({
    name: 'test',
    // The feature request is cached per project for the lifetime of the module
    projectId: `project-${Math.random().toString(36).slice(2)}`,
    dataset: 'test',
    plugins: [definePlugin({name: 'test-plugin'})()],
    auth: createMockAuthStore({client, currentUser: null}),
    ...overrides,
  }).workspaces
  return workspace
}

function requestedUrls() {
  return requestCallback.mock.calls.map(([request]) => request.url)
}

describe('preloadNavbarData', () => {
  it('sends the feature check and the scheduled publishing usage probe for a signed-in user', () => {
    preloadNavbarData(prepareWorkspace())

    expect(requestedUrls()).toEqual(['/features', SCHEDULES_PROBE])
  })

  it('sends each request once, so the providers read the cached answers', () => {
    const workspace = prepareWorkspace()

    preloadNavbarData(workspace)
    preloadNavbarData(workspace)

    expect(requestedUrls()).toEqual(['/features', SCHEDULES_PROBE])
  })

  it('does not probe when the scheduled publishing plugin is not loaded', () => {
    preloadNavbarData(prepareWorkspace({scheduledPublishing: {enabled: false}}))
    preloadNavbarData(prepareWorkspace({plugins: []}))

    expect(requestedUrls()).toEqual(['/features', '/features'])
  })

  it('does not probe when the workspace opted in to scheduled publishing explicitly', () => {
    preloadNavbarData(prepareWorkspace({scheduledPublishing: {enabled: true}}))

    expect(requestedUrls()).toEqual(['/features'])
  })

  it('sends nothing while the user is not signed in', () => {
    const auth: AuthStore = {state: of({authenticated: false, client, currentUser: null})}

    preloadNavbarData(prepareWorkspace({auth}))

    expect(requestCallback).not.toHaveBeenCalled()
  })
})
