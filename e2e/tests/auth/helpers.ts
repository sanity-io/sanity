import {type Page, type Route} from '@playwright/test'

export const PROJECT_ID = 'ppsg7ml5'

export const MOCK_USER = {
  id: 'mock-user-123',
  name: 'Test User',
  email: 'test@example.com',
  profileImage: '',
  provider: 'google',
  role: '',
  roles: [{name: 'administrator', title: 'Administrator'}],
}

export const MOCK_PROVIDERS = {
  providers: [
    {
      name: 'google',
      title: 'Google',
      url: 'https://api.sanity.io/v1/auth/login/google',
      logo: null,
    },
  ],
  thirdPartyLogin: true,
}

export const MOCK_TOKEN = 'mock-token-abc123'

export const MOCK_AUTH_PROBE = {
  id: 'mock-user-123',
  expiry: Math.floor(Date.now() / 1000) + 3600,
}

export interface MockAuth {
  logOut(): void
  logIn(): void
}

/**
 * Set up route mocks for all Sanity API endpoints.
 *
 * Options:
 * - `cookieProbeSucceeds`: if true, /auth/id returns 200 (cookie auth works).
 *   If false, returns 401 (forces token fallback). Default: true.
 * - `catchAll`: if true, register a catch-all route returning empty 200 for
 *   any unmocked Sanity API request. Needed for token/dual auth where a fake
 *   token would otherwise hit real servers and trigger 401s. Default: false.
 */
export async function setupMockAuth(
  page: Page,
  options: {cookieProbeSucceeds?: boolean; catchAll?: boolean} = {},
): Promise<MockAuth> {
  const {cookieProbeSucceeds = true, catchAll = false} = options
  let authenticated = true

  if (catchAll) {
    const emptyOk = (route: Route) =>
      route.fulfill({status: 200, contentType: 'application/json', body: '[]'})
    await page.route('**/*.api.sanity.io/**', emptyOk)
    await page.route('**/api.sanity.io/**', emptyOk)
  }

  await page.route('**/users/me*', (route) => {
    if (authenticated) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      })
    }
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({statusCode: 401, error: 'Unauthorized', message: 'Not authenticated'}),
    })
  })

  await page.route('**/auth/providers*', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_PROVIDERS),
    })
  })

  await page.route('**/auth/id*', (route) => {
    if (cookieProbeSucceeds && authenticated) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_AUTH_PROBE),
      })
    }
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({statusCode: 401, error: 'Unauthorized', message: 'Not authenticated'}),
    })
  })

  await page.route('**/auth/fetch*', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({token: MOCK_TOKEN}),
    })
  })

  await page.route('**/auth/logout*', (route) => {
    authenticated = false
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ok: true}),
    })
  })

  await page.route('**/journey/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    }),
  )

  return {
    logOut() {
      authenticated = false
    },
    logIn() {
      authenticated = true
    },
  }
}
