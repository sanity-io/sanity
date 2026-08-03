import {useMemo} from 'react'
import {isObservable, map, of} from 'rxjs'
import {startWith} from 'rxjs/operators'
import {
  type ObjectSchemaType,
  type PreviewableType,
  useDocumentPreviewStore,
  useDocumentStore,
} from 'sanity'

import {useDeferredObservableValue} from '../core/util/useDeferredObservableValue'
import {
  type DocumentLocationResolver,
  type DocumentLocationResolvers,
  type DocumentLocationsState,
  type DocumentLocationsStatus,
} from './types'
import {usePresentationPerspectiveStack} from './usePresentationPerspectiveStack'

const INITIAL_STATE: DocumentLocationsState = {locations: []}

type DocumentLocationsResult = {
  state: DocumentLocationsState
  status: DocumentLocationsStatus
}

export function useDocumentLocations(props: {
  id: string
  version: string | undefined
  resolvers?: DocumentLocationResolver | DocumentLocationResolvers
  type: ObjectSchemaType
}): {
  state: DocumentLocationsState
  status: DocumentLocationsStatus
} {
  const {id, resolvers, type, version} = props
  const documentStore = useDocumentStore()
  const documentPreviewStore = useDocumentPreviewStore()

  const perspectiveStack = usePresentationPerspectiveStack()

  const resolver = resolvers && (typeof resolvers === 'function' ? resolvers : resolvers[type.name])

  const initialResult = useMemo(
    (): DocumentLocationsResult => ({
      state: INITIAL_STATE,
      status: resolver ? 'resolving' : 'empty',
    }),
    [resolver],
  )

  const result = useMemo(() => {
    if (!resolver) return undefined

    // Original/advanced resolver which requires explicit use of Observables
    if (typeof resolver === 'function') {
      const params = {id, type: type.name, version, perspectiveStack}
      const context = {documentStore}
      const _result = resolver(params, context)
      return isObservable(_result) ? _result : of(_result)
    }

    // Simplified resolver pattern which abstracts away Observable logic
    if ('select' in resolver && 'resolve' in resolver) {
      const doc = {_type: 'reference', _ref: id}
      // Override the preview selection in the schema type to use the user
      // defined selection defined by the resolver
      const _type = {...type, preview: {select: resolver.select}} satisfies PreviewableType
      const options = {perspective: perspectiveStack}
      return documentPreviewStore
        .observeForPreview(doc, _type, options)
        .pipe(map((preview) => resolver.resolve(preview.snapshot || null)))
    }

    // Resolver is explicitly provided state
    return of(resolver)
  }, [documentStore, documentPreviewStore, id, resolver, type, version, perspectiveStack])

  const locationsResult$ = useMemo(() => {
    if (!result) return of(initialResult)

    return result.pipe(
      map(
        (state): DocumentLocationsResult => ({
          state: state || INITIAL_STATE,
          status: state ? 'resolved' : 'empty',
        }),
      ),
      startWith(initialResult),
    )
  }, [result, initialResult])

  const {state, status} = useDeferredObservableValue(locationsResult$, initialResult)

  return {
    state,
    status,
  }
}
