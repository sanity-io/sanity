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
  allowOrigins: URLPattern[] | null
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
export const shareAccessSingletonDocument = {_id: schemaIdSingleton, _type: schemaTypeSingleton}
export const previewUrlSecretDocument = {
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
    'notify preview will likely fail': log(
      `Missing permissions to create preview secret, or read shared preview secret. Preview will likely fail loading.`,
    ),
    'assign preview search param': assign({
      previewSearchParam: (_, params: {previewSearchParam: string | null}) =>
        params.previewSearchParam,
    }),
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
            `The 'check permission' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'check permission': fromObservable(({input}: {input: CheckPermissionInput}) => ...)}})`,
          ),
      ),
    ),
    'resolve initial url': fromPromise<URL, {previewSearchParam: string | null}>(() =>
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
    }>(async () =>
      Promise.reject(
        new Error(
          `The 'create preview secret' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'create preview secret': fromPromise(...)}})`,
        ),
      ),
    ),
    'read shared preview secret': fromPromise<string | null>(async () =>
      Promise.reject(
        new Error(
          `The 'read shared preview secret' actor is not implemented. Add it to previewUrlMachine.provide({actors: {'read shared preview secret': fromPromise(...)}})`,
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
      if (!context.previewUrl || !event.previewSearchParam) {
        return false
      }
      try {
        const previewSearchParamUrl = new URL(event.previewSearchParam, context.previewUrl)
        return context.previewUrl.origin !== previewSearchParamUrl.origin
      } catch {
        return false
      }
    },
    'can create preview secret': ({context}) => {
      return context.previewUrlSecretPermission?.granted === true
    },

    'has preview mode with created secret': ({context}, params: PreviewUrlPreviewMode | false) => {
      if (params === false) {
        return false
      }
      return context.previewUrlSecretPermission?.granted === true
    },
    'has preview mode with share access': ({context}, params: PreviewUrlPreviewMode | false) => {
      if (params === false) {
        return false
      }
      return context.previewAccessSharingReadPermission?.granted === true
    },
    'has preview mode without permissions': ({context}, params: PreviewUrlPreviewMode | false) => {
      if (params === false) {
        return false
      }
      return (
        context.previewAccessSharingReadPermission?.granted === false &&
        context.previewUrlSecretPermission?.granted === false
      )
    },
  },
  delays: {
    expiredSecret: ({context}) => {
      if (!context.previewUrlSecret?.expiresAt) {
        return 0
      }
      const now = Date.now()
      const expiresAt = context.previewUrlSecret.expiresAt.getTime()
      return Math.max(expiresAt - now, 0)
    },
  },
}).createMachine({
  // eslint-disable-next-line tsdoc/syntax
  /** @xstate-layout N4IgpgJg5mDOIC5QAUBOYBuBLMB3ABAKoBKAMgMRiqoD2qAdAA4A2AhgC4BmdAtvWphwESpBFgB2GGgGMOWGuIDaABgC6K1YlCMasLO3nitIAB6IArAA56AZgCcAdkcBGS8vMAmO+YBszgDQgAJ6Izs4+9M7KACzKztGWHg4OPubmAL7pgQLYeERklNR0TGxcvPzoucJkYpIycgqKzupqxjp6BgrGZggAtM520ZHRdjZjNjFe7oEhCGERUbHxicmpGVkgOUL5FFS0DCwc3Kh8W3kitVKynUoeLZpIIO36ht2IvV62Hl7elmE2lh83xmoXCkRicQSSRS5gSmWylW2IkK+xKR3KZ2qogkVwaShs9zauheXUePV6gPo3jSUyi-xBczBi0hKxh5mc8M2iPOBVgYHY+EY3IIfNYqGkAAtBWLWDwNESOq8yaCbM56A4bB5fGllHYvD4fAz4h56CNfG5LKqHMpLdFOZidvRJWBpABrCRQZBUHhYWB6BSwcjyx7PG5vPrs5TqjWqyyjTXRDwMjwxei68J2ZQ2nyWXN2jYOkT0dCwGjMbDiKAASXEL1YzEIqGY5AgCjA9BxNFd7cLZGLcDLFertYM9cbzEu9RuGmD2mJYeVfRGdipyh86Yc0XiE3MDK3JssIwcrmtPjGSXzCMEPNI-dL5Y9NbrDabKOKhzKJwq16xd8Hj5HLAxybSdrkMGdWhDeclVAclN3odlzBsKwBjSSxjwcZM7DVeJ1w8P4xmidk7HtYVHRLf9KwAQWYZgaFwZAOHYKhxEDVtxHbTtu2-KpyIHB9qNo+jGPYZjUFY0C8Qgh450VUlYPedkHHoHwnDSZDVOiGwfGiBlUhXXwwjsQYtKSYzSJ-Pj7yHGi6IYpiWMDPZ31KY5TjIosKIEqBbOEhzxNgSTpzUWcnmg+TTHePV6Hw3MYgzaItJ0hlYRNTNkLiHxBl1GILN4zz+KHccADFaB4TEAGUwDFSVGNQWUWzbDs6m43tby8oqm1KmhyuFKqaolOrZSC8CQsg2SSSMRdel8ZSNUTdlcw8M07AZQZrDXdaDRtUZnHWK98r7DqPRKsrKuq8VBplHg3wOVyMQ8o7CpOrqzr6i7auukbGjGmSwrkqaFL6MJlLiWFlC1EGty0hknAiXVVPMRx12UJwOQLR72ueytMQAWRoCAwEajjmqkVrMb-by8YJsBvqUX6FUm8Nem2+hbWPUZErGTcjS8NUJg8AE9T1ZwHHwvKkSe6yPWpwnic4lqewp46ceFfHCbpmdmkZhcgZmyxzFsDmTPcXUUiNRKDy3ZQJlVLSkYlm9KaHWWifYhWyaVyyCul1Wf3V2nOzAn71DuHWYMivovGsBxPCy74beWaJDWCUJzBSFTrUcQYdMzIFHd-FXPTVmn5dJrsvcOrHfeL-2ac1kKCXDiLyWcNKJiiHM-BtONwgtnMEM1DVNwhhI7B8AurMo2uqgD260U-dzval6fXYbwkoIB5moijLLkm5tvYRBo1nGQtND11ZaIdzEiMeX6vV5LuW+QFIVLNFS7pXquVxv+pnF1FtYP4OY7AG3QohJMqcEDeGUq4NwYQBhLEnkWWAABXaQ0g4CBhfoKMiH9JRf1lKFUMEceiizVPA0+7gtQQy8LzXU6obaJTFtEJwHhXDIL7G-WepccHcO2PgqUjBrrEPCoDSOFI3C2AGHtQ8sIiJJGTILZS7JRaeGSKw7CnDbz8LwAHJ06AOBgHOtIdA7Ay5cUrpLHRT92ymOqsxExZj16iK3gAqI6oaQ6QtE4YylhkynzmkCBGNgNR7VvgdaxTBbEGIccY969jzHOTuuiL8bVol10JrEoxTj+QuN-iQlu7xwjKX1P8bSTC0hGhcKaBIOZAQGkBKE7RGSeFZMMRACqEoxRgCohgrBFjFY8Sibo3A+iOldJ6X0zBfp8l-UKeIshjgqTGTiPYPaGotS7igd8QWtgsp6iQnFOEd8q6tKEOM6qnTunoGmQM5JC83LDKdqMy5rBrlTP6bMoOUkGab3-kDU+ERVEpnsEjDRVSdljBXKeQY3h5gOBaa8mmzt4k-nHIMz2zzfzIvaYVNFVRxxzObosxAfg1Q2jSOERIh5kIBNGKaNZ2lvjhFhEimJHUCVCAxQ8j8Tz0m4vbJyzERKfnBQ3hNXWkdyWeJsCMVhqNsK6mTO4Q2Q9DysLCEhDw7LMntjQV8wMJhYDsCMfQVgnAxIAAowAmEYFgdAnSXRmIAJTkAFTEg1MzYCuIBZHKYKlUiqWwrCMJkDZgDAYceRMfwUisPYZYTIGxxA03gI8NqJLmZ6msKqENcjErqIZL0cethvDGXLew9hiYWnOjdDLb0vp-SsUzdNcwEMEJ7WTohDMfgU4RpTCpUJnhYrHghuEFpRcnyjhfMwFtet2Q2FNOwsWZarBan8TsuMkRvhIzPJGDwmkWnJLnf6g0aZl0mQTURDdsxYiGwwsRIEgwEwTuxj5IS9lRKORPeSJCOF4XgrUZqbZsxwZszcJtbC4RUg2FfTXU6PVzoDSGjwH9ik-gxRGG4NtxkkZblhgyxIhFQG5lSPEODj89VoYjKqGKURkij0zImXSUCwiozZuDLUCQQY6tOVEr1WDqMsxNCkP4RFPBZj+I4I0qoRMODjIlceBzkK6raWAIT7DDZlNPhUuVkKI0pEXbHBISF1yAiIqpi5KL7E5ISWYoTna2b6Qg+DcFN7EAphLdpdOWVoPJ0RXxl5HKrmTNuYahzaQviaQPVERa8mlGeBUnnQyDStSwcCzi4L1kuV4HHNR4DCFdRaVVFSzcZ4VVIVsDEVhZ5QnWlYZZvRKLj3-KlT0FIKjVRZghkCXwqkjQGzVFxvOMisoWYy46QV9ABN+mo3mFZZ427lp032jzVa2bJGtCUtciak1AA */
  id: 'Preview URL',
  context: ({input}) => ({
    initialUrl: null,
    previewUrl: null,
    error: null,
    allowOrigins: null,
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
      actions: {
        type: 'assign preview search param',
        params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
      },
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
        input: ({context}) => ({previewSearchParam: context.previewSearchParam}),
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
      type: 'final',
      tags: 'error',
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
          actions: assign({allowOrigins: ({event}) => event.output}),
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
          allowOrigins: context.allowOrigins!,
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
      on: {
        'set preview search param': {
          guard: 'search param has new origin',
          actions: {
            type: 'assign preview search param',
            params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
          },
          target: '#loop',
          reenter: true,
        },
      },
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
            guard: {
              type: 'has preview mode with created secret',
              params: ({event}) => event.output,
            },
            actions: assign({
              previewMode: ({event}) => event.output as unknown as PreviewUrlPreviewMode,
            }),
            target: 'previewMode.createPreviewSecret',
          },
          {
            guard: {
              type: 'has preview mode with share access',
              params: ({event}) => event.output,
            },
            actions: assign({
              previewMode: ({event}) => event.output as unknown as PreviewUrlPreviewMode,
            }),
            target: 'previewMode.readShareAccess',
          },
          {
            guard: {
              type: 'has preview mode without permissions',
              params: ({event}) => event.output,
            },
            actions: [
              assign({
                previewUrl: ({context}) => context.initialUrl,
              }),
              'notify preview will likely fail',
            ],
            target: 'success',
          },
          {
            actions: assign({
              previewUrl: ({context}) => context.initialUrl,
            }),
            target: 'success',
          },
        ],
      },
      tags: ['busy'],
    },

    success: {
      on: {
        'set preview search param': {
          guard: 'search param has new origin',
          actions: {
            type: 'assign preview search param',
            params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
          },
          target: '#loop',
          reenter: true,
        },
      },
    },

    previewMode: {
      on: {
        'set preview search param': {
          guard: 'search param has new origin',
          actions: {
            type: 'assign preview search param',
            params: ({event}) => ({previewSearchParam: event.previewSearchParam}),
          },
          target: '#loop',
          reenter: true,
        },
      },

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
        readShareAccess: {
          invoke: {
            src: 'read shared preview secret',
            onError: {
              target: 'error',
              actions: {
                type: 'assign error',
                params: ({event}) => ({
                  message: 'Failed to read shared preview secret',
                  error: event.error,
                }),
              },
            },
            onDone: {
              target: 'resolvePreviewUrl',
              actions: assign({
                previewUrlSecret: ({event}) => ({
                  secret: event.output!,
                  expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 60 * 24),
                }),
              }),
            },
          },
          tags: ['busy'],
        },
        resolvePreviewUrl: {
          invoke: {
            src: 'resolve preview mode url',
            input: ({context}) => ({
              initialUrl: context.initialUrl!,
              resolvedPreviewMode: context.previewMode!,
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
          type: 'final',
          tags: ['error'],
        },
        success: {
          after: {
            expiredSecret: {
              guard: 'can create preview secret',
              actions: assign({previewUrlSecret: null}),
              target: 'createPreviewSecret',
              reenter: true,
            },
          },
        },
      },
      initial: 'readShareAccess',
    },
  },

  initial: 'checkingPermissions',
})
export type PreviewUrlRef = ActorRefFrom<typeof previewUrlMachine>
