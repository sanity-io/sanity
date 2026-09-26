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
  type VistaPanel,
  type VistaPanelsState,
  type VistaPersistedState,
  type VistaSettings,
  type VistaSidebarState,
  type VistaTab,
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

export interface VistaContext {
  projectId: string
  defaults: VistaStorageDefaults
  tabs: VistaTab[]
  activeTabId: string
  settings: VistaSettings
  /** One query runner per open tab, keyed by tab id */
  runners: Record<string, QueryRunnerRef>
  /**
   * Bumped whenever a query is loaded into a tab from outside its editors (saved query, pasted
   * URL), so the mounted editors know to replace their content. Not persisted.
   */
  loadRevisions: Record<string, number>
  /** Sidebar state as restored from storage, consumed once by the `restoring` states */
  restoredSidebar: VistaSidebarState
  /** Panel state as restored from storage, consumed once by the `restoring` states */
  restoredPanels: VistaPanelsState
}

export type VistaEvent =
  | {type: 'tab.add'; tab?: VistaTabInit}
  | {type: 'tab.close'; id: string}
  | {type: 'tab.select'; id: string}
  /** The complete set of open tab ids in their new order */
  | {type: 'tab.reorder'; ids: string[]}
  | {type: 'tab.rename'; id: string; title: string | undefined}
  | {type: 'tab.setQuery'; id: string; query: string}
  | {type: 'tab.setParams'; id: string; rawParams: string}
  | {type: 'tab.setAutoRefetch'; id: string; autoRefetch: boolean}
  | {type: 'tab.setOptions'; id: string; options: Partial<VistaTabOptions>}
  | {type: 'tab.load'; id: string; tab: Omit<VistaTabInit, 'id'>}
  | {type: 'settings.update'; settings: Partial<VistaSettings>}
  | {type: 'sidebar.toggle'}
  | {type: 'panel.toggle'; panel: VistaPanel}
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
    wasDrawerOpen: ({context}, params: {drawer: VistaDrawer}) =>
      context.restoredSidebar.drawer === params.drawer,
    isPanel: ({event}, params: {panel: VistaPanel}) =>
      event.type === 'panel.toggle' && event.panel === params.panel,
    isDrawer: ({event}, params: {drawer: VistaDrawer}) =>
      event.type === 'drawer.toggle' && event.drawer === params.drawer,
    isDialog: ({event}, params: {dialog: VistaDialog}) =>
      event.type === 'dialog.open' && event.dialog === params.dialog,
  },
  actions: {
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
          runners: spawnRunners(spawn, fresh.tabs),
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
    runners: spawnRunners(spawn, input.persisted.tabs),
    loadRevisions: {},
    restoredSidebar: input.persisted.sidebar,
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
      }),
    },
    'settings.update': {
      actions: assign({
        settings: ({context, event}) => ({...context.settings, ...event.settings}),
      }),
    },
    'storage.clear': {
      target: [
        '.sidebar.collapsed',
        '.paramsPanel.expanded',
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
    drawer: {
      initial: 'restoring',
      states: {
        restoring: {
          always: [
            {guard: {type: 'wasDrawerOpen', params: {drawer: 'saved'}}, target: 'saved'},
            {guard: {type: 'wasDrawerOpen', params: {drawer: 'shared'}}, target: 'shared'},
            {target: 'closed'},
          ],
        },
        closed: {
          on: {
            'drawer.toggle': [
              {guard: {type: 'isDrawer', params: {drawer: 'saved'}}, target: 'saved'},
              {target: 'shared'},
            ],
          },
        },
        saved: {
          on: {
            'drawer.toggle': [
              {guard: {type: 'isDrawer', params: {drawer: 'saved'}}, target: 'closed'},
              {target: 'shared'},
            ],
            'drawer.close': {target: 'closed'},
          },
        },
        shared: {
          on: {
            'drawer.toggle': [
              {guard: {type: 'isDrawer', params: {drawer: 'shared'}}, target: 'closed'},
              {target: 'saved'},
            ],
            'drawer.close': {target: 'closed'},
          },
        },
      },
    },
    dialog: {
      initial: 'closed',
      states: {
        closed: {
          on: {
            'dialog.open': [
              {guard: {type: 'isDialog', params: {dialog: 'settings'}}, target: 'settings'},
              {target: 'shortcuts'},
            ],
          },
        },
        settings: {on: {'dialog.close': {target: 'closed'}}},
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
      drawer: snapshot.matches({drawer: 'saved'})
        ? 'saved'
        : snapshot.matches({drawer: 'shared'})
          ? 'shared'
          : null,
    },
    panels: {
      params: isPanelExpanded(snapshot, 'params'),
      options: isPanelExpanded(snapshot, 'options'),
    },
  }
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
  if (snapshot.matches({dialog: 'settings'})) return 'settings'
  if (snapshot.matches({dialog: 'shortcuts'})) return 'shortcuts'
  return null
}

export function selectOpenDrawer(snapshot: VistaSnapshot): VistaDrawer | null {
  if (snapshot.matches({drawer: 'saved'})) return 'saved'
  if (snapshot.matches({drawer: 'shared'})) return 'shared'
  return null
}
