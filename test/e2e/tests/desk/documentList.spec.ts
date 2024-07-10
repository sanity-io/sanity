import {expect, type Request} from '@playwright/test'
import {test} from '@sanity/test'

function getListenEventType(request: Request): string | null | undefined {
  if (request.url().includes('data/listen')) {
    const url = new URL(request.url())
    return url.searchParams.get('$type')
  }

  return undefined
}

test(`navigating document creates only one listener connection`, async ({page}) => {
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

  const authorRequest = page.waitForRequest(
    (request) => request.url().includes('data/listen') && request.url().includes('author'),
  )
  const bookRequest = page.waitForRequest(
    (request) => request.url().includes('data/listen') && request.url().includes('book'),
  )
  const keyValueRequest = page.waitForResponse((response) => response.url().includes('keyvalue'))

  await page.getByTestId('pane-item-Author').click({force: true})
  await page.waitForSelector('#author-author-0')
  await authorRequest
  expect(bookListenersCount).toBe(0)
  expect(authorListenersCount).toBe(1)

  // We change the sort order to not be default, to ensure that the listener is not re-created
  await page.getByTestId('pane-context-menu-button').click()
  await page.getByRole('menuitem', {name: 'Sort by Name'}).click()
  await keyValueRequest

  await page.getByTestId('pane-item-Book').click({force: true})
  await page.waitForSelector('#book-book-0')
  expect(authorListenersCount).toBe(0)
  expect(bookListenersCount).toBe(1)
  await bookRequest

  await page.getByTestId('pane-item-Author').click({force: true})
  await page.waitForSelector('#author-author-0')
  expect(bookListenersCount).toBe(0)
  expect(authorListenersCount).toBe(1)
  await authorRequest

  await page.getByTestId('pane-item-Book').click({force: true})
  await page.waitForSelector('#book-book-0')
  expect(authorListenersCount).toBe(0)
  expect(bookListenersCount).toBe(1)
  await bookRequest
})

test.describe('search strategy', () => {
  test('uses Text Search API search strategy if filter is supported', async ({page}) => {
    // Wait for Text Search API request.
    const searchRequest = page.waitForRequest((request) =>
      request.url().includes('data/textsearch'),
    )

    await page.goto('/test/content/book')
    await expect(page.locator('#book-book-0')).toBeVisible()
    await searchRequest
  })

  test('falls back to GROQ Query API search strategy if filter is not supported by Text Search API', async ({
    page,
  }) => {
    // Wait for GROQ Query API request.
    const searchRequest = page.waitForRequest(
      (request) =>
        request.url().includes('data/query') && request.url().includes('*%5Bdefined%28title%29%5D'),
    )

    await page.goto('/test/content/custom;anythingWithATitle')
    await expect(page.locator('#title-list-anythingWithATitle-0')).toBeVisible()
    await searchRequest
  })
})
