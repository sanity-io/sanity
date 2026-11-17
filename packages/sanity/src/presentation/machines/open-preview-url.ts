import {throwError} from 'rxjs'
import {type PermissionCheckResult} from 'sanity'
import {type ActorRefFrom, assign, fromObservable, fromPromise, setup} from 'xstate'

import {type PreviewUrlPreviewMode} from '../types'
import {
  type CheckPermissionInput,
  previewUrlSecretDocument,
  shareAccessSingletonDocument,
} from './preview-url'

interface Context {
  targetOrigin: string
  previewMode: PreviewUrlPreviewMode | null
  /**
   * `expiresAt` is `null` for the shared preview secret, which stays valid until sharing is turned off
   */
  previewUrlSecret: {secret: string; expiresAt: Date | null} | null
  previewUrlSecretPermission: PermissionCheckResult | null
  previewAccessSharingReadPermission: PermissionCheckResult | null
  error: Error | null
}

type SetTargetOriginEvent = {
  type: 'set target origin'
  targetOrigin: string
}
type Event = SetTargetOriginEvent

type Input = Omit<SetTargetOriginEvent, 'type'>

/**
 * Owns what the "Open preview" link needs for the origin currently shown in the iframe: the preview mode
 * resolved for that origin, and a preview URL secret that is created again when it expires, or the shared
 * secret, which is followed as sharing is turned off and on.
 *
 * The iframe itself is driven by `previewUrlMachine`. Once it has loaded through the enable route its
 * preview mode cookie is set, so it has no use for a fresh secret. The link is different: it can be clicked
 * at any time, so the secret in it has to be valid at that moment.
 * @internal
 */
export const openPreviewUrlMachine = setup({
  types: {} as {
    context: Context
    events: Event
    input: Input
    tags: 'busy' | 'error'
  },
  actions: {
    'assign error': assign({
      error: (_, params: {message: string; error: unknown}) => {
        return params.error instanceof Error
          ? params.error
          : new Error(params.message, {cause: params.error})
      },
    }),
  },
  actors: {
    'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(() =>
      throwError(
        () =>
          new Error(
            `The 'check permission' actor is not implemented. Add it to openPreviewUrlMachine.provide({actors: {'check permission': fromObservable(({input}: {input: CheckPermissionInput}) => ...)}})`,
          ),
      ),
    ),
    'resolve preview mode': fromPromise<PreviewUrlPreviewMode | false, {targetOrigin: string}>(() =>
      Promise.reject(
        new Error(
          `The 'resolve preview mode' actor is not implemented. Add it to openPreviewUrlMachine.provide({actors: {'resolve preview mode': fromPromise(...)}})`,
        ),
      ),
    ),
    'create preview secret': fromPromise<{
      secret: string
      expiresAt: Date
    }>(async () =>
      Promise.reject(
        new Error(
          `The 'create preview secret' actor is not implemented. Add it to openPreviewUrlMachine.provide({actors: {'create preview secret': fromPromise(...)}})`,
        ),
      ),
    ),
    'watch shared preview secret': fromObservable<string | null, void>(() =>
      throwError(
        () =>
          new Error(
            `The 'watch shared preview secret' actor is not implemented. Add it to openPreviewUrlMachine.provide({actors: {'watch shared preview secret': fromObservable(...)}})`,
          ),
      ),
    ),
  },
  guards: {
    'has checked permissions': ({context}) => {
      return Boolean(
        context.previewUrlSecretPermission && context.previewAccessSharingReadPermission,
      )
    },
    'has new target origin': ({context, event}) => {
      return event.targetOrigin !== context.targetOrigin
    },
    'has preview mode': (_, params: PreviewUrlPreviewMode | false) => {
      return params !== false
    },
    'can create preview secret': ({context}) => {
      return context.previewUrlSecretPermission?.granted === true
    },
    'can read shared preview secret': ({context}) => {
      return context.previewAccessSharingReadPermission?.granted === true
    },
    'has shared secret': (_, params: string | null | undefined) => {
      return typeof params === 'string' && params !== ''
    },
    'is sharing off': (_, params: string | null | undefined) => {
      return params === null || params === ''
    },
  },
  delays: {
    expiredSecret: ({context}) => {
      const expiresAt = context.previewUrlSecret?.expiresAt
      if (!expiresAt) {
        return 0
      }
      return Math.max(expiresAt.getTime() - Date.now(), 0)
    },
  },
}).createMachine({
  id: 'Open Preview URL',
  context: ({input}) => ({
    targetOrigin: input.targetOrigin,
    previewMode: null,
    previewUrlSecret: null,
    previewUrlSecretPermission: null,
    previewAccessSharingReadPermission: null,
    error: null,
  }),

  invoke: [
    {
      src: 'check permission',
      input: () => ({checkPermissionName: 'create', document: previewUrlSecretDocument}),
      onError: {
        target: '.error',
        actions: {
          type: 'assign error',
          params: ({event}) => ({
            message: 'Failed to check permission',
            error: event.error,
          }),
        },
      },
      onSnapshot: {
        actions: assign({
          previewUrlSecretPermission: ({event}) => event.snapshot.context ?? null,
        }),
      },
    },
    {
      src: 'check permission',
      input: () => ({checkPermissionName: 'read', document: shareAccessSingletonDocument}),
      onError: {
        target: '.error',
        actions: {
          type: 'assign error',
          params: ({event}) => ({
            message: 'Failed to check permission',
            error: event.error,
          }),
        },
      },
      onSnapshot: {
        actions: assign({
          previewAccessSharingReadPermission: ({event}) => event.snapshot.context ?? null,
        }),
      },
    },
  ],

  on: {
    /**
     * A new origin starts over: whatever was resolved for the previous origin no longer applies to the link
     */
    'set target origin': {
      guard: 'has new target origin',
      actions: assign({
        targetOrigin: ({event}) => event.targetOrigin,
        previewMode: null,
        previewUrlSecret: null,
        error: null,
      }),
      target: '.resolvingPreviewMode',
    },
  },

  states: {
    checkingPermissions: {
      on: {
        'set target origin': {
          actions: assign({targetOrigin: ({event}) => event.targetOrigin}),
        },
      },
      always: {
        guard: 'has checked permissions',
        target: 'resolvingPreviewMode',
      },
      tags: ['busy'],
    },

    resolvingPreviewMode: {
      invoke: {
        src: 'resolve preview mode',
        input: ({context}) => ({targetOrigin: context.targetOrigin}),
        onError: {
          target: 'error',
          actions: {
            type: 'assign error',
            params: ({event}) => ({
              message: 'Failed to resolve preview mode',
              error: event.error,
            }),
          },
        },
        onDone: [
          {
            guard: {
              type: 'has preview mode',
              params: ({event}) => event.output,
            },
            actions: assign({
              previewMode: ({event}) => (event.output === false ? null : event.output),
            }),
            target: 'choosingPreviewSecret',
          },
          {
            target: 'unavailable',
          },
        ],
      },
      tags: ['busy'],
    },

    /**
     * Picks where the secret comes from with the permissions the user has at this point. An expired secret
     * comes back here too, as the permission to create a new one might be gone by then.
     */
    choosingPreviewSecret: {
      always: [
        {
          guard: 'can create preview secret',
          target: 'creatingPreviewSecret',
        },
        {
          guard: 'can read shared preview secret',
          target: 'sharedSecret',
        },
        {
          actions: assign({previewMode: null}),
          target: 'unavailable',
        },
      ],
    },

    creatingPreviewSecret: {
      invoke: {
        src: 'create preview secret',
        onError: {
          target: 'error',
          actions: {
            type: 'assign error',
            params: ({event}) => ({
              message: 'Failed to create preview secret',
              error: event.error,
            }),
          },
        },
        onDone: {
          target: 'createdSecret',
          actions: assign({previewUrlSecret: ({event}) => event.output}),
        },
      },
      tags: ['busy'],
    },

    createdSecret: {
      after: {
        expiredSecret: {
          actions: assign({previewUrlSecret: null}),
          target: 'choosingPreviewSecret',
        },
      },
    },

    /**
     * The shared secret is not ours to rotate, but sharing can be turned off, or back on with a new secret,
     * at any time, so it's followed for as long as the link uses it
     */
    sharedSecret: {
      invoke: {
        src: 'watch shared preview secret',
        onSnapshot: [
          {
            guard: {
              type: 'has shared secret',
              params: ({event}) => event.snapshot.context,
            },
            actions: assign({
              previewUrlSecret: ({event}) =>
                event.snapshot.context ? {secret: event.snapshot.context, expiresAt: null} : null,
            }),
            target: '.on',
          },
          {
            guard: {
              type: 'is sharing off',
              params: ({event}) => event.snapshot.context,
            },
            actions: assign({previewUrlSecret: null}),
            target: '.off',
          },
        ],
        onError: {
          target: 'error',
          actions: [
            assign({previewUrlSecret: null}),
            {
              type: 'assign error',
              params: ({event}) => ({
                message: 'Failed to read shared preview secret',
                error: event.error,
              }),
            },
          ],
        },
      },
      initial: 'reading',
      states: {
        reading: {
          tags: ['busy'],
        },
        on: {},
        /**
         * The link opens the preview directly until sharing is turned on again
         */
        off: {},
      },
    },

    /**
     * Preview mode is off for this origin, or there is no way to get a secret for it.
     * The link opens the preview directly instead.
     */
    unavailable: {},

    /**
     * Not final on purpose: a new target origin can recover from here
     */
    error: {
      tags: ['error'],
    },
  },

  initial: 'checkingPermissions',
})
export type OpenPreviewUrlRef = ActorRefFrom<typeof openPreviewUrlMachine>
