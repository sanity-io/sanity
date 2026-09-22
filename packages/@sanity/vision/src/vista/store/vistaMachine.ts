import {
  type ActorRefFromLogic,
  assign,
  enqueueActions,
  setup,
  type SnapshotFrom,
  stopChild,
} from 'xstate'

import {queryRunnerMachine, type QueryRunnerRef} from './queryRunnerMachine'
import {
  type VistaDialog,
  type VistaDrawer,
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
  /** Sidebar state as restored from storage, consumed once by the `restoring` states */
  restoredSidebar: VistaSidebarState
}

export type VistaEvent =
  | {type: 'tab.add'; tab?: VistaTabInit}
  | {type: 'tab.close'; id: string}
  | {type: 'tab.select'; id: string}
  | {type: 'tab.rename'; id: string; title: string | undefined}
  | {type: 'tab.setQuery'; id: string; query: string}
  | {type: 'tab.setParams'; id: string; rawParams: string}
  | {type: 'tab.setAutoRefetch'; id: string; autoRefetch: boolean}
  | {type: 'tab.setOptions'; id: string; options: Partial<VistaTabOptions>}
  | {type: 'tab.load'; id: string; tab: Omit<VistaTabInit, 'id'>}
  | {type: 'settings.update'; settings: Partial<VistaSettings>}
  | {type: 'sidebar.toggle'}
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

function runnerId(tabId: string): string {
  return `runner:${tabId}`
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
    wasSidebarExpanded: ({context}) => context.restoredSidebar.expanded,
    wasDrawerOpen: ({context}, params: {drawer: VistaDrawer}) =>
      context.restoredSidebar.drawer === params.drawer,
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
        runners: {
          ...context.runners,
          [tab.id]: spawn('queryRunner', {id: runnerId(tab.id), input: {tabId: tab.id}}),
        },
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
          runners: {
            ...runners,
            [fallback.id]: spawn('queryRunner', {
              id: runnerId(fallback.id),
              input: {tabId: fallback.id},
            }),
          },
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
          runners: Object.fromEntries(
            fresh.tabs.map((tab) => [
              tab.id,
              spawn('queryRunner', {id: runnerId(tab.id), input: {tabId: tab.id}}),
            ]),
          ),
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
    runners: Object.fromEntries(
      input.persisted.tabs.map((tab) => [
        tab.id,
        spawn('queryRunner', {id: runnerId(tab.id), input: {tabId: tab.id}}),
      ]),
    ),
    restoredSidebar: input.persisted.sidebar,
  }),
  on: {
    'tab.add': {actions: 'addTab'},
    'tab.close': {actions: 'closeTab'},
    'tab.select': {
      guard: ({context, event}) => context.tabs.some((tab) => tab.id === event.id),
      actions: assign({activeTabId: ({event}) => event.id}),
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
      }),
    },
    'settings.update': {
      actions: assign({
        settings: ({context, event}) => ({...context.settings, ...event.settings}),
      }),
    },
    'storage.clear': {
      target: ['.sidebar.collapsed', '.drawer.closed', '.dialog.closed'],
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
  }
}

export function selectActiveTab(snapshot: VistaSnapshot): VistaTab {
  const {tabs, activeTabId} = snapshot.context
  return tabs.find((tab) => tab.id === activeTabId) || tabs[0]
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
