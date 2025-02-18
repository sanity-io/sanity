import {of, Subject} from 'rxjs'
import {type PermissionCheckResult, type SanityClient} from 'sanity'
import {describe, expect, test} from 'vitest'
import {createActor, fromObservable, fromPromise, waitFor} from 'xstate'

import {defineResolveAllowPatternsActor} from '../../actors/resolve-allow-patterns'
import {defineResolveInitialUrlActor} from '../../actors/resolve-initial-url'
import {defineResolvePreviewModeActor} from '../../actors/resolve-preview-mode'
import {defineResolvePreviewModeUrlActor} from '../../actors/resolve-preview-mode-url'
import {
  type DeprecatedPreviewUrlResolver,
  type PreviewUrlAllowOptionContext,
  type PreviewUrlInitialOptionContext,
} from '../../types'
import {type CheckPermissionInput, previewUrlMachine} from '../preview-url'

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
const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)
const mockActors = {
  'create preview secret': fromPromise(() => Promise.resolve({secret: 'abc123', expiresAt})),
  'resolve allow patterns': defineResolveAllowPatternsActor({client, allowOption: undefined}),
  'resolve initial url': defineResolveInitialUrlActor({
    client,
    studioBasePath,
    previewUrlOption: undefined,
  }),
  'resolve preview mode': defineResolvePreviewModeActor({
    client,
    previewUrlOption: undefined,
  }),
  'resolve preview mode url': defineResolvePreviewModeUrlActor({
    client,
    studioBasePath,
    previewUrlOption: undefined,
  }),
  'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(() =>
    of({granted: true, reason: 'Matching grant'}),
  ),
}

describe('Preview URL machine', () => {
  describe('checks permissions', () => {
    test('the check permission actor is required', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
      const {'check permission': _, ...actors} = mockActors
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
            ...mockActors,
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

    test('handles errors', async () => {
      const subject = new Subject<PermissionCheckResult>()
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors,
            'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(
              () => subject,
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
      const {'resolve initial url': _, ...actors} = mockActors
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
            ...mockActors,
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
            ...mockActors,
            'resolve initial url': defineResolveInitialUrlActor({
              client,
              studioBasePath,
              previewUrlOption: previewUrlOption,
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
      const {'resolve allow patterns': _, ...actors} = mockActors
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
            ...mockActors,
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
      expect(snapshot.context.allow).toBe(patterns)
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
          const dynamicPatterns = await context.client.fetch<unknown>(`*[_id == $id][0].allow`, {
            id: 'settings',
          })
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
    ])('{initialUrl: %s, allow: %O}', async (initialUrl, allowOption, expected) => {
      const actor = createActor(
        previewUrlMachine.provide({
          actors: {
            ...mockActors,
            'resolve initial url': fromPromise(async () => initialUrl),
            'resolve allow patterns': defineResolveAllowPatternsActor({
              client,
              allowOption,
            }),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      const snapshot = await waitFor(actor, (state) => Array.isArray(state.context.allow))
      expect(snapshot.context.allow).toEqual(expected)
      expected.forEach((pattern, index) => {
        const actual = snapshot.context.allow![index]!
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
          actors: {
            ...mockActors,
            'resolve allow patterns': defineResolveAllowPatternsActor({
              client,
              allowOption,
            }),
          },
        }),
        {input: {previewSearchParam: null}},
      ).start()

      const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
      expect(snapshot.context.error).toBeInstanceOf(Error)
      expect(snapshot.context.error?.message).toMatch('insecure')
      expect(snapshot.context.error).toMatchSnapshot()
    })
  })

  describe.todo('resolves url from search param', () => {
    test.todo('validates the search param with the allow patterns')
  })

  describe('resolves preview mode options', () => {
    test.todo('handles legacy draftMode options')
  })

  describe.todo(
    'handles moving from success state back to resolving url from preview search param when target origin changes',
  )

  describe('preview mode', () => {
    describe.todo('creates preview url secrets')

    describe.todo('resolves preview mode url')

    describe.todo(
      'handles moving from success state back to resolving url from preview search param when target origin changes',
    )
  })
})
