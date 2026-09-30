/**
 * The studio error watcher in `helpers/studioErrors.ts` leaves out child frames of another origin
 * than their page, such as the Presentation preview, which the e2e studio loads from its own
 * deployment. This checks that it does, and that the page errors of the studio itself still reach
 * it while such a frame is open.
 */
import {expect} from '@playwright/test'

import {DOM_PROP_LEAK_MARKER} from '../../helpers/domPropLeaks/scanner'
import {type StudioErrorInfo, watchForStudioErrors} from '../../helpers/studioErrors'
import {test} from '../../studio-test'

const FOREIGN_URL = 'https://foreign-frame.invalid/'

// Throws what the Presentation preview threw on every load, logs the development-build warnings
// the watcher collects, and gives an element a prop that the DOM prop leak scanner reports.
const FOREIGN_DOCUMENT = `<!doctype html>
<html><body>
<script>
  const element = document.createElement('div')
  element.__reactProps$foreign = {isOpen: true}
  document.body.append(element)
  console.error('Warning: React does not recognize the \`isOpen\` prop on a DOM element.')
  console.warn('styled-components: it looks like an unknown prop "isOpen" is being sent through to the DOM, which will likely trigger a React console error.')
</script>
<script>window.parent.__REACT_DEVTOOLS_GLOBAL_HOOK__</script>
<script>throw new Error('the foreign frame crashed')</script>
</body></html>`

// What Chromium and Firefox throw when the studio reads the `document` of the foreign frame.
const STUDIO_ERROR = /property ['"]document['"]/

test('leaves out child frames of another origin, but not the errors of the studio', async ({
  page,
  context,
}) => {
  const watcher = await watchForStudioErrors(context)
  await page.route(`${FOREIGN_URL}**`, (route) =>
    route.fulfill({contentType: 'text/html', body: FOREIGN_DOCUMENT}),
  )
  await page.goto('/content')
  await expect(page.getByTestId('studio-navbar')).toBeVisible()

  // Every error the watcher handles from here on passes through this matcher, and any but the
  // expected one fails the test.
  const seen: StudioErrorInfo[] = []
  watcher.expectError((info) => {
    seen.push(info)
    return STUDIO_ERROR.test(info.message)
  })

  const foreignLeakLogged = page.waitForEvent(
    'console',
    (msg) => msg.text().startsWith(DOM_PROP_LEAK_MARKER) && msg.text().includes(FOREIGN_URL),
  )
  const foreignFrameCrashed = page.waitForEvent('pageerror', (error) =>
    error.message.includes('the foreign frame crashed'),
  )
  await page.evaluate((src) => {
    const frame = document.createElement('iframe')
    frame.src = src
    document.body.append(frame)
  }, FOREIGN_URL)
  await Promise.all([foreignLeakLogged, foreignFrameCrashed])

  expect(page.frames().map((frame) => frame.url())).toContain(FOREIGN_URL)
  const report = await watcher.collectDomPropLeaks()
  expect(report.findings.map((finding) => finding.url)).not.toContainEqual(
    expect.stringContaining(FOREIGN_URL),
  )
  expect(report.warnings).not.toContainEqual(expect.stringContaining('isOpen'))
  expect(report.scans.map((scan) => scan.frameUrl)).not.toContain(FOREIGN_URL)
  expect(report.scans.some((scan) => scan.studioRendered)).toBe(true)

  // The studio handles the uncaught exceptions of its own document (see `StudioErrorSource`), so its
  // error is a rejection.
  const studioErrorThrown = page.waitForEvent('pageerror', (error) =>
    STUDIO_ERROR.test(error.message),
  )
  await page.evaluate((src) => {
    const frame = document.querySelector<HTMLIFrameElement>(`iframe[src="${src}"]`)
    void (async () => frame?.contentWindow?.document)()
  }, FOREIGN_URL)
  await studioErrorThrown

  expect(seen).toEqual([{source: 'pageerror', message: expect.stringMatching(STUDIO_ERROR)}])
})
