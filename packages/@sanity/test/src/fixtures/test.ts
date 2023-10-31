/* eslint-disable no-empty-pattern */
/**
 * These are collections of custom fixtures that are used in the tests.
 * It overrides the playwright test context and adds specific helpers to it.
 */

import {test as baseTest} from '@playwright/test'
import {type SanityClient, createClient, SanityDocumentStub} from '@sanity/client'
import {_TestSanityContext} from './SanityDocument'

interface SanityFixtures {
  /**
   * This fixture is used to create a new document in the dataset.
   * It will create a new document with a unique name and return the document.
   */
  createUniqueDocument: (options: SanityDocumentStub) => Promise<SanityDocumentStub>
  sanityClient: SanityClient
  _testContext: _TestSanityContext
  createDraftDocument: (navigationPath: string) => Promise<string>
}

const sanityFixtures = baseTest.extend<SanityFixtures>({
  /**
   * This fixture creates a draft document and navigates to it.
   * It takes a path and other properties to create the document.
   */
  async createDraftDocument({page, _testContext}, use) {
    async function createDraftDocument(navigationPath: string) {
      const id = _testContext.getUniqueDocumentId()
      await page.goto(`${navigationPath};${id}`)

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
  async sanityClient({}, use) {
    const client = createClient({
      projectId: process.env.SANITY_E2E_PROJECT_ID,
      dataset: process.env.SANITY_E2E_DATASET,
      token: process.env.SANITY_E2E_SESSION_TOKEN,
      useCdn: false,
      apiVersion: '2021-08-31',
    })
    await use(client)
  },
})

export const test = sanityFixtures
