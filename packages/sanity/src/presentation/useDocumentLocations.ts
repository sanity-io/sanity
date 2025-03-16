/* eslint-disable @typescript-eslint/no-shadow */
import {get} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {isObservable, map, type Observable, of, switchMap} from 'rxjs'
import {
  type DocumentStore,
  getDraftId,
  isRecord,
  isReference,
  type Previewable,
  type SanityDocument,
  useDocumentStore,
  usePerspective,
} from 'sanity'

import {
  type DocumentLocationResolver,
  type DocumentLocationResolverObject,
  type DocumentLocationResolvers,
  type DocumentLocationsState,
  type DocumentLocationsStatus,
} from './types'
import {props} from './util/props'

const INITIAL_STATE: DocumentLocationsState = {locations: []}

function getDocumentId(value: Previewable) {
  if (isReference(value)) {
    return value._ref
  }
  return '_id' in value ? value._id : undefined
}

function cleanPreviewable(id: string | undefined, previewable: Previewable) {
  const clean: Record<string, unknown> = id ? {...previewable, _id: id} : {...previewable}

  if (clean._type === 'reference') {
    delete clean._type
    delete clean._ref
    delete clean._weak
    delete clean._dataset
    delete clean._projectId
    delete clean._strengthenOnPublish
  }

  return clean
}

function listen(id: string, fields: string[], store: DocumentStore) {
  const projection = fields.join(', ')
  const query = {
    fetch: `*[_id==$id][0]{${projection}}`,
    // TODO: is it more performant to use `||` instead of `in`?
    listen: `*[_id in [$id,$draftId]]`,
  }
  const params = {id, draftId: getDraftId(id)}
  return store.listenQuery(query, params, {
    perspective: 'drafts',
    tag: 'drafts',
  }) as Observable<SanityDocument | null>
}

function observeDocument(
  value: Previewable | null,
  paths: string[][],
  store: DocumentStore,
): Observable<Record<string, unknown> | null> {
  if (!value || typeof value !== 'object') {
    return of(value)
  }

  const id = getDocumentId(value)
  const currentValue = cleanPreviewable(id, value)

  const headlessPaths = paths.filter((path) => !(path[0] in currentValue))

  if (id && headlessPaths.length) {
    const fields = [...new Set(headlessPaths.map((path: string[]) => path[0]))]
    return listen(id, fields, store).pipe(
      switchMap((snapshot) => {
        if (snapshot) {
          return observeDocument(snapshot, paths, store)
        }
        return of(null)
      }),
    )
  }

  const leads: Record<string, string[][]> = {}
  paths.forEach((path) => {
    const [head, ...tail] = path
    if (!leads[head]) {
      leads[head] = []
    }
    leads[head].push(tail)
  })
  const next = Object.keys(leads).reduce((res: Record<string, unknown>, head) => {
    const tails = leads[head].filter((tail) => tail.length > 0)
    if (tails.length === 0) {
      res[head] = isRecord(value) ? (value as Record<string, unknown>)[head] : undefined
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res[head] = observeDocument((value as any)[head], tails, store)
    }
    return res
  }, currentValue)

  return of(next).pipe(props({wait: true}))
}

function observeForLocations(
  documentId: string,
  resolver: DocumentLocationResolverObject<string>,
  documentStore: DocumentStore,
) {
  const {select} = resolver
  const paths = Object.values(select).map((value) => String(value).split('.')) || []
  const doc = {_type: 'reference', _ref: documentId}
  return observeDocument(doc, paths, documentStore).pipe(
    map((doc) => {
      return Object.keys(select).reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = get(doc, select[key])
        return acc
      }, {})
    }),
    map(resolver.resolve),
  )
}

export function useDocumentLocations(props: {
  id: string
  version: string | undefined
  resolvers?: DocumentLocationResolver | DocumentLocationResolvers
  type: string
}): {
  state: DocumentLocationsState
  status: DocumentLocationsStatus
} {
  const {id, resolvers, type, version} = props
  const documentStore = useDocumentStore()
  const {perspectiveStack} = usePerspective()
  const [locationsState, setLocationsState] = useState<DocumentLocationsState>(INITIAL_STATE)

  const resolver = resolvers && (typeof resolvers === 'function' ? resolvers : resolvers[type])

  const [locationsStatus, setLocationsStatus] = useState<DocumentLocationsStatus>(
    resolver ? 'resolving' : 'empty',
  )

  const result = useMemo(() => {
    if (!resolver) return undefined

    // Original/advanced resolver which requires explicit use of Observables
    if (typeof resolver === 'function') {
      const params = {id, type, version, perspectiveStack}
      const context = {documentStore}
      const _result = resolver(params, context)
      return isObservable(_result) ? _result : of(_result)
    }

    // Simplified resolver pattern which abstracts away Observable logic
    if ('select' in resolver && 'resolve' in resolver) {
      return observeForLocations(id, resolver, documentStore)
    }

    // Resolver is explicitly provided state
    return of(resolver)
  }, [documentStore, id, resolver, type, version, perspectiveStack])

  useEffect(() => {
    const sub = result?.subscribe((state) => {
      setLocationsState(state || INITIAL_STATE)
      setLocationsStatus(state ? 'resolved' : 'empty')
    })

    return () => sub?.unsubscribe()
  }, [result])

  return {
    state: locationsState,
    status: locationsStatus,
  }
}
