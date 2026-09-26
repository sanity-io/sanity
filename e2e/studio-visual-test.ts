import {takeSnapshot, test as chromaticTest} from '@chromatic-com/playwright'
import {expect, mergeTests, type Page, type TestInfo} from '@playwright/test'

import {test as studioTest} from './studio-test'

/**
 * Studio test fixtures composed with the Chromatic archive fixture, for specs
 * that take visual regression snapshots.
 *
 * ⚠️ Only use this in specs that actually call `takeChromaticSnapshot`. The
 * Chromatic fixture instruments the page over CDP to archive resources, and
 * applying it suite-wide broke the studio's streaming connections on chromium
 * (~90 "element not found" failures across all chromium shards, firefox — no
 * CDP — unaffected). Scoping it to the snapshot specs keeps the blast radius
 * to the pages we intentionally archive.
 *
 * ⚠️ Known limitation: specs that edit documents (`createDraftDocument` waits
 * for the form to become editable) hang under this fixture for the same
 * reason — stick to page chrome and read-only states. Document form states
 * are already visually covered by the vitest browser tests (snapshotted in
 * place by @chromatic-com/vitest) and the Storybook stories, so e2e snapshots
 * should focus on what neither can render: full-studio page chrome against a
 * real deployment.
 *
 * Automatic end-of-test snapshots are disabled globally (`disableAutoSnapshot`
 * in playwright.config.ts): the e2e suite runs against per-PR staging datasets
 * with live timestamps and presence, so snapshots are explicit opt-in.
 */
export const test = mergeTests(studioTest, chromaticTest)

/**
 * The `LoadingBlock` the studio renders in place of a screen, tool or pane it
 * is still resolving: a centered spinner with a "Loading" caption.
 *
 * Only the visible ones count. Closed `@sanity/ui` overlays stay mounted (React
 * `<Activity>`, hidden with `display: none`) and keep their own loading blocks
 * around indefinitely, and those never reach the archive.
 */
const VISIBLE_LOADING_BLOCK = '[data-testid="loading-block"]:visible'

/**
 * Captures a Chromatic visual regression snapshot of the page's current state.
 *
 * Only snapshot deterministic states: freshly seeded fixture documents and
 * schema-driven chrome — never anything with relative timestamps, presence
 * from other sessions, or dataset-dependent document lists. Captures from the
 * chromium project only, so each state produces exactly one snapshot
 * (Chromatic re-renders archives in its own standardized browser).
 *
 * Wait for everything the archive should show before calling this — an
 * assertion on the navbar says nothing about the tool rendering below it. As a
 * backstop this waits out any visible `LoadingBlock`: a spinner is never the
 * state a spec means to archive, and one that reaches Chromatic reads as a
 * real visual change against a baseline captured a moment later. Content that
 * cannot settle under the archive fixture belongs in `ignoreSelectors`
 * instead.
 *
 * @example
 * ```ts
 * import {takeChromaticSnapshot, test} from '../../studio-visual-test'
 *
 * test('my test', async ({page}, testInfo) => {
 *   await expect(page.getByTestId('studio-navbar')).toBeVisible()
 *   await expect(page.getByTestId('structure-tool-list-pane')).toBeVisible()
 *   await takeChromaticSnapshot(page, 'studio navbar', testInfo)
 * })
 * ```
 */
export async function takeChromaticSnapshot(
  page: Page,
  name: string,
  testInfo: TestInfo,
): Promise<void> {
  if (testInfo.project.name !== 'chromium') {
    return
  }
  await expect(page.locator(VISIBLE_LOADING_BLOCK)).toHaveCount(0)
  await takeSnapshot(page, name, testInfo)
}
