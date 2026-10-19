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

/** A studio on the `drafts` perspective with variants on but none selected */
const environment: RequestEnvironment = {
  workspaceDataset: 'production',
  perspectiveStack: ['drafts'],
  selectedVariantNames: [],
  isVariantsEnabled: true,
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
        useCdn: false,
        datasetMode: 'pinned',
        dataset: 'production',
        apiVersion: 'v2025-02-19',
        perspective: 'drafts',
        variant: 'none',
      },
    })
    // A request that asked for a content source map turns the option on
    const withSourceMap = parse(url('*', {resultSourceMap: 'true'}))
    expect(parsedQueryToTabInit(withSourceMap).options).toMatchObject({includeSourceMap: true})
  })

  it('loads a URL without a perspective as the API default, not as the tab had it', () => {
    const options = parsedQueryToTabInit(parse(url('*'))).options ?? {}
    // Set to `undefined` rather than left out, so it replaces the receiving tab's perspective
    expect('perspective' in options).toBe(true)
    expect(options.perspective).toBeUndefined()
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
    // Where the workspace has variants switched off, the tab sends none, whatever the navbar's
    // URL still carries, so it sends the request without the variant and not the one with it
    const variantsOff = {...withVariant, isVariantsEnabled: false}
    expect(matches(tab, variantUrl, variantsOff)).toBe(false)
    expect(matches(tab, url('*', {perspective: 'drafts'}), variantsOff)).toBe(true)

    const sourceMapUrl = url('*', {perspective: 'drafts', resultSourceMap: 'true'})
    const sourceMapTab = {...tab, options: {...tab.options, includeSourceMap: true}}
    expect(matches(tab, sourceMapUrl)).toBe(false)
    expect(matches(sourceMapTab, sourceMapUrl)).toBe(true)
    expect(matches(sourceMapTab, url('*', {perspective: 'drafts'}))).toBe(false)
    // A request made with the key array selector mode asked for a source map all the same
    const selectorUrl = url('*', {perspective: 'drafts', resultSourceMap: 'withKeyArraySelector'})
    expect(matches(sourceMapTab, selectorUrl)).toBe(true)
    expect(matches(tab, selectorUrl)).toBe(false)
    expect(parsedQueryToTabInit(parse(selectorUrl)).options).toMatchObject({includeSourceMap: true})
  })

  it('leaves a dataset the tool does not know, and an unrepresentable perspective, to the tab', () => {
    const parsed = parse(url('*', {perspective: 'rXYZ,drafts'}, 'v2025-02-19/data/query/other'))
    expect(parsed.isKnownDataset).toBe(false)
    expect(parsed.hasUnsupportedPerspective).toBe(true)
    expect(parsedQueryToTabInit(parsed)).toEqual({
      query: '*',
      rawParams: '{}',
      options: {
        includeSourceMap: false,
        useCdn: false,
        apiVersion: 'v2025-02-19',
        variant: 'none',
      },
    })
    // The saved request went to another dataset, so no tab here is showing it
    const tab = createTab(settings, {query: '*'})
    expect(matches(tab, parsed.url, {...environment, perspectiveStack: ['rXYZ', 'drafts']})).toBe(
      false,
    )
  })

  it("loads the variant the URL states: none without one, the navbar's with one", () => {
    const withVariant = {...environment, selectedVariantNames: ['french']}
    const plain = url('*', {perspective: 'drafts'})
    // A tab on global would add the navbar's variant to a request that had none
    const loaded = createTab(settings, parsedQueryToTabInit(parse(plain)))
    expect(loaded.options.variant).toBe('none')
    expect(matches(loaded, plain, withVariant)).toBe(true)

    const variantUrl = url(
      '*',
      {perspective: 'drafts', variant: 'french'},
      'vX/data/query/production',
    )
    const following = createTab(settings, parsedQueryToTabInit(parse(variantUrl)))
    expect(following.options.variant).toBe('global')
    expect(matches(following, variantUrl, withVariant)).toBe(true)
  })

  it('matches empty and non-object params the way the request sends them, as {}', () => {
    const saved = url('*', {perspective: 'drafts'})
    for (const rawParams of ['', '{}', '[]', '  {  }  ']) {
      expect(matches(createTab(settings, {query: '*', rawParams}), saved)).toBe(true)
    }
    expect(matches(createTab(settings, {query: '*', rawParams: '{"a": 1}'}), saved)).toBe(false)
  })

  it('loads and matches a request to the API CDN, which serves published and raw but no drafts', () => {
    const cdnUrl = url('*', {perspective: 'published'}).replace('.api.', '.apicdn.')
    const loaded = createTab(settings, parsedQueryToTabInit(parse(cdnUrl)))
    expect(loaded.options.useCdn).toBe(true)
    expect(matches(loaded, cdnUrl)).toBe(true)
    // The same request to the API is another one
    expect(matches(loaded, url('*', {perspective: 'published'}))).toBe(false)
    expect(matches({...loaded, options: {...loaded.options, useCdn: false}}, cdnUrl)).toBe(false)

    // With the drafts perspective the query goes to the API, whatever the option says
    const drafts = resolveRequestOptions({...loaded.options, perspective: 'drafts'}, environment)
    expect(drafts).toMatchObject({useCdn: false, isCdnBlockedByPerspective: true})
    // ...and so it does on `global` with the navbar's drafts, or a release stack
    expect(
      resolveRequestOptions({...loaded.options, perspective: 'global'}, environment),
    ).toMatchObject({useCdn: false, isCdnBlockedByPerspective: true})
    expect(
      resolveRequestOptions({...loaded.options, perspective: 'raw'}, environment),
    ).toMatchObject({useCdn: true, isCdnBlockedByPerspective: false})
    expect(
      resolveRequestOptions({...loaded.options, perspective: undefined}, environment),
    ).toMatchObject({useCdn: true, isCdnBlockedByPerspective: false})
    // Not asked for, nothing is blocked
    expect(
      resolveRequestOptions({...loaded.options, useCdn: false, perspective: 'drafts'}, environment),
    ).toMatchObject({useCdn: false, isCdnBlockedByPerspective: false})
  })

  it('sends `global` on the navbar’s published perspective as published, which the API CDN serves', () => {
    const tab = createTab(settings, {query: '*', options: {perspective: 'global', useCdn: true}})
    const published: RequestEnvironment = {...environment, perspectiveStack: ['published']}
    expect(resolveRequestOptions(tab.options, published)).toMatchObject({
      perspective: 'published',
      useCdn: true,
      isCdnBlockedByPerspective: false,
    })
    // A release on top of published is a stack still
    expect(
      resolveRequestOptions(tab.options, {
        ...environment,
        perspectiveStack: ['rSpring', 'published'],
      }),
    ).toMatchObject({perspective: ['rSpring', 'published'], useCdn: false})
    // Saved with `perspective=published`, the request matches either way
    expect(
      matches(
        createTab(settings, {query: '*', options: {perspective: 'global'}}),
        url('*', {perspective: 'published'}),
        published,
      ),
    ).toBe(true)
  })

  it('matches a tab following the workspace against the dataset the workspace uses', () => {
    const tab = createTab(settings, {query: '*', options: {perspective: undefined}})
    expect(tab.options.datasetMode).toBe('workspace')
    const saved = url('*')

    expect(matches(tab, saved, {...environment, workspaceDataset: 'production'})).toBe(true)
    expect(matches(tab, saved, {...environment, workspaceDataset: 'staging'})).toBe(false)
  })
})
