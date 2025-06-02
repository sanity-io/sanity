import {useEffect, useMemo, useState} from 'react'
import {isObservable, map, of} from 'rxjs'
import {
  type ObjectSchemaType,
  type PreviewableType,
  useDocumentPreviewStore,
  useDocumentStore,
  usePerspective,
} from 'sanity'

import {
  type DocumentLocationResolver,
  type DocumentLocationResolvers,
  type DocumentLocationsState,
  type DocumentLocationsStatus,
} from './types'

const INITIAL_STATE: DocumentLocationsState = {locations: []}

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

  const {perspectiveStack} = usePerspective()
  const [locationsState, setLocationsState] = useState<DocumentLocationsState>(INITIAL_STATE)

  const resolver = resolvers && (typeof resolvers === 'function' ? resolvers : resolvers[type.name])

  const [locationsStatus, setLocationsStatus] = useState<DocumentLocationsStatus>(
    resolver ? 'resolving' : 'empty',
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
