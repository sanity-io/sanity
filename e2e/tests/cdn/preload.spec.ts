import {MOCK_TOKEN, setupMockAuth} from '../auth/helpers'
import {expect, PROJECT_ID, test} from './cdnFixture'

test.describe('auto-updating studio behind a cross-origin redirect', () => {
  test('preloads the lazy studio shell from the module host and renders', async ({page, cdn}) => {
    const failedRequests: string[] = []
    const consoleErrors: string[] = []
    page.on('requestfailed', (request) => {
      const {origin} = new URL(request.url())
      if ([cdn.appUrl, cdn.redirectorOrigin, cdn.bucketOrigin].includes(origin)) {
        failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`)
      }
    })
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('pageerror', (error) => consoleErrors.push(error.message))

    await setupMockAuth(page, {cookieProbeSucceeds: false, catchAll: true})
    await page.addInitScript(({key, token}) => localStorage.setItem(key, JSON.stringify({token})), {
      key: `__studio_auth_token_${PROJECT_ID}`,
      token: MOCK_TOKEN,
    })

    await page.goto(`${cdn.appUrl}/404`)
    await expect(page.locator('[data-testid="studio-navbar"]')).toBeVisible()

    const hrefs = await page
      .locator('link[rel="modulepreload"]')
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    expect(hrefs).toHaveLength(cdn.preloadSpecifiers.length)
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      expect(href!.startsWith(`${cdn.bucketOrigin}/sanity/`)).toBe(true)
    }

    const redirected = cdn.requests.redirector
    expect(redirected.filter((pathname) => /-[\w-]{8}\.mjs/.test(pathname))).toEqual([])
    expect(redirected.filter((pathname) => pathname.startsWith('/sanity/'))).toContain(
      '/sanity/index',
    )

    const bucketRequests = cdn.requests.bucket.filter((pathname) => pathname.startsWith('/sanity/'))
    for (const specifier of cdn.preloadSpecifiers) {
      const pathname = `/sanity/${specifier.slice(2)}`
      expect(bucketRequests.filter((requested) => requested === pathname)).toHaveLength(1)
    }

    expect(failedRequests).toEqual([])
    expect(consoleErrors).toEqual([])
  })
})
