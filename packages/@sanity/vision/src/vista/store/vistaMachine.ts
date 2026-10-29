import {
  type ActorRefFromLogic,
  assign,
  enqueueActions,
  setup,
  type SnapshotFrom,
  type Spawner,
} from 'xstate'

import {queryRunnerMachine, type QueryRunnerRef} from './queryRunnerMachine'
import {
  type VistaDialog,
  type VistaDrawer,
  type VistaHistoryDiffSettings,
  type VistaPanel,
  type VistaPanelsState,
  type VistaParamsView,
  type VistaPersistedState,
  type VistaResultView,
  type VistaSavedFunction,
  type VistaSettings,
  type VistaSidebarState,
  type VistaTab,
  type VistaTabDrawer,
  type VistaTabInit,
  type VistaTabOptions,
} from './types'
import {
  clearVistaState,
  createInitialState,
  createTab,
  resolveWorkspaceDataset,
  type VistaStorageDefaults,
} from './vistaStorage'

/** Where the query a tab fetches as soon as it is shown came from */
export type FetchOnOpenSource = 'generated' | 'paste' | 'link'

export interface VistaContext {
  projectId: string
  defaults: VistaStorageDefaults
  tabs: VistaTab[]
  activeTabId: string
  settings: VistaSettings
  historyDiff: VistaHistoryDiffSettings
  /** The functions library, most recently saved first */
  functions: VistaSavedFunction[]
  /** One query runner per open tab, keyed by tab id */
  runners: Record<string, QueryRunnerRef>
  /**
   * Bumped whenever a query is loaded into a tab from outside its editors (saved query, pasted
   * URL), so the mounted editors know to replace their content. Not persisted.
   */
  loadRevisions: Record<string, number>
  /**
   * Tabs to fetch as soon as they are shown, or right away when they already are, by tab id: a
   * generated query added in a tab or loaded into one, a query URL pasted into one, or one a
   * link to the tool opened a tab for. The source decides how the tab runs the query. Not
   * persisted.
   */
  fetchOnOpen: Record<string, FetchOnOpenSource>
  /** Sidebar state as restored from storage, consumed once by the `restoring` states */
  restoredSidebar: VistaSidebarState
  /** The drawer the `open` drawer state shows: the one last opened */
  drawer: VistaDrawer
  /** Panel state as restored from storage, consumed once by the `restoring` states */
  restoredPanels: VistaPanelsState
}

export type VistaEvent =
  /** `fetch` has the tab fetch its query once it is shown, as a query from that source */
  | {type: 'tab.add'; tab?: VistaTabInit; fetch?: FetchOnOpenSource}
  /** The tab fetched on being shown, as `tab.add` or `tab.load` asked */
  | {type: 'tab.fetchedOnOpen'; id: string}
  | {type: 'tab.close'; id: string}
  | {type: 'tab.select'; id: string}
  /** The complete set of open tab ids in their new order */
  | {type: 'tab.reorder'; ids: string[]}
  | {type: 'tab.rename'; id: string; title: string | undefined}
  | {type: 'tab.setQuery'; id: string; query: string}
  | {type: 'tab.setParams'; id: string; rawParams: string}
  | {type: 'tab.setAutoRefetch'; id: string; autoRefetch: boolean}
  | {type: 'tab.setOptions'; id: string; options: Partial<VistaTabOptions>}
  /**
   * `fetch` has the tab fetch the loaded query (it is the active tab, so right away), as a query
   * from that source
   */
  | {type: 'tab.load'; id: string; tab: Omit<VistaTabInit, 'id'>; fetch?: FetchOnOpenSource}
  | {type: 'settings.update'; settings: Partial<VistaSettings>}
  | {type: 'historyDiff.update'; settings: Partial<VistaHistoryDiffSettings>}
  /** Saves a function to the library, replacing the one with its id */
  | {type: 'functions.save'; fn: VistaSavedFunction}
  | {type: 'functions.remove'; id: string}
  | {type: 'sidebar.toggle'}
  | {type: 'panel.toggle'; panel: VistaPanel}
  | {type: 'params.view'; view: VistaParamsView}
  | {type: 'result.view'; view: VistaResultView}
  | {type: 'drawer.toggle'; drawer: VistaDrawer}
  | {type: 'drawer.close'}
  | {type: 'dialog.open'; dialog: VistaDialog}
  | {type: 'dialog.close'}
  | {type: 'storage.clear'}

export interface VistaInput {
  projectId: string
  persisted: VistaPersistedState
  defaults: VistaStorageDefaults
}

type RunnerSpawner = Spawner<{
  src: 'queryRunner'
  logic: typeof queryRunnerMachine
  id: string | undefined
}>

function spawnRunner(spawn: RunnerSpawner, tabId: string): QueryRunnerRef {
  return spawn('queryRunner', {id: `runner:${tabId}`, input: {tabId}})
}

function spawnRunners(spawn: RunnerSpawner, tabs: VistaTab[]): Record<string, QueryRunnerRef> {
  return Object.fromEntries(tabs.map((tab) => [tab.id, spawnRunner(spawn, tab.id)]))
}

function updateTab(tabs: VistaTab[], id: string, update: (tab: VistaTab) => VistaTab): VistaTab[] {
  const index = tabs.findIndex((tab) => tab.id === id)
  if (index === -1) {
    return tabs
  }
  const updated = update(tabs[index])
  if (updated === tabs[index]) {
    return tabs
  }
  const next = tabs.slice()
  next[index] = updated
  return next
}

/**
 * The root Vista actor for one project: the open tabs and their settings (persisted), one
 * spawned {@link queryRunnerMachine} per tab (runtime), and the sidebar, drawer and dialog UI
 * states. The `restoring` states pick up the persisted sidebar layout on start.
 */
export const vistaMachine = setup({
  types: {} as {
    context: VistaContext
    events: VistaEvent
    input: VistaInput
  },
  actors: {
    queryRunner: queryRunnerMachine,
  },
  guards: {
    // Every open tab exactly once, so a stale drag result cannot drop or duplicate tabs
    isCompleteOrder: ({context, event}) => {
      if (event.type !== 'tab.reorder') return false
      const ids = new Set(event.ids)
      return (
        ids.size === event.ids.length &&
        ids.size === context.tabs.length &&
        context.tabs.every((tab) => ids.has(tab.id))
      )
    },
    wasSidebarExpanded: ({context}) => context.restoredSidebar.expanded,
    wasPanelExpanded: ({context}, params: {panel: VistaPanel}) =>
      context.restoredPanels[params.panel],
    wasParamsForm: ({context}) => context.restoredPanels.paramsView === 'form',
    wasResultView: ({context}, params: {view: VistaResultView}) =>
      context.restoredPanels.resultView === params.view,
    isResultView: ({event}, params: {view: VistaResultView}) =>
      event.type === 'result.view' && event.view === params.view,
    isParamsView: ({event}, params: {view: VistaParamsView}) =>
      event.type === 'params.view' && event.view === params.view,
    wasDrawerOpen: ({context}) => context.restoredSidebar.drawer !== null,
    isPanel: ({event}, params: {panel: VistaPanel}) =>
      event.type === 'panel.toggle' && event.panel === params.panel,
    isOpenDrawer: ({context, event}) =>
      event.type === 'drawer.toggle' && event.drawer === context.drawer,
  },
  actions: {
    setDrawer: assign(({event}) => (event.type === 'drawer.toggle' ? {drawer: event.drawer} : {})),
    addTab: assign(({context, event, spawn}) => {
      if (event.type !== 'tab.add') {
        return {}
      }
      const tab = createTab(context.settings, event.tab)
      if (context.tabs.some((existing) => existing.id === tab.id)) {
        return {activeTabId: tab.id}
      }
      return {
        tabs: [...context.tabs, tab],
        activeTabId: tab.id,
        runners: {...context.runners, [tab.id]: spawnRunner(spawn, tab.id)},
        fetchOnOpen: event.fetch
          ? {...context.fetchOnOpen, [tab.id]: event.fetch}
          : context.fetchOnOpen,
      }
    }),
    closeTab: enqueueActions(({context, event, enqueue}) => {
      if (event.type !== 'tab.close') {
        return
      }
      const index = context.tabs.findIndex((tab) => tab.id === event.id)
      if (index === -1) {
        return
      }
      const runner = context.runners[event.id]
      if (runner) {
        enqueue.stopChild(runner)
      }
      const {[event.id]: _removed, ...runners} = context.runners
      const remaining = context.tabs.filter((tab) => tab.id !== event.id)
      if (event.id in context.fetchOnOpen) {
        const {[event.id]: _pending, ...fetchOnOpen} = context.fetchOnOpen
        enqueue.assign({fetchOnOpen})
      }

      if (remaining.length === 0) {
        const fallback = createTab(context.settings)
        enqueue.assign(({spawn}) => ({
          tabs: [fallback],
          activeTabId: fallback.id,
          runners: {...runners, [fallback.id]: spawnRunner(spawn, fallback.id)},
        }))
        return
      }

      // Prefer the tab that took the closed tab's place, otherwise the previous one
      const activeTabId =
        context.activeTabId === event.id
          ? remaining[Math.min(index, remaining.length - 1)].id
          : context.activeTabId
      enqueue.assign({tabs: remaining, activeTabId, runners})
    }),
    clearStorage: enqueueActions(({context, enqueue}) => {
      for (const runner of Object.values(context.runners)) {
        enqueue.stopChild(runner)
      }
      enqueue(() => clearVistaState(context.projectId))
      enqueue.assign(({spawn}) => {
        const fresh = createInitialState(context.defaults)
        return {
          tabs: fresh.tabs,
          activeTabId: fresh.activeTabId,
          settings: fresh.settings,
          historyDiff: fresh.historyDiff,
          functions: fresh.functions,
          runners: spawnRunners(spawn, fresh.tabs),
          fetchOnOpen: {},
        }
      })
    }),
  },
}).createMachine({
  id: 'vista',
  type: 'parallel',
  context: ({input, spawn}) => ({
    projectId: input.projectId,
    defaults: input.defaults,
    tabs: input.persisted.tabs,
    activeTabId: input.persisted.activeTabId,
    settings: input.persisted.settings,
    historyDiff: input.persisted.historyDiff,
    functions: input.persisted.functions,
    runners: spawnRunners(spawn, input.persisted.tabs),
    loadRevisions: {},
    fetchOnOpen: {},
    restoredSidebar: input.persisted.sidebar,
    drawer: input.persisted.sidebar.drawer ?? 'saved',
    restoredPanels: input.persisted.panels,
  }),
  on: {
    'tab.add': {actions: 'addTab'},
    'tab.close': {actions: 'closeTab'},
    'tab.select': {
      guard: ({context, event}) => context.tabs.some((tab) => tab.id === event.id),
      actions: assign({activeTabId: ({event}) => event.id}),
    },
    'tab.reorder': {
      guard: 'isCompleteOrder',
      actions: assign({
        tabs: ({context, event}) => {
          const byId = new Map(context.tabs.map((tab) => [tab.id, tab]))
          return event.ids.flatMap((id) => byId.get(id) ?? [])
        },
      }),
    },
    'tab.fetchedOnOpen': {
      actions: assign({
        fetchOnOpen: ({context, event}) => {
          const {[event.id]: _fetched, ...fetchOnOpen} = context.fetchOnOpen
          return fetchOnOpen
        },
      }),
    },
    'tab.rename': {
      actions: assign({
        tabs: ({context, event}) =>
          updateTab(context.tabs, event.id, (tab) => ({
            ...tab,
            title: event.title?.trim() || undefined,
          })),
      }),
    },
    'tab.setQuery': {
      actions: assign({
        tabs: ({context, event}) =>
          updateTab(context.tabs, event.id, (tab) =>
            tab.query === event.query ? tab : {...tab, query: event.query},
          ),
      }),
    },
    'tab.setParams': {
      actions: assign({
        tabs: ({context, event}) =>
          updateTab(context.tabs, event.id, (tab) =>
            tab.rawParams === event.rawParams ? tab : {...tab, rawParams: event.rawParams},
          ),
      }),
    },
    'tab.setAutoRefetch': {
      actions: assign({
        tabs: ({context, event}) =>
          updateTab(context.tabs, event.id, (tab) => ({...tab, autoRefetch: event.autoRefetch})),
      }),
    },
    'tab.setOptions': {
      actions: assign({
        tabs: ({context, event}) =>
          updateTab(context.tabs, event.id, (tab) => ({
            ...tab,
            options: {...tab.options, ...event.options},
          })),
      }),
    },
    'tab.load': {
      actions: assign({
        tabs: ({context, event}) =>
          updateTab(context.tabs, event.id, (tab) => ({
            ...tab,
            ...event.tab,
            options: {...tab.options, ...event.tab.options},
          })),
        loadRevisions: ({context, event}) => ({
          ...context.loadRevisions,
          [event.id]: (context.loadRevisions[event.id] || 0) + 1,
        }),
        fetchOnOpen: ({context, event}) =>
          event.fetch ? {...context.fetchOnOpen, [event.id]: event.fetch} : context.fetchOnOpen,
      }),
    },
    'settings.update': {
      actions: assign({
        settings: ({context, event}) => ({...context.settings, ...event.settings}),
      }),
    },
    'historyDiff.update': {
      actions: assign({
        historyDiff: ({context, event}) => ({...context.historyDiff, ...event.settings}),
      }),
    },
    'functions.save': {
      actions: assign({
        functions: ({context, event}) => [
          event.fn,
          ...context.functions.filter((saved) => saved.id !== event.fn.id),
        ],
      }),
    },
    'functions.remove': {
      actions: assign({
        functions: ({context, event}) => context.functions.filter((saved) => saved.id !== event.id),
      }),
    },
    'storage.clear': {
      target: [
        '.sidebar.collapsed',
        '.paramsPanel.expanded',
        '.paramsView.json',
        '.resultView.tree',
        '.optionsPanel.expanded',
        '.drawer.closed',
        '.dialog.closed',
      ],
      actions: 'clearStorage',
    },
  },
  states: {
    sidebar: {
      initial: 'restoring',
      states: {
        restoring: {
          always: [{guard: 'wasSidebarExpanded', target: 'expanded'}, {target: 'collapsed'}],
        },
        collapsed: {on: {'sidebar.toggle': {target: 'expanded'}}},
        expanded: {on: {'sidebar.toggle': {target: 'collapsed'}}},
      },
    },
    paramsPanel: {
      initial: 'restoring',
      states: {
        restoring: {
          always: [
            {guard: {type: 'wasPanelExpanded', params: {panel: 'params'}}, target: 'expanded'},
            {target: 'collapsed'},
          ],
        },
        collapsed: {
          on: {
            'panel.toggle': {
              guard: {type: 'isPanel', params: {panel: 'params'}},
              target: 'expanded',
            },
          },
        },
        expanded: {
          on: {
            'panel.toggle': {
              guard: {type: 'isPanel', params: {panel: 'params'}},
              target: 'collapsed',
            },
          },
        },
      },
    },
    paramsView: {
      initial: 'restoring',
      states: {
        restoring: {
          always: [{guard: 'wasParamsForm', target: 'form'}, {target: 'json'}],
        },
        json: {
          on: {
            'params.view': {guard: {type: 'isParamsView', params: {view: 'form'}}, target: 'form'},
          },
        },
        form: {
          on: {
            'params.view': {guard: {type: 'isParamsView', params: {view: 'json'}}, target: 'json'},
          },
        },
      },
    },
    resultView: {
      initial: 'restoring',
      on: {
        'result.view': [
          {guard: {type: 'isResultView', params: {view: 'tree'}}, target: '.tree'},
          {guard: {type: 'isResultView', params: {view: 'json'}}, target: '.json'},
          {guard: {type: 'isResultView', params: {view: 'graph'}}, target: '.graph'},
        ],
      },
      states: {
        restoring: {
          always: [
            {guard: {type: 'wasResultView', params: {view: 'json'}}, target: 'json'},
            {guard: {type: 'wasResultView', params: {view: 'graph'}}, target: 'graph'},
            {target: 'tree'},
          ],
        },
        tree: {},
        json: {},
        graph: {},
      },
    },
    optionsPanel: {
      initial: 'restoring',
      states: {
        restoring: {
          always: [
            {guard: {type: 'wasPanelExpanded', params: {panel: 'options'}}, target: 'expanded'},
            {target: 'collapsed'},
          ],
        },
        collapsed: {
          on: {
            'panel.toggle': {
              guard: {type: 'isPanel', params: {panel: 'options'}},
              target: 'expanded',
            },
          },
        },
        expanded: {
          on: {
            'panel.toggle': {
              guard: {type: 'isPanel', params: {panel: 'options'}},
              target: 'collapsed',
            },
          },
        },
      },
    },
    // One drawer at a time: toggling the open one closes it, toggling another shows that one
    drawer: {
      initial: 'restoring',
      states: {
        restoring: {
          always: [{guard: 'wasDrawerOpen', target: 'open'}, {target: 'closed'}],
        },
        closed: {
          on: {'drawer.toggle': {target: 'open', actions: 'setDrawer'}},
        },
        open: {
          on: {
            'drawer.toggle': [{guard: 'isOpenDrawer', target: 'closed'}, {actions: 'setDrawer'}],
            'drawer.close': {target: 'closed'},
          },
        },
      },
    },
    dialog: {
      initial: 'closed',
      states: {
        closed: {on: {'dialog.open': {target: 'shortcuts'}}},
        shortcuts: {on: {'dialog.close': {target: 'closed'}}},
      },
    },
  },
})

export type VistaSnapshot = SnapshotFrom<typeof vistaMachine>
export type VistaActorRef = ActorRefFromLogic<typeof vistaMachine>

export function selectPersistedState(snapshot: VistaSnapshot): VistaPersistedState {
  return {
    version: 1,
    tabs: snapshot.context.tabs,
    activeTabId: snapshot.context.activeTabId,
    settings: snapshot.context.settings,
    sidebar: {
      expanded: snapshot.matches({sidebar: 'expanded'}),
      drawer: selectOpenDrawer(snapshot),
    },
    panels: {
      params: isPanelExpanded(snapshot, 'params'),
      options: isPanelExpanded(snapshot, 'options'),
      paramsView: selectParamsView(snapshot),
      resultView: selectResultView(snapshot),
    },
    historyDiff: snapshot.context.historyDiff,
    functions: snapshot.context.functions,
  }
}

export function selectFunctionLibrary(snapshot: VistaSnapshot): VistaSavedFunction[] {
  return snapshot.context.functions
}

export function selectParamsView(snapshot: VistaSnapshot): VistaParamsView {
  return snapshot.matches({paramsView: 'form'}) ? 'form' : 'json'
}

export function selectResultView(snapshot: VistaSnapshot): VistaResultView {
  if (snapshot.matches({resultView: 'json'})) return 'json'
  return snapshot.matches({resultView: 'graph'}) ? 'graph' : 'tree'
}

export function isPanelExpanded(snapshot: VistaSnapshot, panel: VistaPanel): boolean {
  return panel === 'params'
    ? snapshot.matches({paramsPanel: 'expanded'})
    : snapshot.matches({optionsPanel: 'expanded'})
}

export function selectActiveTab(snapshot: VistaSnapshot): VistaTab {
  const {tabs, activeTabId} = snapshot.context
  return tabs.find((tab) => tab.id === activeTabId) || tabs[0]
}

export function selectDatasets(snapshot: VistaSnapshot): string[] {
  return snapshot.context.defaults.datasets
}

/** The dataset tabs query while they follow the workspace */
export function selectWorkspaceDataset(snapshot: VistaSnapshot): string {
  return resolveWorkspaceDataset(snapshot.context.defaults)
}

export function selectProjectId(snapshot: VistaSnapshot): string {
  return snapshot.context.projectId
}

export function selectOpenDialog(snapshot: VistaSnapshot): VistaDialog | null {
  return snapshot.matches({dialog: 'shortcuts'}) ? 'shortcuts' : null
}

export function selectOpenDrawer(snapshot: VistaSnapshot): VistaDrawer | null {
  return snapshot.matches({drawer: 'open'}) ? snapshot.context.drawer : null
}

const TAB_DRAWERS: readonly VistaTabDrawer[] = ['lint', 'functions', 'delta', 'mutate']

/** The open drawer while it shows one of the active tab's tools */
export function selectOpenTabDrawer(snapshot: VistaSnapshot): VistaTabDrawer | null {
  const drawer = selectOpenDrawer(snapshot)
  return TAB_DRAWERS.find((tabDrawer) => tabDrawer === drawer) ?? null
}
