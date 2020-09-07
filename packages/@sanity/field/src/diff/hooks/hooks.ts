import {useState, useEffect} from 'react'
import client from 'part:@sanity/base/client'
import {observeForPreview} from 'part:@sanity/base/preview'
import {Reference, SchemaType} from '../../types'

interface PreviewSnapshot {
  title: string
}

export function getRefValue<T = unknown>(refId: string | undefined | null): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  useEffect(() => {
    if (!refId) {
      return () => {}
    }

    const subscription = client.observable.getDocument(refId).subscribe(setValue)

    return () => {
      subscription.unsubscribe()
    }
  }, [refId])
  return value
}

export function useRefPreview(
  value: Reference | undefined | null,
  schemaType: SchemaType
): PreviewSnapshot | undefined {
  const [preview, setPreview] = useState<PreviewSnapshot | undefined>(undefined)
  useEffect(() => {
    let subscription
    if (value) {
      subscription = observeForPreview(value, schemaType).subscribe(result =>
        setPreview(result.snapshot)
      )
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [value, schemaType])
  return preview
}
