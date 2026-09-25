import {of, Subject} from 'rxjs'
import {type PermissionCheckResult, type SanityClient} from 'sanity'
import {describe, expect, test, vi} from 'vitest'
import {type Actor, createActor, fromObservable, fromPromise, SimulatedClock, waitFor} from 'xstate'

import {promiseWithResolvers} from '../../../core/util/promiseWithResolvers'
import {defineResolvePreviewModeActor} from '../../actors/resolve-preview-mode'
import {type PreviewUrlOption} from '../../types'
import {openPreviewUrlMachine} from '../open-preview-url'
import {type CheckPermissionInput} from '../preview-url'

const client = {} as SanityClient
const secretTtl = 1000 * 60 * 60
const enabledOrigin = 'http://localhost:3000'
const disabledOrigin = 'http://localhost:3333'

/**
 * Preview mode is enabled for `enabledOrigin` only, like a target specific `previewMode` resolver would do
 */
const previewModePerOrigin: PreviewUrlOption = {
  initial: enabledOrigin,
  previewMode: ({targetOrigin}) =>
    targetOrigin === enabledOrigin ? {enable: '/api/draft-mode/enable'} : false,
}

const createSecrets = () => {
  let count = 0
  return vi.fn(async () => ({
    secret: `secret-${++count}`,
    expiresAt: new Date(Date.now() + secretTtl),
  }))
}

interface MockOptions {
  previewUrlOption?: PreviewUrlOption
  canCreatePreviewSecret?: boolean
  canReadSharedSecret?: boolean
  sharedSecret?: string | null
  createPreviewSecret?: () => Promise<{secret: string; expiresAt: Date}>
}

const mockActors = ({
  previewUrlOption = previewModePerOrigin,
  canCreatePreviewSecret = true,
  canReadSharedSecret = true,
  sharedSecret = 'shared-secret',
  createPreviewSecret = createSecrets(),
}: MockOptions = {}) => ({
  'create preview secret': fromPromise(createPreviewSecret),
  'read shared preview secret': fromPromise<string | null>(async () => sharedSecret),
  'resolve preview mode': defineResolvePreviewModeActor({client, previewUrlOption}),
  'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(({input}) => {
    const granted =
      input.checkPermissionName === 'create' ? canCreatePreviewSecret : canReadSharedSecret
    return of({granted, reason: granted ? 'Matching grant' : 'No matching grants found'})
  }),
})

const settled = (actor: Actor<typeof openPreviewUrlMachine>) =>
  waitFor(actor, (state) => !state.hasTag('busy'))

describe('Open preview URL machine', () => {
  test('resolves preview mode for the target origin and creates a secret', async () => {
    const previewMode = vi.fn(() => ({enable: '/api/draft-mode/enable'}))
    const actor = createActor(
      openPreviewUrlMachine.provide({
        actors: mockActors({previewUrlOption: {initial: enabledOrigin, previewMode}}),
      }),
      {input: {targetOrigin: enabledOrigin}},
    ).start()

    const snapshot = await settled(actor)
    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(previewMode).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({targetOrigin: enabledOrigin}),
    )
    expect(snapshot.context.previewMode).toEqual({
      enable: '/api/draft-mode/enable',
      shareAccess: true,
    })
    expect(snapshot.context.previewUrlSecret).toEqual({
      secret: 'secret-1',
      expiresAt: expect.any(Date),
    })
  })

  test('creates a new secret when the current one expires', async () => {
    const clock = new SimulatedClock()
    const createPreviewSecret = createSecrets()
    const actor = createActor(
      openPreviewUrlMachine.provide({actors: mockActors({createPreviewSecret})}),
      {clock, input: {targetOrigin: enabledOrigin}},
    ).start()

    let snapshot = await settled(actor)
    expect(snapshot.context.previewUrlSecret?.secret).toBe('secret-1')

    clock.increment(secretTtl)
    /**
     * The expired secret is dropped right away, so the link opens the preview directly
     * until the new secret arrives
     */
    snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('creatingPreviewSecret')
    expect(snapshot.context.previewUrlSecret).toBeNull()

    snapshot = await settled(actor)
    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(snapshot.context.previewUrlSecret?.secret).toBe('secret-2')
    expect(createPreviewSecret).toHaveBeenCalledTimes(2)

    clock.increment(secretTtl)
    snapshot = await settled(actor)
    expect(snapshot.context.previewUrlSecret?.secret).toBe('secret-3')
  })

  test('falls back to the shared secret, which is never rotated', async () => {
    const clock = new SimulatedClock()
    const createPreviewSecret = createSecrets()
    const actor = createActor(
      openPreviewUrlMachine.provide({
        actors: mockActors({canCreatePreviewSecret: false, createPreviewSecret}),
      }),
      {clock, input: {targetOrigin: enabledOrigin}},
    ).start()

    let snapshot = await settled(actor)
    expect(snapshot.matches({success: 'sharedSecret'})).toBe(true)
    expect(snapshot.context.previewMode).toEqual({
      enable: '/api/draft-mode/enable',
      shareAccess: true,
    })
    expect(snapshot.context.previewUrlSecret).toEqual({secret: 'shared-secret', expiresAt: null})

    clock.increment(secretTtl * 24 * 365)
    snapshot = actor.getSnapshot()
    expect(snapshot.matches({success: 'sharedSecret'})).toBe(true)
    expect(snapshot.context.previewUrlSecret?.secret).toBe('shared-secret')
    expect(createPreviewSecret).not.toHaveBeenCalled()
  })

  test.each<[string, MockOptions & {targetOrigin?: string}]>([
    ['preview mode is off for the origin', {targetOrigin: disabledOrigin}],
    ['there is no preview mode option', {previewUrlOption: enabledOrigin}],
    [
      'the secret can neither be created nor shared',
      {canCreatePreviewSecret: false, canReadSharedSecret: false},
    ],
    ['sharing is off', {canCreatePreviewSecret: false, sharedSecret: null}],
  ])(
    'opens the preview directly when %s',
    async (_, {targetOrigin = enabledOrigin, ...options}) => {
      const createPreviewSecret = createSecrets()
      const actor = createActor(
        openPreviewUrlMachine.provide({actors: mockActors({...options, createPreviewSecret})}),
        {input: {targetOrigin}},
      ).start()

      const snapshot = await settled(actor)
      expect(snapshot.value).toBe('unavailable')
      expect(snapshot.context.previewUrlSecret).toBeNull()
      expect(createPreviewSecret).not.toHaveBeenCalled()
    },
  )

  test('starts over when the target origin changes', async () => {
    const clock = new SimulatedClock()
    const createPreviewSecret = createSecrets()
    const actor = createActor(
      openPreviewUrlMachine.provide({actors: mockActors({createPreviewSecret})}),
      {clock, input: {targetOrigin: enabledOrigin}},
    ).start()

    let snapshot = await settled(actor)
    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(snapshot.context.previewUrlSecret?.secret).toBe('secret-1')

    /**
     * Moving to an origin without preview mode leaves nothing behind from the previous origin
     */
    actor.send({type: 'set target origin', targetOrigin: disabledOrigin})
    snapshot = await settled(actor)
    expect(snapshot.value).toBe('unavailable')
    expect(snapshot.context).toMatchObject({
      targetOrigin: disabledOrigin,
      previewMode: null,
      previewUrlSecret: null,
    })

    /**
     * And the previous secret's expiry no longer triggers anything
     */
    clock.increment(secretTtl)
    expect(actor.getSnapshot().value).toBe('unavailable')
    expect(createPreviewSecret).toHaveBeenCalledTimes(1)

    /**
     * Moving back resolves preview mode again and creates a fresh secret
     */
    actor.send({type: 'set target origin', targetOrigin: enabledOrigin})
    snapshot = await settled(actor)
    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(snapshot.context.previewMode).toEqual({
      enable: '/api/draft-mode/enable',
      shareAccess: true,
    })
    expect(snapshot.context.previewUrlSecret?.secret).toBe('secret-2')
  })

  test('ignores the target origin it already has', async () => {
    const previewMode = vi.fn(() => ({enable: '/api/draft-mode/enable'}))
    const createPreviewSecret = createSecrets()
    const actor = createActor(
      openPreviewUrlMachine.provide({
        actors: mockActors({
          previewUrlOption: {initial: enabledOrigin, previewMode},
          createPreviewSecret,
        }),
      }),
      {input: {targetOrigin: enabledOrigin}},
    ).start()

    await settled(actor)
    actor.send({type: 'set target origin', targetOrigin: enabledOrigin})
    const snapshot = await settled(actor)

    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(snapshot.context.previewUrlSecret?.secret).toBe('secret-1')
    expect(previewMode).toHaveBeenCalledTimes(1)
    expect(createPreviewSecret).toHaveBeenCalledTimes(1)
  })

  test('discards a secret that was still being created for the previous origin', async () => {
    const {promise, resolve} = promiseWithResolvers<{secret: string; expiresAt: Date}>()
    const actor = createActor(
      openPreviewUrlMachine.provide({
        actors: mockActors({createPreviewSecret: () => promise}),
      }),
      {input: {targetOrigin: enabledOrigin}},
    ).start()

    await waitFor(actor, (state) => state.matches('creatingPreviewSecret'))
    actor.send({type: 'set target origin', targetOrigin: disabledOrigin})
    let snapshot = await settled(actor)
    expect(snapshot.value).toBe('unavailable')

    resolve({secret: 'late-secret', expiresAt: new Date(Date.now() + secretTtl)})
    await promise
    snapshot = actor.getSnapshot()
    expect(snapshot.value).toBe('unavailable')
    expect(snapshot.context.previewUrlSecret).toBeNull()
  })

  test('applies a target origin that changes while permissions are still loading', async () => {
    const permissions = new Subject<PermissionCheckResult>()
    const previewMode = vi.fn(() => ({enable: '/api/draft-mode/enable'}))
    const actor = createActor(
      openPreviewUrlMachine.provide({
        actors: {
          ...mockActors({previewUrlOption: {initial: enabledOrigin, previewMode}}),
          'check permission': fromObservable<PermissionCheckResult, CheckPermissionInput>(
            () => permissions,
          ),
        },
      }),
      {input: {targetOrigin: disabledOrigin}},
    ).start()

    actor.send({type: 'set target origin', targetOrigin: enabledOrigin})
    expect(actor.getSnapshot().value).toBe('checkingPermissions')
    expect(actor.getSnapshot().context.targetOrigin).toBe(enabledOrigin)

    permissions.next({granted: true, reason: 'Matching grant'})
    const snapshot = await settled(actor)
    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(previewMode).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({targetOrigin: enabledOrigin}),
    )
  })

  test('recovers from an error once the target origin changes', async () => {
    const actor = createActor(
      openPreviewUrlMachine.provide({
        actors: mockActors({
          previewUrlOption: {
            initial: enabledOrigin,
            previewMode: ({targetOrigin}) => {
              if (targetOrigin === disabledOrigin) {
                throw new Error('Could not resolve preview mode')
              }
              return {enable: '/api/draft-mode/enable'}
            },
          },
        }),
      }),
      {input: {targetOrigin: disabledOrigin}},
    ).start()

    let snapshot = await settled(actor)
    expect(snapshot.hasTag('error')).toBe(true)
    expect(snapshot.context.error).toEqual(new Error('Could not resolve preview mode'))
    expect(snapshot.context.previewUrlSecret).toBeNull()

    actor.send({type: 'set target origin', targetOrigin: enabledOrigin})
    snapshot = await settled(actor)
    expect(snapshot.matches({success: 'createdSecret'})).toBe(true)
    expect(snapshot.context.error).toBeNull()
  })

  test.each<[keyof ReturnType<typeof mockActors>, MockOptions]>([
    ['check permission', {}],
    ['resolve preview mode', {}],
    ['create preview secret', {}],
    ['read shared preview secret', {canCreatePreviewSecret: false}],
  ])('the %s actor is required', async (name, options) => {
    const {[name]: _, ...actors} = mockActors(options)
    const actor = createActor(openPreviewUrlMachine.provide({actors}), {
      input: {targetOrigin: enabledOrigin},
    }).start()

    const snapshot = await waitFor(actor, (state) => state.hasTag('error'))
    expect(snapshot.context.error).toBeInstanceOf(Error)
    expect(snapshot.context.error?.message).toContain(`The '${name}' actor is not implemented`)
  })
})
