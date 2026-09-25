import {describe, expect, it} from 'vitest'

import {parseQueryUrl} from '../../util/parseQueryUrl'
import {createInitialState, createTab} from '../store/vistaStorage'
import {savedQueryToTabInit, tabMatchesParsedQuery, tabMatchesSavedQuery} from './savedQueryTab'

const datasets = ['production', 'staging']
const {settings} = createInitialState({
  datasets,
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
})

function url(query: string, options: Record<string, string> = {}): string {
  const search = new URLSearchParams({query, ...options})
  return `https://abc.api.sanity.io/v2025-02-19/data/query/production?${search}`
}

describe('savedQueryTab', () => {
  it('matches a tab on query, params and the options the saved URL states', () => {
    const tab = createTab(settings, {
      query: '*[_id == $id]',
      rawParams: '{"id": "a"}',
      options: {dataset: 'production', apiVersion: 'v2025-02-19', perspective: 'published'},
    })
    const saved = {
      _key: 'k',
      savedAt: '',
      url: url('*[_id == $id]', {$id: '"a"', perspective: 'published'}),
    }
    expect(tabMatchesSavedQuery(tab, saved, datasets)).toBe(true)

    const parsed = parseQueryUrl(saved.url, datasets)
    if (!parsed) throw new Error('expected the URL to parse')
    expect(
      tabMatchesParsedQuery({...tab, options: {...tab.options, dataset: 'staging'}}, parsed),
    ).toBe(false)
    expect(
      tabMatchesParsedQuery({...tab, options: {...tab.options, apiVersion: 'v2021-10-21'}}, parsed),
    ).toBe(false)
    expect(
      tabMatchesParsedQuery({...tab, options: {...tab.options, perspective: 'drafts'}}, parsed),
    ).toBe(false)
    expect(tabMatchesParsedQuery({...tab, rawParams: '{"id": "b"}'}, parsed)).toBe(false)
  })

  it('leaves options the URL does not state to the tab', () => {
    const tab = createTab(settings, {
      query: '*',
      rawParams: '{}',
      options: {dataset: 'staging', perspective: 'pinnedRelease'},
    })
    // A release stack perspective cannot be represented, so it does not take part in the match
    const parsed = parseQueryUrl(
      'https://abc.api.sanity.io/v2025-02-19/data/query/staging?query=*&perspective=rXYZ,drafts',
      datasets,
    )
    if (!parsed) throw new Error('expected the URL to parse')
    expect(parsed.hasUnsupportedPerspective).toBe(true)
    expect(tabMatchesParsedQuery(tab, parsed)).toBe(true)
  })

  it('turns a saved query into tab fields, keeping its title', () => {
    const parsed = parseQueryUrl(url('*[_type == "author"]', {perspective: 'drafts'}), datasets)
    if (!parsed) throw new Error('expected the URL to parse')
    expect(
      savedQueryToTabInit({_key: 'k', savedAt: '', title: 'Authors', url: ''}, parsed),
    ).toEqual({
      title: 'Authors',
      query: '*[_type == "author"]',
      rawParams: '{}',
      options: {dataset: 'production', apiVersion: 'v2025-02-19', perspective: 'drafts'},
    })
  })
})
