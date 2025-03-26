import {expect, type Request} from '@playwright/test'
import {test} from '@sanity/test'

function getListenEventType(request: Request): string | null | undefined {
  if (request.url().includes('data/listen')) {
    const url = new URL(request.url())
    return url.searchParams.get('$type')
  }

  return undefined
}

test(`navigating document creates only one listener connection`, async ({page, browserName}) => {
  // For now, only test in other browsers except firefox due to flakiness in Firefox with the requests
  test.skip(browserName === 'firefox')

  test.slow()
  await page.goto('/test/content')

  let authorListenersCount = 0
  let bookListenersCount = 0

  /**
   * We listen for requests to the listen endpoint to keep track of how many listeners are active
   * for each type.
   */
  page.on('request', (request) => {
    const type = getListenEventType(request)

    if (type === '"author"') {
      authorListenersCount++
    } else if (type === '"book"') {
      bookListenersCount++
    }
  })

  /**
   * There is not really a good way for playwright to tell if an EventSource request is cancelled
   * It marks requests as failed when it's cancelled
   *
   * We use this to decrement the counter so for the context of the test we should always have one active listener
   */
  page.on('requestfailed', (request) => {
    const type = getListenEventType(request)

    if (type === '"author"') {
      authorListenersCount--
    } else if (type === '"book"') {
      bookListenersCount--
    }
  })

  await page.waitForSelector('[data-testid="structure-tool-list-pane"]')

  const getAuthorItem = () => page.getByTestId('pane-item-Author')
  const getBookItem = () => page.getByTestId('pane-item-Book')
  const getDocumentListPane = () => page.getByTestId('document-list-pane')
  const getAuthorList = () => page.locator('#author-author-0')
  const getBookList = () => page.locator('#book-book-0')

  const authorRequest = page.waitForRequest(
    (request) => request.url().includes('data/listen') && request.url().includes('author'),
  )
  const bookRequest = page.waitForRequest(
    (request) => request.url().includes('data/listen') && request.url().includes('book'),
  )
  const keyValueRequest = page.waitForResponse((response) => response.url().includes('keyvalue'))

  await getAuthorItem().click({force: true})
  await expect(getAuthorList()).toBeVisible()
  await expect(getDocumentListPane()).toBeVisible()
  await authorRequest
  expect(bookListenersCount).toBe(0)
  expect(authorListenersCount).toBe(1)

  // We change the sort order to not be default, to ensure that the listener is not re-created
  await page.getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Name'}).click()
  await keyValueRequest

  await getBookItem().click({force: true})
  await expect(getBookList()).toBeVisible()
  await expect(getDocumentListPane()).toBeVisible()
  expect(authorListenersCount).toBe(0)
  expect(bookListenersCount).toBe(1)
  await bookRequest

  await getAuthorItem().click({force: true})
  await expect(getAuthorList()).toBeVisible()
  await expect(getDocumentListPane()).toBeVisible()
  expect(bookListenersCount).toBe(0)
  expect(authorListenersCount).toBe(1)
  await authorRequest

  await getBookItem().click({force: true})
  await expect(getBookList()).toBeVisible()
  await expect(getDocumentListPane()).toBeVisible()
  expect(authorListenersCount).toBe(0)
  expect(bookListenersCount).toBe(1)
  await bookRequest
})
