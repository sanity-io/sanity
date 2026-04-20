/* eslint-disable react-hooks/rules-of-hooks */
// eslint-disable-next-line no-restricted-imports
import {test as baseTest} from '@playwright/test'
import {createClient, type SanityClient, type SanityDocument} from '@sanity/client'
import {uuid} from '@sanity/uuid'

import {watchForStudioErrors} from './helpers/studioErrors'

class _TestSanityContext {
  documentIds: Set<string>

  constructor() {
    this.documentIds = new Set<string>()
  }

  getUniqueDocumentId(): string {
    const documentId = uuid()

    this.documentIds.add(documentId)

    return documentId
  }

  addId(id: string): void {
    this.documentIds.add(id)
  }

  // TODO: confirm we want this teardown, datasets are at the end, deleted (not in main), persisting the document could help us debug
  teardown(sanityClient: SanityClient): Promise<SanityDocument<Record<string, unknown>>> {
    return sanityClient.delete({
      query: '*[_id in $ids]',
      params: {ids: [...this.documentIds].map((id) => `drafts.${id}`)},
    })
  }
}

interface SanityFixtures {
  /**
   * This provides a Sanity client that can be used to interact with Sanity.
   *
   * @example
   * ```ts
   * function getRemoteValue() {
   *  return sanityClient
   *    .getDocument(`drafts.${documentId}`)
   *    .then((doc) => (doc ? doc.simple : null))
   * }
   *```
   */
  sanityClient: SanityClient
  /**
   * @internal
   */
  _testContext: _TestSanityContext
  /**
   * This fixture is used to create a new document in the dataset.
   * It will create a new document with a unique name and return the document.
   * It also navigates to the document given the path
   *
   * @example
   * ```ts
   * const documentId = await createDraftDocument('/test/content/input-ci;textsTest')
   * ```
   */
  createDraftDocument: (navigationPath: string) => Promise<string>
}

export const test = baseTest.extend<SanityFixtures>({
  // Extends the goto function to preserve the base pathname if it exists in the baseURL
  // This is used to ensure the navigation goes to the correct workspace.
  async page({page, context, baseURL}, use) {
    watchForStudioErrors(context)

    const originalGoto = page.goto.bind(page)
    const baseUrl = new URL(baseURL || '')
    const basePath = baseUrl.pathname

    page.goto = async (url, options) => {
      if (typeof url === 'string' && url.startsWith('/')) {
        url = `${baseUrl.origin}${basePath}${url}`
      }
      // Default to `domcontentloaded` rather than Playwright's default of `load`.
      //
      // The studio loads many subresources after the initial HTML is parsed
      // (code-split chunks, workspace/auth/config fetches against the staging
      // API, fonts, etc). On Firefox under CI load, the full `load` event
      // frequently takes longer than the 60s test timeout, producing
      // `page.originalGoto: Test timeout of 60000ms exceeded` flakes.
      //
      // Every caller already blocks on an explicit readiness signal after
      // navigating (e.g. `[data-testid="form-view"]` via `createDraftDocument`,
      // or an `expect(...).toBeVisible()` assertion), so waiting for `load`
      // here adds latency without making the tests any more correct.
      //
      // Callers that genuinely need `load` / `networkidle` can still opt in
      // by passing `{waitUntil: 'load'}` explicitly.
      return await originalGoto(url, {waitUntil: 'domcontentloaded', ...options})
    }

    // Block the free trial dialog API to prevent overlay from intercepting clicks
    await page.route('**/journey/trial**', (route) =>
      route.fulfill({status: 200, contentType: 'application/json', body: 'null'}),
    )

    await use(page)
  },
  async createDraftDocument({page, _testContext}, use) {
    async function createDraftDocument(navigationPath: string) {
      const id = _testContext.getUniqueDocumentId()

      await page.goto(`${navigationPath};${id}`)
      // Form view must mount before the document is considered ready.
      await page.locator('[data-testid="form-view"]').waitFor({state: 'visible', timeout: 30_000})

      // Form view must not be read-only (i.e. initial value resolver / permissions
      // have settled) before tests interact with fields.
      await page
        .locator('[data-testid="form-view"]:not([data-read-only="true"])')
        .waitFor({state: 'visible', timeout: 30_000})

      return id
    }

    await use(createDraftDocument)
  },

  async _testContext({sanityClient}, use) {
    const _testContext = new _TestSanityContext()

    await use(_testContext)

    // Cleanup
    await _testContext.teardown(sanityClient)
  },

  // eslint-disable-next-line no-empty-pattern
  async sanityClient({}, use) {
    const client = createClient({
      projectId: process.env.SANITY_E2E_PROJECT_ID,
      dataset: process.env.SANITY_E2E_DATASET,
      token: process.env.SANITY_E2E_SESSION_TOKEN,
      useCdn: false,
      apiVersion: '2021-08-31',
      apiHost: 'https://api.sanity.work',
    })

    await use(client)
  },
})
