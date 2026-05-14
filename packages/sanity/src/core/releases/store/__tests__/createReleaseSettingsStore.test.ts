import {firstValueFrom, Subject, take, toArray} from 'rxjs'
import {beforeEach, describe, expect, it, vi} from 'vitest'

import {
  createReleaseSettingsStore,
  type ReleaseSettingsDocument,
  type ReleaseSettingsState,
} from '../createReleaseSettingsStore'
import {
  RELEASE_SETTINGS_DOCUMENT_ID,
  RELEASE_SETTINGS_DOCUMENT_TYPE,
} from '../releaseSettingsConstants'

const listenQueryMock = vi.fn()
vi.mock('../../../store', () => ({listenQuery: (...args: unknown[]) => listenQueryMock(...args)}))

describe('createReleaseSettingsStore', () => {
  beforeEach(() => {
    listenQueryMock.mockReset()
  })

  it('emits loading state initially, then the document once listenQuery emits', () => {
    const queryResults = new Subject<ReleaseSettingsDocument | null>()
    listenQueryMock.mockReturnValue(queryResults.asObservable())

    const store = createReleaseSettingsStore({client: {} as never})
    const emissions: ReleaseSettingsState[] = []
    const subscription = store.state$.subscribe((state) => emissions.push(state))

    expect(emissions[0]).toEqual({document: null, loading: true, error: null})

    const document: ReleaseSettingsDocument = {
      _id: RELEASE_SETTINGS_DOCUMENT_ID,
      _rev: 'rev-1',
      _type: RELEASE_SETTINGS_DOCUMENT_TYPE,
      descriptionSections: [{title: 'Overview'}],
    }
    queryResults.next(document)

    expect(emissions[emissions.length - 1]).toEqual({
      document,
      loading: false,
      error: null,
    })

    const updated = {
      ...document,
      _rev: 'rev-2',
      descriptionSections: [{title: 'Overview'}, {title: 'Changes'}],
    }
    queryResults.next(updated)
    expect(emissions[emissions.length - 1]).toEqual({
      document: updated,
      loading: false,
      error: null,
    })

    queryResults.next(null)
    expect(emissions[emissions.length - 1]).toEqual({
      document: null,
      loading: false,
      error: null,
    })

    subscription.unsubscribe()
  })

  it('emits error state if listenQuery errors', async () => {
    const queryResults = new Subject<ReleaseSettingsDocument | null>()
    listenQueryMock.mockReturnValue(queryResults.asObservable())

    const store = createReleaseSettingsStore({client: {} as never})
    const lastStatePromise = firstValueFrom(store.state$.pipe(take(2), toArray()))

    const listenError = new Error('listen failed')
    queryResults.error(listenError)

    const states = await lastStatePromise
    const last = states[states.length - 1]
    expect(last.loading).toBe(false)
    expect(last.document).toBeNull()
    expect(last.error).toBe(listenError)
  })

  it('uses the correct GROQ query and tag', () => {
    listenQueryMock.mockReturnValue(new Subject().asObservable())
    createReleaseSettingsStore({client: {} as never})

    const [, query, params, options] = listenQueryMock.mock.calls[0]
    expect(query).toContain('_id == $id')
    expect(params).toEqual({id: RELEASE_SETTINGS_DOCUMENT_ID})
    expect(options).toEqual({tag: 'releaseSettings.listen'})
  })
})
