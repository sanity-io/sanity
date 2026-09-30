import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {map, startWith} from 'rxjs/operators'
import {useDocumentStore} from 'sanity'

import {EDEN_TYPES} from './schema'

const DRAFT_ID_PREFIX = 'drafts.'

/** @internal */
export interface EdenDocument {
  _id: string
  _type: string
  _updatedAt: string
  headline: string | null
  status: string | null
  section: string | null
  edition: string | null
  byline: string[] | null
  publishAt: string | null
}

interface EdenStoriesState {
  documents: EdenDocument[]
  loading: boolean
}

const INITIAL_STATE: EdenStoriesState = {documents: [], loading: true}

const EDEN_STORIES_QUERY = {
  fetch: `*[_type in $types] | order(_updatedAt desc) {_id, _type, _updatedAt, headline, status, section, edition, byline, publishAt}`,
  listen: `*[_type in $types]`,
}

function toPublishedId(id: string): string {
  return id.startsWith(DRAFT_ID_PREFIX) ? id.slice(DRAFT_ID_PREFIX.length) : id
}

function isDraftId(id: string): boolean {
  return id.startsWith(DRAFT_ID_PREFIX)
}

function dedupeByPublishedId(rawDocuments: EdenDocument[]): EdenDocument[] {
  const documentsByPublishedId = rawDocuments.reduce<Map<string, EdenDocument>>(
    (accumulator, document) => {
      const publishedId = toPublishedId(document._id)
      const existing = accumulator.get(publishedId)
      const preferred = existing && !isDraftId(document._id) ? existing : document
      accumulator.set(publishedId, preferred)
      return accumulator
    },
    new Map(),
  )

  return Array.from(documentsByPublishedId.values())
    .map((document) => ({...document, _id: toPublishedId(document._id)}))
    .sort((a, b) => b._updatedAt.localeCompare(a._updatedAt))
}

/** @internal */
export function useEdenStories(): EdenStoriesState {
  const documentStore = useDocumentStore()

  const observable = useMemo(() => {
    return documentStore
      .listenQuery(EDEN_STORIES_QUERY, {types: EDEN_TYPES}, {tag: 'eden-dashboard-stories'})
      .pipe(
        map((rawDocuments: EdenDocument[]): EdenStoriesState => ({
          documents: dedupeByPublishedId(rawDocuments),
          loading: false,
        })),
        startWith(INITIAL_STATE),
      )
  }, [documentStore])

  return useObservable(observable, INITIAL_STATE)
}
