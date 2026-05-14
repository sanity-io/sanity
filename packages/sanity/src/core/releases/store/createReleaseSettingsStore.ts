import {type SanityClient} from '@sanity/client'
import {BehaviorSubject, type Observable, shareReplay} from 'rxjs'

import {listenQuery} from '../../store'
import {
  RELEASE_SETTINGS_DOCUMENT_ID,
  RELEASE_SETTINGS_DOCUMENT_TYPE,
} from './releaseSettingsConstants'

/**
 * A section in the release-description template. The optional `hint` carries
 * author-supplied guidance that is passed to the AI summary generator as binding
 * instructions for that specific section.
 * @internal
 */
export interface ReleaseDescriptionSection {
  title: string
  hint?: string
}

/**
 * The singleton release-settings document, as projected from Content Lake.
 * @internal
 */
export interface ReleaseSettingsDocument {
  _id: string
  _rev: string
  _type: typeof RELEASE_SETTINGS_DOCUMENT_TYPE
  descriptionSections?: ReleaseDescriptionSection[]
}

/**
 * @internal
 */
export interface ReleaseSettingsState {
  document: ReleaseSettingsDocument | null
  loading: boolean
  error: Error | null
}

/**
 * @internal
 */
export const INITIAL_RELEASE_SETTINGS_STATE: ReleaseSettingsState = {
  document: null,
  loading: true,
  error: null,
}

interface CreateReleaseSettingsStoreOptions {
  client: SanityClient
}

/**
 * @internal
 */
export interface ReleaseSettingsStore {
  state$: Observable<ReleaseSettingsState>
}

const RELEASE_SETTINGS_QUERY = '*[_id == $id][0]{_id, _rev, _type, descriptionSections}'

/**
 * Lazily subscribes on first observer and replays the latest emission to new
 * subscribers, so callers never see the `loading: true` initial state more than once.
 * @internal
 */
export function createReleaseSettingsStore({
  client,
}: CreateReleaseSettingsStoreOptions): ReleaseSettingsStore {
  const stateSubject = new BehaviorSubject<ReleaseSettingsState>(INITIAL_RELEASE_SETTINGS_STATE)
  const params = {id: RELEASE_SETTINGS_DOCUMENT_ID}

  listenQuery(client, RELEASE_SETTINGS_QUERY, params, {
    tag: 'releaseSettings.listen',
  }).subscribe({
    next: (document: ReleaseSettingsDocument | null | undefined) => {
      stateSubject.next({
        document: document ?? null,
        loading: false,
        error: null,
      })
    },
    error: (error: Error) => {
      stateSubject.next({document: null, loading: false, error})
    },
  })

  return {
    state$: stateSubject.pipe(shareReplay({bufferSize: 1, refCount: false})),
  }
}
