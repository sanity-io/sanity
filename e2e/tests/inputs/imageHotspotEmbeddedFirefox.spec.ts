import {readFileSync} from 'node:fs'
import path, {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'

import {expect, type Page, type Response} from '@playwright/test'

import {test} from '../../studio-test'

/**
 * Regression coverage for CLDX-5653: in Firefox, "Edit hotspot and crop" cannot load the image
 * when the Studio runs inside the Sanity dashboard, while the same Studio works when opened
 * directly and everything works in Chromium.
 *
 * The chain, verified against Firefox 155 (default prefs) and the live CDN:
 *
 * 1. Firefox implements Storage Access Headers. When a cross-site iframe (the hosted Studio)
 *    requests a resource that is same-site with the top-level page (dashboard on www.sanity.io,
 *    image on cdn.sanity.io — the "ABA" case) it sends `Sec-Fetch-Storage-Access: inactive`,
 *    and only then it also appends an `Origin` header to plain `GET` requests such as
 *    `<img src>` loads (`nsHttpChannel::SetOriginHeader`, "Modified Step 4").
 * 2. Every Studio built or served by the CLI carries `<meta name="referrer" content="same-origin">`.
 *    Under that policy Firefox serialises the `Origin` of a cross-origin request as `null`.
 * 3. The asset CDN treats `Origin: null` as an origin that has to be on the project's CORS
 *    allow-list and answers `403 {"error":"Forbidden","message":"CORS Origin not allowed"}`.
 *    A JSON body on an image destination is then dropped by Opaque Response Blocking
 *    (`NS_BINDING_ABORTED` in the console), the `<img>` fires `error`, and `useLoadImage`
 *    renders the "Could not load image from …" card instead of the hotspot tool.
 *
 * The fix lives in the API gateway (sanity-io/kong#1283: treat `Origin: null` as if no Origin
 * header was sent). Until it is deployed these tests are expected to fail; once it ships they
 * pass without any Studio change. Chromium does not send an `Origin` header on these requests,
 * so the tests only run in the firefox project.
 */

const capybara = readFileSync(
  path.join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'resources', 'capybara.jpg'),
)

/**
 * Loads an image the way `useLoadImage` does
 * (`packages/sanity/src/core/form/inputs/files/ImageToolInput/useLoadImage.ts`): a detached
 * `<img>` without a `crossorigin` attribute, resolved from its `load` / `error` events.
 */
function loadImageLikeUseLoadImage(_body: HTMLElement, src: string): Promise<'loaded' | 'error'> {
  return new Promise((resolve) => {
    const image = document.createElement('img')
    image.addEventListener('load', () => resolve('loaded'), {once: true})
    image.addEventListener('error', () => resolve('error'), {once: true})
    image.src = src
  })
}

/** The dashboard side of the topology: a page that embeds the Studio in an iframe. */
function dashboardHtml(studioUrl: string): string {
  return `<!doctype html><html><head><title>Dashboard stand-in</title></head><body style="margin:0"><iframe id="studio" title="Studio" src="${studioUrl}" style="border:0;width:100vw;height:100vh"></iframe></body></html>`
}

/**
 * The part of the CLI's Studio HTML shell (`@sanity/cli-build` `DefaultDocument`) that matters
 * here: the `same-origin` referrer policy.
 */
const HOSTED_STUDIO_SHELL_HTML =
  '<!doctype html><html><head><meta name="referrer" content="same-origin"><title>Sanity Studio</title></head><body></body></html>'

/**
 * Firefox partitions third-party `localStorage` by top-level site, so the session token the
 * suite seeds through `storageState` is not visible to a Studio embedded under another site.
 * This same-origin document writes the same entry into the iframe's partition and then
 * navigates to the Studio. The token itself is fetched through a `page.exposeFunction` binding
 * rather than inlined: fulfilled response bodies end up in Playwright traces, which CI uploads.
 */
const SESSION_TOKEN_BINDING = '__cldx5653SessionToken'

function authBootstrapHtml(studioUrl: string): string {
  const key = `__studio_auth_token_${process.env.SANITY_E2E_PROJECT_ID}`
  return `<!doctype html><html><body><script>window.${SESSION_TOKEN_BINDING}().then((token) => {localStorage.setItem(${JSON.stringify(key)}, JSON.stringify({token, time: new Date().toISOString()}));location.replace(${JSON.stringify(studioUrl)})})</script></body></html>`
}

function describeCdnResponse(response: Response | undefined, body: string): string {
  if (!response) return 'no CDN response was observed'
  const acao = response.headers()['access-control-allow-origin']
  return `${response.status()} ${response.url()} (access-control-allow-origin: ${acao ?? 'absent'}) ${body}`
}

async function readBody(response: Response | undefined): Promise<string> {
  // Firefox does not hand a body to the test when Opaque Response Blocking dropped it.
  return response ? await response.text().catch(() => '') : ''
}

/** Collects CDN image responses for `assetUrl`, ignoring the query string (`?w=…` previews). */
function collectCdnResponses(page: Page, assetUrl: string): Response[] {
  const responses: Response[] = []
  page.on('response', (response) => {
    if (response.url().split('?')[0] === assetUrl) responses.push(response)
  })
  return responses
}

test.describe('CLDX-5653: image hotspot in a Studio embedded cross-site (Firefox)', () => {
  test.beforeEach(({browserName}) => {
    test.skip(
      browserName !== 'firefox',
      'Only Firefox appends an Origin header to no-cors <img> requests in this topology',
    )
  })

  test('the production CDN serves an image to a Studio embedded in the dashboard', async ({
    page,
  }) => {
    // Both documents are fulfilled from the test; only the image request reaches the network.
    const dashboardUrl = 'https://www.sanity.io/cldx-5653/embedded-studio'
    const hostedStudioUrl = 'https://cldx-5653.sanity.studio/'
    // A public asset on the shared test-studio project. `ppsg7ml5` does not allow-list `null`.
    const productionCdnImage =
      'https://cdn.sanity.io/images/ppsg7ml5/test/48bd3c0b3fb6a9def4d3ce58e82ecc3a56ede2d9-1450x1450.png'

    await page.route(dashboardUrl, (route) =>
      route.fulfill({contentType: 'text/html', body: dashboardHtml(hostedStudioUrl)}),
    )
    await page.route(hostedStudioUrl, (route) =>
      route.fulfill({contentType: 'text/html', body: HOSTED_STUDIO_SHELL_HTML}),
    )
    const cdnResponses = collectCdnResponses(page, productionCdnImage)

    await page.goto(dashboardUrl)
    // Cache-buster: the CDN caches per `Origin` value, and the test should observe what the
    // gateway does today rather than a cached copy.
    const outcome = await page
      .frameLocator('#studio')
      .locator('body')
      .evaluate(loadImageLikeUseLoadImage, `${productionCdnImage}?cldx-5653=${Date.now()}`)

    const [response] = cdnResponses
    const body = await readBody(response)
    expect(
      response?.status(),
      `cdn.sanity.io answered a Firefox <img> request carrying "Origin: null" with ${describeCdnResponse(response, body)}`,
    ).toBe(200)
    expect(outcome).toBe('loaded')
  })

  test('the "Edit hotspot and crop" dialog loads the image when the Studio is embedded cross-site', async ({
    page,
    baseURL,
    sanityClient,
    _testContext,
  }) => {
    test.slow()

    const asset = await sanityClient.assets.upload('image', capybara, {
      filename: 'capybara.jpg',
      contentType: 'image/jpeg',
    })
    const documentId = _testContext.getUniqueDocumentId()
    await sanityClient.create({
      _id: `drafts.${documentId}`,
      _type: 'imagesTest',
      title: 'CLDX-5653',
      mainImage: {_type: 'image', asset: {_type: 'reference', _ref: asset._id}},
    })

    // The stand-in dashboard has to be same-site with the CDN the e2e project serves assets from
    // (cdn.sanity.work) for Firefox to be in the ABA case, and plain http so the http://localhost
    // Studio iframe is not blocked as mixed content. Playwright fulfills the document, nothing is
    // resolved or sent for that host.
    const dashboardUrl = 'http://e2e-dashboard.sanity.work/cldx-5653/embedded-studio'
    const studioUrl = `${baseURL}/content/input-standard;imagesTest;${documentId}`
    const authBootstrapUrl = `${baseURL}/cldx-5653/auth-bootstrap`
    await page.route(dashboardUrl, (route) =>
      route.fulfill({contentType: 'text/html', body: dashboardHtml(authBootstrapUrl)}),
    )
    await page.route(authBootstrapUrl, (route) =>
      route.fulfill({contentType: 'text/html', body: authBootstrapHtml(studioUrl)}),
    )
    await page.exposeFunction(SESSION_TOKEN_BINDING, () => process.env.SANITY_E2E_SESSION_TOKEN)
    const cdnResponses = collectCdnResponses(page, asset.url)

    await page.goto(dashboardUrl)
    const studio = page.frameLocator('#studio')
    await expect(studio.getByTestId('form-view')).toBeVisible({timeout: 60_000})

    // `mainImage` is the only image field with an asset in the seeded document, so it renders the
    // only hotspot button.
    const editHotspot = studio.getByTestId('options-menu-edit-details')
    await expect(editHotspot).toHaveCount(1)
    await editHotspot.click()
    const dialog = studio.getByRole('dialog', {name: 'Edit hotspot and crop'})
    await expect(dialog).toBeVisible()

    const loadError = dialog.getByText('Could not load image from')
    const hotspotTool = dialog.locator('svg[data-handle="crop"]')
    await expect(hotspotTool.or(loadError).first()).toBeVisible()

    // The dialog requests the bare asset URL; the form's thumbnail requests it with `?w=…`.
    const response =
      cdnResponses.find((candidate) => !candidate.url().includes('?')) ?? cdnResponses.at(-1)
    const body = await readBody(response)
    expect(
      response?.status(),
      `cdn.sanity.work answered the hotspot dialog's image request with ${describeCdnResponse(response, body)}`,
    ).toBe(200)
    await expect(loadError).toHaveCount(0)
    await expect(hotspotTool).toBeVisible()
  })
})
