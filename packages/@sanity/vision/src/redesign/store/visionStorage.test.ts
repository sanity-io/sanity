import {beforeEach, describe, expect, it} from 'vitest'

import {DEFAULT_API_VERSION} from '../../apiVersions'
import {clearLocalStorage} from '../../util/localStorage'
import {
  clearVisionState,
  createInitialState,
  createTab,
  createTabOptions,
  DEFAULT_PARAMS,
  getClassicVisionStorageKey,
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

  it('resolves settings from the tool defaults: following the workspace, on published', () => {
    expect(resolveDefaultSettings(defaults)).toEqual({
      datasetMode: 'auto',
      dataset: 'production',
      apiVersion: 'v2025-02-19',
      perspective: 'published',
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
      datasetMode: 'auto',
      dataset: 'staging',
      apiVersion: DEFAULT_API_VERSION,
      perspective: 'published',
      variant: 'global',
      includeSourceMap: false,
      useCdn: false,
    })
  })

  it('keeps an unlisted default API version on new tabs', () => {
    const options = createTabOptions({
      datasetMode: 'auto',
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
      options: {
        perspective: 'published',
        datasetMode: 'override',
        dataset: 'staging',
        useCdn: true,
      },
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
        resultViewer: 'tree' as const,
      },
      historyDiff: {hiddenFields: ['_rev', 'meta.version']},
      ai: {
        enabled: true,
        generateQuery: false,
        editQuery: true,
        fixLint: false,
        generateMutations: true,
        explainQuery: false,
      },
      editor: {autoFormatOnResize: false},
      response: {
        resolveSyncTags: true,
        sourceMapEnabled: true,
        resultSourceMap: 'withKeyArraySelector' as const,
      },
      exportSnippets: {
        order: [
          'curl' as const,
          'astro' as const,
          'client' as const,
          'next-sanity' as const,
          'sveltekit' as const,
          'nuxt' as const,
        ],
        hidden: ['next-sanity' as const, 'nuxt' as const],
      },
      functions: [{id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'}],
      openedSavedQueries: ['saved-pages', 'saved-posts'],
    }
    saveVisionState('proj', saved)

    expect(loadVisionState('proj', defaults)).toEqual(saved)
  })

  it('records each saved query opened as a tab once, and none for state saved before', () => {
    const state = createInitialState(defaults)
    expect(state.openedSavedQueries).toEqual([])
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({...state, openedSavedQueries: ['a', 'b', 'a', 7, null]}),
    )
    expect(loadVisionState('proj', defaults).openedSavedQueries).toEqual(['a', 'b'])

    const {openedSavedQueries: _recorded, ...before} = state
    localStorage.setItem(getVisionStorageKey('before'), JSON.stringify(before))
    expect(loadVisionState('before', defaults).openedSavedQueries).toEqual([])
  })

  it('opens the query the classic tool last showed when nothing is stored yet', () => {
    // Under the key the classic tool writes it to
    localStorage.setItem(
      'sanityVision:proj',
      JSON.stringify({
        query: '*[_type == "movie"]',
        params: '{"limit": 10}',
        dataset: 'staging',
        apiVersion: 'v2021-10-21',
        perspective: 'pinnedRelease',
      }),
    )

    const loaded = loadVisionState('proj', defaults)
    expect(loaded.tabs).toHaveLength(1)
    expect(loaded.activeTabId).toBe(loaded.tabs[0].id)
    expect(loaded.tabs[0]).toMatchObject({
      title: undefined,
      query: '*[_type == "movie"]',
      rawParams: '{"limit": 10}',
      options: {
        datasetMode: 'override',
        dataset: 'staging',
        apiVersion: 'v2021-10-21',
        perspective: 'global',
      },
    })
    // The classic tool still reads it on releases that have it
    expect(localStorage.getItem(getClassicVisionStorageKey('proj'))).not.toBeNull()
  })

  it('runs a query from the classic tool on raw and the workspace dataset unless it picked others', () => {
    localStorage.setItem(getClassicVisionStorageKey('proj'), JSON.stringify({query: '*'}))

    expect(loadVisionState('proj', defaults).tabs[0]).toMatchObject({
      query: '*',
      rawParams: DEFAULT_PARAMS,
      options: {
        datasetMode: 'auto',
        dataset: 'production',
        apiVersion: 'v2025-02-19',
        perspective: 'raw',
      },
    })
  })

  it('keeps the custom API version and the renamed drafts perspective the classic tool stored', () => {
    // The classic tool stored a custom version typed under Other as its API version, and the
    // drafts perspective as `previewDrafts` until the API renamed it
    localStorage.setItem(
      getClassicVisionStorageKey('proj'),
      JSON.stringify({query: '*', apiVersion: 'v2023-05-03', perspective: 'previewDrafts'}),
    )

    expect(loadVisionState('proj', defaults).tabs[0].options).toMatchObject({
      apiVersion: 'v2023-05-03',
      perspective: 'drafts',
    })
  })

  it('leaves the classic tool out once a state is stored, and when it left no query', () => {
    localStorage.setItem(getClassicVisionStorageKey('stored'), JSON.stringify({query: '*'}))
    saveVisionState('stored', createInitialState(defaults))
    expect(loadVisionState('stored', defaults).tabs[0].query).toBe('')

    localStorage.setItem(
      getClassicVisionStorageKey('blank'),
      JSON.stringify({query: '  ', dataset: 'staging'}),
    )
    expect(loadVisionState('blank', defaults).tabs[0]).toMatchObject({
      query: '',
      options: {datasetMode: 'auto', dataset: 'production'},
    })

    localStorage.setItem(getClassicVisionStorageKey('broken'), '{not json')
    expect(loadVisionState('broken', defaults).tabs[0].query).toBe('')
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
    expect(load('delta')).toBe('delta')
    expect(load('lint')).toBeNull()
    expect(load('functions')).toBeNull()
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

  it('reads state saved before the panels existed as having them expanded, params as JSON, the result as JSON', () => {
    const {panels: _panels, ...withoutPanels} = createInitialState(defaults)
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify(withoutPanels))

    expect(loadVisionState('proj', defaults).panels).toEqual({
      params: true,
      options: true,
      paramsView: 'json',
      resultViewer: 'json',
    })

    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...withoutPanels,
        panels: {params: false, paramsView: 'table', resultViewer: 'chart'},
      }),
    )
    expect(loadVisionState('proj', defaults).panels).toEqual({
      params: false,
      options: true,
      paramsView: 'json',
      resultViewer: 'json',
    })
  })

  it('shows the result as JSON for state saved while the tree was the default, unless the graph was chosen', () => {
    const state = createInitialState(defaults)
    const load = (panels: Record<string, unknown>) => {
      localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify({...state, panels}))
      return loadVisionState('proj', defaults).panels.resultViewer
    }
    // The tree was written for every session back then, chosen or not
    expect(load({resultView: 'tree'})).toBe('json')
    expect(load({resultView: 'json'})).toBe('json')
    expect(load({resultView: 'graph'})).toBe('graph')
    // Written since, every view is a choice
    expect(load({resultViewer: 'tree'})).toBe('tree')
    expect(load({resultViewer: 'graph'})).toBe('graph')
    expect(load({resultViewer: 'documents'})).toBe('documents')
    expect(load({resultViewer: 'tree', resultView: 'graph'})).toBe('tree')
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

  it('keeps each AI setting on unless it was switched off', () => {
    const {ai: _ai, ...withoutAi} = createInitialState(defaults)
    const allOn = {
      enabled: true,
      generateQuery: true,
      editQuery: true,
      fixLint: true,
      generateMutations: true,
      explainQuery: true,
    }
    expect(createInitialState(defaults).ai).toEqual(allOn)

    // State saved before the settings existed
    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify(withoutAi))
    expect(loadVisionState('proj', defaults).ai).toEqual(allOn)

    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...withoutAi,
        ai: {enabled: false, generateQuery: 'no', editQuery: false, explainQuery: false},
      }),
    )
    expect(loadVisionState('proj', defaults).ai).toEqual({
      enabled: false,
      generateQuery: true,
      editQuery: false,
      fixLint: true,
      generateMutations: true,
      explainQuery: false,
    })

    localStorage.setItem(getVisionStorageKey('proj'), JSON.stringify({...withoutAi, ai: 'off'}))
    expect(loadVisionState('proj', defaults).ai).toEqual(allOn)
  })

  it('keeps auto-formatting on resize on unless it was switched off', () => {
    const {editor: _editor, ...withoutEditor} = createInitialState(defaults)
    expect(createInitialState(defaults).editor).toEqual({autoFormatOnResize: true})

    const load = (editor?: unknown) => {
      localStorage.setItem(
        getVisionStorageKey('proj'),
        JSON.stringify(editor === undefined ? withoutEditor : {...withoutEditor, editor}),
      )
      return loadVisionState('proj', defaults).editor
    }
    expect(load()).toEqual({autoFormatOnResize: true})
    expect(load({autoFormatOnResize: false})).toEqual({autoFormatOnResize: false})
    expect(load({autoFormatOnResize: 'no'})).toEqual({autoFormatOnResize: true})
    expect(load('off')).toEqual({autoFormatOnResize: true})
  })

  it('keeps sync tag lookup on unless it was switched off', () => {
    const {response: _response, ...withoutResponse} = createInitialState(defaults)
    const on = {resolveSyncTags: true, sourceMapEnabled: false, resultSourceMap: true}
    expect(createInitialState(defaults).response).toEqual(on)
    // Nothing stored: a new user
    expect(loadVisionState('proj', defaults).response).toEqual(on)

    const load = (response?: unknown) => {
      localStorage.setItem(
        getVisionStorageKey('proj'),
        JSON.stringify(response === undefined ? withoutResponse : {...withoutResponse, response}),
      )
      return loadVisionState('proj', defaults).response
    }
    expect(load()).toEqual(on)
    expect(load({})).toEqual(on)
    expect(load({resolveSyncTags: 'yes'})).toEqual(on)
    expect(load('on')).toEqual(on)
    expect(load({resolveSyncTags: false})).toEqual({...on, resolveSyncTags: false})

    // State from before the current storage key, and state without tabs, read the same way
    localStorage.clear()
    localStorage.setItem(getLegacyVisionStorageKey('proj'), JSON.stringify(withoutResponse))
    expect(loadVisionState('proj', defaults).response).toEqual(on)
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({...withoutResponse, tabs: [], response: {resolveSyncTags: false}}),
    )
    expect(loadVisionState('proj', defaults).response).toEqual({...on, resolveSyncTags: false})
  })

  it('keeps the Content Source Map features off, and the plain source map, unless picked', () => {
    const {response: _response, ...withoutResponse} = createInitialState(defaults)
    const load = (response: unknown) => {
      localStorage.setItem(
        getVisionStorageKey('proj'),
        JSON.stringify({...withoutResponse, response}),
      )
      return loadVisionState('proj', defaults).response
    }
    expect(load({resolveSyncTags: false})).toEqual({
      resolveSyncTags: false,
      sourceMapEnabled: false,
      resultSourceMap: true,
    })
    expect(load({sourceMapEnabled: true, resultSourceMap: 'withKeyArraySelector'})).toEqual({
      resolveSyncTags: true,
      sourceMapEnabled: true,
      resultSourceMap: 'withKeyArraySelector',
    })
    expect(load({sourceMapEnabled: 'yes', resultSourceMap: 'withKeys'})).toEqual({
      resolveSyncTags: true,
      sourceMapEnabled: false,
      resultSourceMap: true,
    })
    expect(load({sourceMapEnabled: true, resultSourceMap: false})).toEqual({
      resolveSyncTags: true,
      sourceMapEnabled: true,
      resultSourceMap: true,
    })
  })

  it('keeps every export snippet once, in the stored order, and never hides them all', () => {
    const {exportSnippets: _exportSnippets, ...withoutSnippets} = createInitialState(defaults)
    const defaultOrder = ['client', 'curl', 'next-sanity', 'astro', 'sveltekit', 'nuxt']
    expect(createInitialState(defaults).exportSnippets).toEqual({order: defaultOrder, hidden: []})

    const load = (exportSnippets?: unknown) => {
      localStorage.setItem(
        getVisionStorageKey('proj'),
        JSON.stringify(
          exportSnippets === undefined ? withoutSnippets : {...withoutSnippets, exportSnippets},
        ),
      )
      return loadVisionState('proj', defaults).exportSnippets
    }
    // State saved before the setting existed
    expect(load()).toEqual({order: defaultOrder, hidden: []})
    expect(load('off')).toEqual({order: defaultOrder, hidden: []})
    // Unknown and repeated snippets are dropped, and snippets added since come last
    expect(
      load({order: ['curl', 'gone', 'curl', 'astro'], hidden: ['client', 'gone', 'client']}),
    ).toEqual({
      order: ['curl', 'astro', 'client', 'next-sanity', 'sveltekit', 'nuxt'],
      hidden: ['client'],
    })
    // The dialog always has a tab to show
    expect(load({order: defaultOrder, hidden: defaultOrder})).toEqual({
      order: defaultOrder,
      hidden: [],
    })
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
      datasetMode: 'override',
      dataset: 'staging',
      apiVersion: 'v2025-02-19',
      perspective: 'global',
      variant: 'global',
      includeSourceMap: false,
      useCdn: false,
    })
    // The workspace's dataset was the old default, so it keeps following the workspace
    expect(loaded.settings).toMatchObject({
      datasetMode: 'auto',
      dataset: 'production',
      perspective: 'raw',
    })
  })

  it('reads a pinned dataset as an override and one following the workspace as Auto', () => {
    const state = createInitialState(defaults)
    localStorage.setItem(
      getVisionStorageKey('proj'),
      JSON.stringify({
        ...state,
        settings: {...state.settings, datasetMode: 'workspace', dataset: 'staging'},
        tabs: [
          {
            ...state.tabs[0],
            options: {...state.tabs[0].options, datasetMode: 'pinned', dataset: 'staging'},
          },
        ],
      }),
    )

    const loaded = loadVisionState('proj', defaults)
    expect(loaded.tabs[0].options).toMatchObject({datasetMode: 'override', dataset: 'staging'})
    // Following the workspace resets the stored dataset to the workspace's
    expect(loaded.settings).toMatchObject({datasetMode: 'auto', dataset: 'production'})
  })

  it('keeps the API default perspective of a tab and of the settings across a reload', () => {
    const initial = createInitialState(defaults)
    expect(initial.settings.perspective).toBe('published')

    // A tab on the API default while the settings say Published: the tab must not fall back to them
    const tab = createTab(initial.settings, {id: 'default', options: {perspective: undefined}})
    saveVisionState('tab', {...initial, tabs: [tab], activeTabId: 'default'})
    // JSON has no undefined, so the choice is written as null rather than left out
    expect(localStorage.getItem(getVisionStorageKey('tab'))).toContain('"perspective":null')
    expect(loadVisionState('tab', defaults).tabs[0].options.perspective).toBeUndefined()

    // Settings on the API default must not fall back to the built-in Published either
    saveVisionState('settings', {
      ...initial,
      settings: {...initial.settings, perspective: undefined},
    })
    expect(loadVisionState('settings', defaults).settings.perspective).toBeUndefined()
  })

  it('keeps a stored perspective over the Published default', () => {
    const initial = createInitialState(defaults)
    const tab = createTab(initial.settings, {id: 'auto', options: {perspective: 'global'}})
    saveVisionState('proj', {
      ...initial,
      tabs: [tab],
      activeTabId: 'auto',
      settings: {...initial.settings, perspective: 'drafts'},
    })

    const loaded = loadVisionState('proj', defaults)
    expect(loaded.tabs[0].options.perspective).toBe('global')
    expect(loaded.settings.perspective).toBe('drafts')
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
