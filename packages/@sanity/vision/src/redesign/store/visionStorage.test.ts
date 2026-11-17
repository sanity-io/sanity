import {beforeEach, describe, expect, it} from 'vitest'

import {DEFAULT_API_VERSION} from '../../apiVersions'
import {clearLocalStorage} from '../../util/localStorage'
import {
  clearVisionState,
  createInitialState,
  createTab,
  createTabOptions,
  DEFAULT_PARAMS,
  getLegacyVisionStorageKey,
  getVisionStorageKey,
  loadVisionState,
  resolveDefaultSettings,
  saveVisionState,
} from './visionStorage'

const defaults = {
  datasets: ['production', 'staging'],
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
}

describe('visionStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('resolves settings from the tool defaults: following the workspace and the navbar', () => {
    expect(resolveDefaultSettings(defaults)).toEqual({
      datasetMode: 'workspace',
      dataset: 'production',
      apiVersion: 'v2025-02-19',
      perspective: 'global',
      variant: 'global',
      includeSourceMap: false,
      useCdn: false,
    })
  })

  it('falls back to the first dataset and the default API version when the defaults are unusable', () => {
    expect(
      resolveDefaultSettings({
        datasets: ['staging'],
        defaultDataset: 'missing',
        defaultApiVersion: 'not-a-version',
      }),
    ).toEqual({
      datasetMode: 'workspace',
      dataset: 'staging',
      apiVersion: DEFAULT_API_VERSION,
      perspective: 'global',
      variant: 'global',
      includeSourceMap: false,
      useCdn: false,
    })
  })

  it('keeps an unlisted default API version on new tabs', () => {
    const options = createTabOptions({
      datasetMode: 'workspace',
      dataset: 'production',
      apiVersion: 'v2022-01-01',
      perspective: 'raw',
      variant: 'none',
      includeSourceMap: false,
      useCdn: false,
    })
    expect(options.apiVersion).toBe('v2022-01-01')
  })

  it('moves state stored under the legacy key to the current key', () => {
    const state = createInitialState(defaults)
    const tab = createTab(state.settings, {id: 'kept', query: '*[_type == "movie"]'})
    const stored = JSON.stringify({...state, tabs: [tab], activeTabId: 'kept'})
    localStorage.setItem(getLegacyVisionStorageKey('proj'), stored)

    const loaded = loadVisionState('proj', defaults)
    expect(loaded.tabs.map((t) => t.id)).toEqual(['kept'])
    expect(loaded.tabs[0].query).toBe('*[_type == "movie"]')
    expect(localStorage.getItem(getVisionStorageKey('proj'))).toBe(stored)
    expect(localStorage.getItem(getLegacyVisionStorageKey('proj'))).toBeNull()
  })

  it('prefers the current key over the legacy key', () => {
    const state = createInitialState(defaults)
    const current = createTab(state.settings, {id: 'current'})
    const legacy = createTab(state.settings, {id: 'legacy'})
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify({...state, tabs: [current]}))
    localStorage.setItem(
      getLegacyVisionStorageKey('proj'),
      JSON.stringify({...state, tabs: [legacy]}),
    )

    expect(loadVisionState('proj', defaults).tabs.map((t) => t.id)).toEqual(['current'])
  })

  it('clears the legacy key along with the current one', () => {
    localStorage.setItem(getLegacyVisionStorageKey('proj'), '{}')
    clearVisionState('proj')
    expect(localStorage.getItem(getLegacyVisionStorageKey('proj'))).toBeNull()
  })

  it('drops stored API versions that do not validate', () => {
    const state = createInitialState(defaults)
    const tab = createTab(state.settings, {id: 'tab', options: {apiVersion: 'v20'}})
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify({...state, tabs: [tab]}))

    expect(loadVisionState('proj', defaults).tabs[0].options.apiVersion).toBe(
      state.settings.apiVersion,
    )
  })

  it('creates an initial state with a single empty tab', () => {
    const state = createInitialState(defaults)
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(state.tabs[0].id)
    expect(state.tabs[0]).toMatchObject({
      query: '',
      rawParams: DEFAULT_PARAMS,
      autoRefetch: false,
      title: undefined,
    })
  })

  it('round-trips persisted state', () => {
    const state = createInitialState(defaults)
    const tab = createTab(state.settings, {
      query: '*[_type == "author"]',
      title: 'Authors',
      autoRefetch: true,
      options: {perspective: 'published', datasetMode: 'pinned', dataset: 'staging', useCdn: true},
    })
    const saved = {
      ...state,
      settings: {...state.settings, useCdn: true},
      tabs: [tab],
      activeTabId: tab.id,
      sidebar: {expanded: true, drawer: 'saved' as const},
      panels: {
        params: true,
        options: false,
        paramsView: 'form' as const,
        resultView: 'json' as const,
      },
      historyDiff: {hiddenFields: ['_rev', 'meta.version']},
      functions: [{id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'}],
    }
    saveVisionState('proj', saved)

    expect(loadVisionState('proj', defaults)).toEqual(saved)
  })

  it('keeps the drawers the sidebar has, and forgets any other', () => {
    const state = createInitialState(defaults)
    const load = (drawer: unknown) => {
      localStorage.setItem(
        getVisionStorageKey('proj'),
        JSON.stringify({...state, sidebar: {expanded: false, drawer}}),
      )
      return loadVisionState('proj', defaults).sidebar.drawer
    }
    expect(load('mutate')).toBe('mutate')
    expect(load('settings')).toBe('settings')
    expect(load('lint')).toBe('lint')
    expect(load('history')).toBeNull()
    expect(load(null)).toBeNull()
  })

  it('reads the API CDN option as off unless it was turned on', () => {
    const state = createInitialState(defaults)
    expect(state.settings.useCdn).toBe(false)
    const {useCdn: _useCdn, ...legacyOptions} = state.tabs[0].options
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...state,
        tabs: [
          {...state.tabs[0], options: legacyOptions},
          {...state.tabs[0], id: 'b', options: {...legacyOptions, useCdn: 'yes'}},
        ],
      }),
    )
    expect(loadVisionState('proj', defaults).tabs.map((tab) => tab.options.useCdn)).toEqual([
      false,
      false,
    ])
  })

  it('keeps the saved functions that have an id and a declaration, the first of each id', () => {
    const state = createInitialState(defaults)
    const author = {id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'}
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...state,
        functions: [
          author,
          {id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{title}'},
          {id: 'ex::broken'},
          'fn ex::loose($p) = $p{x}',
          {id: 'ex::tags', declaration: 'fn ex::tags($t) = $t[]->{title}', savedBy: 'someone'},
        ],
      }),
    )
    expect(loadVisionState('proj', defaults).functions).toEqual([
      author,
      {id: 'ex::tags', declaration: 'fn ex::tags($t) = $t[]->{title}'},
    ])

    // State saved before the library existed has none, and unusable tabs do not drop it
    const {functions: _functions, ...withoutFunctions} = state
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify(withoutFunctions))
    expect(loadVisionState('proj', defaults).functions).toEqual([])
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({...state, tabs: [], functions: [author]}),
    )
    expect(loadVisionState('proj', defaults).functions).toEqual([author])
  })

  it('keeps only the first of the tabs sharing an id', () => {
    const state = createInitialState(defaults)
    const first = createTab(state.settings, {id: 'dup', query: 'first'})
    const second = createTab(state.settings, {id: 'dup', query: 'second'})
    const other = createTab(state.settings, {id: 'other'})
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({...state, tabs: [first, second, other], activeTabId: 'dup'}),
    )

    const loaded = loadVisionState('proj', defaults)
    expect(loaded.tabs.map((tab) => [tab.id, tab.query])).toEqual([
      ['dup', 'first'],
      ['other', ''],
    ])
    expect(loaded.activeTabId).toBe('dup')
  })

  it('reads state saved before the panels existed as having them expanded, params as JSON, the result as a tree', () => {
    const {panels: _panels, ...withoutPanels} = createInitialState(defaults)
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify(withoutPanels))

    expect(loadVisionState('proj', defaults).panels).toEqual({
      params: true,
      options: true,
      paramsView: 'json',
      resultView: 'tree',
    })

    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...withoutPanels,
        panels: {params: false, paramsView: 'table', resultView: 'chart'},
      }),
    )
    expect(loadVisionState('proj', defaults).panels).toEqual({
      params: false,
      options: true,
      paramsView: 'json',
      resultView: 'tree',
    })
  })

  it('hides the default fields from history diffs unless others were chosen', () => {
    const {historyDiff: _historyDiff, ...withoutHistoryDiff} = createInitialState(defaults)
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify(withoutHistoryDiff))
    expect(loadVisionState('proj', defaults).historyDiff).toEqual({
      hiddenFields: ['_rev', '_updatedAt', '_system.base.rev'],
    })

    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...withoutHistoryDiff,
        historyDiff: {hiddenFields: [' _rev ', '', 3, '_rev', 'a.b']},
      }),
    )
    expect(loadVisionState('proj', defaults).historyDiff).toEqual({hiddenFields: ['_rev', 'a.b']})

    // Hiding nothing is a choice too
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({...withoutHistoryDiff, historyDiff: {hiddenFields: []}}),
    )
    expect(loadVisionState('proj', defaults).historyDiff).toEqual({hiddenFields: []})
  })

  it('returns a fresh state for missing, malformed or outdated storage', () => {
    expect(loadVisionState('missing', defaults).tabs).toHaveLength(1)

    localStorage.setItem(getVisionStorageKey('broken'), '{not json')
    expect(loadVisionState('broken', defaults).tabs).toHaveLength(1)

    localStorage.setItem(getVisionStorageKey('old'), JSON.stringify({version: 0, tabs: []}))
    expect(loadVisionState('old', defaults).tabs).toHaveLength(1)
  })

  it('drops tabs that do not validate and datasets that no longer exist', () => {
    const state = createInitialState(defaults)
    const valid = createTab(state.settings, {id: 'valid', options: {dataset: 'gone'}})
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...state,
        tabs: [valid, {noId: true}, 'garbage'],
        activeTabId: 'not-there',
        settings: {...state.settings, dataset: 'gone', perspective: 'bogus'},
      }),
    )

    const loaded = loadVisionState('proj', defaults)
    expect(loaded.tabs.map((tab) => tab.id)).toEqual(['valid'])
    expect(loaded.activeTabId).toBe('valid')
    expect(loaded.tabs[0].options.dataset).toBe('production')
    expect(loaded.settings.dataset).toBe('production')
    expect(loaded.settings.perspective).toBeUndefined()
  })

  it('reads state saved before dataset modes and variants existed', () => {
    const state = createInitialState(defaults)
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...state,
        settings: {
          dataset: 'production',
          apiVersion: 'v2025-02-19',
          perspective: 'raw',
          includeSourceMap: false,
        },
        tabs: [
          {
            id: 'old',
            query: '*',
            rawParams: '{}',
            autoRefetch: false,
            options: {
              dataset: 'staging',
              apiVersion: 'v2025-02-19',
              perspective: 'pinnedRelease',
              includeSourceMap: false,
            },
          },
        ],
      }),
    )

    const loaded = loadVisionState('proj', defaults)
    // A dataset other than the workspace's was chosen on purpose, so it stays pinned; the
    // navbar-following perspective keeps its meaning under its new name, and variants follow the navbar
    expect(loaded.tabs[0].options).toEqual({
      datasetMode: 'pinned',
      dataset: 'staging',
      apiVersion: 'v2025-02-19',
      perspective: 'global',
      variant: 'global',
      includeSourceMap: false,
      useCdn: false,
    })
    // The workspace's dataset was the old default, so it keeps following the workspace
    expect(loaded.settings).toMatchObject({
      datasetMode: 'workspace',
      dataset: 'production',
      perspective: 'raw',
    })
  })

  it('keeps the API default perspective of a tab and of the settings across a reload', () => {
    const initial = createInitialState(defaults)
    expect(initial.settings.perspective).toBe('global')

    // A tab on the API default while the settings say Global: the tab must not fall back to them
    const tab = createTab(initial.settings, {id: 'default', options: {perspective: undefined}})
    saveVisionState('tab', {...initial, tabs: [tab], activeTabId: 'default'})
    // JSON has no undefined, so the choice is written as null rather than left out
    expect(localStorage.getItem(getVisionStorageKey('tab'))).toContain('"perspective":null')
    expect(loadVisionState('tab', defaults).tabs[0].options.perspective).toBeUndefined()

    // Settings on the API default must not fall back to the built-in Global either
    saveVisionState('settings', {
      ...initial,
      settings: {...initial.settings, perspective: undefined},
    })
    expect(loadVisionState('settings', defaults).settings.perspective).toBeUndefined()
  })

  it('stores state under the classic Vision prefix so "Clear cache" resets both tools', () => {
    saveVisionState('a', createInitialState(defaults))
    saveVisionState('b', createInitialState(defaults))
    localStorage.setItem('sanityVision:classic', '{}')
    localStorage.setItem('unrelated', 'keep')

    expect(getVisionStorageKey('a')).toBe('sanityVision:state:a')
    expect(getLegacyVisionStorageKey('a').startsWith('sanityVision:')).toBe(true)

    clearVisionState('a')
    expect(localStorage.getItem(getVisionStorageKey('a'))).toBeNull()
    expect(localStorage.getItem(getVisionStorageKey('b'))).not.toBeNull()

    clearLocalStorage()
    expect(localStorage.getItem(getVisionStorageKey('b'))).toBeNull()
    expect(localStorage.getItem('sanityVision:classic')).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })
})
