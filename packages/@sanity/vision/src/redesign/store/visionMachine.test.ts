import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {createActor, createMachine} from 'xstate'

import {CLOSED_TAB_RETENTION_MS} from './closedTabs'
import {type VisionPersistedState, type VisionTab} from './types'
import {
  isPanelExpanded,
  selectActiveTab,
  selectClosedTabs,
  selectOpenDialog,
  selectFunctionLibrary,
  selectOpenDrawer,
  selectOpenTabDrawer,
  selectParamsView,
  selectResultView,
  selectPersistedState,
  selectSourceMapEnabled,
  selectSourceMapRequest,
  visionMachine,
} from './visionMachine'
import {createInitialState, createTab, getVisionStorageKey, saveVisionState} from './visionStorage'

const defaults = {
  datasets: ['production', 'staging'],
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
}

// The runners are exercised in queryRunnerMachine.test.ts; here they only need to be spawnable
const runnerStub = createMachine({id: 'runnerStub'})

function createHarness(persisted: VisionPersistedState = createInitialState(defaults)) {
  const actor = createActor(visionMachine.provide({actors: {queryRunner: runnerStub as never}}), {
    input: {projectId: 'proj', persisted, defaults},
  })
  actor.start()
  return {
    actor,
    snapshot: () => actor.getSnapshot(),
    tabs: () => actor.getSnapshot().context.tabs,
    runnerIds: () => Object.keys(actor.getSnapshot().context.runners).sort(),
  }
}

function withTabs(tabs: VisionTab[], activeTabId = tabs[0].id): VisionPersistedState {
  const initial = createInitialState(defaults)
  return {...initial, tabs, activeTabId}
}

function closedIds(harness: ReturnType<typeof createHarness>): string[] {
  return selectClosedTabs(harness.snapshot()).map(({tab}) => tab.id)
}

describe('visionMachine', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('spawns one runner per restored tab', () => {
    const initial = createInitialState(defaults)
    const tabs = [createTab(initial.settings, {id: 'a'}), createTab(initial.settings, {id: 'b'})]
    const harness = createHarness(withTabs(tabs, 'b'))

    expect(harness.runnerIds()).toEqual(['a', 'b'])
    expect(selectActiveTab(harness.snapshot()).id).toBe('b')
  })

  it('adds and activates a tab with the settings defaults, spawning its runner', () => {
    const harness = createHarness()
    harness.actor.send({type: 'settings.update', settings: {perspective: 'drafts'}})
    harness.actor.send({type: 'tab.add', tab: {query: '*'}})

    const tabs = harness.tabs()
    expect(tabs).toHaveLength(2)
    expect(tabs[1].query).toBe('*')
    expect(tabs[1].options.perspective).toBe('drafts')
    expect(harness.snapshot().context.activeTabId).toBe(tabs[1].id)
    expect(harness.runnerIds()).toEqual(tabs.map((tab) => tab.id).sort())
  })

  it('activates the neighbour when the active tab is closed and stops its runner', () => {
    const initial = createInitialState(defaults)
    const tabs = ['a', 'b', 'c'].map((id) => createTab(initial.settings, {id}))
    const harness = createHarness(withTabs(tabs, 'b'))

    harness.actor.send({type: 'tab.close', id: 'b'})
    expect(harness.tabs().map((tab) => tab.id)).toEqual(['a', 'c'])
    expect(harness.snapshot().context.activeTabId).toBe('c')
    expect(harness.runnerIds()).toEqual(['a', 'c'])

    harness.actor.send({type: 'tab.close', id: 'c'})
    expect(harness.snapshot().context.activeTabId).toBe('a')
  })

  it('keeps the active tab when another one is closed', () => {
    const initial = createInitialState(defaults)
    const tabs = ['a', 'b'].map((id) => createTab(initial.settings, {id}))
    const harness = createHarness(withTabs(tabs, 'a'))

    harness.actor.send({type: 'tab.close', id: 'b'})
    expect(harness.snapshot().context.activeTabId).toBe('a')
  })

  it('replaces the last tab with a fresh one', () => {
    const initial = createInitialState(defaults)
    const only = createTab(initial.settings, {id: 'only', query: '*'})
    const harness = createHarness(withTabs([only]))

    harness.actor.send({type: 'tab.close', id: 'only'})
    const tabs = harness.tabs()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).not.toBe('only')
    expect(tabs[0].query).toBe('')
    expect(harness.runnerIds()).toEqual([tabs[0].id])
  })

  it('ignores selecting an unknown tab', () => {
    const harness = createHarness()
    const before = harness.snapshot().context.activeTabId
    harness.actor.send({type: 'tab.select', id: 'nope'})
    expect(harness.snapshot().context.activeTabId).toBe(before)
  })

  it('reorders tabs, keeping the active tab and its runner, and persists the order', () => {
    const initial = createInitialState(defaults)
    const tabs = ['a', 'b', 'c'].map((id) => createTab(initial.settings, {id}))
    const harness = createHarness(withTabs(tabs, 'b'))

    harness.actor.send({type: 'tab.reorder', ids: ['c', 'a', 'b']})
    expect(harness.tabs().map((tab) => tab.id)).toEqual(['c', 'a', 'b'])
    expect(harness.tabs()[1]).toBe(tabs[0])
    expect(harness.snapshot().context.activeTabId).toBe('b')
    expect(harness.runnerIds()).toEqual(['a', 'b', 'c'])
    expect(selectPersistedState(harness.snapshot()).tabs.map((tab) => tab.id)).toEqual([
      'c',
      'a',
      'b',
    ])
  })

  it('refuses a reorder that does not list every open tab exactly once', () => {
    const initial = createInitialState(defaults)
    const tabs = ['a', 'b', 'c'].map((id) => createTab(initial.settings, {id}))
    const harness = createHarness(withTabs(tabs))

    harness.actor.send({type: 'tab.reorder', ids: ['c', 'a']})
    harness.actor.send({type: 'tab.reorder', ids: ['c', 'a', 'a']})
    harness.actor.send({type: 'tab.reorder', ids: ['c', 'a', 'b', 'stale']})
    harness.actor.send({type: 'tab.reorder', ids: ['c', 'a', 'stale']})
    expect(harness.tabs().map((tab) => tab.id)).toEqual(['a', 'b', 'c'])
  })

  it('edits tab fields, treating a blank title as "derive from query"', () => {
    const harness = createHarness()
    const [tab] = harness.tabs()

    harness.actor.send({type: 'tab.rename', id: tab.id, title: '  Authors '})
    expect(harness.tabs()[0].title).toBe('Authors')
    harness.actor.send({type: 'tab.rename', id: tab.id, title: '  '})
    expect(harness.tabs()[0].title).toBeUndefined()

    harness.actor.send({type: 'tab.setQuery', id: tab.id, query: '*[_type == "x"]'})
    harness.actor.send({type: 'tab.setParams', id: tab.id, rawParams: '{"a": 1}'})
    harness.actor.send({type: 'tab.setAutoRefetch', id: tab.id, autoRefetch: true})
    harness.actor.send({
      type: 'tab.setOptions',
      id: tab.id,
      options: {datasetMode: 'override', dataset: 'staging'},
    })

    expect(harness.tabs()[0]).toMatchObject({
      query: '*[_type == "x"]',
      rawParams: '{"a": 1}',
      autoRefetch: true,
      options: {
        datasetMode: 'override',
        dataset: 'staging',
        perspective: 'published',
        variant: 'global',
      },
    })
  })

  it('links a tab to the shared query it is shared as, through edits and until unlinked', () => {
    const harness = createHarness()
    const [tab] = harness.tabs()

    harness.actor.send({type: 'tab.setSharedId', id: tab.id, sharedId: 'shared-a'})
    harness.actor.send({type: 'tab.setQuery', id: tab.id, query: '*[_type == "x"]'})
    harness.actor.send({type: 'tab.load', id: tab.id, tab: {query: '*[_type == "y"]'}})
    expect(harness.tabs()[0]).toMatchObject({query: '*[_type == "y"]', sharedId: 'shared-a'})

    const before = harness.tabs()
    harness.actor.send({type: 'tab.setSharedId', id: tab.id, sharedId: 'shared-a'})
    expect(harness.tabs()).toBe(before)

    harness.actor.send({type: 'tab.load', id: tab.id, tab: {query: '*', sharedId: 'shared-b'}})
    expect(harness.tabs()[0].sharedId).toBe('shared-b')
    harness.actor.send({type: 'tab.setSharedId', id: tab.id, sharedId: undefined})
    expect(harness.tabs()[0].sharedId).toBeUndefined()
  })

  it('does not produce a new tabs array for a no-op query change', () => {
    const harness = createHarness()
    const [tab] = harness.tabs()
    harness.actor.send({type: 'tab.setQuery', id: tab.id, query: 'abc'})
    const tabs = harness.tabs()
    harness.actor.send({type: 'tab.setQuery', id: tab.id, query: 'abc'})
    expect(harness.tabs()).toBe(tabs)
  })

  it('loads a query into a tab while keeping unspecified options', () => {
    const harness = createHarness()
    const [tab] = harness.tabs()
    harness.actor.send({
      type: 'tab.load',
      id: tab.id,
      tab: {query: '*', rawParams: '{}', options: {perspective: 'published'}},
    })
    expect(harness.tabs()[0]).toMatchObject({
      query: '*',
      rawParams: '{}',
      options: {perspective: 'published', dataset: 'production'},
    })
    expect(harness.snapshot().context.loadRevisions[tab.id]).toBe(1)

    harness.actor.send({type: 'tab.load', id: tab.id, tab: {query: '*[]'}})
    expect(harness.snapshot().context.loadRevisions[tab.id]).toBe(2)

    // An option given as `undefined` is set, not unspecified: this is how a URL without a
    // perspective puts the tab on the API default
    harness.actor.send({
      type: 'tab.load',
      id: tab.id,
      tab: {query: '*', options: {perspective: undefined}},
    })
    expect(harness.tabs()[0].options).toMatchObject({dataset: 'production'})
    expect(harness.tabs()[0].options.perspective).toBeUndefined()
  })

  it('restores and toggles the sidebar, drawer and dialogs', () => {
    const persisted = {
      ...createInitialState(defaults),
      sidebar: {expanded: true, drawer: 'shared' as const},
    }
    const harness = createHarness(persisted)

    expect(harness.snapshot().matches({sidebar: 'expanded'})).toBe(true)
    expect(selectOpenDrawer(harness.snapshot())).toBe('shared')
    expect(selectOpenDialog(harness.snapshot())).toBeNull()

    harness.actor.send({type: 'sidebar.toggle'})
    expect(harness.snapshot().matches({sidebar: 'collapsed'})).toBe(true)

    harness.actor.send({type: 'drawer.toggle', drawer: 'closed-tabs'})
    expect(selectOpenDrawer(harness.snapshot())).toBe('closed-tabs')
    harness.actor.send({type: 'drawer.toggle', drawer: 'closed-tabs'})
    expect(selectOpenDrawer(harness.snapshot())).toBeNull()
    harness.actor.send({type: 'drawer.toggle', drawer: 'shared'})
    harness.actor.send({type: 'drawer.close'})
    expect(selectOpenDrawer(harness.snapshot())).toBeNull()

    // One drawer at a time: the tab's tools and the settings open in it like the tab lists
    harness.actor.send({type: 'drawer.toggle', drawer: 'delta'})
    expect(selectOpenDrawer(harness.snapshot())).toBe('delta')
    expect(selectOpenTabDrawer(harness.snapshot())).toBe('delta')
    harness.actor.send({type: 'drawer.toggle', drawer: 'settings'})
    expect(selectOpenDrawer(harness.snapshot())).toBe('settings')
    expect(selectOpenTabDrawer(harness.snapshot())).toBeNull()
    expect(selectPersistedState(harness.snapshot()).sidebar.drawer).toBe('settings')
    harness.actor.send({type: 'drawer.toggle', drawer: 'mutate'})
    expect(selectOpenTabDrawer(harness.snapshot())).toBe('mutate')
    harness.actor.send({type: 'drawer.toggle', drawer: 'mutate'})
    expect(selectOpenDrawer(harness.snapshot())).toBeNull()
    expect(selectPersistedState(harness.snapshot()).sidebar.drawer).toBeNull()

    harness.actor.send({type: 'dialog.open', dialog: 'shortcuts'})
    expect(selectOpenDialog(harness.snapshot())).toBe('shortcuts')
    harness.actor.send({type: 'dialog.close'})
    expect(selectOpenDialog(harness.snapshot())).toBeNull()
  })

  it('restores any drawer, the tab’s tools included', () => {
    const harness = createHarness({
      ...createInitialState(defaults),
      sidebar: {expanded: false, drawer: 'delta'},
    })
    expect(selectOpenTabDrawer(harness.snapshot())).toBe('delta')
  })

  it('remembers which added or loaded tabs fetch when shown, until they have or are closed', () => {
    const harness = createHarness()
    harness.actor.send({type: 'tab.add', tab: {id: 'generated', query: '*'}, fetch: 'generated'})
    harness.actor.send({type: 'tab.add', tab: {id: 'plain', query: '*'}})
    harness.actor.send({type: 'tab.add', tab: {id: 'closed', query: '*'}, fetch: 'generated'})
    expect(harness.snapshot().context.fetchOnOpen).toEqual({
      generated: 'generated',
      closed: 'generated',
    })

    harness.actor.send({type: 'tab.fetchedOnOpen', id: 'generated'})
    harness.actor.send({type: 'tab.close', id: 'closed'})
    expect(harness.snapshot().context.fetchOnOpen).toEqual({})

    // A generated query loaded into a tab that is already shown fetches the same way, and a
    // pasted URL does too, remembered as such since it runs as pasted
    harness.actor.send({type: 'tab.load', id: 'plain', tab: {query: '*[0]'}, fetch: 'generated'})
    expect(harness.snapshot().context.fetchOnOpen).toEqual({plain: 'generated'})
    harness.actor.send({type: 'tab.load', id: 'plain', tab: {query: '*[1]'}, fetch: 'paste'})
    expect(harness.snapshot().context.fetchOnOpen).toEqual({plain: 'paste'})
    harness.actor.send({type: 'tab.load', id: 'plain', tab: {query: '*[2]'}})
    expect(harness.snapshot().context.fetchOnOpen).toEqual({plain: 'paste'})
    // Never persisted: a reload does not fetch again
    expect(selectPersistedState(harness.snapshot())).not.toHaveProperty('fetchOnOpen')
  })

  it('restores and toggles the params and options panels independently', () => {
    const harness = createHarness({
      ...createInitialState(defaults),
      panels: {params: true, options: false, paramsView: 'json', resultViewer: 'tree'},
    })

    expect(isPanelExpanded(harness.snapshot(), 'params')).toBe(true)
    expect(isPanelExpanded(harness.snapshot(), 'options')).toBe(false)

    harness.actor.send({type: 'panel.toggle', panel: 'params'})
    expect(isPanelExpanded(harness.snapshot(), 'params')).toBe(false)
    expect(isPanelExpanded(harness.snapshot(), 'options')).toBe(false)

    harness.actor.send({type: 'panel.toggle', panel: 'options'})
    harness.actor.send({type: 'panel.toggle', panel: 'params'})
    expect(isPanelExpanded(harness.snapshot(), 'params')).toBe(true)
    expect(isPanelExpanded(harness.snapshot(), 'options')).toBe(true)
  })

  it('restores, switches and persists how the params are edited', () => {
    const harness = createHarness({
      ...createInitialState(defaults),
      panels: {params: true, options: true, paramsView: 'form', resultViewer: 'tree'},
    })
    expect(selectParamsView(harness.snapshot())).toBe('form')

    harness.actor.send({type: 'params.view', view: 'form'})
    expect(selectParamsView(harness.snapshot())).toBe('form')
    harness.actor.send({type: 'params.view', view: 'json'})
    expect(selectParamsView(harness.snapshot())).toBe('json')
    expect(selectPersistedState(harness.snapshot()).panels.paramsView).toBe('json')

    harness.actor.send({type: 'params.view', view: 'form'})
    expect(selectPersistedState(harness.snapshot()).panels.paramsView).toBe('form')
    harness.actor.send({type: 'storage.clear'})
    expect(selectParamsView(harness.snapshot())).toBe('json')
  })

  it('shows the result as JSON in a fresh session', () => {
    const harness = createHarness()
    expect(selectResultView(harness.snapshot())).toBe('json')
    expect(selectPersistedState(harness.snapshot()).panels.resultViewer).toBe('json')

    harness.actor.send({type: 'tab.add'})
    expect(selectResultView(harness.snapshot())).toBe('json')
  })

  it('restores, switches and persists how the result shows', () => {
    const harness = createHarness({
      ...createInitialState(defaults),
      panels: {params: true, options: true, paramsView: 'json', resultViewer: 'tree'},
    })
    expect(selectResultView(harness.snapshot())).toBe('tree')

    harness.actor.send({type: 'result.view', view: 'tree'})
    expect(selectResultView(harness.snapshot())).toBe('tree')
    expect(selectPersistedState(harness.snapshot()).panels.resultViewer).toBe('tree')
    harness.actor.send({type: 'result.view', view: 'json'})
    expect(selectPersistedState(harness.snapshot()).panels.resultViewer).toBe('json')
    harness.actor.send({type: 'result.view', view: 'graph'})
    expect(selectResultView(harness.snapshot())).toBe('graph')
    expect(selectPersistedState(harness.snapshot()).panels.resultViewer).toBe('graph')
    harness.actor.send({type: 'result.view', view: 'documents'})
    expect(selectResultView(harness.snapshot())).toBe('documents')
    expect(selectPersistedState(harness.snapshot()).panels.resultViewer).toBe('documents')
    // A new tab opens on the remembered view
    harness.actor.send({type: 'tab.add'})
    expect(selectResultView(harness.snapshot())).toBe('documents')

    harness.actor.send({type: 'storage.clear'})
    expect(selectResultView(harness.snapshot())).toBe('json')

    const restored = createHarness({
      ...createInitialState(defaults),
      panels: {params: true, options: true, paramsView: 'json', resultViewer: 'graph'},
    })
    expect(selectResultView(restored.snapshot())).toBe('graph')

    const restoredDocuments = createHarness({
      ...createInitialState(defaults),
      panels: {params: true, options: true, paramsView: 'json', resultViewer: 'documents'},
    })
    expect(selectResultView(restoredDocuments.snapshot())).toBe('documents')
  })

  it('updates, persists and resets the fields hidden from history diffs', () => {
    const harness = createHarness()
    expect(harness.snapshot().context.historyDiff).toEqual({
      hiddenFields: ['_rev', '_updatedAt', '_system.base.rev'],
    })

    harness.actor.send({type: 'historyDiff.update', settings: {hiddenFields: ['_rev']}})
    expect(selectPersistedState(harness.snapshot()).historyDiff).toEqual({hiddenFields: ['_rev']})

    harness.actor.send({type: 'storage.clear'})
    expect(harness.snapshot().context.historyDiff.hiddenFields).toEqual([
      '_rev',
      '_updatedAt',
      '_system.base.rev',
    ])
  })

  it('derives the persisted slice from context and UI states', () => {
    const harness = createHarness()
    harness.actor.send({type: 'sidebar.toggle'})
    harness.actor.send({type: 'drawer.toggle', drawer: 'closed-tabs'})
    harness.actor.send({type: 'panel.toggle', panel: 'options'})

    const persisted = selectPersistedState(harness.snapshot())
    expect(persisted).toEqual({
      version: 1,
      tabs: harness.tabs(),
      activeTabId: harness.snapshot().context.activeTabId,
      settings: harness.snapshot().context.settings,
      sidebar: {expanded: true, drawer: 'closed-tabs'},
      panels: {params: true, options: false, paramsView: 'json', resultViewer: 'json'},
      historyDiff: {hiddenFields: ['_rev', '_updatedAt', '_system.base.rev']},
      ai: {
        enabled: true,
        generateQuery: true,
        editQuery: true,
        fixLint: true,
        generateMutations: true,
        explainQuery: true,
      },
      editor: {autoFormatOnResize: true},
      response: {resolveSyncTags: true, sourceMapEnabled: false, resultSourceMap: true},
      exportSnippets: {
        order: ['client', 'curl', 'next-sanity', 'astro', 'sveltekit', 'nuxt'],
        hidden: [],
      },
      functions: [],
      closedTabs: [],
      openedSavedQueries: [],
    })
  })

  describe('closed tabs', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('lists a closed tab first unless it holds nothing, and restores it as it was after the open ones', () => {
      vi.useFakeTimers({now: new Date('2026-03-01T12:00:00Z')})
      const initial = createInitialState(defaults)
      const tabs = [
        createTab(initial.settings, {id: 'a', query: '*[_type == "a"]'}),
        createTab(initial.settings, {
          id: 'b',
          title: 'Shared b',
          query: '*[_type == "b"]',
          rawParams: '{"b": 1}',
          sharedId: 'shared-b',
        }),
        createTab(initial.settings, {id: 'blank'}),
        createTab(initial.settings, {id: 'c', query: '*[_type == "c"]'}),
      ]
      const harness = createHarness(withTabs(tabs, 'b'))

      harness.actor.send({type: 'tab.close', id: 'blank'})
      harness.actor.send({type: 'tab.close', id: 'b'})
      vi.setSystemTime(new Date('2026-03-01T12:05:00Z'))
      harness.actor.send({type: 'tab.close', id: 'a'})
      expect(selectClosedTabs(harness.snapshot())).toEqual([
        {tab: tabs[0], closedAt: '2026-03-01T12:05:00.000Z'},
        {tab: tabs[1], closedAt: '2026-03-01T12:00:00.000Z'},
      ])
      expect(selectPersistedState(harness.snapshot()).closedTabs).toBe(
        selectClosedTabs(harness.snapshot()),
      )

      harness.actor.send({type: 'closedTab.restore', id: 'b'})
      expect(harness.tabs()).toEqual([tabs[3], tabs[1]])
      expect(harness.snapshot().context.activeTabId).toBe('b')
      expect(harness.runnerIds()).toEqual(['b', 'c'])
      expect(closedIds(harness)).toEqual(['a'])

      // Restored, it is no longer listed, so restoring it again opens nothing
      harness.actor.send({type: 'closedTab.restore', id: 'b'})
      expect(harness.tabs().map((tab) => tab.id)).toEqual(['c', 'b'])
    })

    it('lists a tab and a query once, as most recently closed', () => {
      vi.useFakeTimers({now: new Date('2026-03-01T12:00:00Z')})
      const harness = createHarness()
      harness.actor.send({type: 'tab.add', tab: {id: 'posts', query: '*[_type == "post"]'}})
      harness.actor.send({type: 'tab.close', id: 'posts'})

      vi.setSystemTime(new Date('2026-03-02T12:00:00Z'))
      harness.actor.send({type: 'tab.add', tab: {id: 'again', query: '*[_type == "post"]'}})
      harness.actor.send({type: 'tab.close', id: 'again'})
      expect(closedIds(harness)).toEqual(['again'])

      harness.actor.send({type: 'closedTab.restore', id: 'again'})
      harness.actor.send({type: 'tab.rename', id: 'again', title: 'Posts'})
      harness.actor.send({type: 'tab.close', id: 'again'})
      expect(
        selectClosedTabs(harness.snapshot()).map(({tab, closedAt}) => [tab.title, closedAt]),
      ).toEqual([['Posts', '2026-03-02T12:00:00.000Z']])
    })

    it('deletes a closed tab for good', () => {
      const harness = createHarness()
      harness.actor.send({type: 'tab.add', tab: {id: 'posts', query: '*[_type == "post"]'}})
      harness.actor.send({type: 'tab.add', tab: {id: 'pages', query: '*[_type == "page"]'}})
      harness.actor.send({type: 'tab.close', id: 'posts'})
      harness.actor.send({type: 'tab.close', id: 'pages'})

      harness.actor.send({type: 'closedTab.delete', id: 'posts'})
      expect(closedIds(harness)).toEqual(['pages'])
      harness.actor.send({type: 'closedTab.restore', id: 'posts'})
      expect(harness.tabs().map((tab) => tab.id)).not.toContain('posts')
    })

    it('purges a closed tab 30 days after it was closed', () => {
      const closedAt = Date.parse('2026-03-01T12:00:00Z')
      vi.useFakeTimers({now: closedAt})
      const harness = createHarness()
      harness.actor.send({type: 'tab.add', tab: {id: 'old', query: '*[_type == "old"]'}})
      harness.actor.send({type: 'tab.close', id: 'old'})
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
      harness.actor.send({type: 'tab.add', tab: {id: 'recent', query: '*[_type == "recent"]'}})
      harness.actor.send({type: 'tab.close', id: 'recent'})

      vi.setSystemTime(closedAt + CLOSED_TAB_RETENTION_MS - 1)
      const before = selectClosedTabs(harness.snapshot())
      harness.actor.send({type: 'closedTabs.purge'})
      expect(selectClosedTabs(harness.snapshot())).toBe(before)
      expect(closedIds(harness)).toEqual(['recent', 'old'])

      vi.setSystemTime(closedAt + CLOSED_TAB_RETENTION_MS)
      harness.actor.send({type: 'closedTabs.purge'})
      expect(closedIds(harness)).toEqual(['recent'])

      // Closing a tab purges too
      vi.setSystemTime(new Date('2026-04-14T12:00:00Z'))
      harness.actor.send({type: 'tab.add', tab: {id: 'new', query: '*[_type == "new"]'}})
      harness.actor.send({type: 'tab.close', id: 'new'})
      expect(closedIds(harness)).toEqual(['new'])
    })

    it('restores a closed tab under a new id when an open tab took its id', () => {
      const harness = createHarness()
      harness.actor.send({type: 'tab.add', tab: {id: 'posts', query: '*[_type == "post"]'}})
      harness.actor.send({type: 'tab.close', id: 'posts'})
      harness.actor.send({type: 'tab.add', tab: {id: 'posts', query: '*'}})

      harness.actor.send({type: 'closedTab.restore', id: 'posts'})
      const tabs = harness.tabs()
      const restored = tabs[tabs.length - 1]
      expect(restored.id).not.toBe('posts')
      expect(restored.query).toBe('*[_type == "post"]')
      expect(harness.snapshot().context.activeTabId).toBe(restored.id)
      expect(harness.runnerIds()).toEqual(tabs.map((tab) => tab.id).sort())
    })

    it('renames and unlinks the open and closed tabs linked to a shared query', () => {
      const initial = createInitialState(defaults)
      const tabs = [
        createTab(initial.settings, {
          id: 'pages',
          title: 'Pages',
          query: '*[_type == "page"]',
          sharedId: 'shared-pages',
        }),
        createTab(initial.settings, {
          id: 'pages-titles',
          title: 'Pages',
          query: '*[_type == "page"]{title}',
          sharedId: 'shared-pages',
        }),
        createTab(initial.settings, {
          id: 'posts',
          title: 'Posts',
          query: '*[_type == "post"]',
          sharedId: 'shared-posts',
        }),
      ]
      const harness = createHarness(withTabs(tabs))
      harness.actor.send({type: 'tab.close', id: 'pages-titles'})

      harness.actor.send({
        type: 'sharedQuery.renamed',
        sharedId: 'shared-pages',
        title: 'All pages',
      })
      expect(harness.tabs().map((tab) => tab.title)).toEqual(['All pages', 'Posts'])
      expect(selectClosedTabs(harness.snapshot())[0].tab.title).toBe('All pages')

      harness.actor.send({type: 'sharedQuery.unshared', sharedId: 'shared-pages'})
      expect(harness.tabs().map((tab) => tab.sharedId)).toEqual([undefined, 'shared-posts'])
      expect(selectClosedTabs(harness.snapshot())[0].tab).toMatchObject({
        id: 'pages-titles',
        title: 'All pages',
        sharedId: undefined,
      })

      // With no tab linked to it any more, neither list changes
      const {tabs: openBefore, closedTabs: closedBefore} = harness.snapshot().context
      harness.actor.send({type: 'sharedQuery.unshared', sharedId: 'shared-pages'})
      expect(harness.tabs()).toBe(openBefore)
      expect(selectClosedTabs(harness.snapshot())).toBe(closedBefore)
    })

    it('restores the closed tabs, and clears them with the storage', () => {
      const initial = createInitialState(defaults)
      const closed = {
        tab: createTab(initial.settings, {id: 'posts', query: '*[_type == "post"]'}),
        closedAt: new Date().toISOString(),
      }
      const harness = createHarness({...initial, closedTabs: [closed]})
      expect(selectClosedTabs(harness.snapshot())).toEqual([closed])

      harness.actor.send({type: 'storage.clear'})
      expect(selectClosedTabs(harness.snapshot())).toEqual([])
    })
  })

  it('opens saved queries as tabs after the open ones, once each, without switching tabs', () => {
    const harness = createHarness()
    const [first] = harness.tabs()
    harness.actor.send({type: 'settings.update', settings: {perspective: 'drafts'}})

    harness.actor.send({
      type: 'savedQueries.open',
      queries: [
        {
          key: 'pages',
          tab: {title: 'Pages', query: '*[_type == "page"]', options: {perspective: 'raw'}},
        },
        // Already shown by a tab, or holding nothing a tab can show
        {key: 'shown', tab: null},
        {key: 'posts', tab: {query: '*[_type == "post"]'}},
      ],
    })

    const tabs = harness.tabs()
    expect(tabs.map((tab) => [tab.title, tab.query])).toEqual([
      [undefined, ''],
      ['Pages', '*[_type == "page"]'],
      [undefined, '*[_type == "post"]'],
    ])
    // What a saved query does not state comes from the settings, as for any new tab
    expect(tabs[1].options.perspective).toBe('raw')
    expect(tabs[2].options.perspective).toBe('drafts')
    expect(harness.snapshot().context.activeTabId).toBe(first.id)
    expect(harness.runnerIds()).toEqual(tabs.map((tab) => tab.id).sort())
    expect(selectPersistedState(harness.snapshot()).openedSavedQueries).toEqual([
      'pages',
      'shown',
      'posts',
    ])

    // A recorded key never opens again, also in a batch with new ones, and a key opens once
    harness.actor.send({
      type: 'savedQueries.open',
      queries: [
        {key: 'posts', tab: {query: '*[_type == "post"]'}},
        {key: 'authors', tab: {query: '*[_type == "author"]'}},
        {key: 'authors', tab: {query: '*[_type == "author"]'}},
      ],
    })
    expect(harness.tabs().map((tab) => tab.query)).toEqual([
      '',
      '*[_type == "page"]',
      '*[_type == "post"]',
      '*[_type == "author"]',
    ])
    expect(harness.snapshot().context.openedSavedQueries).toEqual([
      'pages',
      'shown',
      'posts',
      'authors',
    ])

    const {tabs: before} = harness.snapshot().context
    harness.actor.send({type: 'savedQueries.open', queries: [{key: 'pages', tab: {query: '*'}}]})
    expect(harness.snapshot().context.tabs).toBe(before)
  })

  it('restores the saved queries opened as tabs, and keeps them when storage is cleared', () => {
    const initial = createInitialState(defaults)
    const harness = createHarness({...initial, openedSavedQueries: ['pages']})
    harness.actor.send({type: 'savedQueries.open', queries: [{key: 'posts', tab: {query: '*'}}]})
    expect(harness.tabs()).toHaveLength(2)

    harness.actor.send({type: 'storage.clear'})
    expect(harness.tabs()).toHaveLength(1)
    expect(harness.snapshot().context.openedSavedQueries).toEqual(['pages', 'posts'])
  })

  it('reorders and hides export snippets, never all of them, and resets them when storage is cleared', () => {
    const harness = createHarness()
    harness.actor.send({
      type: 'exportSnippets.update',
      settings: {order: ['curl', 'astro', 'client', 'next-sanity', 'sveltekit', 'nuxt']},
    })
    harness.actor.send({
      type: 'exportSnippets.update',
      settings: {hidden: ['client', 'next-sanity', 'sveltekit', 'nuxt']},
    })
    expect(selectPersistedState(harness.snapshot()).exportSnippets).toEqual({
      order: ['curl', 'astro', 'client', 'next-sanity', 'sveltekit', 'nuxt'],
      hidden: ['client', 'next-sanity', 'sveltekit', 'nuxt'],
    })

    // Hiding the last two visible snippets is ignored
    harness.actor.send({
      type: 'exportSnippets.update',
      settings: {hidden: ['client', 'curl', 'astro', 'next-sanity', 'sveltekit', 'nuxt']},
    })
    expect(harness.snapshot().context.exportSnippets.hidden).toEqual([
      'client',
      'next-sanity',
      'sveltekit',
      'nuxt',
    ])

    harness.actor.send({type: 'storage.clear'})
    expect(harness.snapshot().context.exportSnippets).toEqual({
      order: ['client', 'curl', 'next-sanity', 'astro', 'sveltekit', 'nuxt'],
      hidden: [],
    })
  })

  it('asks for a source map only while the Content Source Map features are on', () => {
    const harness = createHarness()
    expect(selectSourceMapEnabled(harness.snapshot())).toBe(false)
    expect(selectSourceMapRequest(harness.snapshot())).toBeUndefined()

    harness.actor.send({type: 'response.update', settings: {sourceMapEnabled: true}})
    expect(selectSourceMapRequest(harness.snapshot())).toBe(true)
    harness.actor.send({
      type: 'response.update',
      settings: {resultSourceMap: 'withKeyArraySelector'},
    })
    expect(selectSourceMapRequest(harness.snapshot())).toBe('withKeyArraySelector')

    harness.actor.send({type: 'response.update', settings: {sourceMapEnabled: false}})
    expect(selectSourceMapEnabled(harness.snapshot())).toBe(false)
    expect(selectSourceMapRequest(harness.snapshot())).toBeUndefined()
  })

  it('updates the response settings, persists them, and restores the defaults when storage is cleared', () => {
    const harness = createHarness()
    expect(harness.snapshot().context.response.resolveSyncTags).toBe(true)
    harness.actor.send({type: 'response.update', settings: {resolveSyncTags: false}})
    harness.actor.send({
      type: 'response.update',
      settings: {sourceMapEnabled: true, resultSourceMap: 'withKeyArraySelector'},
    })
    expect(selectPersistedState(harness.snapshot()).response).toEqual({
      resolveSyncTags: false,
      sourceMapEnabled: true,
      resultSourceMap: 'withKeyArraySelector',
    })

    harness.actor.send({type: 'storage.clear'})
    expect(harness.snapshot().context.response).toEqual({
      resolveSyncTags: true,
      sourceMapEnabled: false,
      resultSourceMap: true,
    })
  })

  it('updates the editor settings, persists them, and turns them back on when storage is cleared', () => {
    const harness = createHarness()
    harness.actor.send({type: 'editor.update', settings: {autoFormatOnResize: false}})
    expect(selectPersistedState(harness.snapshot()).editor).toEqual({autoFormatOnResize: false})

    harness.actor.send({type: 'storage.clear'})
    expect(harness.snapshot().context.editor).toEqual({autoFormatOnResize: true})
  })

  it('updates the AI settings, persists them, and turns them all back on when storage is cleared', () => {
    const harness = createHarness()
    harness.actor.send({type: 'ai.update', settings: {generateMutations: false}})
    harness.actor.send({type: 'ai.update', settings: {enabled: false}})
    expect(selectPersistedState(harness.snapshot()).ai).toEqual({
      enabled: false,
      generateQuery: true,
      editQuery: true,
      fixLint: true,
      generateMutations: false,
      explainQuery: true,
    })

    harness.actor.send({type: 'storage.clear'})
    expect(harness.snapshot().context.ai).toEqual({
      enabled: true,
      generateQuery: true,
      editQuery: true,
      fixLint: true,
      generateMutations: true,
      explainQuery: true,
    })
  })

  it('saves functions to the library, newest first and one per id, and removes them', () => {
    const harness = createHarness()
    const author = {id: 'ex::author', declaration: 'fn ex::author($ref) = $ref->{name}'}
    const tags = {id: 'ex::tags', declaration: 'fn ex::tags($tags) = $tags[]->{title}'}

    harness.actor.send({type: 'functions.save', fn: author})
    harness.actor.send({type: 'functions.save', fn: tags})
    expect(selectFunctionLibrary(harness.snapshot())).toEqual([tags, author])

    const updated = {...author, declaration: 'fn ex::author($ref) = $ref->{name, bio}'}
    harness.actor.send({type: 'functions.save', fn: updated})
    expect(selectFunctionLibrary(harness.snapshot())).toEqual([updated, tags])
    expect(selectPersistedState(harness.snapshot()).functions).toEqual([updated, tags])

    harness.actor.send({type: 'functions.remove', id: 'ex::tags'})
    expect(selectFunctionLibrary(harness.snapshot())).toEqual([updated])

    harness.actor.send({type: 'storage.clear'})
    expect(selectFunctionLibrary(harness.snapshot())).toEqual([])
  })

  it('clears storage: fresh tab, default settings, closed UI, dropped localStorage', () => {
    const initial = createInitialState(defaults)
    saveVisionState('proj', initial)
    const harness = createHarness(initial)
    const [original] = harness.tabs()

    harness.actor.send({type: 'settings.update', settings: {perspective: 'drafts'}})
    harness.actor.send({type: 'tab.add', tab: {query: 'extra'}})
    harness.actor.send({type: 'sidebar.toggle'})
    harness.actor.send({type: 'panel.toggle', panel: 'params'})
    harness.actor.send({type: 'drawer.toggle', drawer: 'settings'})
    harness.actor.send({type: 'dialog.open', dialog: 'shortcuts'})

    harness.actor.send({type: 'storage.clear'})

    const tabs = harness.tabs()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).not.toBe(original.id)
    expect(tabs[0].query).toBe('')
    expect(harness.snapshot().context.settings.perspective).toBe('published')
    expect(harness.runnerIds()).toEqual([tabs[0].id])
    expect(harness.snapshot().matches({sidebar: 'collapsed'})).toBe(true)
    expect(isPanelExpanded(harness.snapshot(), 'params')).toBe(true)
    expect(selectOpenDrawer(harness.snapshot())).toBeNull()
    expect(selectOpenDialog(harness.snapshot())).toBeNull()
    expect(localStorage.getItem(getVisionStorageKey('proj'))).toBeNull()
  })
})
