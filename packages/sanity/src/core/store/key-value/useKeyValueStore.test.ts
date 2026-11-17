import {
  createSanityInstance,
  PreferenceError,
  type SanityInstance,
  updateUserPreference,
  type UserPreference,
  userPreference,
} from '@sanity/sdk'
import {BehaviorSubject, lastValueFrom} from 'rxjs'
import {toArray} from 'rxjs/operators'
import {afterEach, beforeEach, describe, expect, onTestFinished, test, vi} from 'vitest'

import {createPreferenceKeyValueStore} from './useKeyValueStore'

vi.mock(import('@sanity/sdk'), async (importOriginal) => {
  const sdk = await importOriginal()
  return {
    ...sdk,
    userPreference: {...sdk.userPreference, getState: vi.fn()},
    updateUserPreference: vi.fn(),
  }
})

type PreferenceState = ReturnType<typeof userPreference.getState>
type Snapshot = ReturnType<PreferenceState['getCurrent']>

const LAYOUT = 'studio.structure-tool.layout.book'
const USER_ID = 'user-1'

const own = (value: string): UserPreference => ({
  key: LAYOUT,
  value,
  canEdit: true,
  isDefault: false,
  shared: false,
  resourceType: 'project',
})
const unset: UserPreference = {
  key: LAYOUT,
  value: 'default',
  canEdit: true,
  isDefault: true,
  shared: false,
}

const pending: Snapshot = {
  status: 'pending',
  data: undefined,
  error: undefined,
  isFetching: true,
  dataUpdatedAt: undefined,
}
const loaded = (data: UserPreference): Snapshot => ({
  status: 'success',
  data,
  error: undefined,
  isFetching: false,
  dataUpdatedAt: 1,
})
const failed: Snapshot = {
  status: 'error',
  data: undefined,
  error: new Error('Network error'),
  isFetching: false,
  dataUpdatedAt: undefined,
}

function preferenceState(snapshots: BehaviorSubject<Snapshot>): PreferenceState {
  return {
    observable: snapshots,
    getCurrent: () => snapshots.getValue(),
    subscribe: (onStoreChanged) => {
      const subscription = snapshots.subscribe(() => onStoreChanged?.())
      return () => subscription.unsubscribe()
    },
  }
}

describe('createPreferenceKeyValueStore', () => {
  let instance: SanityInstance

  beforeEach(() => {
    instance = createSanityInstance({projectId: 'project-1', dataset: 'production'})
  })

  afterEach(() => {
    instance.dispose()
  })

  test("reads the user's value from the SDK's preference once it's known", async () => {
    const snapshots = new BehaviorSubject<Snapshot>(pending)
    vi.mocked(userPreference.getState).mockReturnValue(preferenceState(snapshots))
    const store = createPreferenceKeyValueStore(instance, USER_ID)

    const emitted = lastValueFrom(store.getKey(LAYOUT).pipe(toArray()))
    snapshots.next(loaded(own('detail')))
    snapshots.next(loaded(own('detail')))
    snapshots.next(loaded(own('list')))
    snapshots.complete()

    expect(await emitted).toEqual(['detail', 'list'])
    expect(userPreference.getState).toHaveBeenCalledWith(instance, USER_ID, LAYOUT)
  })

  test('reads a key nobody has set, and one that failed to load, as null', async () => {
    const snapshots = new BehaviorSubject<Snapshot>(loaded(unset))
    vi.mocked(userPreference.getState).mockReturnValue(preferenceState(snapshots))
    const store = createPreferenceKeyValueStore(instance, USER_ID)

    const emitted = lastValueFrom(store.getKey(LAYOUT).pipe(toArray()))
    snapshots.next(failed)
    snapshots.next(loaded(own('detail')))
    snapshots.complete()

    expect(await emitted).toEqual([null, 'detail'])
  })

  test("reads a key the SDK doesn't declare as null", async () => {
    vi.mocked(userPreference.getState).mockImplementation(() => {
      throw new PreferenceError('keyNotDeclared', 'Unknown preference key "my-plugin.setting".')
    })
    const store = createPreferenceKeyValueStore(instance, USER_ID)

    expect(await lastValueFrom(store.getKey('my-plugin.setting').pipe(toArray()))).toEqual([null])
  })

  test('stores a value through the SDK and resolves with what it stored', async () => {
    vi.mocked(updateUserPreference).mockResolvedValue(own('detail'))
    const store = createPreferenceKeyValueStore(instance, USER_ID)

    await expect(store.setKey(LAYOUT, 'detail')).resolves.toBe('detail')
    expect(updateUserPreference).toHaveBeenCalledWith(instance, {
      userId: USER_ID,
      key: LAYOUT,
      value: 'detail',
    })
  })

  test("removes the user's value when it's set to null", async () => {
    vi.mocked(updateUserPreference).mockResolvedValue(unset)
    const store = createPreferenceKeyValueStore(instance, USER_ID)

    await expect(store.setKey(LAYOUT, null)).resolves.toBeNull()
    expect(updateUserPreference).toHaveBeenCalledWith(instance, {
      userId: USER_ID,
      key: LAYOUT,
      value: undefined,
    })
  })

  test('logs a write the SDK refuses and resolves with null', async () => {
    const refusal = new PreferenceError(
      'keyNotDeclared',
      'Unknown preference key "my-plugin.setting".',
    )
    vi.mocked(updateUserPreference).mockRejectedValue(refusal)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    onTestFinished(() => consoleError.mockRestore())
    const store = createPreferenceKeyValueStore(instance, USER_ID)

    await expect(store.setKey('my-plugin.setting', true)).resolves.toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      'Unable to store the preference "my-plugin.setting"',
      refusal,
    )
  })
})
