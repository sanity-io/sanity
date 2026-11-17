import {
  createSanityInstance,
  PreferenceError,
  type SanityInstance,
  type StateSource,
  updateUserPreference,
  updateUserPreferenceListItem,
  type UserPreference,
  userPreference,
  userPreferenceList,
  type UserPreferenceListPage,
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
    userPreferenceList: {
      ...sdk.userPreferenceList,
      getState: vi.fn(),
      loadMore: vi.fn(),
      resolveState: vi.fn(),
      refetch: vi.fn(),
    },
    updateUserPreference: vi.fn(),
    updateUserPreferenceListItem: vi.fn(),
  }
})

type Snapshot = ReturnType<ReturnType<typeof userPreference.getState>['getCurrent']>
type ListSnapshot = ReturnType<ReturnType<typeof userPreferenceList.getState>['getCurrent']>

const LAYOUT = 'studio.structure-tool.layout.book'
const SAVED_QUERIES = 'studio.vision-tool.saved-queries'
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

const pending = {
  status: 'pending',
  data: undefined,
  error: undefined,
  isFetching: true,
  dataUpdatedAt: undefined,
} as const
const loaded = <T>(data: T) =>
  ({status: 'success', data, error: undefined, isFetching: false, dataUpdatedAt: 1}) as const
const failed = {
  status: 'error',
  data: undefined,
  error: new Error('Network error'),
  isFetching: false,
  dataUpdatedAt: undefined,
} as const

const query = (key: string, title: string) => ({
  _key: key,
  title,
  url: `https://project-1.api.sanity.io/v2026-11-07/data/query/production?query=${title}`,
  savedAt: '2026-11-01T00:00:00.000Z',
})
const page = (
  queries: ReturnType<typeof query>[],
  nextCursor: string | null = null,
): UserPreferenceListPage => ({
  data: queries.map((value) => ({
    itemId: value._key,
    value,
    addedAt: value.savedAt,
    updatedAt: value.savedAt,
  })),
  nextCursor,
})

function stateOf<T>(snapshots: BehaviorSubject<T>): StateSource<T> {
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
    vi.mocked(userPreference.getState).mockReturnValue(stateOf(snapshots))
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
    vi.mocked(userPreference.getState).mockReturnValue(stateOf(snapshots))
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

  describe("older Vision's saved queries", () => {
    const books = query('books', 'books')
    const authors = query('authors', 'authors')
    const posts = query('posts', 'posts')

    test('read as one list once every page of items is read', async () => {
      const snapshots = new BehaviorSubject<ListSnapshot>(pending)
      vi.mocked(userPreferenceList.getState).mockReturnValue(stateOf(snapshots))
      vi.mocked(userPreferenceList.loadMore).mockResolvedValue([])
      const store = createPreferenceKeyValueStore(instance, USER_ID)

      const emitted = lastValueFrom(store.getKey(SAVED_QUERIES).pipe(toArray()))
      snapshots.next(loaded([page([books], 'cursor-1')]))
      expect(userPreferenceList.loadMore).toHaveBeenCalledWith(instance, USER_ID, SAVED_QUERIES)
      snapshots.next(loaded([page([books], 'cursor-1'), page([authors])]))
      snapshots.complete()

      expect(await emitted).toEqual([{queries: [books, authors]}])
    })

    test('write the queries that changed as items, and remove the ones left out', async () => {
      vi.mocked(userPreferenceList.resolveState).mockResolvedValue([page([books], 'cursor-1')])
      vi.mocked(userPreferenceList.loadMore).mockResolvedValue([
        page([books], 'cursor-1'),
        page([authors]),
      ])
      vi.mocked(userPreferenceList.refetch).mockResolvedValue([])
      vi.mocked(updateUserPreferenceListItem).mockResolvedValue()
      const store = createPreferenceKeyValueStore(instance, USER_ID)
      const renamedBooks = {...books, title: 'all books'}

      await expect(store.setKey(SAVED_QUERIES, {queries: [renamedBooks, posts]})).resolves.toEqual({
        queries: [renamedBooks, posts],
      })
      expect(vi.mocked(updateUserPreferenceListItem).mock.calls).toEqual([
        [instance, {userId: USER_ID, key: SAVED_QUERIES, itemId: 'books', value: renamedBooks}],
        [instance, {userId: USER_ID, key: SAVED_QUERIES, itemId: 'posts', value: posts}],
        [instance, {userId: USER_ID, key: SAVED_QUERIES, itemId: 'authors', value: undefined}],
      ])
      expect(userPreferenceList.refetch).toHaveBeenCalledWith(instance, USER_ID, SAVED_QUERIES)
    })

    test('are all removed when set to null', async () => {
      vi.mocked(userPreferenceList.resolveState).mockResolvedValue([page([books, authors])])
      vi.mocked(userPreferenceList.refetch).mockResolvedValue([])
      vi.mocked(updateUserPreferenceListItem).mockResolvedValue()
      const store = createPreferenceKeyValueStore(instance, USER_ID)

      await expect(store.setKey(SAVED_QUERIES, null)).resolves.toEqual({queries: []})
      expect(vi.mocked(updateUserPreferenceListItem).mock.calls).toEqual([
        [instance, {userId: USER_ID, key: SAVED_QUERIES, itemId: 'books', value: undefined}],
        [instance, {userId: USER_ID, key: SAVED_QUERIES, itemId: 'authors', value: undefined}],
      ])
    })
  })
})
