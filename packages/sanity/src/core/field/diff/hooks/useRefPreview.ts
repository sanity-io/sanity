import {type PreviewValue, type Reference, type SchemaType} from '@sanity/types'
import {useEffect, useState} from 'react'
import {type Subscription} from 'rxjs'

import {useDocumentPreviewStore} from '../../../store'

export function useRefPreview(
  value: Reference | undefined | null,
  schemaType: SchemaType,
): PreviewValue | null | undefined {
  const documentPreviewStore = useDocumentPreviewStore()

  const [preview, setPreview] = useState<PreviewValue | null | undefined>(undefined)

  useEffect(() => {
    let subscription: Subscription

    if (value) {
      subscription = documentPreviewStore
        .observeForPreview(value, schemaType)
        .subscribe((result) => setPreview(result.snapshot))
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [documentPreviewStore, value, schemaType])

  return value ? preview : undefined
}
