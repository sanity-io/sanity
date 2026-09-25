import {beforeEach, describe, expect, it} from 'vitest'
import {createActor, createMachine} from 'xstate'

import {type VistaPersistedState, type VistaTab} from './types'
import {
  isPanelExpanded,
  selectActiveTab,
  selectOpenDialog,
  selectOpenDrawer,
  selectPersistedState,
  vistaMachine,
} from './vistaMachine'
import {createInitialState, createTab, getVistaStorageKey, saveVistaState} from './vistaStorage'

const defaults = {
  datasets: ['production', 'staging'],
  defaultDataset: 'production',
  defaultApiVersion: '2025-02-19',
}

// The runners are exercised in queryRunnerMachine.test.ts; here they only need to be spawnable
const runnerStub = createMachine({id: 'runnerStub'})

function createHarness(persisted: VistaPersistedState = createInitialState(defaults)) {
  const actor = createActor(vistaMachine.provide({actors: {queryRunner: runnerStub as never}}), {
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

function withTabs(tabs: VistaTab[], activeTabId = tabs[0].id): VistaPersistedState {
  const initial = createInitialState(defaults)
  return {...initial, tabs, activeTabId}
}

describe('vistaMachine', () => {
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
    harness.actor.send({type: 'tab.setOptions', id: tab.id, options: {dataset: 'staging'}})

    expect(harness.tabs()[0]).toMatchObject({
      query: '*[_type == "x"]',
      rawParams: '{"a": 1}',
      autoRefetch: true,
      options: {dataset: 'staging', perspective: 'raw'},
    })
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

    harness.actor.send({type: 'drawer.toggle', drawer: 'saved'})
    expect(selectOpenDrawer(harness.snapshot())).toBe('saved')
    harness.actor.send({type: 'drawer.toggle', drawer: 'saved'})
    expect(selectOpenDrawer(harness.snapshot())).toBeNull()
    harness.actor.send({type: 'drawer.toggle', drawer: 'shared'})
    harness.actor.send({type: 'drawer.close'})
    expect(selectOpenDrawer(harness.snapshot())).toBeNull()

    harness.actor.send({type: 'dialog.open', dialog: 'settings'})
    expect(selectOpenDialog(harness.snapshot())).toBe('settings')
    harness.actor.send({type: 'dialog.close'})
    harness.actor.send({type: 'dialog.open', dialog: 'shortcuts'})
    expect(selectOpenDialog(harness.snapshot())).toBe('shortcuts')
  })

  it('restores and toggles the params and options panels independently', () => {
    const harness = createHarness({
      ...createInitialState(defaults),
      panels: {params: true, options: false},
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

  it('derives the persisted slice from context and UI states', () => {
    const harness = createHarness()
    harness.actor.send({type: 'sidebar.toggle'})
    harness.actor.send({type: 'drawer.toggle', drawer: 'saved'})
    harness.actor.send({type: 'panel.toggle', panel: 'options'})

    const persisted = selectPersistedState(harness.snapshot())
    expect(persisted).toEqual({
      version: 1,
      tabs: harness.tabs(),
      activeTabId: harness.snapshot().context.activeTabId,
      settings: harness.snapshot().context.settings,
      sidebar: {expanded: true, drawer: 'saved'},
      panels: {params: true, options: false},
    })
  })

  it('clears storage: fresh tab, default settings, closed UI, dropped localStorage', () => {
    const initial = createInitialState(defaults)
    saveVistaState('proj', initial)
    const harness = createHarness(initial)
    const [original] = harness.tabs()

    harness.actor.send({type: 'settings.update', settings: {perspective: 'drafts'}})
    harness.actor.send({type: 'tab.add', tab: {query: 'extra'}})
    harness.actor.send({type: 'sidebar.toggle'})
    harness.actor.send({type: 'panel.toggle', panel: 'params'})
    harness.actor.send({type: 'dialog.open', dialog: 'settings'})

    harness.actor.send({type: 'storage.clear'})

    const tabs = harness.tabs()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).not.toBe(original.id)
    expect(tabs[0].query).toBe('')
    expect(harness.snapshot().context.settings.perspective).toBe('raw')
    expect(harness.runnerIds()).toEqual([tabs[0].id])
    expect(harness.snapshot().matches({sidebar: 'collapsed'})).toBe(true)
    expect(isPanelExpanded(harness.snapshot(), 'params')).toBe(true)
    expect(selectOpenDialog(harness.snapshot())).toBeNull()
    expect(localStorage.getItem(getVistaStorageKey('proj'))).toBeNull()
  })
})
