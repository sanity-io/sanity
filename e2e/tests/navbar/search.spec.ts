import {expect, type Request} from '@playwright/test'

import {clearKeyValueKey} from '../../helpers/clearKeyValueKey'
import {test} from '../../studio-test'

const SEARCH_KEY = 'studio.search.recent'

interface StoredSearchItem {
  created: string
  terms: {query: string}
}

interface KeyValuePair {
  key: string
  value: {recentSearches: StoredSearchItem[]}
}

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'

/**
 * Returns a random, purely alphabetic word. Every query below is prefixed with
 * it so a search can only ever match the document seeded by this run: the
 * dataset is shared with the other specs, with previous runs and with earlier
 * retries of this test, all of which leave books behind.
 *
 * Digits are left out because search tokenizes the query, and a word mixing
 * letters and digits is not guaranteed to survive as a single token.
 */
function uniqueSearchWord(): string {
  return Array.from({length: 10}, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join(
    '',
  )
}

function queriesOf(recentSearches: StoredSearchItem[]): string[] {
  return recentSearches.map((recentSearch) => recentSearch.terms.query)
}

test('searching creates unique saved searches', async ({page, sanityClient, _testContext}) => {
  // Three search → open-result → persisted-write round trips against the live
  // API: on a loaded CI runner two healthy rounds alone have taken ~35s, so
  // the default 60s budget leaves no room for a single slow round.
  test.slow()

  const dataset = sanityClient.config().dataset
  const storedSearchKey = `${SEARCH_KEY}.${dataset}`

  const word = uniqueSearchWord()
  const title = `${word} searchable title`
  const firstQuery = `${word} se`
  const secondQuery = `${word} search`
  const thirdQuery = `${word} searchable`

  // Seed the document to search for over the API, so it is known to exist
  // before the studio is loaded.
  await sanityClient.create({
    _id: `drafts.${_testContext.getUniqueDocumentId()}`,
    _type: 'book',
    title,
  })

  // Recent searches are stored per user in the server key-value store, so they
  // outlive the browser context and are shared with previous runs and retries.
  // Clear them before the studio loads, so no reload is needed to pick the
  // cleared state up.
  await clearKeyValueKey(sanityClient, storedSearchKey)

  // The studio only re-runs a search when the terms change, so a document that
  // isn't matchable yet is missing from the results for as long as the query
  // stays the same. Wait for it to become matchable before searching for it.
  await expect
    .poll(
      () =>
        sanityClient.fetch<number>('count(*[_type == "book" && title match $prefix])', {
          prefix: `${word}*`,
        }),
      {intervals: [500, 1_000, 2_000], timeout: 30_000},
    )
    .toBe(1)

  await page.goto('/content')

  const studioSearch = page.getByTestId('studio-search')
  const searchInput = page.getByPlaceholder('Search', {exact: true})
  const searchResults = page.getByTestId('search-results')
  const seededResult = searchResults.getByRole('option', {name: title}).first()

  function isStoredSearchWrite(request: Request): boolean {
    if (request.method() !== 'PUT' || !request.url().includes('/users/me/keyvalue')) {
      return false
    }
    const body: {key?: string}[] | null = request.postDataJSON()
    return Array.isArray(body) && body[0]?.key === storedSearchKey
  }

  /**
   * Opens the search popover, unless it is already open: clicking the button
   * while the popover is open lands on its backdrop and closes it again.
   */
  async function openSearchIfClosed(): Promise<void> {
    if (await searchInput.isVisible()) return
    await studioSearch.click()
    await expect(searchInput).toBeVisible({timeout: 5_000})
  }

  /**
   * Searches for `query`, opens the seeded document from the results and
   * returns the recent searches the studio persisted as a result.
   */
  async function performSearch(query: string): Promise<StoredSearchItem[]> {
    await expect(studioSearch).toBeVisible()

    // Retype the query until the seeded document shows up, instead of failing
    // on the first response: the document is newly created, and the studio only
    // re-runs a search when the terms change, so a response that comes back
    // without it is never retried on its own. Opening is part of the retry
    // because a studio that is still settling can drop the popover again.
    //
    // Each attempt gets a generous visibility window: on a starved CI runner
    // the studio can take well over five seconds to *render* results it has
    // already received (a CI trace shows the matching response arriving within
    // an attempt's window while the option only painted ~20s later), and every
    // retype cancels the in-flight search and starts that work over — with a
    // short window the retries livelock the very rendering they wait for.
    await expect(async () => {
      await openSearchIfClosed()
      await searchInput.fill('')
      await searchInput.fill(query)
      await expect(seededResult).toBeVisible({timeout: 15_000})
    }).toPass({intervals: [1_000, 2_000], timeout: 45_000})

    // Wait for the write itself rather than reading the value back afterwards:
    // the studio rebuilds recent searches from the value it last saw, so the
    // next search must not start before this write has come back.
    const storedSearchWrite = page.waitForResponse(
      (response) => isStoredSearchWrite(response.request()),
      {timeout: 30_000},
    )
    await seededResult.click()
    const written: KeyValuePair[] = await (await storedSearchWrite).json()

    await expect(searchInput).toBeHidden()

    return written[0].value.recentSearches
  }

  expect(queriesOf(await performSearch(firstQuery))).toEqual([firstQuery])

  // Searches stack, most recent first
  expect(queriesOf(await performSearch(secondQuery))).toEqual([secondQuery, firstQuery])

  const beforeDuplicate = await performSearch(thirdQuery)
  expect(queriesOf(beforeDuplicate)).toEqual([thirdQuery, secondQuery, firstQuery])

  // Repeating a search rewrites the existing entry instead of adding a second
  // one - the new `created` timestamp confirms this is the repeated search's
  // own write, and not the previous one read back.
  const afterDuplicate = await performSearch(thirdQuery)
  expect(queriesOf(afterDuplicate)).toEqual([thirdQuery, secondQuery, firstQuery])
  expect(afterDuplicate[0].created).not.toBe(beforeDuplicate[0].created)
})
