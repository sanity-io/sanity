import {describe, expect, it} from 'vitest'

import {parseQueryUrl} from '../../util/parseQueryUrl'
import {createInitialState, createTab} from '../store/vistaStorage'
import {savedQueryToTabInit, tabMatchesParsedQuery, tabMatchesSavedQuery} from './savedQueryTab'

const datasets = ['production', 'staging']
const workspaceDataset = 'production'
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
    expect(tabMatchesSavedQuery(tab, saved, datasets, workspaceDataset)).toBe(true)

    const parsed = parseQueryUrl(saved.url, datasets)
    if (!parsed) throw new Error('expected the URL to parse')
    expect(
      tabMatchesParsedQuery(
        {...tab, options: {...tab.options, datasetMode: 'pinned', dataset: 'staging'}},
        parsed,
        workspaceDataset,
      ),
    ).toBe(false)
    expect(
      tabMatchesParsedQuery(
        {...tab, options: {...tab.options, apiVersion: 'v2021-10-21'}},
        parsed,
        workspaceDataset,
      ),
    ).toBe(false)
    expect(
      tabMatchesParsedQuery(
        {...tab, options: {...tab.options, perspective: 'drafts'}},
        parsed,
        workspaceDataset,
      ),
    ).toBe(false)
    expect(
      tabMatchesParsedQuery({...tab, rawParams: '{"id": "b"}'}, parsed, workspaceDataset),
    ).toBe(false)
  })

  it('matches params by value, whatever their key order or formatting', () => {
    const tab = createTab(settings, {query: '*[_id == $id && _type == $type]'})
    const parsed = parseQueryUrl(
      'https://abc.api.sanity.io/v2025-02-19/data/query/production?query=*%5B_id+%3D%3D+%24id+%26%26+_type+%3D%3D+%24type%5D&%24id=%22a%22&%24type=%22post%22',
      datasets,
    )
    if (!parsed) throw new Error('expected the URL to parse')

    expect(
      tabMatchesParsedQuery(
        {...tab, rawParams: '{\n  type: "post",\n  id: "a",\n}'},
        parsed,
        workspaceDataset,
      ),
    ).toBe(true)
    expect(
      tabMatchesParsedQuery(
        {...tab, rawParams: '{type: "post", id: "b"}'},
        parsed,
        workspaceDataset,
      ),
    ).toBe(false)
    // Params that do not parse only match the same text
    expect(
      tabMatchesParsedQuery({...tab, rawParams: '{type: "post", id:'}, parsed, workspaceDataset),
    ).toBe(false)
  })

  it('matches a __proto__ parameter like any other', () => {
    const tab = createTab(settings, {query: '*[_id == $__proto__]'})
    const parsed = parseQueryUrl(url('*[_id == $__proto__]', {$__proto__: '{"a":1}'}), datasets)
    if (!parsed) throw new Error('expected the URL to parse')

    expect(
      tabMatchesParsedQuery({...tab, rawParams: '{"__proto__": {a: 1}}'}, parsed, workspaceDataset),
    ).toBe(true)
    expect(
      tabMatchesParsedQuery({...tab, rawParams: '{"__proto__": {a: 2}}'}, parsed, workspaceDataset),
    ).toBe(false)
    expect(tabMatchesParsedQuery({...tab, rawParams: '{}'}, parsed, workspaceDataset)).toBe(false)
  })

  it('leaves options the URL does not state to the tab', () => {
    const tab = createTab(settings, {
      query: '*',
      rawParams: '{}',
      options: {datasetMode: 'pinned', dataset: 'staging', perspective: 'global'},
    })
    // A release stack perspective cannot be represented, so it does not take part in the match
    const parsed = parseQueryUrl(
      'https://abc.api.sanity.io/v2025-02-19/data/query/staging?query=*&perspective=rXYZ,drafts',
      datasets,
    )
    if (!parsed) throw new Error('expected the URL to parse')
    expect(parsed.hasUnsupportedPerspective).toBe(true)
    expect(tabMatchesParsedQuery(tab, parsed, workspaceDataset)).toBe(true)
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
      options: {
        datasetMode: 'pinned',
        dataset: 'production',
        apiVersion: 'v2025-02-19',
        perspective: 'drafts',
      },
    })
  })

  it('matches a tab following the workspace against the dataset the workspace uses', () => {
    const tab = createTab(settings, {query: '*'})
    expect(tab.options.datasetMode).toBe('workspace')
    const parsed = parseQueryUrl(url('*'), datasets)
    if (!parsed) throw new Error('expected the URL to parse')

    expect(tabMatchesParsedQuery(tab, parsed, 'production')).toBe(true)
    expect(tabMatchesParsedQuery(tab, parsed, 'staging')).toBe(false)
  })
})
