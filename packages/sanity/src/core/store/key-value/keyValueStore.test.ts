/* oxlint-disable no-deprecated -- tests the deprecated key-value store */
import {
  ClientError,
  createClient,
  ObservableSanityClient,
  type RawRequestOptions,
} from '@sanity/client'
import {type Observable, of, Subject, throwError} from 'rxjs'
import {describe, expect, onTestFinished, test, vi} from 'vitest'

import {createKeyValueStore} from './keyValueStore'
import {type KeyValueStore} from './types'

const LAYOUT = 'studio.structure-tool.layout.book'
const PREFERENCES = '/projects/project-1/users/me/preferences'
const LAYOUT_URL = `${PREFERENCES}/${encodeURIComponent(LAYOUT)}`

const stored = (activeValue: unknown, activeLevel = 'user@project') => ({
  key: LAYOUT,
  activeValue,
  activeLevel,
  canEdit: true,
})

const client = createClient({
  projectId: 'project-1',
  dataset: 'production',
  apiVersion: '2025-02-19',
  useCdn: false,
})

/** Answers the preferences API's requests by method, and records the API version of each */
function answer(
  handlers: Partial<Record<string, (options: RawRequestOptions) => Observable<unknown>>>,
) {
  const apiVersions: string[] = []
  const request = vi
    .spyOn(ObservableSanityClient.prototype, 'request')
    .mockImplementation(function (this: ObservableSanityClient, options) {
      apiVersions.push(this.config().apiVersion)
      const handler = handlers[options.method ?? 'GET']
      return handler ? handler(options) : throwError(() => new Error('Unexpected request'))
    })
  onTestFinished(() => request.mockRestore())
  return {request, apiVersions}
}

/** The values `getKey` emits while the test runs */
function watch(store: KeyValueStore, key: string) {
  const emitted: unknown[] = []
  const subscription = store.getKey(key).subscribe((value) => emitted.push(value))
  onTestFinished(() => subscription.unsubscribe())
  return emitted
}

describe('createKeyValueStore', () => {
  test("reads the user's value from the project's preferences", () => {
    const {request, apiVersions} = answer({GET: () => of({data: [stored('detail')]})})

    expect(watch(createKeyValueStore({client}), LAYOUT)).toEqual(['detail'])
    expect(request).toHaveBeenCalledWith({
      url: PREFERENCES,
      query: {keys: LAYOUT},
      tag: 'preferences.get',
    })
    expect(apiVersions).toEqual(['2026-11-07'])
  })

  test("reads a key nobody has set as null, and the project's shared value as the value", () => {
    answer({GET: () => of({data: [stored('default', 'default')]})})
    expect(watch(createKeyValueStore({client}), LAYOUT)).toEqual([null])

    answer({GET: () => of({data: [stored('list', 'project')]})})
    expect(watch(createKeyValueStore({client}), LAYOUT)).toEqual(['list'])
  })

  test('shows a write to readers at once, and resolves with what the API stored', async () => {
    const put = new Subject<unknown>()
    const {request} = answer({
      GET: () => of({data: [stored('default', 'default')]}),
      PUT: () => put,
    })
    const store = createKeyValueStore({client})
    const emitted = watch(store, LAYOUT)

    const written = store.setKey(LAYOUT, 'detail')
    expect(emitted).toEqual([null, 'detail'])

    put.next(stored('detail'))
    put.complete()
    await expect(written).resolves.toBe('detail')
    expect(emitted).toEqual([null, 'detail'])
    expect(request).toHaveBeenLastCalledWith({
      url: LAYOUT_URL,
      method: 'PUT',
      body: {value: 'detail'},
      tag: 'preferences.set',
    })
  })

  test("removes the user's value when it's set to null", async () => {
    const {request} = answer({DELETE: () => of(stored('default', 'default'))})

    await expect(createKeyValueStore({client}).setKey(LAYOUT, null)).resolves.toBeNull()
    expect(request).toHaveBeenCalledWith({
      url: LAYOUT_URL,
      method: 'DELETE',
      tag: 'preferences.reset',
    })
  })

  test('puts the stored value back on screen when a write fails', async () => {
    const refusal = new ClientError({statusCode: 400, headers: {}, body: {message: 'Invalid'}})
    answer({GET: () => of({data: [stored('list')]}), PUT: () => throwError(() => refusal)})
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    onTestFinished(() => consoleError.mockRestore())
    const store = createKeyValueStore({client})
    const emitted = watch(store, LAYOUT)

    await expect(store.setKey(LAYOUT, 'detail')).resolves.toBeNull()
    expect(emitted).toEqual(['list', 'detail', 'list'])
    expect(consoleError).toHaveBeenCalledWith(`Unable to store the preference "${LAYOUT}"`, refusal)
  })

  test('ignores the answer to a read that a write overtook', async () => {
    const get = new Subject<unknown>()
    answer({GET: () => get, PUT: () => of(stored('detail'))})
    const store = createKeyValueStore({client})
    const emitted = watch(store, LAYOUT)

    await store.setKey(LAYOUT, 'detail')
    get.next({data: [stored('list')]})
    get.complete()

    expect(emitted).toEqual(['detail'])
  })
})
