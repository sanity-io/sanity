import {describe, expect, it} from 'vitest'

import {parseQueryUrl} from '../../util/parseQueryUrl'
import {type RequestEnvironment, resolveRequestOptions} from '../hooks/useResolvedRequest'
import {type VistaTab} from '../store/types'
import {createInitialState, createTab} from '../store/vistaStorage'
import {parsedQueryToTabInit, savedQueryToTabInit, tabMatchesParsedQuery} from './savedQueryTab'

const datasets = ['production', 'staging']
const {settings} = createInitialState({
  datasets,
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
})

/** A studio on the `drafts` perspective with no variant selected */
const environment: RequestEnvironment = {
  workspaceDataset: 'production',
  perspectiveStack: ['drafts'],
  selectedVariantNames: [],
  scheduledDraftsStack: undefined,
  isScheduledDraftsEnabled: false,
}

function url(
  query: string,
  options: Record<string, string> = {},
  path = 'v2025-02-19/data/query/production',
): string {
  const search = new URLSearchParams({query, ...options})
  return `https://abc.api.sanity.io/${path}?${search}`
}

function parse(text: string) {
  const parsed = parseQueryUrl(text, datasets)
  if (!parsed) throw new Error('expected the URL to parse')
  return parsed
}

/** Matches the tab through the request it would send in `env` */
function matches(tab: VistaTab, text: string, env: RequestEnvironment = environment): boolean {
  return tabMatchesParsedQuery(tab, parse(text), resolveRequestOptions(tab.options, env))
}

describe('savedQueryTab', () => {
  it('matches a tab on query, params and the options the saved URL states', () => {
    const tab = createTab(settings, {
      query: '*[_id == $id]',
      rawParams: '{"id": "a"}',
      options: {dataset: 'production', apiVersion: 'v2025-02-19', perspective: 'published'},
    })
    const saved = url('*[_id == $id]', {$id: '"a"', perspective: 'published'})
    expect(matches(tab, saved)).toBe(true)

    expect(
      matches(
        {...tab, options: {...tab.options, datasetMode: 'pinned', dataset: 'staging'}},
        saved,
      ),
    ).toBe(false)
    expect(matches({...tab, options: {...tab.options, apiVersion: 'v2021-10-21'}}, saved)).toBe(
      false,
    )
    expect(matches({...tab, options: {...tab.options, perspective: 'drafts'}}, saved)).toBe(false)
    expect(matches({...tab, rawParams: '{"id": "b"}'}, saved)).toBe(false)
  })

  it('matches through the request the tab would send, not its stored options', () => {
    // A tab on the default `global` perspective saved the navbar's `drafts`
    const global = createTab(settings, {query: '*'})
    expect(global.options.perspective).toBe('global')
    expect(matches(global, url('*', {perspective: 'drafts'}))).toBe(true)
    expect(matches(global, url('*', {perspective: 'published'}))).toBe(false)
    // ...and a release stack while a release was pinned in the navbar
    const pinnedRelease = {...environment, perspectiveStack: ['rXYZ', 'drafts']}
    expect(matches(global, url('*', {perspective: 'rXYZ,drafts'}), pinnedRelease)).toBe(true)
    expect(matches(global, url('*', {perspective: 'drafts'}), pinnedRelease)).toBe(false)
    expect(matches(global, url('*', {perspective: 'rXYZ,drafts'}))).toBe(false)

    // A selected navbar variant sends `vX` and the variant, whatever the tab's own API version says
    const withVariant = {...environment, selectedVariantNames: ['french']}
    expect(global.options.apiVersion).toBe('v2025-02-19')
    expect(
      matches(
        global,
        url('*', {perspective: 'drafts', variant: 'french'}, 'vX/data/query/production'),
        withVariant,
      ),
    ).toBe(true)
    expect(matches(global, url('*', {perspective: 'drafts', variant: 'french'}), withVariant)).toBe(
      false,
    )

    // The API default perspective is the absence of one, on both sides
    const apiDefault = {...global, options: {...global.options, perspective: undefined}}
    expect(matches(apiDefault, url('*'))).toBe(true)
    expect(matches(apiDefault, url('*', {perspective: 'drafts'}))).toBe(false)
    expect(matches(global, url('*'))).toBe(false)
  })

  it('matches params by value, whatever their key order or formatting', () => {
    const tab = createTab(settings, {
      query: '*[_id == $id && _type == $type]',
      options: {perspective: undefined},
    })
    const saved =
      'https://abc.api.sanity.io/v2025-02-19/data/query/production?query=*%5B_id+%3D%3D+%24id+%26%26+_type+%3D%3D+%24type%5D&%24id=%22a%22&%24type=%22post%22'

    expect(matches({...tab, rawParams: '{\n  type: "post",\n  id: "a",\n}'}, saved)).toBe(true)
    expect(matches({...tab, rawParams: '{type: "post", id: "b"}'}, saved)).toBe(false)
    // Params that do not parse only match the same text
    expect(matches({...tab, rawParams: '{type: "post", id:'}, saved)).toBe(false)
  })

  it('matches a __proto__ parameter like any other', () => {
    const tab = createTab(settings, {
      query: '*[_id == $__proto__]',
      options: {perspective: undefined},
    })
    const saved = url('*[_id == $__proto__]', {$__proto__: '{"a":1}'})

    expect(matches({...tab, rawParams: '{"__proto__": {a: 1}}'}, saved)).toBe(true)
    expect(matches({...tab, rawParams: '{"__proto__": {a: 2}}'}, saved)).toBe(false)
    expect(matches({...tab, rawParams: '{}'}, saved)).toBe(false)
  })

  it('turns a saved query into tab fields, keeping its title', () => {
    const parsed = parse(url('*[_type == "author"]', {perspective: 'drafts'}))
    expect(
      savedQueryToTabInit({_key: 'k', savedAt: '', title: 'Authors', url: ''}, parsed),
    ).toEqual({
      title: 'Authors',
      query: '*[_type == "author"]',
      rawParams: '{}',
      options: {
        includeSourceMap: false,
        datasetMode: 'pinned',
        dataset: 'production',
        apiVersion: 'v2025-02-19',
        perspective: 'drafts',
      },
    })
    // A request that asked for a content source map turns the option on
    const withSourceMap = parse(url('*', {resultSourceMap: 'true'}))
    expect(parsedQueryToTabInit(withSourceMap).options).toMatchObject({includeSourceMap: true})
  })

  it('matches the variant and the content source map the request was sent with', () => {
    const tab = createTab(settings, {query: '*'})
    const withVariant = {...environment, selectedVariantNames: ['french']}
    const variantUrl = url(
      '*',
      {perspective: 'drafts', variant: 'french'},
      'vX/data/query/production',
    )
    // The tab sends the navbar's variant, so the saved request carries it too
    expect(matches(tab, variantUrl, withVariant)).toBe(true)
    // Without the variant selected the tab sends another request
    expect(matches(tab, variantUrl)).toBe(false)
    // ...and a saved request without a variant is not what a tab with one sends
    expect(
      matches(tab, url('*', {perspective: 'drafts'}, 'vX/data/query/production'), withVariant),
    ).toBe(false)

    const sourceMapUrl = url('*', {perspective: 'drafts', resultSourceMap: 'true'})
    expect(matches(tab, sourceMapUrl)).toBe(false)
    expect(matches({...tab, options: {...tab.options, includeSourceMap: true}}, sourceMapUrl)).toBe(
      true,
    )
    expect(
      matches(
        {...tab, options: {...tab.options, includeSourceMap: true}},
        url('*', {perspective: 'drafts'}),
      ),
    ).toBe(false)
  })

  it('leaves a dataset the tool does not know, and an unrepresentable perspective, to the tab', () => {
    const parsed = parse(url('*', {perspective: 'rXYZ,drafts'}, 'v2025-02-19/data/query/other'))
    expect(parsed.isKnownDataset).toBe(false)
    expect(parsed.hasUnsupportedPerspective).toBe(true)
    expect(parsedQueryToTabInit(parsed)).toEqual({
      query: '*',
      rawParams: '{}',
      options: {includeSourceMap: false, apiVersion: 'v2025-02-19'},
    })
    // The saved request went to another dataset, so no tab here is showing it
    const tab = createTab(settings, {query: '*'})
    expect(matches(tab, parsed.url, {...environment, perspectiveStack: ['rXYZ', 'drafts']})).toBe(
      false,
    )
  })

  it('matches a tab following the workspace against the dataset the workspace uses', () => {
    const tab = createTab(settings, {query: '*', options: {perspective: undefined}})
    expect(tab.options.datasetMode).toBe('workspace')
    const saved = url('*')

    expect(matches(tab, saved, {...environment, workspaceDataset: 'production'})).toBe(true)
    expect(matches(tab, saved, {...environment, workspaceDataset: 'staging'})).toBe(false)
  })
})
