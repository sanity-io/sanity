import {
  schemaIdSingleton,
  schemaType,
  schemaTypeSingleton,
} from '@sanity/preview-url-secret/constants'
import {type SanityDocument} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {throwError} from 'rxjs'
import {type DocumentValuePermission, type PermissionCheckResult} from 'sanity'
import {type ActorRefFrom, assign, fromObservable, fromPromise, log, setup} from 'xstate'

import {type ResolvePreviewModeUrlInput} from '../actors/resolve-preview-mode-url'
import {resolveUrlFromPreviewSearchParamActor} from '../actors/resolve-url-from-preview-search-param'
import {type PreviewUrlPreviewMode} from '../types'

interface Context {
  initialUrl: URL | null
  previewUrl: URL | null
  allow: URLPattern[] | null
  error: Error | null
  previewSearchParam: string | null
  previewUrlSecret: {secret: string; expiresAt: Date} | null
  previewAccessSharingCreatePermission: PermissionCheckResult | null
  previewAccessSharingReadPermission: PermissionCheckResult | null
  previewAccessSharingUpdatePermission: PermissionCheckResult | null
  previewUrlSecretPermission: PermissionCheckResult | null
  previewMode: PreviewUrlPreviewMode | null
}

type SetPreviewSearchParamEvent = {
  type: 'set preview search param'
  previewSearchParam: string | null
}
type Event = SetPreviewSearchParamEvent

type Input = Omit<SetPreviewSearchParamEvent, 'type'>

export interface CheckPermissionInput {
  checkPermissionName: DocumentValuePermission
  document: Partial<SanityDocument> | null
}

/**
 * Used for permissions checks
 */
const shareAccessSingletonDocument = {_id: schemaIdSingleton, _type: schemaTypeSingleton}
const previewUrlSecretDocument = {
  _id: `drafts.${uuid()}`,
  _type: schemaType,
}

export const previewUrlMachine = setup({
  types: {} as {
    context: Context
    events: Event
    input: Input
    tags: 'busy' | 'error'
  },
  actions: {
    'assign preview search param': assign({
      previewSearchParam: (_, params: {previewSearchParam: string | null}) =>
        params.previewSearchParam,
    }),
    'assign error': assign({
      error: (_, params: {message?: string; error: unknown}) => {
        const message = params.message || 'An error occurred'
        return params.error instanceof Error
          ? params.error
          : new Error(message, {cause: params.error})
      },
    }),
  },
  actors: {
    'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(() =>
      throwError(
        () =>
          new Error(
            `The 'check permission' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'check permission': fromObservable(({input}: {input: CheckPermissionInput}) => ...)}})`,
          ),
      ),
    ),
    'resolve initial url': fromPromise<URL>(() =>
      Promise.reject(
        new Error(
          `The 'resolve initial url' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'resolve initial url': fromPromise(...)}})`,
        ),
      ),
    ),
    'resolve allow patterns': fromPromise<URLPattern[], {initialUrl: URL}>(() =>
      Promise.reject(
        new Error(
          `The 'resolve allow patterns' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'resolve allow pattern': fromPromise(...)}})`,
        ),
      ),
    ),
    'resolve url from preview search param': resolveUrlFromPreviewSearchParamActor,
    'resolve preview mode': fromPromise<PreviewUrlPreviewMode | false, {targetOrigin: string}>(() =>
      Promise.reject(
        new Error(
          `The 'resolve preview mode' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'resolve preview mode': fromPromise(...)}})`,
        ),
      ),
    ),
    'create preview secret': fromPromise<{
      secret: string
      expiresAt: Date
    }>(() =>
      Promise.reject(
        new Error(
          `The 'create preview secret' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'create preview secret': fromPromise(...)}})`,
        ),
      ),
    ),
    'resolve preview mode url': fromPromise<URL, ResolvePreviewModeUrlInput>(() =>
      Promise.reject(
        new Error(
          `The 'resolve preview mode url' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'resolve preview mode url': fromPromise(...)}})`,
        ),
      ),
    ),
  },
  guards: {
    'has checked permissions': ({context}) => {
      return Boolean(
        context.previewAccessSharingCreatePermission &&
          context.previewAccessSharingReadPermission &&
          context.previewAccessSharingUpdatePermission &&
          context.previewUrlSecretPermission,
      )
    },
    'search param has new origin': ({context, event}) => {
      if (!context.previewSearchParam || !event.previewSearchParam) {
        return false
      }
      if (!context.previewUrl) {
        return false
      }
      try {
        const before = new URL(context.previewSearchParam, context.previewUrl)
        const after = new URL(event.previewSearchParam, context.previewUrl)
        return before.origin !== after.origin
      } catch {
        return false
      }
    },
  },
}).createMachine({
  // eslint-disable-next-line tsdoc/syntax
  /** @xstate-layout N4IgpgJg5mDOIC5QAUBOYBuBLMB3ABAKoBKAMgMRiqoD2qAdAA4A2AhgC4BmdAtvWphwESpBFgB2GGgGMOWGuIDaABgC6K1YlCMasLO3nitIAB6IAjAFYA7ABoQATwvLrATnoAOS64BMANg9lX1dzPwBfMPsBbDwiMkpqOiY2Ll5+dBjhMjFJGTkFRXN1NWMdPQMFYzMEcwAWO0cLc2tlT3MfAGZvcy9lS3MOiKiMoTiKKloGFg5uVD5o0ZEcqVkKpR9izSQQMv1DKosOhqca-3N6az9LWstlH2trHr9ByJAF2JEEyeSZtPes0QSFb5JQdTalXR7SrbartY6HSw+C5PZQeDzWHzNWpDN4jD7xWBgdj4Rh4giE1ioaQACxJlNYPA0EPK+xhFkxHnoHWUtQ8dWuyma13sJ38LguPlqPOUfmsaJCOP+Y3oNLA0gA1hIoMgqDwsLA9ApYOQmdtdmsDgh-JZ6K47a50fd+rVXNZLCLEH47fQ-EEfJYOlLXDZmoqycr0LAaMxsOIoABJcR7VjMQioZjkCAKMD0IE0dU5pUieiR6OxhNJgwptPMZZ5NYaU3aSEWtkIDHWLm1I5ut0eYMYj0Ia6cqV+dpeh0uoJhwT40gluBlrWJ5Op9NfJLTVJzdJzgGLqMxleVrDV9N11aGRslM0t1mgaqyoeSjxIh5BN0uVx+f2zzLKrAACu0jSHAxqEsSpL7vgFJUrSjD0oyt7Niy0KPoctTvoG9TmMoQQeNy8I1NYHTuOYwaYnKHgBOO-6LGQTBkgAsjQEA5tI6AcGA-wAMpqug7CZtmua5AWe4AcW0GZKx7Eqlx7A8WS-GcUSl4gjeWyoVCRhtlK5xeK4XRej21hSsRPh9O46K3LUVz9CEPj0fOTH7rJHEKUp+4qYJm5TCkszzOGUksWxHlgNxfECWpeZXgUahNjs97oaYiD6Z43jGUZDxmS4Q4UcoHQ+ry3Z+L+gTGc5B7SUI7mHmWXmZDWwniDmebiUWjE1XgdWljGjVCDW6kNglKFJWhukYQgRmtJZHSWf4DoOkEL4DJyNh8i0hX+GR1hVcq3W4L1S79f8zUTFuAV-MFXWhXJfUYANeBDbFGmjVp406ZaM30HNC1ev2gSuC+PI2r+LpelhlxevtIVuWF9AXag5CQSS4ZwTSdKoAyiXmg+qU1IG2G1Lh+EOkR+X9n49DND0lwdETG2w7d8NycBoHgSjRJozBGMIUhuPJZNBMDFhFw4Y8ZOEXljRWu07jdrybqWCZ3bMwuh11ezYEGiaY14ylsLfvQ+Gm3aZkPMKss+J05wBu0xkdAVfjYq8nULg9WoAILMMwNC4MgHCKag4jGlmrWiVIHU3R7J3lj7fsB0HVCh8N17vcyX1tqLxOkwRFPW-6Bm1OYzv9j4hHq-Vx5xgn-uB+wweh35Pw7kFMHFp7te+-Xych7AafxeCd4TZaOfiyTkv5zLopExcrhYZtfIl2+Vdd1ANYAGK0DwUWUjSgfYzwLVtWJhYx9X5Zbzve-wYfDKD0oGcj1nU14cRoQMz6jzUfUmIBq7YYHdGLr2vjQXeykIp3yQi3bcgUJIMVjkeK+6Zt7gNvgfJCj9NKZ1bFNTEXpv50wxIRKU7pZYUQGFyKc0pvCShuGvOOWp-juRPpHfM59gFIOXHGFhYVsHP20nggmgZORkT6CXQUVgvAdD8EOWRSIXT2hsMojwjDkHMLumANh7VOGSRAUw3hWiBHqCKLg-G1RRHUIkXhUulgZFyNljcG0NxuTjjIr4ehlh1E8O1Fo2BV1dzu0vpo1mYATGC1HtnZo+UXRIi9P0NEoQfyyj2jicQYV4DbHduYw2iBgYUNuCbU2JSSl1CrqqDUzDdT6kNKHXJwtqg2CHF6TshlXwM0uLbHxNcKxrhrA0y0EN6D9EsJlK4PglpHBaWZLkdCSZ2LtLKKuSNBltn9PNC4VxnhjNuJZAY+V+hInwv0J2vgXYuyrtrcCay353HypbYqhFbiBEXmrN2F9NZhVuQTMylNQg015Azf0NFETeI+Vw1yMkEaqUipA1S7AfmwhtvlXwtR6BKODEosZb5AG4khV8+6ccnq4AGS-YRT4SY+hsv0Fwky3C1BBvYmmgoxk8nREcfwVdCU5lWeSix7J8I02WnhO0FFHios2eDV0bK7hjKchC-RGstH0GuQaJFTQjLUsuC4OoHQPBAtWlcTwaIeQ231RRLlirEEhO7onBuTcslCIFQgN8L55o2g-F4Z4k8zLgqAUq21G9UE30gfvak98eAapqBVX620nS+iWuQk4lDzjSqOIiDEdw0kBptevPh7Fo3NKcfcE2kztl3BcCTNREQwhAA */
  id: 'Preview URL',
  context: ({input}) => ({
    initialUrl: null,
    previewUrl: null,
    error: null,
    allow: null,
    previewSearchParam: input.previewSearchParam,
    previewUrlSecret: null,
    previewAccessSharingCreatePermission: null,
    previewAccessSharingReadPermission: null,
    previewAccessSharingUpdatePermission: null,
    previewUrlSecretPermission: null,
    previewMode: null,
  }),

  invoke: [
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
    {
      src: 'check permission',
      input: () => ({checkPermissionName: 'create', document: shareAccessSingletonDocument}),
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
          previewAccessSharingCreatePermission: ({event}) => event.snapshot.context ?? null,
        }),
      },
    },
    {
      src: 'check permission',
      input: () => ({checkPermissionName: 'update', document: shareAccessSingletonDocument}),
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
          previewAccessSharingUpdatePermission: ({event}) => event.snapshot.context ?? null,
        }),
      },
    },
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
  ],

  on: {
    'set preview search param': {
      actions: [
        log(({event}) => event.previewSearchParam, 'set preview search param'),
        {
          type: 'assign preview search param',
          params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
        },
      ],
    },
  },

  states: {
    checkingPermissions: {
      always: {
        guard: 'has checked permissions',
        target: 'resolvingInitialUrl',
      },
      tags: 'busy',
    },

    resolvingInitialUrl: {
      invoke: {
        src: 'resolve initial url',
        onError: {
          target: 'error',
          actions: {
            type: 'assign error',
            params: ({event}) => ({
              message: 'Failed to resolve initial url',
              error: event.error,
            }),
          },
        },
        onDone: {
          target: 'resolvingAllowPatterns',
          actions: assign({initialUrl: ({event}) => event.output}),
        },
      },

      tags: 'busy',
    },

    error: {
      tags: 'error',
    },

    success: {
      on: {
        'set preview search param': {
          guard: 'search param has new origin',
          actions: [
            log(
              ({event}) => event.previewSearchParam,
              'set preview search param with new origin from error',
            ),
            {
              type: 'assign preview search param',
              params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
            },
          ],
          target: '#loop',
          reenter: true,
        },
      },
    },

    previewMode: {
      states: {
        createPreviewSecret: {
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
              target: 'resolvePreviewUrl',
              actions: assign({previewUrlSecret: ({event}) => event.output}),
            },
          },
          tags: ['busy'],
        },
        resolvePreviewUrl: {
          invoke: {
            src: 'resolve preview mode url',
            input: ({context}) => ({
              resolvedPreviewMode: context.previewMode!,
              /**
               * The `initialUrl` at this point is the parsed and validated version of what started off as `previewSearchParam`
               */
              previewSearchParam: context.initialUrl!.toString(),
              previewUrlSecret: context.previewUrlSecret!.secret,
            }),
            onError: {
              target: 'error',
              actions: {
                type: 'assign error',
                params: ({event}) => ({
                  message: 'Failed to resolve preview url',
                  error: event.error,
                }),
              },
            },
            onDone: {
              target: 'success',
              actions: assign({previewUrl: ({event}) => event.output}),
            },
          },
          tags: ['busy'],
        },
        error: {
          on: {
            'set preview search param': {
              guard: 'search param has new origin',
              actions: [
                log(
                  ({event}) => event.previewSearchParam,
                  'set preview search param with new origin from error',
                ),
                {
                  type: 'assign preview search param',
                  params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
                },
              ],
              target: '#loop',
              reenter: true,
            },
          },
          tags: ['error'],
        },
        success: {
          // When the previewUrlSecret is set and is about to expire, we should renew it
          always: {
            guard: ({context}) => {
              return Boolean(
                context.previewUrlSecret &&
                  context.previewUrlSecret.expiresAt &&
                  context.previewUrlSecret.expiresAt.getTime() - Date.now() < 60000 && // Less than 1 minute left
                  context.previewUrlSecretPermission?.granted,
              )
            },

            target: 'createPreviewSecret',
            reenter: true,
          },
          on: {
            'set preview search param': {
              guard: 'search param has new origin',

              actions: [
                log(
                  ({event}) => event.previewSearchParam,
                  'set preview search param with new origin from success',
                ),
                {
                  type: 'assign preview search param',
                  params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
                },
              ],

              target: '#loop',
              reenter: true,
            },
          },
        },
      },

      initial: 'createPreviewSecret',
    },

    resolvingAllowPatterns: {
      invoke: {
        src: 'resolve allow patterns',
        input: ({context}) => ({initialUrl: context.initialUrl!}),
        onError: {
          target: 'error',
          actions: {
            type: 'assign error',
            params: ({event}) => ({
              message: 'Failed to resolve preview url allow patterns',
              error: event.error,
            }),
          },
        },
        onDone: {
          target: 'resolvingUrlFromPreviewSearchParam',
          actions: assign({allow: ({event}) => event.output}),
        },
      },
      tags: ['busy'],
    },

    resolvingUrlFromPreviewSearchParam: {
      id: 'loop',
      invoke: {
        src: 'resolve url from preview search param',
        input: ({context}) => ({
          initialUrl: context.initialUrl!,
          allow: context.allow!,
          previewSearchParam: context.previewSearchParam,
        }),
        onError: {
          target: 'error',
          actions: {
            type: 'assign error',
            params: ({event}) => ({
              message: 'Failed to resolve preview url from search param',
              error: event.error,
            }),
          },
        },
        onDone: {
          target: 'resolvingPreviewMode',
          actions: assign({initialUrl: ({event}) => event.output}),
        },
      },
      tags: ['busy'],
    },

    resolvingPreviewMode: {
      invoke: {
        src: 'resolve preview mode',
        input: ({context}) => ({targetOrigin: context.initialUrl!.origin}),
        onError: {
          target: 'error',
          actions: {
            type: 'assign error',
            params: ({event}) => ({
              message: 'Failed to resolve preview url allow patterns',
              error: event.error,
            }),
          },
        },
        onDone: [
          {
            guard: ({event}) => event.output === false,
            actions: assign({
              previewUrl: ({context}) => context.initialUrl,
            }),
            target: 'success',
          },
          {
            actions: assign({
              previewMode: ({event}) => event.output as unknown as PreviewUrlPreviewMode,
            }),
            target: 'previewMode',
          },
        ],
      },
    },
  },

  initial: 'checkingPermissions',
})
export type PreviewUrlRef = ActorRefFrom<typeof previewUrlMachine>
