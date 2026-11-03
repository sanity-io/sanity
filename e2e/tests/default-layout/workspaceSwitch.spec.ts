import {expect, type Page, type Request} from '@playwright/test'

import {expectCreatedStatus} from '../../helpers/documentStatusAssertions'
import {findEnv, readEnv} from '../../helpers/envVars'
import {retryingClickUntilVisible} from '../../helpers/retryingClick'
import {test} from '../../studio-test'

/**
 * The e2e studio defines two workspaces, `chromium` and `firefox`
 * (dev/studio-e2e-testing/sanity.config.ts). Each Playwright project runs
 * with its own as the baseURL, and in CI each one points at a dataset of its
 * own, so switching to the other workspace is a switch between datasets.
 */
const WORKSPACE_TITLES = {
  chromium: 'studio-e2e-testing-chromium',
  firefox: 'studio-e2e-testing-firefox',
} as const
type WorkspaceName = keyof typeof WORKSPACE_TITLES

const DATASET_ENV = {
  chromium: 'SANITY_E2E_DATASET_CHROMIUM',
  firefox: 'SANITY_E2E_DATASET_FIREFOX',
} as const

/**
 * Resolves like the e2e studio config does: the per-workspace variable when
 * set, else the shared one (which a CI shard sets to its own dataset).
 */
function datasetOf(workspace: WorkspaceName): string {
  return findEnv(DATASET_ENV[workspace]) ?? readEnv('SANITY_E2E_DATASET')
}

const WRITE_REQUEST = /\/data\/(?:mutate|actions)\/([^/?]+)/

function writtenDataset(request: Request): string | undefined {
  return WRITE_REQUEST.exec(request.url())?.[1]
}

declare global {
  interface Window {
    __workspaceSwitchMarker?: string
  }
}

async function switchWorkspace(page: Page, from: WorkspaceName, to: WorkspaceName) {
  const navbar = page.getByTestId('studio-navbar')
  await navbar.getByRole('button', {name: WORKSPACE_TITLES[from]}).click()
  await page.getByRole('menuitem', {name: WORKSPACE_TITLES[to]}).click()
  await expect(page).toHaveURL(new RegExp(`/${to}(/|$)`))
  await expect(navbar.getByRole('button', {name: WORKSPACE_TITLES[to]})).toBeVisible()
}

/**
 * Creates a book through the navbar's "new document" menu, which stays inside
 * the running studio, and edits it until the draft has been saved. (A book,
 * because the author template's initial value references documents a fresh
 * e2e dataset does not have, which fails the create action.)
 */
async function createAndEditBookInPlace(page: Page, title: string): Promise<string> {
  await expect(page.getByTestId('new-document-button')).toBeEnabled()
  await page.getByTestId('new-document-button').click()
  await page.getByTestId('new-document-button-search-input').fill('Book')
  const formView = page.getByTestId('form-view')
  // The command list items are aria-hidden, and a click can land while the
  // list is still settling, so click until the document actually opens.
  await retryingClickUntilVisible(page, page.getByTestId('create-new-book'), formView)
  // Same guard as `createDraftDocument`: a brand-new draft can briefly flip
  // editable before reverting to read-only while it finishes connecting.
  let consecutiveEditableReads = 0
  await expect
    .poll(
      async () => {
        const readOnly = await formView.getAttribute('data-read-only')
        consecutiveEditableReads = readOnly === null ? consecutiveEditableReads + 1 : 0
        return consecutiveEditableReads
      },
      {timeout: 30_000, intervals: [100]},
    )
    .toBeGreaterThanOrEqual(3)

  await page.getByTestId('field-title').getByTestId('string-input').fill(title)
  await expectCreatedStatus(page.getByTestId('pane-footer-document-status'))

  // `/<structure item>;<uuid>,template=book`: the item is whatever structure
  // list the intent resolves to, so only rely on the id segment.
  const id = /;([0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})/i.exec(page.url())?.[1]
  if (!id) throw new Error(`Could not read the document id from ${page.url()}`)
  return id
}

test.describe('workspace switcher', () => {
  test('switches workspace in place and keeps writes in the active dataset', async ({
    page,
    baseURL,
    sanityClient,
    _testContext,
  }) => {
    const current = new URL(baseURL ?? '').pathname.replace(/^\//, '') as WorkspaceName
    const other: WorkspaceName = current === 'chromium' ? 'firefox' : 'chromium'

    await page.goto('/content')
    await expect(page.getByTestId('studio-navbar')).toBeVisible()

    // Anything that survives in `window` proves the document was never
    // reloaded; a main-frame navigation request would prove the opposite.
    // (Not the `load` event: the fixture's `goto` only waits for
    // `domcontentloaded`, so the first load can still fire after this point.)
    await page.evaluate(() => {
      window.__workspaceSwitchMarker = 'kept'
    })
    let documentLoads = 0
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documentLoads += 1
    })

    // Every write the studio sends, with the dataset it went to and the
    // document ids it carried. sanity-io/sanity#7228 made the switcher a full
    // document load because a workspace's document store could outlive a
    // switch and execute the next workspace's mutations against its own
    // dataset, so a document edited after switching back was written to both.
    const writes: {dataset: string; body: string}[] = []
    page.on('request', (request) => {
      const dataset = writtenDataset(request)
      if (dataset) writes.push({dataset, body: request.postData() ?? ''})
    })
    const datasetsWrittenFor = (id: string) =>
      new Set(writes.filter((write) => write.body.includes(id)).map((write) => write.dataset))

    await switchWorkspace(page, current, other)
    const otherId = await createAndEditBookInPlace(page, `Written from ${other}`)
    try {
      await switchWorkspace(page, other, current)
      const currentId = await createAndEditBookInPlace(page, `Written from ${current}`)
      _testContext.addId(currentId)

      expect(documentLoads).toBe(0)
      expect(await page.evaluate(() => window.__workspaceSwitchMarker)).toBe('kept')

      // A CI shard only knows its own dataset, so the sibling's writes are
      // checked against the exact dataset only where the environment names it.
      const otherDatasets = datasetsWrittenFor(otherId)
      expect(otherDatasets.size).toBe(1)
      const expectedOtherDataset = findEnv(DATASET_ENV[other])
      if (expectedOtherDataset) expect(otherDatasets).toEqual(new Set([expectedOtherDataset]))
      expect(datasetsWrittenFor(currentId)).toEqual(new Set([datasetOf(current)]))
    } finally {
      // The fixture's teardown only knows the current dataset; the sibling's
      // draft lives in whichever dataset its create action went to.
      for (const dataset of datasetsWrittenFor(otherId)) {
        await sanityClient.withConfig({dataset}).delete(`drafts.${otherId}`)
      }
    }
  })
})
