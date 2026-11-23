import {describe, expect, it, vi} from 'vitest'

import {getOAuthFlowStorageKey} from '../constants'
import {_createOAuthAuthStore} from '../createOAuthAuthStore'
import {
  authenticatedState,
  createEnvironment,
  createMockClientFactory,
  createMockEndpoints,
  ORIGIN,
  PROJECT_ID,
  tokenOf,
} from './fixtures'

// Without localStorage the token pair lives in this tab's memory and is not shared with other
// tabs. (jsdom reports no localStorage support to the store, so this is the default here.)
vi.mock('../../../../util/supportsLocalStorage', () => ({
  supportsLocalStorage: false,
}))

describe('createOAuthAuthStore without localStorage', () => {
  it('keeps the token pair to the tab that signed in', async () => {
    const clientId = 'oc-memory-client'
    const endpoints = createMockEndpoints()
    const {factory: clientFactory} = createMockClientFactory(new Set(['access-1']))
    const otherTab = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId,
      clientFactory,
      endpoints,
      ...createEnvironment(),
    })
    const otherTabStates: boolean[] = []
    const subscription = otherTab.state.subscribe((state) =>
      otherTabStates.push(state.authenticated),
    )

    // This tab signs in.
    sessionStorage.setItem(
      getOAuthFlowStorageKey(PROJECT_ID, clientId),
      JSON.stringify({codeVerifier: 'v', state: 's', redirectUri: ORIGIN}),
    )
    const thisTab = _createOAuthAuthStore({
      projectId: PROJECT_ID,
      dataset: 'test-dataset',
      clientId,
      clientFactory,
      endpoints,
      ...createEnvironment('?code=c&state=s'),
    })
    await expect(thisTab.handleCallbackUrl!()).resolves.toMatchObject({success: true})
    const state = await authenticatedState(thisTab.state)
    expect(await tokenOf(state.client)).toBe('access-1')

    // A broadcast would reach the other tab out of order with the refresh lock, and it could
    // redeem a refresh token this tab already used. So nothing is shared: it stays signed out
    // and never refreshes this tab's pair.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(otherTabStates).toEqual([false])
    expect(endpoints.refresh).not.toHaveBeenCalled()
    subscription.unsubscribe()
  })
})
