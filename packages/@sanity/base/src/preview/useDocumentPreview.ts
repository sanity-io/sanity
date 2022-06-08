import {PreviewValue, SchemaType, SortOrdering} from '@sanity/types'
import {useEffect, useState} from 'react'
import {useDocumentPreviewStore} from '../datastores'
import {Previewable} from './types'

export {useDocumentPreview as unstable_useDocumentPreview}

/**
 * @deprecated FOR INTERNAL USE.
 */
function useDocumentPreview(props: {
  enabled?: boolean
  ordering?: SortOrdering
  schemaType?: SchemaType
  value: Previewable | undefined
}): {error: Error | null; value: PreviewValue | null} {
  const {enabled = true, ordering, schemaType, value: previewValue} = props || {}
  const {observeForPreview} = useDocumentPreviewStore()
  const [error, setError] = useState<Error | null>(null)
  const [value, setValue] = useState<PreviewValue | null>(null)

  useEffect(() => {
    if (!enabled || !previewValue || !schemaType) return undefined

    const snapshotEvent$ = observeForPreview(previewValue, schemaType, {ordering})

    const sub = snapshotEvent$.subscribe({
      error(nextError) {
        setError(nextError)
      },
      next(nextValue) {
        setValue(nextValue.snapshot || null)
      },
    })

    return () => sub.unsubscribe()
  }, [enabled, observeForPreview, ordering, schemaType, previewValue])

  return {error, value}
}
