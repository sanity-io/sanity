import {takeSnapshot} from '@chromatic-com/vitest'
import {defineField, defineType} from 'sanity'
import {describe, expect, it, vi} from 'vitest'
import {render} from 'vitest-browser-react'
import {page, userEvent} from 'vitest/browser'

import {expectStable, testHelpers} from '../../../../../../../../../test/browser/testHelpers'
import {TestWrapper} from '../../../../../../../../../test/browser/TestWrapper'
import {SearchProvider} from '../../../contexts/search/SearchProvider'
import {type RecentSearch} from '../../../datastores/recentSearches'
import {type StoredSearch} from '../../../datastores/useStoredSearch'
import {RecentSearchItem} from '../item/RecentSearchItem'
import {RecentSearches} from '../RecentSearches'

const TITLE_FILTER = {
  fieldId: 'string-title-Title',
  filterName: 'string',
  operatorType: 'stringEqual',
  value: 'Ada',
}

const schemaTypes = [
  defineType({
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
      defineField({name: 'name', title: 'Name', type: 'string'}),
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description: 'The display title',
      }),
    ],
  }),
  defineType({
    name: 'article',
    title: 'Article',
    type: 'document',
    fields: [
      defineField({
        name: 'title',
        title: 'Title',
        type: 'string',
        description: 'The display title',
      }),
    ],
  }),
]

// Recent searches are read from the key-value store, which round-trips through
// the mock client and would replace a local seed with null. Hand the list in
// directly so the snapshot does not depend on that request.
const {storedSearch} = vi.hoisted(() => ({
  storedSearch: {
    recentSearches: [
      {
        created: '2026-03-15T12:00:00.000Z',
        filters: [
          {
            fieldId: 'string-title-Title',
            filterName: 'string',
            operatorType: 'stringEqual',
            value: 'Ada',
          },
        ],
        terms: {query: 'Ada Lovelace', typeNames: ['author']},
      },
      {
        created: '2026-03-14T12:00:00.000Z',
        filters: [],
        terms: {query: 'portable text', typeNames: ['author', 'article']},
      },
    ],
    version: 3,
  },
}))

vi.mock('../../../datastores/useStoredSearch', () => ({
  RECENT_SEARCH_VERSION: 3,
  useStoredSearch: (): [StoredSearch, (value: StoredSearch) => void] => [
    storedSearch,
    () => undefined,
  ],
}))

const STANDALONE_SEARCH: RecentSearch = {
  __recent: {index: 0, timestamp: Date.parse('2026-03-15T12:00:00.000Z')},
  filters: [TITLE_FILTER],
  query: 'Grace Hopper',
  types: [],
}

/**
 * Chromatic sentinel for the recent-search list label and a search row
 * (query, type pill, filter pill, clock icon). Copy is fixture data.
 */
function RecentSearchesHarness() {
  return (
    <TestWrapper schemaTypes={schemaTypes}>
      <SearchProvider>
        <div style={{display: 'flex', flexDirection: 'column', height: 320, width: 520}}>
          {/* The scroll box is height:100% of an unsized parent. Size that box, not the list. */}
          <style>{`div:has(> [aria-label="Recent searches"]) { height: 140px; }`}</style>
          <RecentSearches />
        </div>
        <RecentSearchItem index={0} maxVisibleTypePillChars={40} value={STANDALONE_SEARCH} />
      </SearchProvider>
    </TestWrapper>
  )
}

describe('recent searches', () => {
  it('lists stored searches and a single search row', async () => {
    const {settleChromaticEndState} = testHelpers()
    await render(<RecentSearchesHarness />)

    await expect.element(page.getByText('Recent searches', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Ada Lovelace', {exact: true})).toBeVisible()
    await expect.element(page.getByText('portable text', {exact: true})).toBeVisible()
    await expect.element(page.getByText('Grace Hopper', {exact: true})).toBeVisible()
    await expect.element(page.getByRole('button', {name: 'Clear recent searches'})).toBeVisible()

    const row = page.getByText('Grace Hopper', {exact: true})
    await userEvent.hover(row)
    await expectStable(() => row.element().getBoundingClientRect().width)
    await takeSnapshot('recent search hovered')

    await settleChromaticEndState()
  })
})
