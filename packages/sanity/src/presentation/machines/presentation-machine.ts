import {type StatusEvent} from '@sanity/comlink'
import {type ActorRefFrom, assign, setup} from 'xstate'

import {
  MAX_TIME_TO_IFRAME_LOAD,
  MAX_TIME_TO_OVERLAYS_CONNECTION,
  TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS,
} from '../constants'
import {type ConnectionStatus} from '../types'
import {aggregateConnectionStatus, type ChannelStatusMap, reduceStatusMap} from '../useStatus'

interface Context {
  visualEditingOverlaysEnabled: boolean
  /**
   * Per-connection statuses for the visual editing comlink channel
   */
  overlaysStatusMap: ChannelStatusMap
  /**
   * The aggregated connection status of the visual editing comlink channel
   */
  overlaysConnection: ConnectionStatus
  /**
   * Whether the user dismissed an overlays connection failure with "Continue anyway".
   * Unlike a load timeout dismissal (which is modelled as a state and lives only for the duration
   * of the failed load), this survives iframe reloads and is only cleared once the overlays connect.
   */
  overlaysDismissed: boolean
}

type Event =
  | {type: 'toggle visual editing overlays'; enabled: boolean}
  | {type: 'iframe loaded'}
  | {type: 'iframe refresh'}
  | {type: 'iframe reload'}
  | {type: 'overlays status'; statusEvent: StatusEvent}
  | {type: 'continue anyway'}

export const presentationMachine = setup({
  types: {} as {
    context: Context
    events: Event
    tags:
      | 'busy'
      | 'show loading overlay'
      | 'show overlays connection status'
      | 'overlays connection timed out'
      | 'show error card'
      | 'prevent iframe interaction'
  },
  actions: {
    'assign overlays status': assign(({context}, params: {statusEvent: StatusEvent}) => {
      const overlaysStatusMap = reduceStatusMap(context.overlaysStatusMap, params.statusEvent)
      const overlaysConnection = aggregateConnectionStatus(overlaysStatusMap)
      return {
        overlaysStatusMap,
        overlaysConnection,
        // A successful connection resolves whatever failure the user previously dismissed
        overlaysDismissed: overlaysConnection === 'connected' ? false : context.overlaysDismissed,
      }
    }),
    'assign overlays dismissed': assign({overlaysDismissed: true}),
    'notify iframe load timeout': () => {
      console.error(
        `The preview iframe hasn't finished loading after ${MAX_TIME_TO_IFRAME_LOAD}ms. If the preview keeps reloading itself, note that Next.js dev servers older than 16.3.0 enter an infinite reload loop in Firefox when embedded cross-origin (https://github.com/vercel/next.js/pull/94128) — upgrade Next.js, or add \`experimental: {reactDebugChannel: false}\` to your Next.js config as a workaround.`,
      )
    },
    'notify overlays connection timeout': () => {
      console.error(
        `Unable to connect to visual editing. Make sure you've setup '@sanity/visual-editing' correctly`,
      )
    },
  },
  guards: {
    'overlays connected': ({context}) => context.overlaysConnection === 'connected',
    'overlays connecting': ({context}) => context.overlaysConnection === 'connecting',
    'overlays reconnecting': ({context}) => context.overlaysConnection === 'reconnecting',
    'overlays dismissed': ({context}) => context.overlaysDismissed,
  },
  delays: {
    /**
     * How long we wait for the iframe `load` event before surfacing the connection error UI.
     * Generous because dev servers can spend a long time compiling the preview on first load.
     */
    'iframe load timeout': MAX_TIME_TO_IFRAME_LOAD,
    /**
     * How long an overlays connection attempt may be pending before we surface the connection
     * status overlay on top of the preview
     */
    'overlays connection status delay': TIME_TO_SHOW_OVERLAYS_CONNECTION_STATUS,
    /**
     * How long we allow the overlays connection to stay pending, after surfacing the connection
     * status overlay, before we consider it failed
     */
    'overlays connection timeout': MAX_TIME_TO_OVERLAYS_CONNECTION,
  },
}).createMachine({
  id: 'Presentation Tool',
  context: () => ({
    visualEditingOverlaysEnabled: false,
    overlaysStatusMap: new Map(),
    overlaysConnection: 'idle',
    overlaysDismissed: false,
  }),

  on: {
    'iframe reload': {
      target: '.loading',
    },
    'overlays status': {
      actions: {
        type: 'assign overlays status',
        params: ({event}) => ({statusEvent: event.statusEvent}),
      },
    },
  },

  states: {
    loading: {
      description: 'Waiting for the iframe to fire its load event',
      tags: ['busy'],
      on: {
        'iframe loaded': {
          target: 'loaded',
        },
      },
      initial: 'waiting',
      states: {
        waiting: {
          tags: ['show loading overlay', 'prevent iframe interaction'],
          after: {
            'iframe load timeout': {
              target: 'timedOut',
            },
          },
        },
        timedOut: {
          description:
            'The iframe never fired its `load` event within the deadline — for example when the preview is stuck in a reload loop, like Next.js dev servers before 16.3.0 get in Firefox when embedded cross-origin (vercel/next.js#94128). Surface the connection error UI instead of spinning indefinitely.',
          tags: ['show error card', 'prevent iframe interaction'],
          entry: 'notify iframe load timeout',
          on: {
            'continue anyway': {
              target: 'dismissed',
            },
          },
        },
        dismissed: {
          description:
            'The user chose to continue despite the load timeout. Suppress the loading and error UI until this load settles — the dismissal is over once the iframe loads.',
        },
      },
    },

    loaded: {
      initial: 'idle',
      on: {
        'toggle visual editing overlays': {
          actions: assign({
            visualEditingOverlaysEnabled: ({event}) => event.enabled,
          }),
        },
        'iframe refresh': {
          target: '.refreshing',
        },
        'iframe reload': {
          target: '.reloading',
        },
      },

      states: {
        idle: {
          description:
            'The iframe is loaded, watch the visual editing overlays connection and escalate to the connection status overlay, and eventually the error card, if it stays pending for too long',
          on: {
            'overlays status': {
              actions: {
                type: 'assign overlays status',
                params: ({event}) => ({statusEvent: event.statusEvent}),
              },
              // Re-evaluate on every status change, restarting the escalation timers
              target: '.checking',
            },
          },
          initial: 'checking',
          states: {
            checking: {
              always: [
                {guard: 'overlays connected', target: 'ok'},
                {guard: 'overlays dismissed', target: 'dismissed'},
                {guard: 'overlays connecting', target: 'connecting'},
                {guard: 'overlays reconnecting', target: 'reconnecting'},
                {target: 'ok'},
              ],
            },
            ok: {},
            dismissed: {
              id: 'overlays dismissed',
              description:
                'The user chose to continue despite an overlays connection failure. Suppress connection UI — also across reloads — until the overlays connect.',
            },
            connecting: {
              description: 'The overlays have never connected on the current preview',
              tags: ['prevent iframe interaction'],
              initial: 'pending',
              states: {
                pending: {
                  tags: ['show loading overlay'],
                  after: {
                    'overlays connection status delay': {
                      target: 'slow',
                    },
                  },
                },
                slow: {
                  tags: ['show overlays connection status'],
                  after: {
                    'overlays connection timeout': {
                      target: 'timedOut',
                    },
                  },
                },
                timedOut: {
                  tags: ['show overlays connection status', 'overlays connection timed out'],
                  entry: 'notify overlays connection timeout',
                  on: {
                    'continue anyway': {
                      actions: 'assign overlays dismissed',
                      target: '#overlays dismissed',
                    },
                  },
                },
              },
            },
            reconnecting: {
              description: 'The overlays were connected before, but the connection was lost',
              initial: 'pending',
              states: {
                pending: {
                  after: {
                    'overlays connection status delay': {
                      target: 'slow',
                    },
                  },
                },
                slow: {
                  tags: ['show overlays connection status'],
                  after: {
                    'overlays connection timeout': {
                      target: 'failed',
                    },
                  },
                },
                failed: {
                  tags: ['show error card'],
                  on: {
                    'continue anyway': {
                      actions: 'assign overlays dismissed',
                      target: '#overlays dismissed',
                    },
                  },
                },
              },
            },
          },
        },
        refreshing: {
          description:
            'Waiting for an already loaded preview to ack a refresh request — a slow refresh is not a failed load, so no load timeout is armed',
          on: {
            'iframe loaded': {
              target: 'idle',
            },
          },
          tags: ['busy'],
        },
        reloading: {
          description: 'The iframe is reloading, wait for its load event like the initial load',
          tags: ['busy'],
          on: {
            'iframe loaded': {
              target: 'idle',
            },
          },
          initial: 'checking',
          states: {
            checking: {
              always: [
                // An overlays failure dismissal also suppresses the loading UI of subsequent
                // reloads, until the overlays connect
                {guard: 'overlays dismissed', target: 'dismissed'},
                {target: 'waiting'},
              ],
            },
            waiting: {
              tags: ['show loading overlay', 'prevent iframe interaction'],
              after: {
                'iframe load timeout': {
                  target: 'timedOut',
                },
              },
            },
            timedOut: {
              tags: ['show error card', 'prevent iframe interaction'],
              entry: 'notify iframe load timeout',
              on: {
                'continue anyway': {
                  target: 'dismissed',
                },
              },
            },
            dismissed: {},
          },
        },
      },
    },
  },
  initial: 'loading',
})

export type PresentationMachineRef = ActorRefFrom<typeof presentationMachine>
