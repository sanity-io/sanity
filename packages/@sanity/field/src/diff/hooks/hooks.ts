import {Reference} from '@sanity/types'
import {useState, useEffect} from 'react'
import {observeForPreview} from 'part:@sanity/base/preview'
import {SchemaType} from '../../types'
import {versionedClient} from '../../versionedClient'

interface PreviewSnapshot {
  title: string
}

export function useRefValue<T = unknown>(refId: string | undefined | null): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  useEffect(() => {
    if (!refId) {
      return undefined
    }

    const subscription = versionedClient.observable.getDocument(refId).subscribe(setValue)

    return () => {
      subscription.unsubscribe()
    }
  }, [refId])

  // Always return undefined in the case of a falsey ref to prevent bug
  // when going from an ID to an undefined state
  return refId ? value : undefined
}

export function useRefPreview(
  value: Reference | undefined | null,
  schemaType: SchemaType
): PreviewSnapshot | undefined {
  const [preview, setPreview] = useState<PreviewSnapshot | undefined>(undefined)

  useEffect(() => {
    let subscription
    if (value) {
      subscription = observeForPreview(value, schemaType).subscribe((result) =>
        setPreview(result.snapshot)
      )
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [value, schemaType])

  return value ? preview : undefined
}
