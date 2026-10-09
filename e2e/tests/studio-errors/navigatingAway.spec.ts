/**
 * The studio error watcher in `helpers/studioErrors.ts` leaves out an error screen that renders once
 * a navigation away from its document has started: Firefox fails the lazy imports that are in flight
 * then, and the studio renders its import error screen in the document that a `page.reload()` or
 * `page.goto()` is leaving (see `StudioErrorSource`). This checks that it does, and that it still
 * reports the error screens of a document that no navigation is leaving, or that a navigation did
 * not replace.
 */
import {expect, type Page} from '@playwright/test'

import {type StudioErrorInfo, watchForStudioErrors} from '../../helpers/studioErrors'
import {test} from '../../studio-test'

const MESSAGE = 'error loading dynamically imported module: /static/lazyTool.js'
const RENDERED_ON_LEAVE = 'rendered an error screen as the page was left'

// Renders an error screen as the studio does: when it loads with `?now`, and otherwise when a
// navigation away from it starts.
const DOCUMENT = `<!doctype html>
<html><body>
<script>
  function renderErrorScreen(log) {
    const screen = document.createElement('div')
    screen.setAttribute('data-testid', 'studio-error-screen')
    screen.setAttribute('data-error', ${JSON.stringify(MESSAGE)})
    document.body.append(screen)
    if (log) console.log(log)
  }
  if (location.search === '?now') renderErrorScreen()
  else addEventListener('beforeunload', () => renderErrorScreen(${JSON.stringify(RENDERED_ON_LEAVE)}))
</script>
</body></html>`

async function routeDocument(page: Page, baseURL: string | undefined): Promise<string> {
  const origin = new URL(baseURL || '').origin
  await page.route(`${origin}/__studio-error-watcher**`, (route) =>
    route.fulfill({contentType: 'text/html', body: DOCUMENT}),
  )
  // A navigation that gets no content leaves the page where it is.
  await page.route(`${origin}/__no-content`, (route) => route.fulfill({status: 204}))
  return `${origin}/__studio-error-watcher`
}

test('reports the error screen of a page that no navigation is leaving right away', async ({
  page,
  context,
  baseURL,
}) => {
  const url = await routeDocument(page, baseURL)
  const seen: StudioErrorInfo[] = []
  ;(await watchForStudioErrors(context)).expectError((info) => {
    seen.push(info)
    return info.message === MESSAGE
  })

  await page.goto(`${url}?now`)

  await expect
    .poll(() => seen, {timeout: 5_000})
    .toEqual([{source: 'error-screen', message: MESSAGE}])
})

test('leaves out an error screen that renders as the page is replaced', async ({page, baseURL}) => {
  const url = await routeDocument(page, baseURL)
  await page.goto(url)

  const renderedOnLeave = page.waitForEvent('console', (msg) => msg.text() === RENDERED_ON_LEAVE)
  // An error screen that the watcher reports fails the test before the reload resolves.
  await page.reload()
  await renderedOnLeave

  await expect(page.getByTestId('studio-error-screen')).toHaveCount(0)
})

test('reports an error screen that renders as a navigation that does not replace the page starts', async ({
  page,
  context,
  baseURL,
}) => {
  const url = await routeDocument(page, baseURL)
  await page.goto(url)
  const seen: StudioErrorInfo[] = []
  ;(await watchForStudioErrors(context)).expectError((info) => {
    seen.push(info)
    return info.message === MESSAGE
  })

  const renderedOnLeave = page.waitForEvent('console', (msg) => msg.text() === RENDERED_ON_LEAVE)
  await page.evaluate(() => location.assign('/__no-content'))
  await renderedOnLeave
  expect(seen).toEqual([])

  await expect
    .poll(() => seen, {timeout: 20_000})
    .toEqual([{source: 'error-screen', message: MESSAGE}])
  expect(page.url()).toBe(url)
})
