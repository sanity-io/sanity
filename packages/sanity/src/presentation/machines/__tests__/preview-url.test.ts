import {of, Subject} from 'rxjs'
import {type PermissionCheckResult, type SanityClient} from 'sanity'
import {describe, expect, test, vi} from 'vitest'
import {createActor, fromObservable, fromPromise, waitFor} from 'xstate'

import {defineResolveAllowPatternsActor} from '../../actors/resolve-allow-patterns'
import {defineResolveInitialUrlActor} from '../../actors/resolve-initial-url'
import {defineResolvePreviewModeActor} from '../../actors/resolve-preview-mode'
import {defineResolvePreviewModeUrlActor} from '../../actors/resolve-preview-mode-url'
import {
  type DeprecatedPreviewUrlResolver,
  type PreviewUrlAllowOption,
  type PreviewUrlAllowOptionContext,
  type PreviewUrlInitialOptionContext,
  type PreviewUrlOption,
} from '../../types'
import {
  type CheckPermissionInput,
  previewUrlMachine,
  previewUrlSecretDocument,
  shareAccessSingletonDocument,
} from '../preview-url'

if (typeof URLPattern === 'undefined') {
  await import('urlpattern-polyfill')
}

const createFakeClient = () => {
  /* eslint-disable no-empty-function */
  const client = {
    async fetch() {},
    async commit() {},
    async delete() {},
    patch() {
      return this
    },
    set() {
      return this
    },
    transaction() {
      return this
    },
    createOrReplace() {
      return this
    },
    withConfig() {
      return this
    },
  }
  /* eslint-enable no-empty-function */
  return client as unknown as SanityClient
}
const client = createFakeClient()
const studioBasePath = '/'
const expiresAt = new Date(Date.now() + 1000 * 60 * 60)
const mockActors = ({
  allowOption = undefined,
  previewUrlOption = undefined,
}: {
  allowOption?: PreviewUrlAllowOption
  previewUrlOption?: PreviewUrlOption
} = {}) => ({
  'create preview secret': fromPromise(() => Promise.resolve({secret: 'abc123', expiresAt})),
  'read shared preview secret': fromPromise<string | null>(() => Promise.resolve('dfg456')),
  'resolve allow patterns': defineResolveAllowPatternsActor({client, allowOption}),
  'resolve initial url': defineResolveInitialUrlActor({
    client,
    studioBasePath,
    previewUrlOption,
    perspective: 'drafts',
  }),
  'resolve preview mode': defineResolvePreviewModeActor({
    client,
    previewUrlOption,
  }),
  'resolve preview mode url': defineResolvePreviewModeUrlActor({
    client,
    studioBasePath,
    previewUrlOption,
    perspective: 'drafts',
  }),
  'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(() =>
    of({granted: true, reason: 'Matching grant'}),
  ),
})

describe('Preview URL machine', () => {
  describe('checks permissions', () => {
    test('the check permission actor is required', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      const {'check permission': _, ...actors} = mockActors()
      const actor = createActor(previewUrlMachine.provide({actors}), {
        input: {previewSearchParam: null},
      }).start()

      const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).toBeInstanceOf(Error)
      expect(snapshot.context.error).toMatchSnapshot()
    })

    test('transitions from permissions checking when permissions are set', async () => {
      const subject = new Subject<PermissionCheckResult>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(
              () => subject,
            ),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) => state.matches('checkingPermissions'))
      expect(snapshot.hasTag('busy')).toBe(true)
      expect(snapshot.context.previewAccessSharingCreatePermission).toBeNull()
      expect(snapshot.context.previewAccessSharingReadPermission).toBeNull()
      expect(snapshot.context.previewAccessSharingUpdatePermission).toBeNull()
      expect(snapshot.context.previewUrlSecretPermission).toBeNull()

      const permissionCheckResult = {granted: true, reason: 'Matching grant'}
      subject.next(permissionCheckResult)
      snapshot = await waitFor(actor, (state) => !state.matches('checkingPermissions'))
      expect(snapshot.context.previewAccessSharingCreatePermission).toEqual(permissionCheckResult)
      expect(snapshot.context.previewAccessSharingReadPermission).toEqual(permissionCheckResult)
      expect(snapshot.context.previewAccessSharingUpdatePermission).toEqual(permissionCheckResult)
      expect(snapshot.context.previewUrlSecretPermission).toEqual(permissionCheckResult)
    })

    const permissionCheckResult = of({granted: true, reason: 'Matching grant'})
    test.each([
      ['read', shareAccessSingletonDocument],
      ['create', shareAccessSingletonDocument],
      ['update', shareAccessSingletonDocument],
      ['create', previewUrlSecretDocument],
    ])('handles errors: %O', async (checkPermissionName, document) => {
      const subject = new Subject<PermissionCheckResult>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(
              ({input}) =>
                input.checkPermissionName === checkPermissionName &&
                input.document?._type === document._type
                  ? subject
                  : permissionCheckResult,
            ),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) => state.matches('checkingPermissions'))
      expect(snapshot.hasTag('busy')).toBe(true)

      const error = new Error('Failed to check permission')
      subject.error(error)
      snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).toBe(error)
    })
  })

  describe('resolves initial url', () => {
    test('the resolve initial url actor is required', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      const {'resolve initial url': _, ...actors} = mockActors()
      const actor = createActor(previewUrlMachine.provide({actors}), {
        input: {previewSearchParam: null},
      }).start()
      const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).toBeInstanceOf(Error)
      expect(snapshot.context.error).toMatchSnapshot()
    })

    test('is busy while resolving initial url', async () => {
      const {promise, resolve} = Promise.withResolvers<URL>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'resolve initial url': fromPromise(() => promise),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) => state.matches('resolvingInitialUrl'))
      expect(snapshot.hasTag('busy')).toBe(true)

      const url = new URL('https://example.com')
      resolve(url)
      snapshot = await waitFor(actor, (state) => !state.matches('resolvingInitialUrl'))
      expect(snapshot.context.initialUrl).toBe(url)
    })

    test.each([
      [undefined, 'http://localhost:3000/'],
      ['/', 'http://localhost:3000/'],
      ['/preview', 'http://localhost:3000/preview'],
      ['https://example.com', 'https://example.com/'],
      [{initial: '/preview'}, 'http://localhost:3000/preview'],
      [{initial: 'https://example.com'}, 'https://example.com/'],
      [{initial: () => '/preview'}, 'http://localhost:3000/preview'],
      [{initial: () => 'https://example.com'}, 'https://example.com/'],
      [
        {
          initial: async ({origin}: PreviewUrlInitialOptionContext) =>
            new URL('/preview', origin).toString(),
        },
        'http://localhost:3000/preview',
      ],
      [
        (async ({studioPreviewPerspective}) => {
          const url = new URL('https://example.com')
          url.searchParams.set('sanity-preview-perspective', studioPreviewPerspective)
          return url.toString()
        }) as DeprecatedPreviewUrlResolver,
        'https://example.com/?sanity-preview-perspective=drafts',
      ],
      [{origin: 'https://example.com'}, 'https://example.com/'],
      [{preview: '/preview'}, 'http://localhost:3000/preview'],
      [{origin: 'https://example.com', preview: '/preview'}, 'https://example.com/preview'],
    ])('%O => %s', async (previewUrlOption, expected) => {
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'resolve initial url': defineResolveInitialUrlActor({
              client,
              studioBasePath,
              previewUrlOption: previewUrlOption,
              perspective: 'drafts',
            }),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      const snapshot = await waitFor(actor, (state) => state.context.initialUrl !== null)
      expect(snapshot.context.initialUrl).toBeInstanceOf(URL)
      expect(snapshot.context.initialUrl!.toString()).toBe(expected)
    })
  })

  describe('resolves allow patterns', () => {
    test('the resolve allow patterns actor is required', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      const {'resolve allow patterns': _, ...actors} = mockActors()
      const actor = createActor(previewUrlMachine.provide({actors}), {
        input: {previewSearchParam: null},
      }).start()
      const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).toBeInstanceOf(Error)
      expect(snapshot.context.error).toMatchSnapshot()
    })

    test('is busy while resolving allow patterns', async () => {
      const {promise, resolve} = Promise.withResolvers<URLPattern[]>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'resolve allow patterns': fromPromise(() => promise),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) => state.matches('resolvingAllowPatterns'))
      expect(snapshot.hasTag('busy')).toBe(true)

      const patterns = [new URLPattern(location.origin)]
      resolve(patterns)
      snapshot = await waitFor(actor, (state) => !state.matches('resolvingAllowPatterns'))
      expect(snapshot.context.allowOrigins).toBe(patterns)
    })

    test.each([
      /**
       * Specifying a list of allow pattern strings are converted to URLPattern instances
       */
      [
        new URL('http://localhost:3333'),
        ['http://localhost:*'],
        [new URLPattern('http://localhost:*')],
      ],
      [
        new URL('https://example.com'),
        ['https://example.com', 'http://localhost:*'],
        [new URLPattern('https://example.com'), new URLPattern('http://localhost:*')],
      ],
      /**
       * A function can be used to infer allow patterns from the context
       */
      [
        new URL('https://example.sanity.dev'),
        (context: PreviewUrlAllowOptionContext) => [context.origin, context.initialUrl.origin],
        [new URLPattern(location.origin), new URLPattern('https://example.sanity.dev')],
      ],
      /**
       * The function can also be async
       */
      [
        new URL('https://example.sanity.dev'),
        async (context: PreviewUrlAllowOptionContext) => {
          const initialPatterns = [context.initialUrl.origin]
          const dynamicPatterns = await context.client.fetch<unknown>(
            `*[_id == $id][0].allowOrigins`,
            {
              id: 'settings',
            },
          )
          if (
            Array.isArray(dynamicPatterns) &&
            dynamicPatterns.every((pattern) => typeof pattern === 'string')
          ) {
            return [...initialPatterns, ...dynamicPatterns]
          }
          return initialPatterns
        },
        [new URLPattern('https://example.sanity.dev')],
      ],
      /**
       * If no allow option is provided, it'll infer it from the initial URL
       */
      [new URL(location.href), undefined, [new URLPattern(location.origin)]],
      [new URL('https://example.com/preview'), undefined, [new URLPattern('https://example.com')]],
      [new URL(location.href), [], [new URLPattern(location.origin)]],
      [new URL('https://example.com/preview'), [], [new URLPattern('https://example.com')]],
      /**
       * If an allow option is provided, and the initial URL is allowed, it'll use it as-is
       */
      [
        new URL('https://example.com/preview'),
        ['https://example.com'],
        [new URLPattern('https://example.com')],
      ],
      [
        new URL('http://localhost:3000'),
        ['http://localhost:*'],
        [new URLPattern('http://localhost:*')],
      ],
      /**
       * If the initial URL is not allowed, it'll be added to the list of allowed patterns
       */
      [
        new URL('http://localhost:3000'),
        ['http://localhost:3333'],
        [new URLPattern('http://localhost:3333'), new URLPattern('http://localhost:3000')],
      ],
      [
        new URL('https://example.com'),
        ['http://localhost:*'],
        [new URLPattern('http://localhost:*'), new URLPattern('https://example.com')],
      ],
      [
        new URL('https://example-git-main.sanity.build'),
        async () => [
          'https://example.sanity.build',
          'https://example.sanity.dev',
          'https://example-git-*.sanity.dev',
        ],
        [
          new URLPattern('https://example.sanity.build'),
          new URLPattern('https://example.sanity.dev'),
          new URLPattern('https://example-git-*.sanity.dev'),
          new URLPattern('https://example-git-main.sanity.build'),
        ],
      ],
    ])('{initialUrl: %s, allowOrigins: %O}', async (initialUrl, allowOption, expected) => {
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors({allowOption}),
            'resolve initial url': fromPromise(async () => initialUrl),
            'resolve allow patterns': defineResolveAllowPatternsActor({
              client,
              allowOption,
            }),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      const snapshot = await waitFor(actor, (state) => Array.isArray(state.context.allowOrigins))
      expect(snapshot.context.allowOrigins).toEqual(expected)
      expected.forEach((pattern, index) => {
        const actual = snapshot.context.allowOrigins![index]!
        expect(actual.protocol).toBe(pattern.protocol)
        expect(actual.hostname).toBe(pattern.hostname)
        expect(actual.port).toBe(pattern.port)
      })
    })

    test.each([
      '://*',
      'http://*',
      'https://*',
      '://*/foo/bar?foo=bar#hash',
      'https://username:password@*',
    ])(`doesn't allow %O`, async (allowOption) => {
      const actor = createActor(
        previewUrlMachine.provide({
          actors: mockActors({allowOption}),
        }),
        {input: {previewSearchParam: null}},
      ).start()

      const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).toBeInstanceOf(Error)
      expect(snapshot.context.error?.message).toMatch('insecure')
      expect(snapshot.context.error).toMatchSnapshot()
    })
  })

  describe('resolves url from search param', () => {
    test('is busy while resolving', async () => {
      const {promise, resolve} = Promise.withResolvers<URL>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'resolve url from preview search param': fromPromise(() => promise),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) =>
        state.matches('resolvingUrlFromPreviewSearchParam'),
      )
      expect(snapshot.hasTag('busy')).toBe(true)

      const url = new URL('https://example.com')
      resolve(url)
      snapshot = await waitFor(
        actor,
        (state) => !state.matches('resolvingUrlFromPreviewSearchParam'),
      )
      expect(snapshot.context.initialUrl).toBe(url)
    })

    test.each([
      [null, undefined, 'https://example.com', 'https://example.com/'],
      ['/preview', undefined, 'https://example.com', 'https://example.com/preview'],
      ['http://localhost:3000', undefined, 'https://example.com', 'https://example.com/'],
      [
        'http://localhost:3333',
        ['http://localhost:*'],
        'http://localhost:3000',
        'http://localhost:3333/',
      ],
      [
        'http://localhost:3333',
        ['https://example.com'],
        'http://localhost:3333',
        'http://localhost:3333/',
      ],
      ['/blog', ['http://localhost:*'], 'https://example.com', 'https://example.com/blog'],
      ['/blog', ['http://localhost:*'], 'http://localhost:3000', 'http://localhost:3000/blog'],
    ])(
      '%s allowOrigins: %O initialUrl: %s => %s',
      async (previewSearchParam, allowOrigins, initialUrl, expected) => {
        const actor = createActor(
          previewUrlMachine.provide({
            actors: mockActors({
              allowOption: allowOrigins,
              previewUrlOption: {initial: initialUrl},
            }),
          }),
          {input: {previewSearchParam}},
        ).start()

        const {context} = await waitFor(actor, (state) => Boolean(state.context.previewUrl))
        expect(context.previewUrl?.toString()).toBe(expected)
      },
    )

    test('handles errors', async () => {
      const {promise, reject} = Promise.withResolvers<URL>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors(),
            'resolve url from preview search param': fromPromise(() => promise),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) =>
        state.matches('resolvingUrlFromPreviewSearchParam'),
      )
      expect(snapshot.hasTag('busy')).toBe(true)

      reject('Unknown error')
      snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).not.toBeNull()
    })
  })

  test('handles legacy preview url resolver', async () => {
    const actor = createActor(
      previewUrlMachine.provide({
        actors: mockActors({
          previewUrlOption: async ({studioPreviewPerspective, previewSearchParam}) => {
            const url = new URL('/api/preview', location.origin)
            url.searchParams.set('perspective', studioPreviewPerspective)
            url.searchParams.set('redirectTo', previewSearchParam ?? '')
            return url.toString()
          },
        }),
      }),
      {input: {previewSearchParam: 'https://example.com'}},
    ).start()

    const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe(
      `http://localhost:3000/api/preview?${new URLSearchParams({perspective: 'drafts', redirectTo: 'https://example.com'})}`,
    )
  })

  /**
   * These two tests are skipped as we're looking to remove the legacy preview url resolver,
   * unless there's a good reason to keep it.
   */
  test.skip('handles legacy preview url resolver with allowOption', async () => {
    const actor = createActor(
      previewUrlMachine.provide({
        actors: mockActors({
          allowOption: ['http://localhost:*', 'https://example.com'],
          previewUrlOption: async ({studioPreviewPerspective, previewSearchParam}) => {
            const url = new URL('/api/preview', location.origin)
            url.searchParams.set('perspective', studioPreviewPerspective)
            url.searchParams.set('redirectTo', previewSearchParam ?? '')
            return url.toString()
          },
        }),
      }),
      {input: {previewSearchParam: 'https://example.com'}},
    ).start()

    const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe(
      `http://localhost:3000/api/preview?${new URLSearchParams({perspective: 'drafts', redirectTo: 'https://example.com'})}`,
    )
  })
  test.skip('handles legacy preview url resolver with previewUrlSecret', async () => {
    const actor = createActor(
      previewUrlMachine.provide({
        actors: mockActors({
          previewUrlOption: async ({previewUrlSecret}) => {
            const url = new URL('/api/preview', location.origin)
            url.searchParams.set('secret', previewUrlSecret)
            return url.toString()
          },
        }),
      }),
      {input: {previewSearchParam: null}},
    ).start()

    const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    const secret = snapshot.context.previewUrl?.searchParams.get('secret')
    expect(typeof secret).toBe('string')
    expect(secret).not.toBe('')
  })

  test('handles changing the preview search param origin', async () => {
    const actor = createActor(
      previewUrlMachine.provide({
        actors: mockActors({
          allowOption: ['http://localhost:*'],
          previewUrlOption: {initial: 'http://localhost:3000'},
        }),
      }),
      {input: {previewSearchParam: null}},
    ).start()

    let snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe('http://localhost:3000/')

    /**
     * Setting a new origin resets the preview URL machine
     */
    actor.send({type: 'set preview search param', previewSearchParam: 'http://localhost:3333/blog'})
    snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe('http://localhost:3333/blog')

    /**
     * A new origin that isn't allowed is ignored
     */
    actor.send({type: 'set preview search param', previewSearchParam: 'https://example.com/docs'})
    snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe('http://localhost:3333/blog')

    /**
     * A new origin that is allowed can run the loop once more
     */
    actor.send({type: 'set preview search param', previewSearchParam: 'http://localhost:4321/docs'})
    snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe('http://localhost:4321/docs')

    /**
     * A relative preview search param updates the context
     */
    actor.send({type: 'set preview search param', previewSearchParam: '/about'})
    snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewSearchParam).toBe('/about')

    /**
     * But again, it has to specify a new origin for it to update `previewUrl`
     */
    actor.send({
      type: 'set preview search param',
      previewSearchParam: 'http://localhost:5173/about',
    })
    snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
    expect(snapshot.context.previewUrl?.toString()).toBe('http://localhost:5173/about')
  })

  describe('preview mode', () => {
    describe('resolves preview mode options', () => {
      test('the resolve preview mode actor is required', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
        const {'resolve preview mode': _, ...actors} = mockActors()
        const actor = createActor(previewUrlMachine.provide({actors}), {
          input: {previewSearchParam: null},
        }).start()
        const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
        expect(snapshot.context.error).toBeInstanceOf(Error)
        expect(snapshot.context.error).toMatchSnapshot()
      })

      test('it normalizes the preview mode option', async () => {
        const actor = createActor(
          previewUrlMachine.provide({
            actors: mockActors({
              allowOption: ['http://localhost:*'],
              previewUrlOption: {
                initial: 'http://localhost:3000',
                previewMode: {
                  enable: '/api/draft-mode/enable',
                  shareAccess: true,
                  check: '/api/draft-mode/check',
                  disable: '/api/draft-mode/disable',
                },
              },
            }),
          }),
          {input: {previewSearchParam: null}},
        ).start()

        const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(snapshot.context.previewMode).toEqual({
          enable: '/api/draft-mode/enable',
          shareAccess: true,
        })
      })

      test('handles legacy draftMode options', async () => {
        const actor = createActor(
          previewUrlMachine.provide({
            actors: mockActors({
              allowOption: ['http://localhost:*'],
              previewUrlOption: {
                initial: 'http://localhost:3000',
                draftMode: {
                  enable: '/api/draft-mode/enable',
                  shareAccess: false,
                },
              },
            }),
          }),
          {input: {previewSearchParam: null}},
        ).start()

        const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(snapshot.context.previewMode).toEqual({
          enable: '/api/draft-mode/enable',
          shareAccess: false,
        })
      })

      test('handles when preview mode is enabled but permissions are missing', async () => {
        const notify = vi.fn()
        const permissionCheckResult = of({granted: false, reason: 'No matching grants found'})
        const actor = createActor(
          previewUrlMachine.provide({
            actions: {'notify preview will likely fail': notify},
            actors: {
              ...mockActors({
                allowOption: ['http://localhost:*'],
                previewUrlOption: {
                  initial: 'http://localhost:3000',
                  previewMode: {enable: '/api/draft-mode/enable'},
                },
              }),
              'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(
                () => permissionCheckResult,
              ),
            },
          }),
          {input: {previewSearchParam: null}},
        ).start()

        const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(snapshot.context.previewMode).toBeNull()
        expect(notify).toHaveBeenCalled()
      })

      test.each([
        [undefined, null],
        [
          {
            enable: '/api/draft-mode/enable',
            check: '/api/draft-mode/check',
            disable: '/api/draft-mode/disable',
          },
          {
            enable: '/api/draft-mode/enable',
            shareAccess: true,
          },
        ],
        [
          {enable: '/api/draft-mode/enable', shareAccess: false},
          {
            enable: '/api/draft-mode/enable',
            shareAccess: false,
          },
        ],
        [
          {enable: '/api/draft-mode/enable', shareAccess: null as unknown as boolean},
          {
            enable: '/api/draft-mode/enable',
            shareAccess: true,
          },
        ],
        [
          ({targetOrigin}: {targetOrigin: string}) => ({
            enable: `${targetOrigin}/api/draft-mode/enable`,
          }),
          {
            enable: 'http://localhost:3000/api/draft-mode/enable',
            shareAccess: true,
          },
        ],
        [async () => false as const, null],
      ])('%O => %O', async (previewMode, expected) => {
        const actor = createActor(
          previewUrlMachine.provide({
            actors: mockActors({
              previewUrlOption: {previewMode},
            }),
          }),
          {input: {previewSearchParam: null}},
        ).start()

        const snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(snapshot.context.previewMode).toEqual(expected)
      })
    })

    describe('creates preview url secrets', () => {
      test('the create preview secret actor is required', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
        const {'create preview secret': _, ...actors} = mockActors({
          previewUrlOption: {previewMode: {enable: '/api/preview'}},
        })
        const actor = createActor(previewUrlMachine.provide({actors}), {
          input: {previewSearchParam: null},
        }).start()
        const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
        expect(snapshot.context.error).toBeInstanceOf(Error)
        expect(snapshot.context.error).toMatchSnapshot()
      })

      test('creates a secret and adds it to the context', async () => {
        const actor = createActor(
          previewUrlMachine.provide({
            actors: mockActors({previewUrlOption: {previewMode: {enable: '/api/preview'}}}),
          }),
          {
            input: {previewSearchParam: null},
          },
        ).start()
        const {context} = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(context.previewUrlSecret).toEqual({
          secret: expect.any(String),
          expiresAt: expect.any(Date),
        })
      })

      test('handles secret expiry', async () => {
        const ttl = 1_000
        const t1 = Promise.withResolvers<{secret: string; expiresAt: Date}>()
        const t2 = Promise.withResolvers<{secret: string; expiresAt: Date}>()
        let promise = t1.promise

        const actor = createActor(
          previewUrlMachine.provide({
            actors: {
              ...mockActors({previewUrlOption: {previewMode: {enable: '/api/preview'}}}),
              'create preview secret': fromPromise(() => promise),
            },
          }),
          {
            input: {previewSearchParam: null},
          },
        ).start()

        t1.resolve({secret: '123', expiresAt: new Date(Date.now() + ttl)})

        let snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(snapshot.context.previewUrlSecret?.secret).toBe('123')
        expect(snapshot.context.previewUrl).toMatchSnapshot()

        promise = t2.promise
        t2.resolve({secret: '456', expiresAt: new Date(Date.now() + ttl)})
        snapshot = await waitFor(actor, (state) => state.hasTag('busy'))
        expect(snapshot.value).toEqual({previewMode: 'createPreviewSecret'})

        snapshot = await waitFor(actor, (state) => state.context.previewUrlSecret?.secret === '456')
        expect(snapshot.context.previewUrlSecret?.secret).toBe('456')
      })

      test('only creates a new secret if the permission is granted', async () => {
        const subject = new Subject<PermissionCheckResult>()
        const permissionCheckResult = of({granted: true, reason: 'Matching grant'})

        const ttl = 1_000
        const t1 = Promise.withResolvers<{secret: string; expiresAt: Date}>()
        const t2 = Promise.withResolvers<{secret: string; expiresAt: Date}>()
        let promise = t1.promise

        const actor = createActor(
          previewUrlMachine.provide({
            actors: {
              ...mockActors({previewUrlOption: {previewMode: {enable: '/api/preview'}}}),
              'create preview secret': fromPromise(() => promise),
              'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(
                ({input}) => {
                  /**
                   * We're only testing changes to the permissions for creating short lived preview secrets
                   */
                  if (
                    input.checkPermissionName === 'create' &&
                    input.document?._type === previewUrlSecretDocument._type
                  ) {
                    return subject
                  }
                  return permissionCheckResult
                },
              ),
            },
          }),
          {
            input: {previewSearchParam: null},
          },
        ).start()

        subject.next({granted: true, reason: 'Matching grant'})
        t1.resolve({secret: '123', expiresAt: new Date(Date.now() + ttl)})

        let snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(snapshot.context.previewUrlSecret?.secret).toBe('123')

        promise = t2.promise
        t2.resolve({secret: '456', expiresAt: new Date(Date.now() + ttl)})

        subject.next({granted: false, reason: 'No matching grants found'})
        await new Promise((resolve) => setTimeout(resolve, ttl))

        snapshot = await waitFor(
          actor,
          (state) =>
            state.context.previewUrlSecretPermission?.granted === false && !state.hasTag('busy'),
        )
        expect(snapshot.context.previewUrlSecret?.secret).toBe('123')
      })
    })

    describe('reads shared preview secrets if missing permissions to create preview secrets', () => {
      const permissionCheckResultGranted = of({granted: true, reason: 'Matching grant'})
      const permissionCheckResultDenied = of({granted: false, reason: 'No matching grants found'})
      const checkPermissionActor = fromObservable<PermissionCheckResult, CheckPermissionInput>(
        ({input}) => {
          if (
            input.checkPermissionName === 'create' &&
            input.document?._type === previewUrlSecretDocument._type
          ) {
            return permissionCheckResultDenied
          }
          return permissionCheckResultGranted
        },
      )

      test('the read shared preview secret actor is required', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
        const {'read shared preview secret': _, ...actors} = mockActors({
          previewUrlOption: {previewMode: {enable: '/api/preview'}},
        })
        const actor = createActor(
          previewUrlMachine.provide({
            actors: {...actors, 'check permission': checkPermissionActor},
          }),
          {
            input: {previewSearchParam: null},
          },
        ).start()
        const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
        expect(snapshot.context.error).toBeInstanceOf(Error)
        expect(snapshot.context.error).toMatchSnapshot()
      })

      test('reads a secret and adds it to the context', async () => {
        const actor = createActor(
          previewUrlMachine.provide({
            actors: {
              ...mockActors({previewUrlOption: {previewMode: {enable: '/api/preview'}}}),
              'check permission': checkPermissionActor,
            },
          }),
          {
            input: {previewSearchParam: null},
          },
        ).start()
        const {context} = await waitFor(actor, (state) => !state.hasTag('busy'))
        expect(context.previewUrlSecret).toEqual({
          secret: 'dfg456',
          expiresAt: expect.any(Date),
        })
      })
    })

    describe('resolves preview mode url', () => {
      test('the resolve preview mode url actor is required', async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
        const {'resolve preview mode url': _, ...actors} = mockActors({
          previewUrlOption: {previewMode: {enable: '/api/preview'}},
        })
        const actor = createActor(previewUrlMachine.provide({actors}), {
          input: {previewSearchParam: null},
        }).start()
        const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
        expect(snapshot.context.error).toBeInstanceOf(Error)
        expect(snapshot.context.error).toMatchSnapshot()
      })
    })

    test('handles changing the preview search param origin', async () => {
      const actor = createActor(
        previewUrlMachine.provide({
          actors: mockActors({
            allowOption: ['http://localhost:*'],
            previewUrlOption: {
              initial: 'http://localhost:3000',
              previewMode: {enable: '/api/draft-mode/enable'},
            },
          }),
        }),
        {input: {previewSearchParam: null}},
      ).start()

      let snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
      expect(snapshot.context.previewUrl?.origin).toBe('http://localhost:3000')

      /**
       * Setting a new origin resets the preview URL machine
       */
      actor.send({
        type: 'set preview search param',
        previewSearchParam: 'http://localhost:3333/blog',
      })
      snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
      expect(snapshot.context.previewUrl?.origin).toBe('http://localhost:3333')

      /**
       * A new origin that isn't allowed is ignored
       */
      actor.send({type: 'set preview search param', previewSearchParam: 'https://example.com/docs'})
      snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
      expect(snapshot.context.previewUrl?.origin).toBe('http://localhost:3333')

      /**
       * A new origin that is allowed can run the loop once more
       */
      actor.send({
        type: 'set preview search param',
        previewSearchParam: 'http://localhost:4321/docs',
      })
      snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
      expect(snapshot.context.previewUrl?.origin).toBe('http://localhost:4321')

      /**
       * A relative preview search param updates the context
       */
      actor.send({type: 'set preview search param', previewSearchParam: '/about'})
      snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
      expect(snapshot.context.previewSearchParam).toBe('/about')

      /**
       * But again, it has to specify a new origin for it to update `previewUrl`
       */
      actor.send({
        type: 'set preview search param',
        previewSearchParam: 'http://localhost:5173/about',
      })
      snapshot = await waitFor(actor, (state) => !state.hasTag('busy'))
      expect(snapshot.context.previewUrl?.origin).toBe('http://localhost:5173')
    })
  })
})
