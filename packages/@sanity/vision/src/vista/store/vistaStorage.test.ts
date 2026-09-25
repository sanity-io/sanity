import {beforeEach, describe, expect, it} from 'vitest'

import {DEFAULT_API_VERSION} from '../../apiVersions'
import {clearLocalStorage} from '../../util/localStorage'
import {
  clearVistaState,
  createInitialState,
  createTab,
  createTabOptions,
  DEFAULT_PARAMS,
  getVistaStorageKey,
  loadVistaState,
  resolveDefaultSettings,
  saveVistaState,
} from './vistaStorage'

const defaults = {
  datasets: ['production', 'staging'],
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
}

describe('vistaStorage', () => {
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
    })
    expect(options.apiVersion).toBe('v2022-01-01')
  })

  it('drops stored API versions that do not validate', () => {
    const state = createInitialState(defaults)
    const tab = createTab(state.settings, {id: 'tab', options: {apiVersion: 'v20'}})
    localStorage.setItem(getVistaStorageKey('proj'), JSON.stringify({...state, tabs: [tab]}))

    expect(loadVistaState('proj', defaults).tabs[0].options.apiVersion).toBe(
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
      options: {perspective: 'drafts', datasetMode: 'pinned', dataset: 'staging'},
    })
    const saved = {
      ...state,
      tabs: [tab],
      activeTabId: tab.id,
      sidebar: {expanded: true, drawer: 'saved' as const},
      panels: {params: true, options: false},
    }
    saveVistaState('proj', saved)

    expect(loadVistaState('proj', defaults)).toEqual(saved)
  })

  it('keeps only the first of the tabs sharing an id', () => {
    const state = createInitialState(defaults)
    const first = createTab(state.settings, {id: 'dup', query: 'first'})
    const second = createTab(state.settings, {id: 'dup', query: 'second'})
    const other = createTab(state.settings, {id: 'other'})
    localStorage.setItem(
      getVistaStorageKey('proj'),
      JSON.stringify({...state, tabs: [first, second, other], activeTabId: 'dup'}),
    )

    const loaded = loadVistaState('proj', defaults)
    expect(loaded.tabs.map((tab) => [tab.id, tab.query])).toEqual([
      ['dup', 'first'],
      ['other', ''],
    ])
    expect(loaded.activeTabId).toBe('dup')
  })

  it('reads state saved before the panels existed as having them expanded', () => {
    const {panels: _panels, ...withoutPanels} = createInitialState(defaults)
    localStorage.setItem(getVistaStorageKey('proj'), JSON.stringify(withoutPanels))

    expect(loadVistaState('proj', defaults).panels).toEqual({params: true, options: true})
  })

  it('returns a fresh state for missing, malformed or outdated storage', () => {
    expect(loadVistaState('missing', defaults).tabs).toHaveLength(1)

    localStorage.setItem(getVistaStorageKey('broken'), '{not json')
    expect(loadVistaState('broken', defaults).tabs).toHaveLength(1)

    localStorage.setItem(getVistaStorageKey('old'), JSON.stringify({version: 0, tabs: []}))
    expect(loadVistaState('old', defaults).tabs).toHaveLength(1)
  })

  it('drops tabs that do not validate and datasets that no longer exist', () => {
    const state = createInitialState(defaults)
    const valid = createTab(state.settings, {id: 'valid', options: {dataset: 'gone'}})
    localStorage.setItem(
      getVistaStorageKey('proj'),
      JSON.stringify({
        ...state,
        tabs: [valid, {noId: true}, 'garbage'],
        activeTabId: 'not-there',
        settings: {...state.settings, dataset: 'gone', perspective: 'bogus'},
      }),
    )

    const loaded = loadVistaState('proj', defaults)
    expect(loaded.tabs.map((tab) => tab.id)).toEqual(['valid'])
    expect(loaded.activeTabId).toBe('valid')
    expect(loaded.tabs[0].options.dataset).toBe('production')
    expect(loaded.settings.dataset).toBe('production')
    expect(loaded.settings.perspective).toBeUndefined()
  })

  it('reads state saved before dataset modes and variants existed', () => {
    const state = createInitialState(defaults)
    localStorage.setItem(
      getVistaStorageKey('proj'),
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

    const loaded = loadVistaState('proj', defaults)
    // A dataset other than the workspace's was chosen on purpose, so it stays pinned; the
    // navbar-following perspective keeps its meaning under its new name, and variants follow the navbar
    expect(loaded.tabs[0].options).toEqual({
      datasetMode: 'pinned',
      dataset: 'staging',
      apiVersion: 'v2025-02-19',
      perspective: 'global',
      variant: 'global',
      includeSourceMap: false,
    })
    // The workspace's dataset was the old default, so it keeps following the workspace
    expect(loaded.settings).toMatchObject({
      datasetMode: 'workspace',
      dataset: 'production',
      perspective: 'raw',
    })
  })

  it('stores state under the classic Vision prefix so "Clear cache" resets both tools', () => {
    saveVistaState('a', createInitialState(defaults))
    saveVistaState('b', createInitialState(defaults))
    localStorage.setItem('sanityVision:classic', '{}')
    localStorage.setItem('unrelated', 'keep')

    expect(getVistaStorageKey('a')).toBe('sanityVision:vista:a')

    clearVistaState('a')
    expect(localStorage.getItem(getVistaStorageKey('a'))).toBeNull()
    expect(localStorage.getItem(getVistaStorageKey('b'))).not.toBeNull()

    clearLocalStorage()
    expect(localStorage.getItem(getVistaStorageKey('b'))).toBeNull()
    expect(localStorage.getItem('sanityVision:classic')).toBeNull()
    expect(localStorage.getItem('unrelated')).toBe('keep')
  })
})
